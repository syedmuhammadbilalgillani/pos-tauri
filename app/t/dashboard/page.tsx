"use client";

import { useAuthSession } from "@/lib/tan-stack/auth/query";

export default function DashboardPage() {
  const sessions = useAuthSession();
  return (
    <div className="p-4 max-w-full mx-auto overflow-hidden">
      {JSON.stringify(sessions,null,2)}
    </div>
  );
}
