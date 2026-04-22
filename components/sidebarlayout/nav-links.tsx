"use client"

import Link from "next/link"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { type NavLinksProps } from "./nav-types"

export function NavLinks({
  links,
  label,
  className,
  showIcons = true,
  showBadges = true,
}: NavLinksProps) {
  return (
    <SidebarGroup className={className}>
      {label && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
      <SidebarMenu>
        {links.map((link) => (
          <SidebarMenuItem key={link.title}>
            <SidebarMenuButton
              asChild
              isActive={link.isActive}
              tooltip={link.title}
            >
              <Link href={link.url}>
                {showIcons && link.icon && <link.icon />}
                <span>{link.title}</span>
                {showBadges && link.badge && (
                  <span className="ml-auto text-xs">{link.badge}</span>
                )}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}

