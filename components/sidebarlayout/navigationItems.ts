import {
  Building,
  LayoutDashboard
} from "lucide-react";
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
    ],
  },
];
