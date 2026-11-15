-- PUENTE Quest Garden: apply AFTER supabase/schema.sql on a DEDICATED project.
-- NO real database modifications are performed simply by committing this file.
alter table public.puente_rooms add column if not exists pack jsonb;
-- Public room tables remain RLS-enabled and direct access revoked.
create or replace function puente_private.valid_pack(p jsonb, p_language text)
returns boolean language plpgsql security invoker set search_path = ''
as $$
declare q jsonb; ch jsonb; a text; b text; c text;
begin
  if p is null or pg_catalog.jsonb_typeof(p)<>'object' or pg_catalog.pg_column_size(p)>28000 then return false;end if;
  if p->>'schema'<>'puente.questpack/v1' or p->>'language' is distinct from p_language then return false;end if;
  if pg_catalog.length(p->>'title') not between 4 and 95 or pg_catalog.length(p->>'intro') not between 8 and 350 then return false;end if;
  if pg_catalog.jsonb_typeof(p->'questions')<>'array' or pg_catalog.jsonb_array_length(p->'questions')<>6 then return false;end if;
  for q in select value from pg_catalog.jsonb_array_elements(p->'questions') loop
    if pg_catalog.jsonb_typeof(q)<>'object' or pg_catalog.length(q->>'prompt') not between 12 and 250 then return false;end if;
    if pg_catalog.length(q->>'explanation') not between 8 and 250 then return false;end if;
    if pg_catalog.jsonb_typeof(q->'choices')<>'array' or pg_catalog.jsonb_array_length(q->'choices')<>3 then return false;end if;
    if pg_catalog.jsonb_typeof(q->'correct')<>'number' or (q->>'correct') !~ '^[012]$' then return false;end if;
    ch:=q->'choices';a:=ch->>0;b:=ch->>1;c:=ch->>2;
    if a is null or b is null or c is null or pg_catalog.length(pg_catalog.btrim(a)) not between 1 and 115
      or pg_catalog.length(pg_catalog.btrim(b)) not between 1 and 115 or pg_catalog.length(pg_catalog.btrim(c)) not between 1 and 115 then return false;end if;
    if pg_catalog.lower(pg_catalog.btrim(a))=pg_catalog.lower(pg_catalog.btrim(b))
      or pg_catalog.lower(pg_catalog.btrim(a))=pg_catalog.lower(pg_catalog.btrim(c))
      or pg_catalog.lower(pg_catalog.btrim(b))=pg_catalog.lower(pg_catalog.btrim(c)) then return false;end if;
  end loop;
  return true;
exception when others then return false;
end $$;

create or replace function public.puente_create_room(p_language text,p_pack jsonb)
returns text language plpgsql security definer set search_path = ''
as $$
declare v_uid uuid := auth.uid(); v_code text; v_n int;
begin
  if v_uid is null then raise exception 'Sign in to host a room.'; end if;
  if p_language not in ('es','en') or p_language is null then raise exception 'Invalid language.'; end if;
  if p_pack is not null and not puente_private.valid_pack(p_pack,p_language) then
    raise exception 'Invalid quest pack. Ask the teacher to validate it in Quest Garden.';
  end if;
  select count(*) into v_n from public.puente_rooms
    where teacher_uid=v_uid and expires_at>now() and status<>'finished';
  if v_n>=3 then raise exception 'You have three active rooms. Finish one or let it expire.'; end if;
  for i in 1..8 loop
    v_code:=upper(substr(replace(pg_catalog.gen_random_uuid()::text,'-',''),1,8));
    insert into public.puente_rooms(code,teacher_uid,language,pack)
      values(v_code,v_uid,p_language,p_pack) on conflict do nothing;
    if found then return v_code;end if;
  end loop;
  raise exception 'Could not create a room. Try again.';
end $$;

create or replace function public.puente_advance_room(p_code text)
returns boolean language plpgsql security definer set search_path = ''
as $$
declare v_uid uuid := auth.uid(); v_code text:=upper(trim(p_code));
  r public.puente_rooms%rowtype; v_total int; v_round_correct int;
begin
  if v_uid is null then raise exception 'Not signed in.'; end if;
  select * into r from public.puente_rooms where code=v_code and teacher_uid=v_uid and expires_at>now() for update;
  if not found then raise exception 'Only the room teacher can advance this classroom.'; end if;
  if r.pack is null then select count(*) into v_total from puente_private.questions where language=r.language;
  else v_total:=jsonb_array_length(r.pack->'questions');end if;
  if r.status='lobby' then
    update public.puente_rooms set status='question',step=1 where code=v_code;
  elsif r.status='question' then
    update public.puente_rooms set status='reveal' where code=v_code;
  elsif r.status='reveal' then
    select count(*) into v_round_correct from public.puente_submissions
    where room_code=v_code and step=r.step and correct;
    if v_round_correct=0 then
      -- No bridge piece earned: reset this round for a class retry.
      delete from public.puente_submissions where room_code=v_code and step=r.step;
      update public.puente_rooms set status='question' where code=v_code;
    elsif r.step>=v_total then
      update public.puente_rooms set status='finished' where code=v_code;
    else
      update public.puente_rooms set status='question',step=r.step+1 where code=v_code;
    end if;
  end if;
  return true;
end $$;

create or replace function public.puente_submit_answer(p_code text,p_choice integer)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare v_uid uuid := auth.uid(); v_code text:=upper(trim(p_code));
  r public.puente_rooms%rowtype; q puente_private.questions%rowtype;
  v_inserted boolean:=false; v_expected integer;
begin
  if v_uid is null then raise exception 'Sign in to answer.'; end if;
  if p_choice is null or p_choice not between 0 and 2 then raise exception 'Invalid answer.'; end if;
  select * into r from public.puente_rooms where code=v_code and expires_at>now() for share;
  if not found or r.status<>'question' then raise exception 'This challenge is not accepting answers.'; end if;
  if not exists(select 1 from public.puente_players where room_code=v_code and user_id=v_uid)
    then raise exception 'Join this room before answering.'; end if;
  if r.pack is not null then
    v_expected:=(r.pack->'questions'->(r.step-1)->>'correct')::integer;
  else
    select * into q from puente_private.questions where language=r.language and step=r.step;
    if not found then raise exception 'Challenge missing.'; end if;
    v_expected:=q.correct_choice;
  end if;
  insert into public.puente_submissions(room_code,step,user_id,choice,correct)
  values(v_code,r.step,v_uid,p_choice,p_choice=v_expected)
  on conflict do nothing;
  v_inserted:=found;
  return jsonb_build_object('accepted',v_inserted);
end $$;

create or replace function public.puente_room_snapshot(p_code text)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare v_uid uuid := auth.uid(); v_code text:=upper(trim(p_code));
  r public.puente_rooms%rowtype; q puente_private.questions%rowtype; j_question jsonb;
  v_players jsonb; v_responses int; v_total int; v_choice int; v_cleared int; v_round_correct int;
begin
  if v_uid is null then raise exception 'Sign in to see this classroom.'; end if;
  select * into r from public.puente_rooms where code=v_code and expires_at>now();
  if not found then raise exception 'Room not found or expired.'; end if;
  if r.teacher_uid<>v_uid and not exists(
    select 1 from public.puente_players where room_code=v_code and user_id=v_uid
  ) then raise exception 'Join the classroom before seeing its progress.'; end if;
  if r.pack is null then select count(*) into v_total from puente_private.questions where language=r.language;
  else v_total:=jsonb_array_length(r.pack->'questions');end if;
  if r.step>0 and r.pack is null then
    select * into q from puente_private.questions where language=r.language and step=r.step;
  elsif r.step>0 then
    j_question:=r.pack->'questions'->(r.step-1);
  end if;
  select count(*) into v_responses from public.puente_submissions where room_code=v_code and step=r.step;
  select count(distinct step) into v_cleared from public.puente_submissions
  where room_code=v_code and correct;
  select count(*) into v_round_correct from public.puente_submissions
  where room_code=v_code and step=r.step and correct;
  select s.choice into v_choice from public.puente_submissions s
  where s.room_code=v_code and s.step=r.step and s.user_id=v_uid;
  select coalesce(jsonb_agg(jsonb_build_object('alias',x.alias,'score',x.score) order by x.alias),'[]'::jsonb)
  into v_players from (
    select p.alias,count(s.room_code) filter(where s.correct) as score
    from public.puente_players p left join public.puente_submissions s
      on s.room_code=p.room_code and s.user_id=p.user_id
    where p.room_code=v_code
    group by p.user_id,p.alias
  ) x;
  return jsonb_build_object(
    'code',r.code,'language',r.language,'pack_title',coalesce(r.pack->>'title','The Broken Bridge'),'status',r.status,'step',r.step,
    'total',v_total,'cleared',v_cleared,'round_correct',v_round_correct,
    'players',v_players,'responses',v_responses,
    'my_choice',v_choice,
    'question',case when r.step=0 then null
      when r.pack is not null then jsonb_build_object(
        'prompt',j_question->>'prompt','choices',j_question->'choices',
        'topic',coalesce(j_question->>'topic','mixed'),'mechanic',coalesce(j_question->>'mechanic','decode'),
        'correct_choice',case when r.status in ('reveal','finished') then (j_question->>'correct')::integer else null end,
        'explanation',case when r.status in ('reveal','finished') then j_question->>'explanation' else null end)
      when q.id is null then null
      else jsonb_build_object('prompt',q.prompt,'choices',q.choices,
        'topic',case r.step when 1 then 'direction' when 2 then 'greeting' when 3 then 'market' when 4 then 'time' else 'conversation' end,'mechanic','decode',
        'correct_choice',case when r.status in ('reveal','finished') then q.correct_choice else null end,
        'explanation',case when r.status in ('reveal','finished') then q.explanation else null end)
      end
  );
end $$;

revoke all on function public.puente_create_room(text,jsonb) from public, anon, authenticated;
revoke all on function public.puente_advance_room(text) from public, anon, authenticated;
revoke all on function public.puente_submit_answer(text,integer) from public, anon, authenticated;
revoke all on function public.puente_room_snapshot(text) from public, anon, authenticated;
revoke all on function puente_private.valid_pack(jsonb,text) from public, anon, authenticated;
grant execute on function public.puente_create_room(text,jsonb) to authenticated;
grant execute on function public.puente_advance_room(text) to authenticated;
grant execute on function public.puente_submit_answer(text,integer) to authenticated;
grant execute on function public.puente_room_snapshot(text) to authenticated;
