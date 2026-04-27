"use client";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
} from "@/components/ui/sidebar";

import { NavMain, SidebarFooterMenu, SidebarHead } from "./sidebar";
import ThemeSwitch from "./ThemeSwitcher";
import { type NavCollapsibleItem } from "./nav-types";
import { navigation } from "./navigationItems";

function AppSidebar() {
  const navMainItems: NavCollapsibleItem[] = navigation.flatMap((group) =>
    (group.items ?? []).map((item) => ({
      title: item.title,
      url: item.url,
      icon: item.icon,
      isActive: item.isActive,
      items: item.items?.map((subItem) => ({
        title: subItem.title,
        url: subItem.url,
        icon: subItem.icon,
        isActive: subItem.isActive,
      })),
    })),
  );
  return (
    <Sidebar variant="floating" collapsible="icon">
      <SidebarHeader>
        <SidebarHead />
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={navMainItems} label="Platform" />
      </SidebarContent>

      <div className="flex justify-evenly p-2">
        <ThemeSwitch />
      </div>

      <SidebarFooterMenu />
    </Sidebar>
  );
}
export default AppSidebar;
