import { cookies } from "next/headers";
import { query } from "@/lib/db";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";
import { STUDENT_SESSION_COOKIE, verifyStudentSessionToken } from "@/lib/studentSession";

// Mission/diagnosis/coach pages and APIs are reachable two ways: a teacher
// viewing one of their own students (existing teacher session + ownership
// join), or the student themself after self-joining via a class code
// (student session cookie scoped to exactly that studentId). Every route
// that touches a specific student's mission data should go through this
// instead of checking the teacher cookie alone.
export async function canAccessStudent(studentId: string): Promise<boolean> {
  const teacherToken = cookies().get(SESSION_COOKIE)?.value;
  const teacherSession = teacherToken ? await verifySessionToken(teacherToken) : null;
  if (teacherSession) {
    const owned = await query<{ id: string }>(
      `select s.id from students s join classes c on c.id = s.class_id where s.id = $1 and c.teacher_id = $2`,
      [studentId, teacherSession.teacherId]
    );
    if (owned.length > 0) return true;
  }

  const studentToken = cookies().get(STUDENT_SESSION_COOKIE)?.value;
  const studentSession = studentToken ? await verifyStudentSessionToken(studentToken) : null;
  if (studentSession && studentSession.studentId === studentId) return true;

  return false;
}

// Same check, but starting from a mission_attempts id instead of a student
// id directly — resolves the owning student first, then re-checks access.
export async function canAccessAttempt(attemptId: string): Promise<string | null> {
  const rows = await query<{ student_id: string }>(
    "select student_id from mission_attempts where id = $1",
    [attemptId]
  );
  const studentId = rows[0]?.student_id;
  if (!studentId) return null;
  return (await canAccessStudent(studentId)) ? studentId : null;
}
