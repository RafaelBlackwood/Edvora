revoke select on table
  public.community_posts,
  public.community_comments,
  public.community_post_likes
from authenticated;

grant select (
  id,
  author_name,
  author_avatar,
  author_country,
  category,
  title,
  content,
  tags,
  status,
  created_at,
  updated_at
) on public.community_posts to authenticated;

grant select (
  id,
  post_id,
  author_name,
  content,
  status,
  created_at,
  updated_at
) on public.community_comments to authenticated;

create or replace function public.get_community_like_summary(p_post_ids uuid[])
returns table (
  post_id uuid,
  like_count bigint,
  liked_by_me boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    requested.post_id,
    count(likes.user_id) as like_count,
    coalesce(bool_or(likes.user_id = auth.uid()), false) as liked_by_me
  from unnest(p_post_ids) as requested(post_id)
  left join public.community_post_likes as likes
    on likes.post_id = requested.post_id
  where cardinality(p_post_ids) between 1 and 100
  group by requested.post_id;
$$;

revoke all on function public.get_community_like_summary(uuid[]) from public;
grant execute on function public.get_community_like_summary(uuid[]) to authenticated;
