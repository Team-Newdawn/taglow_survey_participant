create table if not exists public.participant_service_feedback (
  id uuid primary key default gen_random_uuid(),
  public_slug text not null
    check (char_length(btrim(public_slug)) between 1 and 160),
  participant_user_id uuid not null default auth.uid(),
  locale text not null
    check (locale in ('ko', 'en')),
  feedback_text text not null
    check (char_length(btrim(feedback_text)) between 1 and 2000),
  source text not null default 'complete_page'
    check (source = 'complete_page'),
  submitted_at timestamptz not null default now()
);

comment on table public.participant_service_feedback is
  'Optional Taglow service improvement feedback collected after survey completion. Keep separate from responses/answers and exclude from survey answer analytics.';

create index if not exists idx_participant_service_feedback_submitted_at
  on public.participant_service_feedback (submitted_at desc);

alter table public.participant_service_feedback enable row level security;

revoke all on table public.participant_service_feedback from anon, authenticated;
grant insert (public_slug, locale, feedback_text, source)
  on table public.participant_service_feedback
  to authenticated;
grant select, insert, update, delete on table public.participant_service_feedback to service_role;

drop policy if exists "participants can add service feedback" on public.participant_service_feedback;

create policy "participants can add service feedback"
  on public.participant_service_feedback
  for insert
  to authenticated
  with check (
    (select auth.uid()) is not null
    and participant_user_id = (select auth.uid())
  );
