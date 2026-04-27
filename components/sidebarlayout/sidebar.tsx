"use client";
import { ChevronUp, User2, UserCircleIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "../ui/sidebar";
// import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useAuthSession, useLogoutMutation } from "@/lib/tan-stack/auth";

// Re-export navigation components for convenience
export { NavMain } from "./nav-main";
export { NavProjects } from "./nav-projects";
export { NavLinks } from "./nav-links";

export const SidebarHead = () => {
  return (
    <div className="flex justify-center items-center w-full py-2">
      <Link href={"/"}>
        <UserCircleIcon size={30} />
      </Link>
    </div>
  );
};

export const SidebarFooterMenu = () => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  // const { data: session } = useSession();
  const { data: session, isPending } = useAuthSession();

  const { mutate: logout } = useLogoutMutation();
  if (isPending) return null;

  const handleLogout = async () => {
    setIsLoading(true);
    // await signOut({ redirect: false });
    logout();
    router.push("/");
    router.refresh();
    setIsLoading(false);
  };

  if (isLoading) return <Loader />;

  // const userName = session?.user?.name || session?.user?.email || "User";

  return (
    <SidebarFooter>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton className="text-nowrap">
                <User2 />
                {session?.user?.name || session?.user?.email || "User"}
                <ChevronUp className="ml-auto" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="top"
              className="w-[--radix-popper-anchor-width]"
            >
              <DropdownMenuItem asChild>
                <Link href="/admin/settings">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout}>
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  );
};

export const Loader = () => {
  return <div>Loader</div>;
};
