-- EduTwin migration 006: self-service password reset without email.
-- No email/SMS provider is wired up anywhere in this app, so a normal
-- "we sent you a reset link" flow isn't possible yet. Instead each teacher
-- picks their own recovery question at registration and answers it later
-- to set a new password -- same trust model as the answer to any other
-- security question, hashed the same way passwords are (never stored
-- in plaintext).
-- Safe to re-run.

alter table teachers add column if not exists security_question text;
alter table teachers add column if not exists security_answer_hash text;
