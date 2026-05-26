-- =============================================================================
-- 0017_messages_ai_classification.sql
-- =============================================================================
-- Purpose:
--   M6 — add columns to `messages` for the AI-classified inbox.
--   Populated in the background by the submitMessage Server Action;
--   surfaced in the M7 admin inbox UI.

alter table public.messages
  add column if not exists classification text
    check (
      classification is null
      or classification = any (array['recruiter', 'collaboration', 'spam', 'question', 'other'])
    ),
  add column if not exists suggested_reply text,
  add column if not exists classified_at timestamptz;

create index if not exists messages_classification_idx
  on public.messages (classification);

comment on column public.messages.classification is
  'AI-generated classification: recruiter | collaboration | spam | question | other. Null until classified.';
comment on column public.messages.suggested_reply is
  'AI-drafted reply tone for the admin inbox. Suggestion only — the admin always writes the actual reply.';
comment on column public.messages.classified_at is
  'When the AI classification completed. Null = not yet classified.';
