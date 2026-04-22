"use client";

import {
  useAuthSession,
  useAuthUser,
  useLogoutMutation,
} from "@/lib/tan-stack/auth";

export default function DashboardPage() {
  const { data: session, isPending } = useAuthSession();
  const user = useAuthUser();

  const { mutate: logout } = useLogoutMutation();
  if (isPending) return null;
  if (!session || !user) return null;

  return (
    <div className="p-4 max-w-full mx-auto overflow-hidden">
      {JSON.stringify(session, null, 2)}
      <button onClick={() => logout()}>Logout</button>
    </div>
  );
}
