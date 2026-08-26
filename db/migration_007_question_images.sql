-- EduTwin migration 007: optional image per mission question, for
-- teacher-authored missions built in Mission Builder. Safe to re-run.

alter table mission_questions add column if not exists image_url text;
