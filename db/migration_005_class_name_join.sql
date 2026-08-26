-- EduTwin migration 005: students join by typing the class's own name
-- (e.g. "5/2") instead of a random 6-character code. Requires class names
-- to be unique across the whole system -- same trust model join_code had
-- (knowing the exact class identifier + picking your own name from that
-- one class's roster, nothing more) -- so add that constraint and drop
-- the now-redundant join_code column.
--
-- If the unique index fails with a duplicate key error, two existing
-- classes share the same name: rename one of them (Dashboard -> Classes
-- -> Edit) and re-run this file.

create unique index if not exists idx_classes_name on classes(name);

alter table classes drop column if exists join_code;
