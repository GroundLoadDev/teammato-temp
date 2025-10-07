import { Home, MessageSquare, Tag, Lightbulb, BarChart, Slack, FileText, Download, Clock, Users, Sparkles, History } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import logoImage from "@assets/galaxyai-image-1759612930294_1759613447444.png";
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
      { href: "/admin/dashboard", label: "Dashboard", icon: Home },
      { href: "/admin/feedback", label: "Feedback", icon: MessageSquare },
      { href: "/admin/topics", label: "Topics", icon: Tag },
      { href: "/admin/topic-suggestions", label: "Suggestions", icon: Lightbulb },
      { href: "/admin/analytics", label: "Analytics", icon: BarChart },
      { href: "/admin/themes", label: "Themes", icon: Sparkles },
    ],
  },
  {
    label: "Settings",
    items: [
      { href: "/admin/users", label: "Users", icon: Users },
      { href: "/admin/slack-settings", label: "Slack", icon: Slack },
      { href: "/admin/billing", label: "Billing", icon: FileText },
      { href: "/admin/audience", label: "Audience", icon: Users },
    ],
  },
  {
    label: "Data",
    items: [
      { href: "/admin/export", label: "Export", icon: Download },
      { href: "/admin/retention", label: "Retention", icon: Clock },
      { href: "/admin/audit-log", label: "Audit Log", icon: History },
    ],
  },
];

export function AppSidebar() {
  const [location] = useLocation();
  
  const { data: authData } = useQuery<{ user: { id: string; email: string; role: string; orgId: string } }>({
    queryKey: ['/api/auth/me'],
  });

  const user = authData?.user;
  const initials = user?.email 
    ? user.email.substring(0, 2).toUpperCase() 
    : 'AD';
  const displayEmail = user?.email || 'admin@example.com';
  const displayName = user?.email?.split('@')[0] || 'Admin';

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-6 py-4">
        <Link href="/admin/dashboard">
          <div className="flex items-center gap-2 cursor-pointer">
            <div className="flex h-8 w-8 items-center justify-center rounded-md overflow-hidden">
              <img
                src={logoImage}
                alt=""
                className="h-8 w-8 object-contain"
              />
            </div>
            <span className="text-lg font-semibold" style={{ color: '#0f172a' }}>Teammato</span>
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
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-medium truncate" data-testid="text-user-name">{displayName}</span>
            <span className="text-xs text-muted-foreground truncate" data-testid="text-user-email">{displayEmail}</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
