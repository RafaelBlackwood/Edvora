create or replace function public.set_community_post_author()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  request_user_id uuid := auth.uid();
  profile_name text;
  profile_avatar text;
  profile_country text;
begin
  if tg_op = 'UPDATE' then
    new.user_id := old.user_id;
    new.author_name := old.author_name;
    new.author_avatar := old.author_avatar;
    new.author_country := old.author_country;
    return new;
  end if;

  if request_user_id is null then
    return new;
  end if;

  select
    nullif(display_name, ''),
    avatar_url,
    nationality
  into profile_name, profile_avatar, profile_country
  from public.profiles
  where id = request_user_id;

  new.user_id := request_user_id;
  new.author_name := coalesce(profile_name, 'Edvora student');
  new.author_avatar := coalesce(profile_avatar, '');
  new.author_country := coalesce(profile_country, '');
  return new;
end;
$$;

create trigger community_posts_set_author
  before insert or update on public.community_posts
  for each row execute procedure public.set_community_post_author();

create or replace function public.set_community_comment_author()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  request_user_id uuid := auth.uid();
  profile_name text;
begin
  if tg_op = 'UPDATE' then
    new.user_id := old.user_id;
    new.author_name := old.author_name;
    return new;
  end if;

  if request_user_id is null then
    return new;
  end if;

  select nullif(display_name, '')
  into profile_name
  from public.profiles
  where id = request_user_id;

  new.user_id := request_user_id;
  new.author_name := coalesce(profile_name, 'Edvora student');
  return new;
end;
$$;

create trigger community_comments_set_author
  before insert or update on public.community_comments
  for each row execute procedure public.set_community_comment_author();

revoke all on function public.set_community_post_author() from public;
revoke all on function public.set_community_comment_author() from public;

create or replace function public.get_booked_consultation_slots(
  p_from timestamptz,
  p_to timestamptz
)
returns table (
  mentor_id text,
  starts_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select booking.mentor_id, booking.starts_at
  from public.consultation_bookings as booking
  where booking.status = 'booked'
    and p_to > p_from
    and p_to <= p_from + interval '31 days'
    and booking.starts_at >= p_from
    and booking.starts_at < p_to
  order by booking.starts_at;
$$;

revoke all on function public.get_booked_consultation_slots(timestamptz, timestamptz) from public;
grant execute on function public.get_booked_consultation_slots(timestamptz, timestamptz) to authenticated;
