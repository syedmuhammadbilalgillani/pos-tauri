import { type LucideIcon } from "lucide-react";

// Base navigation item types
export interface NavLinkItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  isActive?: boolean;
  badge?: string | number;
}

export interface NavSubItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  isActive?: boolean;
  badge?: string | number;
}

export interface NavCollapsibleItem extends NavLinkItem {
  items?: NavSubItem[];
}

// Project item types
export interface NavProjectItem {
  name: string;
  url: string;
  icon: LucideIcon;
  badge?: string | number;
}

// Dropdown action types
export interface NavDropdownAction {
  label: string;
  icon?: LucideIcon;
  onClick?: () => void;
  href?: string;
  variant?: "default" | "destructive";
  separator?: boolean;
}

// Helper type for default actions (without separator)
export interface NavDropdownActionItem extends Omit<NavDropdownAction, "separator"> {
  separator?: never;
}

// Component props types
export interface NavMainProps {
  items: NavCollapsibleItem[];
  label?: string;
  className?: string;
  defaultOpen?: boolean;
}

export interface NavProjectsProps {
  projects: NavProjectItem[];
  label?: string;
  className?: string;
  showMoreButton?: boolean;
  dropdownActions?: (project: NavProjectItem) => NavDropdownAction[];
  onActionClick?: (action: string, project: NavProjectItem) => void;
}

export interface NavLinksProps {
  links: NavLinkItem[];
  label?: string;
  className?: string;
  showIcons?: boolean;
  showBadges?: boolean;
}


/** Raw config: one sidebar section with flat links (no permissions). */
export type NavConfigGroup = {
  title: string;
  icon: LucideIcon;
  items: NavConfigItem[];
};

export type NavConfigItem = {
  title: string;
  url: string;
  icon?: LucideIcon;
  isActive?: boolean;
  /** Optional second level under this row */
  items?: NavConfigItem[];
};