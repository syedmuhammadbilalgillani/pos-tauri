"use client";

import * as React from "react";
import { PlatformAuthGate } from "@/components/platform-admin/platform-auth-gate";

export default function PlatformAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PlatformAuthGate>{children}</PlatformAuthGate>;
}
