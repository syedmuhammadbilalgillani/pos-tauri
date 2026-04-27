import { Building, LayoutDashboard, Users } from "lucide-react";
import type { NavConfigGroup } from "./nav-types";

export const navigation: NavConfigGroup[] = [
  {
    title: "POS",
    icon: LayoutDashboard,
    items: [
      {
        title: "Dashboard",
        url: "/t/dashboard",
        icon: LayoutDashboard,
        isActive: true,
      },
      {
        title: "Brands",
        url: "/t/brands",
        icon: Building,
        isActive: false,
      },
      {
        title: "Users",
        url: "/platform-admin/platform-users",
        icon: Users,
        isActive: false,
      },
      {
        title: "KDS",
        url: "/t/kds",
        icon: Building,
        isActive: false,
      },
      {
        title: "FOH",
        url: "/t/foh",
        icon: Building,
        isActive: false,
      },
    ],
  },
];
