-- Demo teacher account for EduTwin admin panel testing.
-- Login: teacher@edutwin.demo / Demo2026!
-- Change the password later once a "change password" feature exists.

insert into schools (name) values ('โรงเรียนสาธิต EduTwin') returning id \gset school_

insert into teachers (school_id, full_name, email, password_hash)
  values (:'school_id', 'ครู เดโม่', 'teacher@edutwin.demo', '$2b$12$I7Ay5v8GkUn7QCW.Z5y1Q.y/KnJlfonDgnrA241zrgEnYk7RhZCHq')
  returning id \gset teacher_

insert into classes (school_id, teacher_id, name, subject)
  values (:'school_id', :'teacher_id', 'ป.5/2', 'คณิตศาสตร์')
  returning id \gset class_

\echo school=:school_id teacher=:teacher_id class=:class_id
