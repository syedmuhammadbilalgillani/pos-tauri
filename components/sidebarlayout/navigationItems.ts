import {
  Building,
  CreditCard,
  LayoutDashboard,
  Receipt,
  ScreenShare,
  ScreenShareIcon,
  ScreenShareOff,
  Terminal,
  Users,
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
      {
        title: "KDS",
        url: "/t/kds",
        icon: ScreenShareIcon,
        isActive: false,
      },
      {
        title: "FOH",
        url: "/t/foh",
        icon: ScreenShare,
        isActive: false,
      },
      {
        title: "POS",
        url: "/t/pos",
        icon: CreditCard,
        isActive: false,
      },
      {
        title: "Orders",
        url: "/t/orders",
        icon: Receipt,
        isActive: false,
      },
    ],
  },
];
