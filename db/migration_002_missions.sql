-- EduTwin migration 002: activate the mission/attempt/coach/DNA tables
-- that schema.sql already defined but the app never wrote to.
-- Safe to re-run: every statement is idempotent (if not exists / on conflict).
-- Run this once in the Neon SQL Editor against the same database used by
-- edutwin-admin (DATABASE_URL).

create table if not exists missions (
  id            uuid primary key default gen_random_uuid(),
  class_id      uuid references classes(id) on delete cascade,
  title         text not null,
  scenario_text text not null,
  created_by    uuid references teachers(id),
  created_at    timestamptz not null default now()
);

create table if not exists mission_questions (
  id            uuid primary key default gen_random_uuid(),
  mission_id    uuid not null references missions(id) on delete cascade,
  order_index   int not null,
  question_text text not null,
  unique (mission_id, order_index)
);

create table if not exists question_choices (
  id            uuid primary key default gen_random_uuid(),
  question_id   uuid not null references mission_questions(id) on delete cascade,
  order_index   int not null,
  choice_text   text not null,
  is_correct    boolean not null default false,
  unique (question_id, order_index)
);

create table if not exists mission_attempts (
  id            uuid primary key default gen_random_uuid(),
  student_id    uuid not null references students(id) on delete cascade,
  mission_id    uuid not null references missions(id) on delete cascade,
  started_at    timestamptz not null default now(),
  completed_at  timestamptz,
  score         int
);

create table if not exists question_responses (
  id                uuid primary key default gen_random_uuid(),
  attempt_id        uuid not null references mission_attempts(id) on delete cascade,
  question_id       uuid not null references mission_questions(id) on delete cascade,
  choice_id         uuid references question_choices(id),
  attempt_number    int not null default 1,
  is_correct        boolean not null,
  time_spent_seconds int,
  responded_at      timestamptz not null default now()
);

create table if not exists hint_requests (
  id            uuid primary key default gen_random_uuid(),
  attempt_id    uuid not null references mission_attempts(id) on delete cascade,
  question_id   uuid references mission_questions(id),
  requested_at  timestamptz not null default now()
);

create table if not exists coach_conversations (
  id            uuid primary key default gen_random_uuid(),
  student_id    uuid not null references students(id) on delete cascade,
  attempt_id    uuid references mission_attempts(id) on delete set null,
  started_at    timestamptz not null default now()
);

create table if not exists coach_messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references coach_conversations(id) on delete cascade,
  sender          text not null check (sender in ('student', 'ai')),
  message_text    text not null,
  created_at      timestamptz not null default now()
);

create table if not exists reflections (
  id            uuid primary key default gen_random_uuid(),
  attempt_id    uuid not null references mission_attempts(id) on delete cascade,
  prompt_text   text not null,
  response_text text not null,
  created_at    timestamptz not null default now()
);

create table if not exists learning_dna_snapshots (
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
  source_model        text not null,
  source_attempt_id    uuid references mission_attempts(id)
);

create table if not exists mistake_types (
  id      smallint primary key,
  code    text not null unique,
  label_th text not null,
  label_en text not null
);

insert into mistake_types (id, code, label_th, label_en) values
  (1, 'misconception',        'จำ Concept ผิด/สับสน', 'Misconception'),
  (2, 'logic_gap',            'ลำดับความคิดขาดหาย', 'Logic Gap'),
  (3, 'calculation_error',    'คำนวณผิดพลาด', 'Calculation Error'),
  (4, 'misread_question',     'อ่านโจทย์ผิด', 'Misread Question'),
  (5, 'wrong_concept_recall', 'จำสูตร/Concept ผิดตัว', 'Wrong Concept Recall'),
  (6, 'guessing',             'เดาคำตอบ', 'Guessing')
on conflict (id) do nothing;

create table if not exists mistake_records (
  id              uuid primary key default gen_random_uuid(),
  attempt_id      uuid not null references mission_attempts(id) on delete cascade,
  mistake_type_id smallint not null references mistake_types(id),
  pct             numeric(5,2) not null check (pct between 0 and 100),
  source_model    text not null,
  created_at      timestamptz not null default now()
);

create table if not exists root_cause_analyses (
  id            uuid primary key default gen_random_uuid(),
  student_id    uuid not null references students(id) on delete cascade,
  attempt_id    uuid references mission_attempts(id) on delete set null,
  summary_text  text not null,
  source_model  text not null,
  created_at    timestamptz not null default now()
);

create table if not exists interventions (
  id              uuid primary key default gen_random_uuid(),
  student_id      uuid not null references students(id) on delete cascade,
  root_cause_id   uuid references root_cause_analyses(id) on delete set null,
  title           text not null,
  description     text not null,
  status          text not null default 'recommended'
                    check (status in ('recommended', 'assigned', 'completed', 'dismissed')),
  recommended_by  text not null default 'ai' check (recommended_by in ('ai', 'teacher')),
  reviewed_by     uuid references teachers(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists kpi_snapshots (
  id            uuid primary key default gen_random_uuid(),
  class_id      uuid references classes(id) on delete cascade,
  school_id     uuid references schools(id) on delete cascade,
  metric_key    text not null,
  metric_value  numeric not null,
  period_start  date not null,
  period_end    date not null,
  computed_at   timestamptz not null default now(),
  check (class_id is not null or school_id is not null)
);

create index if not exists idx_students_class on students(class_id);
create index if not exists idx_attempts_student on mission_attempts(student_id);
create index if not exists idx_attempts_mission on mission_attempts(mission_id);
create index if not exists idx_responses_attempt on question_responses(attempt_id);
create index if not exists idx_dna_student_time on learning_dna_snapshots(student_id, computed_at desc);
create index if not exists idx_mistakes_attempt on mistake_records(attempt_id);
create index if not exists idx_interventions_student_status on interventions(student_id, status);
create index if not exists idx_kpi_class_period on kpi_snapshots(class_id, period_start, period_end);

-- The single hackathon demo mission (public-park budget), pinned to a
-- fixed id so the app can reference it without a lookup. class_id is left
-- null: it's a shared mission available to every teacher's students, not
-- owned by one class. Content matches MISSION_QUESTIONS in index.html
-- exactly, so the real-data version and the static pitch demo tell the
-- same story with the same numbers.
insert into missions (id, class_id, title, scenario_text, created_by)
values (
  '00000000-0000-0000-0000-000000000001',
  null,
  'มิชชันที่ 3 · สวนสาธารณะชุมชน',
  'เทศบาลให้งบประมาณ 50,000 บาท เพื่อสร้างสวนสาธารณะขนาด 200 ตร.ม. โดยกำหนดให้ 60% ของพื้นที่ทั้งหมดใช้ปูหญ้า ส่วนที่เหลือเป็นทางเดินและสนามเด็กเล่น',
  null
)
on conflict (id) do nothing;

insert into mission_questions (mission_id, order_index, question_text) values
  ('00000000-0000-0000-0000-000000000001', 1, 'พื้นที่ที่ต้องปูหญ้า (60% ของพื้นที่ทั้งหมด) คิดเป็นกี่ตารางเมตร?'),
  ('00000000-0000-0000-0000-000000000001', 2, 'พื้นที่ที่เหลือสำหรับทางเดินและสนามเด็กเล่นมีกี่ตารางเมตร?'),
  ('00000000-0000-0000-0000-000000000001', 3, 'ถ้าทางเดินใช้พื้นที่ 30 ตร.ม. สนามเด็กเล่นจะเหลือพื้นที่กี่ตารางเมตร?'),
  ('00000000-0000-0000-0000-000000000001', 4, 'งบประมาณสำหรับปูหญ้าคือ 40% ของงบทั้งหมด 50,000 บาท เป็นเงินเท่าไหร่?'),
  ('00000000-0000-0000-0000-000000000001', 5, 'งบประมาณที่เหลือสำหรับทางเดินและสนามเด็กเล่นเป็นเงินเท่าไหร่?')
on conflict (mission_id, order_index) do nothing;

insert into question_choices (question_id, order_index, choice_text, is_correct)
select q.id, c.order_index, c.choice_text, c.is_correct
from mission_questions q
join (values
  (1, 1, '80 ตร.ม.', false),   (1, 2, '120 ตร.ม.', true),  (1, 3, '140 ตร.ม.', false), (1, 4, '160 ตร.ม.', false),
  (2, 1, '60 ตร.ม.', false),   (2, 2, '70 ตร.ม.', false),  (2, 3, '80 ตร.ม.', true),   (2, 4, '90 ตร.ม.', false),
  (3, 1, '40 ตร.ม.', false),   (3, 2, '50 ตร.ม.', true),   (3, 3, '55 ตร.ม.', false),  (3, 4, '60 ตร.ม.', false),
  (4, 1, '15,000 บาท', false), (4, 2, '18,000 บาท', false),(4, 3, '20,000 บาท', true), (4, 4, '25,000 บาท', false),
  (5, 1, '25,000 บาท', false), (5, 2, '28,000 บาท', false),(5, 3, '30,000 บาท', true), (5, 4, '32,000 บาท', false)
) as c(q_order, order_index, choice_text, is_correct)
  on c.q_order = q.order_index
where q.mission_id = '00000000-0000-0000-0000-000000000001'
on conflict (question_id, order_index) do nothing;
