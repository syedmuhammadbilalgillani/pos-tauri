"use client"

import {
  Folder,
  Forward,
  MoreHorizontal,
  Trash2,
} from "lucide-react"
import Link from "next/link"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { type NavProjectsProps } from "./nav-types"

const defaultActions = [
  {
    label: "View Project",
    icon: Folder,
  },
  {
    label: "Share Project",
    icon: Forward,
  },
  {
    separator: true,
  },
  {
    label: "Delete Project",
    icon: Trash2,
    variant: "destructive" as const,
  },
]

export function NavProjects({
  projects,
  label = "Projects",
  className,
  showMoreButton = true,
  dropdownActions,
  onActionClick,
}: NavProjectsProps) {
  const { isMobile } = useSidebar()

  const getActions = (project: typeof projects[0]) => {
    if (dropdownActions) {
      return dropdownActions(project)
    }
    return defaultActions
  }

  const handleActionClick = (action: string, project: typeof projects[0]) => {
    if (onActionClick && action) {
      onActionClick(action, project)
    }
  }

  return (
    <SidebarGroup className={className}>
      {label && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
      <SidebarMenu>
        {projects.map((item) => {
          const actions = getActions(item)
          return (
            <SidebarMenuItem key={item.name}>
              <SidebarMenuButton asChild>
                <Link href={item.url}>
                  <item.icon />
                  <span>{item.name}</span>
                  {item.badge && (
                    <span className="ml-auto text-xs">{item.badge}</span>
                  )}
                </Link>
              </SidebarMenuButton>
              {actions.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuAction showOnHover>
                      <MoreHorizontal />
                      <span className="sr-only">More</span>
                    </SidebarMenuAction>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="w-48 rounded-lg"
                    side={isMobile ? "bottom" : "right"}
                    align={isMobile ? "end" : "start"}
                  >
                    {actions.map((action, index) => {
                      if (action.separator) {
                        return <DropdownMenuSeparator key={`separator-${index}`} />
                      }
                      const actionItem = action as Exclude<typeof action, { separator: true }>
                      const hasHref = "href" in actionItem && actionItem.href && typeof actionItem.href === "string"
                      return (
                        <DropdownMenuItem
                          key={actionItem.label}
                          onClick={() => actionItem.label && handleActionClick(actionItem.label, item)}
                          className={
                            actionItem.variant === "destructive"
                              ? "text-destructive focus:text-destructive"
                              : ""
                          }
                        >
                          {actionItem.icon && (
                            <actionItem.icon className="text-muted-foreground" />
                          )}
                          {hasHref ? (
                            <Link href={actionItem.href as string}>{actionItem.label}</Link>
                          ) : (
                            <span>{actionItem.label}</span>
                          )}
                        </DropdownMenuItem>
                      )
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </SidebarMenuItem>
          )
        })}
        {showMoreButton && (
          <SidebarMenuItem>
            <SidebarMenuButton className="text-sidebar-foreground/70">
              <MoreHorizontal className="text-sidebar-foreground/70" />
              <span>More</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )}
      </SidebarMenu>
    </SidebarGroup>
  )
}
