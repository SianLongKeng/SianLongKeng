-- Demo teacher account for EduTwin admin panel testing.
-- Login: teacher@edutwin.demo / Demo2026!
-- Change the password later once a "change password" feature exists.
-- (Uses a single DO block instead of psql's \gset, since this runs
-- through Neon's web SQL Editor, not the psql client.)

do $$
declare
  v_school_id uuid;
  v_teacher_id uuid;
begin
  insert into schools (name) values ('โรงเรียนสาธิต EduTwin')
    returning id into v_school_id;

  insert into teachers (school_id, full_name, email, password_hash)
    values (v_school_id, 'ครู เดโม่', 'teacher@edutwin.demo',
      '$2b$12$I7Ay5v8GkUn7QCW.Z5y1Q.y/KnJlfonDgnrA241zrgEnYk7RhZCHq')
    returning id into v_teacher_id;

  insert into classes (school_id, teacher_id, name, subject)
    values (v_school_id, v_teacher_id, 'ป.5/2', 'คณิตศาสตร์');
end $$;
