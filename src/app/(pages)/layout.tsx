"use client";

import { AppSidebar } from "@/components/AppSidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import React from "react";

interface PagesLayoutProps {
  children: React.ReactNode;
}

export default function PagesLayout({
  children,
}: Readonly<PagesLayoutProps>) {
  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
