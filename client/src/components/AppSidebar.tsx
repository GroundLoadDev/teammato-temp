import { Home, MessageSquare, Tag, Lightbulb, BarChart, Slack, FileText, Download, Clock } from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const navigationGroups = [
  {
    label: "General",
    items: [
      { href: "/admin/get-started", label: "Dashboard", icon: Home },
      { href: "/admin/feedback", label: "Feedback", icon: MessageSquare },
      { href: "/admin/topics", label: "Topics", icon: Tag },
      { href: "/admin/topic-suggestions", label: "Suggestions", icon: Lightbulb },
      { href: "/admin/analytics", label: "Analytics", icon: BarChart },
    ],
  },
  {
    label: "Settings",
    items: [
      { href: "/admin/slack-settings", label: "Slack", icon: Slack },
      { href: "/admin/billing", label: "Billing", icon: FileText },
    ],
  },
  {
    label: "Data",
    items: [
      { href: "/admin/export", label: "Export", icon: Download },
      { href: "/admin/retention", label: "Retention", icon: Clock },
    ],
  },
];

export function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-6 py-4">
        <Link href="/admin/get-started">
          <div className="flex items-center gap-2 cursor-pointer">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <span className="text-sm font-bold">T</span>
            </div>
            <span className="text-lg font-bold">Teammato</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {navigationGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={location === item.href}
                      data-testid={`link-${item.label.toLowerCase()}`}
                    >
                      <Link href={item.href}>
                        <item.icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              AD
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-medium truncate">Admin</span>
            <span className="text-xs text-muted-foreground truncate">admin@example.com</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
