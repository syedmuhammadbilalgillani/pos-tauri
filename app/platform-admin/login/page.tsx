"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { usePlatformLoginMutation } from "@/lib/tan-stack/platform-auth";

export default function PlatformAdminLoginPage() {
  const router = useRouter();
  const m = usePlatformLoginMutation();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-6">
      <div className="w-full max-w-md rounded-xl border bg-background p-6 space-y-4">
        <div className="space-y-1">
          <div className="text-2xl font-semibold">Platform Admin Login</div>
          <div className="text-sm text-muted-foreground">
            Sign in as a platform user (Layer 1).
          </div>
        </div>

        {m.error ? (
          <div className="text-sm text-destructive">
            {(m.error as Error).message}
          </div>
        ) : null}

        <div className="space-y-2">
          <label className="text-sm font-medium">Email</label>
          <input
            className="h-9 w-full rounded-md border bg-background px-3 text-sm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@company.com"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Password</label>
          <input
            className="h-9 w-full rounded-md border bg-background px-3 text-sm"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="••••••••"
          />
        </div>

        <Button
          className="w-full"
          disabled={m.isPending}
          onClick={async () => {
            await m.mutateAsync({ email, password });
            router.replace("/platform-admin/platform-users");
          }}
        >
          {m.isPending ? "Signing in..." : "Sign in"}
        </Button>
      </div>
    </div>
  );
}
