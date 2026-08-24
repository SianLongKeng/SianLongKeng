-- EduTwin migration 003: add a short shareable join code per class so
-- students can self-enter their own mission without a teacher account
-- (students have no password_hash in this schema by design — join codes
-- are the intended low-friction identification method, same trust model
-- as a Kahoot/Quizizz game PIN: knowing the code + picking your own name
-- from that one class's roster, nothing more).
-- Safe to re-run.

alter table classes add column if not exists join_code text;

-- Backfill any class created before this migration with a random 6-character
-- code. Only touches rows that don't already have one.
update classes
   set join_code = upper(substr(md5(random()::text || id::text), 1, 6))
 where join_code is null;

alter table classes alter column join_code set not null;

create unique index if not exists idx_classes_join_code on classes(join_code);
