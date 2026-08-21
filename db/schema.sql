-- EduTwin database schema (PostgreSQL)
-- Matches the data model implied by the product spec: LEARN -> DIAGNOSE -> ADAPT
-- Student -> Learning Actions -> Data Engine -> AI Learning Analysis ->
-- Learning DNA + Mistake DNA -> AI Recommendation -> Student Coach / Teacher Copilot

create extension if not exists pgcrypto;
create extension if not exists citext;

-- ============================================================
-- Tenancy: schools, teachers, classes, students
-- ============================================================

create table schools (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  created_at    timestamptz not null default now()
);

create table teachers (
  id            uuid primary key default gen_random_uuid(),
  school_id     uuid not null references schools(id) on delete cascade,
  full_name     text not null,
  email         citext not null unique,
  password_hash text not null,
  created_at    timestamptz not null default now()
);

create table classes (
  id            uuid primary key default gen_random_uuid(),
  school_id     uuid not null references schools(id) on delete cascade,
  teacher_id    uuid not null references teachers(id) on delete restrict,
  name          text not null,          -- e.g. "ป.5/2"
  subject       text not null,          -- e.g. "คณิตศาสตร์"
  term          text,                   -- e.g. "2569/1"
  created_at    timestamptz not null default now()
);

-- Real identity lives here, and only here. Nothing in this schema
-- attaches AI-generated content directly to a real name/ID without
-- going through this table's foreign key, so access control on this
-- one table is what protects student PII end to end.
create table students (
  id              uuid primary key default gen_random_uuid(),
  class_id        uuid not null references classes(id) on delete cascade,
  student_number  text not null,        -- เลขประจำตัว
  first_name      text not null,
  last_name       text not null,
  nickname        text,
  created_at      timestamptz not null default now(),
  unique (class_id, student_number)
);

-- ============================================================
-- Content: missions, questions, choices
-- ============================================================

create table missions (
  id            uuid primary key default gen_random_uuid(),
  class_id      uuid references classes(id) on delete cascade,
  title         text not null,
  scenario_text text not null,
  created_by    uuid references teachers(id),
  created_at    timestamptz not null default now()
);

create table mission_questions (
  id            uuid primary key default gen_random_uuid(),
  mission_id    uuid not null references missions(id) on delete cascade,
  order_index   int not null,
  question_text text not null,
  unique (mission_id, order_index)
);

create table question_choices (
  id            uuid primary key default gen_random_uuid(),
  question_id   uuid not null references mission_questions(id) on delete cascade,
  order_index   int not null,
  choice_text   text not null,
  is_correct    boolean not null default false,
  unique (question_id, order_index)
);

-- ============================================================
-- Learning actions: what the student actually did
-- (this is the raw material the AI layer analyzes)
-- ============================================================

create table mission_attempts (
  id            uuid primary key default gen_random_uuid(),
  student_id    uuid not null references students(id) on delete cascade,
  mission_id    uuid not null references missions(id) on delete cascade,
  started_at    timestamptz not null default now(),
  completed_at  timestamptz,
  score         int                     -- out of question count, once completed
);

create table question_responses (
  id                uuid primary key default gen_random_uuid(),
  attempt_id        uuid not null references mission_attempts(id) on delete cascade,
  question_id       uuid not null references mission_questions(id) on delete cascade,
  choice_id         uuid references question_choices(id),
  attempt_number    int not null default 1,   -- 1st try, 2nd try (Explore -> Fail -> Reflect -> Improve)
  is_correct        boolean not null,
  time_spent_seconds int,
  responded_at      timestamptz not null default now()
);

create table hint_requests (
  id            uuid primary key default gen_random_uuid(),
  attempt_id    uuid not null references mission_attempts(id) on delete cascade,
  question_id   uuid references mission_questions(id),
  requested_at  timestamptz not null default now()
);

create table coach_conversations (
  id            uuid primary key default gen_random_uuid(),
  student_id    uuid not null references students(id) on delete cascade,
  attempt_id    uuid references mission_attempts(id) on delete set null,
  started_at    timestamptz not null default now()
);

create table coach_messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references coach_conversations(id) on delete cascade,
  sender          text not null check (sender in ('student', 'ai')),
  message_text    text not null,
  created_at      timestamptz not null default now()
);

create table reflections (
  id            uuid primary key default gen_random_uuid(),
  attempt_id    uuid not null references mission_attempts(id) on delete cascade,
  prompt_text   text not null,
  response_text text not null,
  created_at    timestamptz not null default now()
);

-- ============================================================
-- AI output: Learning DNA, Mistake DNA, root cause, interventions
-- Every row here is a machine-generated inference, never hand-entered,
-- and always traceable back to the attempt/response it was computed from.
-- ============================================================

-- One row per (student, computed-at) — Learning DNA is a moving target,
-- recomputed as new mission attempts come in, not a single fixed value.
create table learning_dna_snapshots (
  id                  uuid primary key default gen_random_uuid(),
  student_id          uuid not null references students(id) on delete cascade,
  computed_at         timestamptz not null default now(),
  concept_score       int not null check (concept_score between 0 and 100),
  application_score   int not null check (application_score between 0 and 100),
  critical_thinking_score int not null check (critical_thinking_score between 0 and 100),
  problem_solving_score  int not null check (problem_solving_score between 0 and 100),
  creativity_score    int not null check (creativity_score between 0 and 100),
  collaboration_score int not null check (collaboration_score between 0 and 100),
  confidence_score    int not null check (confidence_score between 0 and 100),
  source_model        text not null,   -- which LLM/version produced this
  source_attempt_id    uuid references mission_attempts(id)
);

create table mistake_types (
  id      smallint primary key,
  code    text not null unique,   -- misconception | logic_gap | calculation_error | misread_question | wrong_concept_recall | guessing
  label_th text not null,
  label_en text not null
);

insert into mistake_types (id, code, label_th, label_en) values
  (1, 'misconception',        'จำ Concept ผิด/สับสน', 'Misconception'),
  (2, 'logic_gap',            'ลำดับความคิดขาดหาย', 'Logic Gap'),
  (3, 'calculation_error',    'คำนวณผิดพลาด', 'Calculation Error'),
  (4, 'misread_question',     'อ่านโจทย์ผิด', 'Misread Question'),
  (5, 'wrong_concept_recall', 'จำสูตร/Concept ผิดตัว', 'Wrong Concept Recall'),
  (6, 'guessing',             'เดาคำตอบ', 'Guessing');

-- Distribution of mistake types for one attempt, as classified by the AI layer.
create table mistake_records (
  id              uuid primary key default gen_random_uuid(),
  attempt_id      uuid not null references mission_attempts(id) on delete cascade,
  mistake_type_id smallint not null references mistake_types(id),
  pct             numeric(5,2) not null check (pct between 0 and 100),
  source_model    text not null,
  created_at      timestamptz not null default now()
);

create table root_cause_analyses (
  id            uuid primary key default gen_random_uuid(),
  student_id    uuid not null references students(id) on delete cascade,
  attempt_id    uuid references mission_attempts(id) on delete set null,
  summary_text  text not null,
  source_model  text not null,
  created_at    timestamptz not null default now()
);

create table interventions (
  id              uuid primary key default gen_random_uuid(),
  student_id      uuid not null references students(id) on delete cascade,
  root_cause_id   uuid references root_cause_analyses(id) on delete set null,
  title           text not null,
  description     text not null,
  status          text not null default 'recommended'
                    check (status in ('recommended', 'assigned', 'completed', 'dismissed')),
  recommended_by  text not null default 'ai' check (recommended_by in ('ai', 'teacher')),
  reviewed_by     uuid references teachers(id),   -- teacher who accepted/dismissed the AI suggestion
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ============================================================
-- Reporting: Impact Dashboard KPIs, computed on a schedule
-- (never hand-typed — this is what backs the KPI screen instead of
-- the hardcoded numbers in the current static demo)
-- ============================================================

create table kpi_snapshots (
  id            uuid primary key default gen_random_uuid(),
  class_id      uuid references classes(id) on delete cascade,
  school_id     uuid references schools(id) on delete cascade,
  metric_key    text not null,   -- e.g. 'student_learning_gap', 'completion_rate', 'ai_diagnosis_accuracy'
  metric_value  numeric not null,
  period_start  date not null,
  period_end    date not null,
  computed_at   timestamptz not null default now(),
  check (class_id is not null or school_id is not null)
);

-- ============================================================
-- Indexes for the access patterns the UI actually needs
-- ============================================================

create index idx_students_class on students(class_id);
create index idx_attempts_student on mission_attempts(student_id);
create index idx_attempts_mission on mission_attempts(mission_id);
create index idx_responses_attempt on question_responses(attempt_id);
create index idx_dna_student_time on learning_dna_snapshots(student_id, computed_at desc);
create index idx_mistakes_attempt on mistake_records(attempt_id);
create index idx_interventions_student_status on interventions(student_id, status);
create index idx_kpi_class_period on kpi_snapshots(class_id, period_start, period_end);

-- ============================================================
-- Grouping (Concept Gap / Application Gap / Mastery) is a derived
-- classification, not stored state — it depends on the latest Learning
-- DNA snapshot and mistake distribution, both of which change as new
-- attempts come in. Compute it in the application layer or as a view
-- over the latest learning_dna_snapshots + mistake_records per student,
-- rather than a column that can drift out of sync with its source rows.
