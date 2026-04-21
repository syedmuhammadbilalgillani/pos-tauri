"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuthSession } from "@/lib/tan-stack/auth";

function isAuthed(session: ReturnType<typeof useAuthSession>["data"]) {
  return (
    !!session &&
    typeof session.accessToken === "string" &&
    session.accessToken.length > 0
  );
}

export default function TLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: session, isPending } = useAuthSession();

  React.useEffect(() => {
    if (isPending) return;
    if (!isAuthed(session)) router.replace("/");
  }, [isPending, session, router]);

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Checking session…
      </div>
    );
  }

  if (!isAuthed(session)) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Redirecting…
      </div>
    );
  }

  return <>{children}</>;
}