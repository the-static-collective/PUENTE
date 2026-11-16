-- PUENTE 003 — Voluntary Village Assembly votes.
-- Apply AFTER schema.sql and garden-v2.sql in a dedicated PUENTE Supabase project.
-- No collection of free-text comments, student identity, or individual answer
-- traces for the next game. Direct SELECT is revoked; teacher sees counts only.

create table if not exists public.puente_design_votes (
  room_code text not null,
  user_id uuid not null,
  world_choice smallint not null check (world_choice between 0 and 2),
  mode_choice smallint not null check (mode_choice between 0 and 2),
  updated_at timestamptz not null default now(),
  primary key (room_code,user_id),
  foreign key (room_code,user_id)
    references public.puente_players(room_code,user_id) on delete cascade
);
alter table public.puente_design_votes enable row level security;
revoke all on public.puente_design_votes from public,anon,authenticated;

create or replace function public.puente_cast_next_game_vote(
  p_code text,p_world integer,p_mode integer)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare v_uid uuid:=auth.uid();v_code text:=upper(trim(p_code));
  r public.puente_rooms%rowtype;v_cleared integer;
begin
  if v_uid is null then raise exception 'Sign in to vote.';end if;
  if p_world is null or p_world not between 0 and 2 or
     p_mode is null or p_mode not between 0 and 2 then
    raise exception 'Invalid next-game vote.';
  end if;
  select * into r from public.puente_rooms
    where code=v_code and expires_at>now() for share;
  if not found then raise exception 'Room not found or expired.';end if;
  if r.status not in ('question','reveal') then raise exception 'Voting is closed.';end if;
  if not exists(select 1 from public.puente_players
    where room_code=v_code and user_id=v_uid) then
    raise exception 'Join the class before suggesting the next game.';
  end if;
  select count(distinct step) into v_cleared
    from public.puente_submissions
    where room_code=v_code and correct;
  if v_cleared<3 then raise exception 'Restore three bridge pieces to unlock voting.';end if;
  insert into public.puente_design_votes
    (room_code,user_id,world_choice,mode_choice)
  values(v_code,v_uid,p_world,p_mode)
  on conflict(room_code,user_id) do update set
    world_choice=excluded.world_choice,
    mode_choice=excluded.mode_choice,
    updated_at=now();
  return jsonb_build_object('accepted',true);
end $$;

create or replace function public.puente_room_snapshot(p_code text)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare v_uid uuid := auth.uid(); v_code text:=upper(trim(p_code));
  r public.puente_rooms%rowtype; q puente_private.questions%rowtype; j_question jsonb;
  v_players jsonb; v_responses int; v_total int; v_choice int; v_cleared int; v_round_correct int;
  v_vote_counts jsonb; v_mine_design jsonb;
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
  select jsonb_build_object(
    'world',jsonb_build_array(count(*) filter(where world_choice=0),count(*) filter(where world_choice=1),count(*) filter(where world_choice=2)),
    'mode',jsonb_build_array(count(*) filter(where mode_choice=0),count(*) filter(where mode_choice=1),count(*) filter(where mode_choice=2)))
    into v_vote_counts from public.puente_design_votes where room_code=v_code;
  select jsonb_build_object('world',world_choice,'mode',mode_choice)
    into v_mine_design from public.puente_design_votes where room_code=v_code and user_id=v_uid;
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
    'design_enabled',true,'design_counts',case when v_uid=r.teacher_uid then v_vote_counts else null end,
    'my_design',v_mine_design,
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

revoke all on function public.puente_cast_next_game_vote(text,integer,integer) from public,anon,authenticated;
revoke all on function public.puente_room_snapshot(text) from public,anon,authenticated;
grant execute on function public.puente_cast_next_game_vote(text,integer,integer) to authenticated;
grant execute on function public.puente_room_snapshot(text) to authenticated;

-- Expiry remains 12 hours, with row deletion scheduled by a room administrator:
-- delete from public.puente_rooms where expires_at<now();
