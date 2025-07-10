-- Create Profiles table to extend auth.users
create table profiles (
  id uuid references auth.users not null primary key,
  full_name text,
  avatar_url text,
  has_onboarded boolean default false
);

-- Function to create a profile for a new user
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$;

-- Trigger to call the function when a new user signs up
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create Teams table
create table teams (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles not null,
  name text not null,
  whitelisted_phone_numbers text[],
  sms_code text not null unique,
  created_at timestamptz default now()
);

-- Create Seasons table
create table seasons (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references public.teams not null,
  name text not null,
  created_at timestamptz default now()
);

-- Create Players table
create table players (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references public.teams not null,
  name text not null,
  created_at timestamptz default now()
);

-- Create Results table
create table results (
  id uuid primary key default gen_random_uuid(),
  player_id uuid references public.players not null,
  season_id uuid references public.seasons not null,
  game_date date not null,
  stats jsonb, -- Flexible for various stats
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table profiles enable row level security;
alter table teams enable row level security;
alter table seasons enable row level security;
alter table players enable row level security;
alter table results enable row level security;

-- RLS Policies
create policy "Users can view their own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update their own profile" on profiles for update using (auth.uid() = id);

create policy "Users can view their own teams" on teams for select using (auth.uid() = user_id);
create policy "Users can create teams for themselves" on teams for insert with check (auth.uid() = user_id);
create policy "Users can update their own teams" on teams for update using (auth.uid() = user_id);

create policy "Users can view seasons for their teams" on seasons for select using (
  exists (select 1 from teams where teams.id = seasons.team_id and teams.user_id = auth.uid())
);
create policy "Users can create seasons for their teams" on seasons for insert with check (
  exists (select 1 from teams where teams.id = seasons.team_id and teams.user_id = auth.uid())
);

create policy "Users can view players for their teams" on players for select using (
  exists (select 1 from teams where teams.id = players.team_id and teams.user_id = auth.uid())
);
create policy "Users can create players for their teams" on players for insert with check (
  exists (select 1 from teams where teams.id = players.team_id and teams.user_id = auth.uid())
);

create policy "Users can view results for their teams" on results for select using (
  exists (
    select 1 from seasons
    join teams on seasons.team_id = teams.id
    where seasons.id = results.season_id and teams.user_id = auth.uid()
  )
);
