# Navigation Components

This directory contains reusable navigation components for the sidebar.

## Components

### 1. `NavMain` - Collapsible Navigation Items
Renders collapsible navigation items with sub-items.

**Props:**
- `items: NavCollapsibleItem[]` - Array of navigation items with optional sub-items
- `label?: string` - Group label (default: "Platform")
- `className?: string` - Additional CSS classes
- `defaultOpen?: boolean` - Default open state for collapsible items

**Example:**
```tsx
<NavMain 
  items={[
    {
      title: "Dashboard",
      url: "/admin",
      icon: LayoutDashboard,
      isActive: true,
      items: [
        { title: "Home", url: "/admin/" },
        { title: "Settings", url: "/admin/settings" }
      ]
    }
  ]}
  label="Main Navigation"
/>
```

### 2. `NavProjects` - Project Navigation with Actions
Renders project items with dropdown actions.

**Props:**
- `projects: NavProjectItem[]` - Array of project items
- `label?: string` - Group label (default: "Projects")
- `className?: string` - Additional CSS classes
- `showMoreButton?: boolean` - Show "More" button (default: true)
- `dropdownActions?: (project) => NavDropdownAction[]` - Custom actions per project
- `onActionClick?: (action, project) => void` - Action click handler

**Example:**
```tsx
<NavProjects 
  projects={[
    { name: "Project 1", url: "/projects/1", icon: Folder }
  ]}
  label="My Projects"
  dropdownActions={(project) => [
    { label: "View", icon: Folder, href: project.url },
    { label: "Delete", icon: Trash2, variant: "destructive" }
  ]}
  onActionClick={(action, project) => {
    console.log(action, project);
  }}
/>
```

### 3. `NavLinks` - Simple Navigation Links
Renders simple navigation links without collapsible or dropdown functionality.

**Props:**
- `links: NavLinkItem[]` - Array of navigation links
- `label?: string` - Group label
- `className?: string` - Additional CSS classes
- `showIcons?: boolean` - Show icons (default: true)
- `showBadges?: boolean` - Show badges (default: true)

**Example:**
```tsx
<NavLinks 
  links={[
    { title: "Home", url: "/", icon: Home, isActive: true },
    { title: "About", url: "/about", icon: Info, badge: "New" }
  ]}
  label="Quick Links"
/>
```

## Types

All types are defined in `nav-types.ts`:
- `NavLinkItem` - Simple navigation link
- `NavSubItem` - Sub-navigation item
- `NavCollapsibleItem` - Collapsible navigation item with sub-items
- `NavProjectItem` - Project navigation item
- `NavDropdownAction` - Dropdown action configuration

## Usage in AppSidebar

```tsx
import { NavMain, NavLinks, NavProjects } from "./sidebar";

function AppSidebar() {
  return (
    <Sidebar>
      <SidebarContent>
        <NavMain items={navMainItems} label="Platform" />
        <NavLinks links={quickLinks} label="Quick Links" />
        <NavProjects projects={projects} label="Projects" />
      </SidebarContent>
    </Sidebar>
  );
}
```

