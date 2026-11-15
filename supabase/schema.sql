-- PUENTE 001 / dedicated Supabase project only.
-- Do not run this in a shared production project without reviewing its auth policies.
-- Anonymous Supabase Auth users have the "authenticated" Postgres role.
-- Database tables intentionally have NO direct browser access: controlled RPC only.

create schema if not exists puente_private;

create table if not exists puente_private.questions (
  id bigint generated always as identity primary key,
  language text not null check (language in ('es','en')),
  step integer not null check (step between 1 and 20),
  prompt text not null,
  choices jsonb not null check (jsonb_typeof(choices)='array' and jsonb_array_length(choices)=3),
  correct_choice integer not null check (correct_choice between 0 and 2),
  explanation text not null,
  unique(language,step)
);

create table if not exists public.puente_rooms (
  code text primary key check (code ~ '^[A-F0-9]{8}$'),
  teacher_uid uuid not null,
  language text not null check (language in ('es','en')),
  status text not null default 'lobby' check (status in ('lobby','question','reveal','finished')),
  step integer not null default 0 check (step between 0 and 20),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now()+interval '12 hours')
);
create index if not exists puente_rooms_teacher_idx on public.puente_rooms(teacher_uid,expires_at);

create table if not exists public.puente_players (
  room_code text not null references public.puente_rooms(code) on delete cascade,
  user_id uuid not null,
  alias text not null check (alias ~ '^[A-Za-z0-9 _-]{2,18}$'),
  joined_at timestamptz not null default now(),
  primary key (room_code,user_id),
  unique (room_code,alias)
);

create table if not exists public.puente_submissions (
  room_code text not null,
  step integer not null,
  user_id uuid not null,
  choice integer not null check (choice between 0 and 2),
  correct boolean not null,
  submitted_at timestamptz not null default now(),
  primary key (room_code,step,user_id),
  foreign key (room_code,user_id) references public.puente_players(room_code,user_id) on delete cascade
);

alter table public.puente_rooms enable row level security;
alter table public.puente_players enable row level security;
alter table public.puente_submissions enable row level security;
alter table puente_private.questions enable row level security;

-- No policies here. Even guessed codes cannot query these tables directly.
revoke all on public.puente_rooms from public, anon, authenticated;
revoke all on public.puente_players from public, anon, authenticated;
revoke all on public.puente_submissions from public, anon, authenticated;
revoke all on puente_private.questions from public, anon, authenticated;
revoke all on schema puente_private from public, anon, authenticated;

insert into puente_private.questions (language,step,prompt,choices,correct_choice,explanation) values
('es',1,'A sign reads “La biblioteca está cerca del parque.” Where is the library?','["Near the park","Behind the school","Across the river"]',0,'“Cerca de” means “near.” The library is near the park.'),
('es',2,'A villager greets you. Which is a natural Spanish way to ask “How are you?”','["¿Cuántos años tienes?","¿Cómo estás?","¿Dónde vives?"]',1,'“¿Cómo estás?” is an informal way to ask how someone is.'),
('es',3,'At the market someone asks “¿Cuánto cuesta?” What are they asking?','["Where is it?","What time is it?","How much does it cost?"]',2,'“¿Cuánto cuesta?” asks for the price.'),
('es',4,'Repair the sign: “Nosotros ___ al mercado ayer.”','["vamos","fuimos","irán"]',1,'“Ayer” means yesterday, so “fuimos” is the past-tense choice.'),
('es',5,'The cook says “Tengo hambre.” What do they need?','["Something to eat","A new coat","A map"]',0,'“Tengo hambre” literally means “I have hunger” — I am hungry.'),
('es',6,'You helped rebuild the bridge. Someone says “Gracias.” What do you reply?','["Tengo frío.","¿Dónde está?","De nada."]',2,'“De nada” is a standard response to “Thank you.”'),
('en',1,'El letrero dice “The library is near the park.” ¿Dónde está la biblioteca?','["Cerca del parque","Detrás de la escuela","Al otro lado del río"]',0,'“Near” significa “cerca de”.'),
('en',2,'Un vecino te saluda. ¿Cómo puedes preguntar “¿Cómo estás?” en inglés?','["How old are you?","How are you?","Where do you live?"]',1,'“How are you?” pregunta por el bienestar de alguien.'),
('en',3,'En el mercado alguien pregunta “How much is it?” ¿Qué quiere saber?','["El lugar","La hora","El precio"]',2,'“How much” pregunta por la cantidad o el precio.'),
('en',4,'Completa la oración: “Yesterday, we ___ to the market.”','["go","went","will go"]',1,'“Yesterday” indica el pasado; “went” es el pasado de “go”.'),
('en',5,'El cocinero dice “I am hungry.” ¿Qué necesita?','["Comida","Un abrigo","Un mapa"]',0,'“I am hungry” significa “Tengo hambre”.'),
('en',6,'Alguien dice “Thank you.” ¿Cuál respuesta es apropiada?','["I am cold.","Where is it?","You are welcome."]',2,'“You are welcome” es una respuesta habitual a “Thank you”.')
on conflict (language,step) do update set
  prompt=excluded.prompt,choices=excluded.choices,
  correct_choice=excluded.correct_choice,explanation=excluded.explanation;

create or replace function public.puente_create_room(p_language text)
returns text language plpgsql security definer set search_path = ''
as $$
declare v_uid uuid := auth.uid(); v_code text; v_n int;
begin
  if v_uid is null then raise exception 'Sign in to host a room.'; end if;
  if p_language not in ('es','en') or p_language is null then raise exception 'Invalid language.'; end if;
  select count(*) into v_n from public.puente_rooms
  where teacher_uid=v_uid and expires_at>now() and status<>'finished';
  if v_n>=3 then raise exception 'You have three active rooms. Finish one or let it expire.'; end if;
  for i in 1..8 loop
    v_code:=upper(substr(replace(pg_catalog.gen_random_uuid()::text,'-',''),1,8));
    insert into public.puente_rooms(code,teacher_uid,language)
    values(v_code,v_uid,p_language) on conflict do nothing;
    if found then return v_code; end if;
  end loop;
  raise exception 'Could not create a room. Try again.';
end $$;

create or replace function public.puente_join_room(p_code text,p_alias text)
returns boolean language plpgsql security definer set search_path = ''
as $$
declare v_uid uuid := auth.uid(); v_code text:=upper(trim(p_code)); v_alias text:=trim(p_alias);
  v_room public.puente_rooms%rowtype; v_n int;
begin
  if v_uid is null then raise exception 'Sign in to join a room.'; end if;
  if v_alias is null or v_alias !~ '^[A-Za-z0-9 _-]{2,18}$' then
    raise exception 'Use a fictional alias of 2–18 plain characters.';
  end if;
  select * into v_room from public.puente_rooms where code=v_code and expires_at>now();
  if not found then raise exception 'Room not found or expired.'; end if;
  if v_room.status='finished' then raise exception 'This adventure has finished.'; end if;
  if v_room.teacher_uid=v_uid then raise exception 'Use a separate browser to join as a student.'; end if;
  if not exists (select 1 from public.puente_players where room_code=v_code and user_id=v_uid) then
    select count(*) into v_n from public.puente_players where room_code=v_code;
    if v_n>=40 then raise exception 'This classroom is full.'; end if;
  end if;
  insert into public.puente_players(room_code,user_id,alias)
  values(v_code,v_uid,v_alias)
  on conflict (room_code,user_id) do update set alias=excluded.alias;
  return true;
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
  select count(*) into v_total from puente_private.questions where language=r.language;
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
  v_correct boolean; v_inserted boolean:=false;
begin
  if v_uid is null then raise exception 'Sign in to answer.'; end if;
  if p_choice is null or p_choice not between 0 and 2 then raise exception 'Invalid answer.'; end if;
  select * into r from public.puente_rooms where code=v_code and expires_at>now() for share;
  if not found or r.status<>'question' then raise exception 'This challenge is not accepting answers.'; end if;
  if not exists(select 1 from public.puente_players where room_code=v_code and user_id=v_uid)
    then raise exception 'Join this room before answering.'; end if;
  select * into q from puente_private.questions where language=r.language and step=r.step;
  if not found then raise exception 'Challenge missing.'; end if;
  insert into public.puente_submissions(room_code,step,user_id,choice,correct)
  values(v_code,r.step,v_uid,p_choice,p_choice=q.correct_choice)
  on conflict do nothing;
  v_inserted:=found;
  select correct into v_correct from public.puente_submissions
  where room_code=v_code and step=r.step and user_id=v_uid;
  return jsonb_build_object('accepted',v_inserted,'correct',v_correct);
end $$;

create or replace function public.puente_room_snapshot(p_code text)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare v_uid uuid := auth.uid(); v_code text:=upper(trim(p_code));
  r public.puente_rooms%rowtype; q puente_private.questions%rowtype;
  v_players jsonb; v_responses int; v_total int; v_choice int; v_cleared int; v_round_correct int;
begin
  if v_uid is null then raise exception 'Sign in to see this classroom.'; end if;
  select * into r from public.puente_rooms where code=v_code and expires_at>now();
  if not found then raise exception 'Room not found or expired.'; end if;
  if r.teacher_uid<>v_uid and not exists(
    select 1 from public.puente_players where room_code=v_code and user_id=v_uid
  ) then raise exception 'Join the classroom before seeing its progress.'; end if;
  select count(*) into v_total from puente_private.questions where language=r.language;
  if r.step>0 then
    select * into q from puente_private.questions where language=r.language and step=r.step;
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
    'code',r.code,'language',r.language,'status',r.status,'step',r.step,
    'total',v_total,'cleared',v_cleared,'round_correct',v_round_correct,
    'players',v_players,'responses',v_responses,
    'my_choice',v_choice,
    'question',case when r.step=0 or q.id is null then null
      else jsonb_build_object('prompt',q.prompt,'choices',q.choices,
        'correct_choice',case when r.status in ('reveal','finished') then q.correct_choice else null end,
        'explanation',case when r.status in ('reveal','finished') then q.explanation else null end)
      end
  );
end $$;

-- Supabase grants function EXECUTE to PUBLIC by default. Restrict RPC entry points.
revoke all on function public.puente_create_room(text) from public,anon,authenticated;
revoke all on function public.puente_join_room(text,text) from public,anon,authenticated;
revoke all on function public.puente_advance_room(text) from public,anon,authenticated;
revoke all on function public.puente_submit_answer(text,integer) from public,anon,authenticated;
revoke all on function public.puente_room_snapshot(text) from public,anon,authenticated;
grant execute on function public.puente_create_room(text) to authenticated;
grant execute on function public.puente_join_room(text,text) to authenticated;
grant execute on function public.puente_advance_room(text) to authenticated;
grant execute on function public.puente_submit_answer(text,integer) to authenticated;
grant execute on function public.puente_room_snapshot(text) to authenticated;

-- Run periodically to remove expired class data (requires admin SQL access):
-- delete from public.puente_rooms where expires_at < now();
