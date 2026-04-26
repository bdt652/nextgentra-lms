"use client";

import { redirect } from "next/navigation";

export default function StudentHomePage() {
  // Simply show courses at root
  redirect("/student/courses");
}
