"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconChartBar,
  IconDashboard,
  IconDatabase,
  IconListDetails,
} from "@tabler/icons-react";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupContent,
} from "@/components/ui/sidebar";
import { syne } from "@/fonts/fonts";

// Navigation configuration
const NAV_ITEMS = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: IconDashboard,
  },
  {
    title: "Accounts",
    url: "/accounts",
    icon: IconDatabase,
  },
  {
    title: "Instructions",
    url: "/instructions",
    icon: IconListDetails,
  },
  {
    title: "Transactions",
    url: "/transactions",
    icon: IconChartBar,
  },
] as const;

// Main Sidebar Component
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <Link href="/" className="flex items-center gap-3">
              <span className={`text-2xl font-bold ${syne}`}>AnchorLabs</span>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={NAV_ITEMS} />
      </SidebarContent>
    </Sidebar>
  );
}

// Navigation Menu Component
function NavMain({
  items,
}: {
  items: readonly {
    title: string;
    url: string;
    icon?: React.ComponentType<{ className?: string }>;
  }[];
}) {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map((item) => {
            const isActive =
              pathname === item.url ||
              (item.url !== "/" && pathname.startsWith(item.url));

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  isActive={isActive}
                >
                  <Link href={item.url} className="flex items-center gap-3">
                    {item.icon && <item.icon className="h-5 w-5" />}
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}