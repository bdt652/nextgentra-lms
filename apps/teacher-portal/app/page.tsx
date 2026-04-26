"use client";

import { redirect } from "next/navigation";

export default function TeacherHomePage() {
  // Simply show dashboard at root with proper layout
  // The layout will be handled by the root layout or we redirect to dashboard
  redirect("/teacher/dashboard");
}
