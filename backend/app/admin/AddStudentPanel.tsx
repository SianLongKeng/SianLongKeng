"use client";

import { useState } from "react";
import AddStudentForm from "./AddStudentForm";
import BulkAddForm from "./BulkAddForm";

interface ClassOption {
  id: string;
  name: string;
  subject: string;
}

export default function AddStudentPanel({ classes }: { classes: ClassOption[] }) {
  const [mode, setMode] = useState<"single" | "bulk">("single");

  return (
    <div>
      <div className="tab-toggle" role="tablist">
        <button type="button" role="tab" aria-selected={mode === "single"} onClick={() => setMode("single")}>
          Add One · เพิ่มทีละคน
        </button>
        <button type="button" role="tab" aria-selected={mode === "bulk"} onClick={() => setMode("bulk")}>
          Bulk Add · เพิ่มทีละหลายคน
        </button>
      </div>
      {mode === "single" ? <AddStudentForm classes={classes} /> : <BulkAddForm classes={classes} />}
    </div>
  );
}
