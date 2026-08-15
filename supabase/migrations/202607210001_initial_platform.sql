create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  avatar_url text,
  role text not null default 'student' check (role in ('student', 'admin')),
  nationality text,
  current_level text,
  target_degree text,
  field_of_study text,
  gpa numeric(5, 2),
  gpa_scale numeric(5, 2),
  ielts numeric(4, 1),
  toefl integer,
  gre integer,
  gmat integer,
  budget text,
  destination_countries text[] not null default '{}',
  intake_season text,
  work_experience text,
  application_goal text,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.protect_profile_role()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.role is distinct from old.role
     and coalesce(auth.role(), '') <> 'service_role'
     and not public.is_admin() then
    raise exception 'Only administrators may change profile roles';
  end if;
  return new;
end;
$$;

create trigger protect_profile_role_before_update
  before update on public.profiles
  for each row execute procedure public.protect_profile_role();

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

create table public.workspace_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger workspace_state_set_updated_at
  before update on public.workspace_state
  for each row execute procedure public.set_updated_at();
create table public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  university_id text not null,
  university_name text not null,
  program text not null,
  intake text not null,
  status text not null default 'Draft' check (status in ('Draft', 'Submitted', 'Reviewed', 'Accepted', 'Rejected')),
  deadline date,
  submitted_date date,
  application_reference text,
  portal_url text,
  notes text not null default '',
  progress integer not null default 0 check (progress between 0 and 100),
  applicant jsonb not null default '{}'::jsonb,
  education jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index applications_user_id_idx on public.applications(user_id);
create index applications_status_idx on public.applications(user_id, status);
create trigger applications_set_updated_at before update on public.applications for each row execute procedure public.set_updated_at();

create table public.application_tasks (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  title text not null,
  completed boolean not null default false,
  due_date date,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index application_tasks_application_id_idx on public.application_tasks(application_id, sort_order);
create trigger application_tasks_set_updated_at before update on public.application_tasks for each row execute procedure public.set_updated_at();

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category text not null,
  status text not null default 'Pending' check (status in ('Pending', 'Draft', 'Final')),
  storage_path text unique,
  mime_type text,
  size_bytes bigint check (size_bytes is null or size_bytes between 0 and 52428800),
  version integer not null default 0 check (version >= 0),
  expiry_date date,
  uploaded_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index documents_user_id_idx on public.documents(user_id);
create trigger documents_set_updated_at before update on public.documents for each row execute procedure public.set_updated_at();

create table public.application_documents (
  application_id uuid not null references public.applications(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (application_id, document_id)
);

create table public.wishlist_items (
  user_id uuid not null references auth.users(id) on delete cascade,
  university_id text not null,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, university_id)
);

create table public.university_notes (
  user_id uuid not null references auth.users(id) on delete cascade,
  university_id text not null,
  note text not null default '',
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, university_id)
);

create table public.saved_scholarships (
  user_id uuid not null references auth.users(id) on delete cascade,
  scholarship_id text not null,
  application_started boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, scholarship_id)
);

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create index chat_messages_user_created_idx on public.chat_messages(user_id, created_at);

create table public.consultation_bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  topic text not null,
  starts_at timestamptz not null,
  status text not null default 'booked' check (status in ('booked', 'completed', 'cancelled')),
  notes text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index consultation_bookings_user_start_idx on public.consultation_bookings(user_id, starts_at);
create trigger consultation_bookings_set_updated_at before update on public.consultation_bookings for each row execute procedure public.set_updated_at();

create table public.institutions (
  id text primary key,
  ror_id text unique,
  display_name text not null,
  aliases text[] not null default '{}',
  country_code text not null,
  country_name text not null,
  city text,
  region text,
  latitude double precision,
  longitude double precision,
  domains text[] not null default '{}',
  official_website text,
  established integer,
  status text not null default 'active' check (status in ('active', 'inactive', 'withdrawn')),
  source_updated_at date,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index institutions_country_idx on public.institutions(country_code);
create index institutions_name_trgm_idx on public.institutions using gin(display_name gin_trgm_ops);
create index institutions_domains_gin_idx on public.institutions using gin(domains);
create trigger institutions_set_updated_at before update on public.institutions for each row execute procedure public.set_updated_at();

create table public.programs (
  id uuid primary key default gen_random_uuid(),
  institution_id text not null references public.institutions(id) on delete cascade,
  official_url text not null,
  name text not null,
  level text,
  subject text,
  delivery_mode text,
  language text,
  duration_months integer,
  published boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (institution_id, official_url)
);

create index programs_institution_idx on public.programs(institution_id);
create index programs_name_trgm_idx on public.programs using gin(name gin_trgm_ops);
create trigger programs_set_updated_at before update on public.programs for each row execute procedure public.set_updated_at();

create table public.source_observations (
  id uuid primary key default gen_random_uuid(),
  institution_id text not null references public.institutions(id) on delete cascade,
  program_id uuid references public.programs(id) on delete cascade,
  source_url text not null,
  fetched_at timestamptz not null default timezone('utc', now()),
  content_hash text not null,
  http_status integer,
  content_type text,
  extractor_version text,
  evidence_path text,
  robots_allowed boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  unique (source_url, content_hash)
);

create index source_observations_institution_idx on public.source_observations(institution_id, fetched_at desc);

create table public.facts (
  id uuid primary key default gen_random_uuid(),
  observation_id uuid not null references public.source_observations(id) on delete cascade,
  institution_id text not null references public.institutions(id) on delete cascade,
  program_id uuid references public.programs(id) on delete cascade,
  field text not null,
  normalized_value jsonb not null,
  raw_value text,
  currency text,
  academic_year text,
  effective_from date,
  effective_until date,
  confidence numeric(4, 3) not null default 0 check (confidence between 0 and 1),
  review_status text not null default 'pending' check (review_status in ('pending', 'published', 'rejected', 'superseded')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index facts_institution_field_idx on public.facts(institution_id, field, review_status);
create index facts_program_field_idx on public.facts(program_id, field, review_status);
create trigger facts_set_updated_at before update on public.facts for each row execute procedure public.set_updated_at();

create table public.crawl_jobs (
  id uuid primary key default gen_random_uuid(),
  institution_id text not null references public.institutions(id) on delete cascade,
  url text not null,
  job_type text not null default 'discover',
  status text not null default 'queued' check (status in ('queued', 'running', 'completed', 'failed', 'blocked')),
  priority integer not null default 100,
  attempts integer not null default 0,
  scheduled_for timestamptz not null default timezone('utc', now()),
  locked_at timestamptz,
  locked_by text,
  last_error text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (institution_id, url, job_type)
);

create index crawl_jobs_queue_idx on public.crawl_jobs(status, scheduled_for, priority);
create trigger crawl_jobs_set_updated_at before update on public.crawl_jobs for each row execute procedure public.set_updated_at();

create table public.subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  provider text not null default 'stripe',
  provider_customer_id text unique,
  provider_subscription_id text unique,
  product_id text,
  status text not null default 'inactive',
  current_period_end timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger subscriptions_set_updated_at before update on public.subscriptions for each row execute procedure public.set_updated_at();

create table public.entitlements (
  user_id uuid not null references auth.users(id) on delete cascade,
  feature_key text not null,
  active boolean not null default false,
  expires_at timestamptz,
  source text not null default 'stripe',
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, feature_key)
);

alter table public.profiles enable row level security;
alter table public.workspace_state enable row level security;
alter table public.applications enable row level security;
alter table public.application_tasks enable row level security;
alter table public.documents enable row level security;
alter table public.application_documents enable row level security;
alter table public.wishlist_items enable row level security;
alter table public.university_notes enable row level security;
alter table public.saved_scholarships enable row level security;
alter table public.chat_messages enable row level security;
alter table public.consultation_bookings enable row level security;
alter table public.institutions enable row level security;
alter table public.programs enable row level security;
alter table public.source_observations enable row level security;
alter table public.facts enable row level security;
alter table public.crawl_jobs enable row level security;
alter table public.subscriptions enable row level security;
alter table public.entitlements enable row level security;

create policy profiles_select_own on public.profiles for select to authenticated using (id = (select auth.uid()) or public.is_admin());
create policy profiles_insert_own on public.profiles for insert to authenticated with check (id = (select auth.uid()));
create policy profiles_update_own on public.profiles for update to authenticated using (id = (select auth.uid()) or public.is_admin()) with check (id = (select auth.uid()) or public.is_admin());

create policy workspace_state_select_own on public.workspace_state for select to authenticated using (user_id = (select auth.uid()) or public.is_admin());
create policy workspace_state_insert_own on public.workspace_state for insert to authenticated with check (user_id = (select auth.uid()));
create policy workspace_state_update_own on public.workspace_state for update to authenticated using (user_id = (select auth.uid()) or public.is_admin()) with check (user_id = (select auth.uid()) or public.is_admin());
create policy workspace_state_delete_own on public.workspace_state for delete to authenticated using (user_id = (select auth.uid()) or public.is_admin());
create policy applications_select_own on public.applications for select to authenticated using (user_id = (select auth.uid()) or public.is_admin());
create policy applications_insert_own on public.applications for insert to authenticated with check (user_id = (select auth.uid()));
create policy applications_update_own on public.applications for update to authenticated using (user_id = (select auth.uid()) or public.is_admin()) with check (user_id = (select auth.uid()) or public.is_admin());
create policy applications_delete_own on public.applications for delete to authenticated using (user_id = (select auth.uid()) or public.is_admin());

create policy application_tasks_select_own on public.application_tasks for select to authenticated using (exists (select 1 from public.applications a where a.id = application_id and (a.user_id = (select auth.uid()) or public.is_admin())));
create policy application_tasks_insert_own on public.application_tasks for insert to authenticated with check (exists (select 1 from public.applications a where a.id = application_id and a.user_id = (select auth.uid())));
create policy application_tasks_update_own on public.application_tasks for update to authenticated using (exists (select 1 from public.applications a where a.id = application_id and (a.user_id = (select auth.uid()) or public.is_admin()))) with check (exists (select 1 from public.applications a where a.id = application_id and (a.user_id = (select auth.uid()) or public.is_admin())));
create policy application_tasks_delete_own on public.application_tasks for delete to authenticated using (exists (select 1 from public.applications a where a.id = application_id and (a.user_id = (select auth.uid()) or public.is_admin())));

create policy documents_select_own on public.documents for select to authenticated using (user_id = (select auth.uid()) or public.is_admin());
create policy documents_insert_own on public.documents for insert to authenticated with check (user_id = (select auth.uid()));
create policy documents_update_own on public.documents for update to authenticated using (user_id = (select auth.uid()) or public.is_admin()) with check (user_id = (select auth.uid()) or public.is_admin());
create policy documents_delete_own on public.documents for delete to authenticated using (user_id = (select auth.uid()) or public.is_admin());

create policy application_documents_select_own on public.application_documents for select to authenticated using (exists (select 1 from public.applications a where a.id = application_id and (a.user_id = (select auth.uid()) or public.is_admin())));
create policy application_documents_insert_own on public.application_documents for insert to authenticated with check (exists (select 1 from public.applications a join public.documents d on d.id = document_id where a.id = application_id and a.user_id = (select auth.uid()) and d.user_id = (select auth.uid())));
create policy application_documents_delete_own on public.application_documents for delete to authenticated using (exists (select 1 from public.applications a where a.id = application_id and (a.user_id = (select auth.uid()) or public.is_admin())));

create policy wishlist_own_all on public.wishlist_items for all to authenticated using (user_id = (select auth.uid()) or public.is_admin()) with check (user_id = (select auth.uid()));
create policy university_notes_own_all on public.university_notes for all to authenticated using (user_id = (select auth.uid()) or public.is_admin()) with check (user_id = (select auth.uid()));
create policy saved_scholarships_own_all on public.saved_scholarships for all to authenticated using (user_id = (select auth.uid()) or public.is_admin()) with check (user_id = (select auth.uid()));
create policy chat_messages_own_all on public.chat_messages for all to authenticated using (user_id = (select auth.uid()) or public.is_admin()) with check (user_id = (select auth.uid()));
create policy consultation_bookings_own_all on public.consultation_bookings for all to authenticated using (user_id = (select auth.uid()) or public.is_admin()) with check (user_id = (select auth.uid()));

create policy institutions_public_read on public.institutions for select using (status = 'active');
create policy programs_public_read on public.programs for select using (published = true);
create policy facts_public_read on public.facts for select using (review_status = 'published');
create policy observations_admin_all on public.source_observations for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy crawl_jobs_admin_all on public.crawl_jobs for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy facts_admin_all on public.facts for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy institutions_admin_all on public.institutions for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy programs_admin_all on public.programs for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy subscriptions_select_own on public.subscriptions for select to authenticated using (user_id = (select auth.uid()) or public.is_admin());
create policy entitlements_select_own on public.entitlements for select to authenticated using (user_id = (select auth.uid()) or public.is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documents',
  'documents',
  false,
  52428800,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy document_objects_select_own on storage.objects for select to authenticated
using (bucket_id = 'documents' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy document_objects_insert_own on storage.objects for insert to authenticated
with check (bucket_id = 'documents' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy document_objects_update_own on storage.objects for update to authenticated
using (bucket_id = 'documents' and (storage.foldername(name))[1] = (select auth.uid())::text)
with check (bucket_id = 'documents' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy document_objects_delete_own on storage.objects for delete to authenticated
using (bucket_id = 'documents' and (storage.foldername(name))[1] = (select auth.uid())::text);
