"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  usePlatformLogoutMutation,
  usePlatformUser,
} from "@/lib/tan-stack/platform-auth";
import { useRouter } from "next/navigation";

export function PlatformAdminShell(props: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  const user = usePlatformUser();
  const { mutate: logout, isPending } = usePlatformLogoutMutation();
  const router = useRouter();
  const handleLogout = () => {
    logout();
    router.push("/");
  };
  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-lg font-semibold">Platform Admin</div>
            <div className="text-xs text-muted-foreground">
              Signed in as{" "}
              <span className="font-medium text-foreground">
                {user?.email ?? "—"}
              </span>{" "}
              ({user?.role ?? "—"})
            </div>
          </div>

          <nav className="flex items-center gap-2">
            <Link
              className="text-sm text-muted-foreground hover:text-foreground"
              href="/platform-admin/platform-users"
             >
              Platform users
            </Link>
            <Link
              className="text-sm text-muted-foreground hover:text-foreground"
              href="/platform-admin/plans"
            >
              Plans
            </Link>
            <Button
              variant="outline"
              disabled={isPending}
              onClick={handleLogout}
            >
              Logout
            </Button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-6 space-y-6">
        <div>
          <div className="text-2xl font-semibold">{props.title}</div>
          {props.description ? (
            <div className="text-sm text-muted-foreground">
              {props.description}
            </div>
          ) : null}
        </div>
        {props.children}
      </main>
    </div>
  );
}
