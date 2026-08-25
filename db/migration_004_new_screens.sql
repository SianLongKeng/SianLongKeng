-- EduTwin migration 004: supports the new screens from
-- design_handoff_edutwin_dark_violet (Mission Builder + Assign, Student
-- Home's "assigned but not started" list). Safe to re-run.

-- A mission can be assigned to a whole class, to one Learning-Gap bucket
-- within a class (same concept_gap/application_gap/mastery classification
-- the AI Grouping page already computes), or to one specific student.
-- Exactly one of class_id-only / bucket / student_id narrows the target;
-- class_id is always set so "assigned to my class" queries stay simple.
create table if not exists mission_assignments (
  id            uuid primary key default gen_random_uuid(),
  mission_id    uuid not null references missions(id) on delete cascade,
  class_id      uuid not null references classes(id) on delete cascade,
  bucket        text check (bucket in ('concept_gap', 'application_gap', 'mastery')),
  student_id    uuid references students(id) on delete cascade,
  due_at        timestamptz,
  created_by    uuid not null references teachers(id),
  created_at    timestamptz not null default now()
);

create index if not exists idx_assignments_class on mission_assignments(class_id);
create index if not exists idx_assignments_student on mission_assignments(student_id);
create index if not exists idx_assignments_mission on mission_assignments(mission_id);
