grant usage on schema public to anon, authenticated;

grant select on table
  public.institutions,
  public.programs,
  public.facts
to anon;

grant select, insert, update, delete on table
  public.profiles,
  public.workspace_state,
  public.applications,
  public.application_tasks,
  public.documents,
  public.application_documents,
  public.wishlist_items,
  public.university_notes,
  public.saved_scholarships,
  public.chat_messages,
  public.consultation_bookings,
  public.institutions,
  public.programs,
  public.source_observations,
  public.facts,
  public.crawl_jobs
to authenticated;

grant select on table
  public.subscriptions,
  public.entitlements
to authenticated;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;
