create table public.budget_scenarios (
  user_id uuid primary key references auth.users(id) on delete cascade,
  preset text not null,
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  duration smallint not null check (duration between 1 and 10),
  scholarship numeric(12, 2) not null default 0 check (scholarship >= 0),
  budget jsonb not null check (jsonb_typeof(budget) = 'object'),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger budget_scenarios_set_updated_at
  before update on public.budget_scenarios
  for each row execute procedure public.set_updated_at();

create table public.community_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  author_name text not null,
  author_avatar text not null default '',
  author_country text not null default '',
  category text not null,
  title text not null check (char_length(title) between 1 and 140),
  content text not null check (char_length(content) between 1 and 1200),
  tags text[] not null default '{}',
  status text not null default 'published' check (status in ('published', 'hidden')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index community_posts_created_idx on public.community_posts(created_at desc);
create index community_posts_category_created_idx on public.community_posts(category, created_at desc);
create trigger community_posts_set_updated_at
  before update on public.community_posts
  for each row execute procedure public.set_updated_at();

create table public.community_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  author_name text not null,
  content text not null check (char_length(content) between 1 and 500),
  status text not null default 'published' check (status in ('published', 'hidden')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index community_comments_post_created_idx on public.community_comments(post_id, created_at);
create trigger community_comments_set_updated_at
  before update on public.community_comments
  for each row execute procedure public.set_updated_at();

create table public.community_post_likes (
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (post_id, user_id)
);

alter table public.consultation_bookings
  add column mentor_id text not null default 'mentor-1';

create unique index consultation_bookings_active_slot_idx
  on public.consultation_bookings(mentor_id, starts_at)
  where status = 'booked';

alter table public.budget_scenarios enable row level security;
alter table public.community_posts enable row level security;
alter table public.community_comments enable row level security;
alter table public.community_post_likes enable row level security;

create policy budget_scenarios_own_all on public.budget_scenarios
  for all to authenticated
  using (user_id = (select auth.uid()) or public.is_admin())
  with check (user_id = (select auth.uid()));

create policy community_posts_read on public.community_posts
  for select to authenticated
  using (status = 'published' or user_id = (select auth.uid()) or public.is_admin());

create policy community_posts_insert_own on public.community_posts
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy community_posts_update_own on public.community_posts
  for update to authenticated
  using (user_id = (select auth.uid()) or public.is_admin())
  with check (user_id = (select auth.uid()) or public.is_admin());

create policy community_posts_delete_own on public.community_posts
  for delete to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

create policy community_comments_read on public.community_comments
  for select to authenticated
  using (status = 'published' or user_id = (select auth.uid()) or public.is_admin());

create policy community_comments_insert_own on public.community_comments
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy community_comments_update_own on public.community_comments
  for update to authenticated
  using (user_id = (select auth.uid()) or public.is_admin())
  with check (user_id = (select auth.uid()) or public.is_admin());

create policy community_comments_delete_own on public.community_comments
  for delete to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

create policy community_post_likes_read on public.community_post_likes
  for select to authenticated using (true);

create policy community_post_likes_insert_own on public.community_post_likes
  for insert to authenticated with check (user_id = (select auth.uid()));

create policy community_post_likes_delete_own on public.community_post_likes
  for delete to authenticated using (user_id = (select auth.uid()));

grant select, insert, update, delete on table
  public.budget_scenarios,
  public.community_posts,
  public.community_comments,
  public.community_post_likes
to authenticated;

insert into public.community_posts (
  id,
  user_id,
  author_name,
  author_country,
  category,
  title,
  content,
  tags,
  created_at
)
values
  (
    '10000000-0000-4000-8000-000000000001',
    null,
    'Edvora Editorial',
    'Germany',
    'Applications',
    'How to tailor a motivation letter to a research group',
    'Connect your academic interests to the group''s recent work and explain the contribution you are prepared to make. Verify every research reference against the university source.',
    array['Motivation letter', 'Research', 'Checklist'],
    timezone('utc', now()) - interval '2 hours'
  ),
  (
    '10000000-0000-4000-8000-000000000002',
    null,
    'Edvora Editorial',
    'International',
    'Scholarships',
    'Build a scholarship calendar before application season',
    'Track the official deadline, required references, document format, and source URL separately for every award. Recheck the source before submitting.',
    array['Funding', 'Deadlines', 'Planning'],
    timezone('utc', now()) - interval '5 hours'
  );
