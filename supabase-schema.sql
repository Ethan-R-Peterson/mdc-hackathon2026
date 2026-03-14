-- ============================================
-- Bookly - Supabase Schema
-- Paste this entire script into the Supabase
-- SQL Editor and click "Run"
-- ============================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ============================================
-- TABLES
-- ============================================

-- Users (synced from auth.users via trigger)
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  avatar_url text,
  current_streak int default 0,
  longest_streak int default 0,
  last_read_date date,
  created_at timestamptz default now()
);

-- Groups
create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  invite_code text unique not null,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz default now()
);

-- Group Members (join table)
create table public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references public.groups(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  joined_at timestamptz default now(),
  unique(group_id, user_id)
);

-- Books (cached from Google Books API)
create table public.books (
  id uuid primary key default gen_random_uuid(),
  google_books_id text unique not null,
  title text not null,
  author text,
  cover_url text,
  page_count int,
  genre text,
  description text,
  rating real,
  ratings_count int,
  created_at timestamptz default now()
);

-- User Books (a user's reading status for a book)
create table public.user_books (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  book_id uuid references public.books(id) on delete cascade not null,
  status text not null default 'reading' check (status in ('reading', 'finished')),
  current_page int default 0,
  started_at timestamptz default now(),
  finished_at timestamptz,
  unique(user_id, book_id)
);

-- Reading Logs
create table public.reading_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  user_book_id uuid references public.user_books(id) on delete cascade not null,
  pages_read int not null check (pages_read >= 1 and pages_read <= 100),
  logged_at timestamptz default now()
);

-- Points
create table public.points (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  amount int not null,
  reason text not null check (reason in ('pages', 'finish_book', 'streak_3', 'streak_7')),
  reference_id uuid,
  created_at timestamptz default now()
);

-- Feed Events
create table public.feed_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  group_id uuid references public.groups(id) on delete cascade not null,
  event_type text not null check (event_type in ('started_book', 'logged_pages', 'finished_book', 'streak')),
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

-- ============================================
-- INDEXES
-- ============================================

create index idx_group_members_group on public.group_members(group_id);
create index idx_group_members_user on public.group_members(user_id);
create index idx_user_books_user on public.user_books(user_id);
create index idx_user_books_book on public.user_books(book_id);
create index idx_reading_logs_user on public.reading_logs(user_id);
create index idx_reading_logs_user_book on public.reading_logs(user_book_id);
create index idx_reading_logs_logged_at on public.reading_logs(logged_at);
create index idx_points_user on public.points(user_id);
create index idx_points_created on public.points(created_at);
create index idx_feed_events_group on public.feed_events(group_id);
create index idx_feed_events_created on public.feed_events(created_at);

-- ============================================
-- TRIGGER: Auto-create user profile on signup
-- ============================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, username, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================
-- HELPER FUNCTION (avoids RLS infinite recursion)
-- ============================================

create or replace function public.is_group_member(p_group_id uuid, p_user_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.group_members
    where group_id = p_group_id and user_id = p_user_id
  );
$$ language sql security definer;

-- Lookup group by invite code (bypasses RLS so non-members can join)
create or replace function public.find_group_by_invite_code(code text)
returns table(id uuid, name text) as $$
  select id, name from public.groups
  where invite_code = code
  limit 1;
$$ language sql security definer;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

alter table public.users enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.books enable row level security;
alter table public.user_books enable row level security;
alter table public.reading_logs enable row level security;
alter table public.points enable row level security;
alter table public.feed_events enable row level security;

-- Users: anyone can read, only own row can update
create policy "Users are viewable by everyone"
  on public.users for select using (true);

create policy "Users can update own profile"
  on public.users for update using (auth.uid() = id);

-- Groups: only members or creator can read
create policy "Groups viewable by members or creator"
  on public.groups for select using (
    public.is_group_member(id, auth.uid()) or created_by = auth.uid()
  );

create policy "Authenticated users can create groups"
  on public.groups for insert with check (auth.uid() = created_by);

create policy "Group creator can update"
  on public.groups for update using (auth.uid() = created_by);

-- Group Members: use helper function to avoid recursion
create policy "Group members viewable by group members"
  on public.group_members for select using (
    public.is_group_member(group_id, auth.uid())
  );

create policy "Authenticated users can join groups"
  on public.group_members for insert with check (auth.uid() = user_id);

create policy "Users can leave groups"
  on public.group_members for delete using (auth.uid() = user_id);

-- Books: anyone can read, authenticated can insert
create policy "Books are viewable by everyone"
  on public.books for select using (true);

create policy "Authenticated users can insert books"
  on public.books for insert with check (auth.role() = 'authenticated');

-- User Books: own rows only
create policy "Users can view own books"
  on public.user_books for select using (auth.uid() = user_id);

create policy "Users can insert own books"
  on public.user_books for insert with check (auth.uid() = user_id);

create policy "Users can update own books"
  on public.user_books for update using (auth.uid() = user_id);

create policy "Users can delete own books"
  on public.user_books for delete using (auth.uid() = user_id);

-- Also allow group members to see each other's books (for recommendations/leaderboard)
create policy "Group members can view each others books"
  on public.user_books for select using (
    exists (
      select 1 from public.group_members gm1
      join public.group_members gm2 on gm1.group_id = gm2.group_id
      where gm1.user_id = auth.uid()
      and gm2.user_id = user_books.user_id
    )
  );

-- Reading Logs: own rows only
create policy "Users can view own logs"
  on public.reading_logs for select using (auth.uid() = user_id);

create policy "Users can insert own logs"
  on public.reading_logs for insert with check (auth.uid() = user_id);

-- Points: own rows readable
create policy "Users can view own points"
  on public.points for select using (auth.uid() = user_id);

create policy "Users can insert own points"
  on public.points for insert with check (auth.uid() = user_id);

-- Also allow group members to see each other's points (for leaderboard)
create policy "Group members can view each others points"
  on public.points for select using (
    exists (
      select 1 from public.group_members gm1
      join public.group_members gm2 on gm1.group_id = gm2.group_id
      where gm1.user_id = auth.uid()
      and gm2.user_id = points.user_id
    )
  );

-- Feed Events: group members can read
create policy "Feed events viewable by group members"
  on public.feed_events for select using (
    public.is_group_member(group_id, auth.uid())
  );

create policy "Authenticated users can insert feed events"
  on public.feed_events for insert with check (auth.uid() = user_id);
