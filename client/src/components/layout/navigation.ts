import {
  LayoutDashboard,
  Users,
  Database,
  MessageSquare,
  Key,
  Bell,
  Settings,
  ListTree,
  Package,
  FileText,
  Plug,
  MessageCircle,
  LucideIcon
} from 'lucide-react';

export type NavItem = {
  name: string;
  href: string;
  icon: LucideIcon;
  group?: string;
};

export const superadminNavigation: NavItem[] = [
  { name: 'Dashboard', href: '/tabdeal', icon: LayoutDashboard, group: 'OVERVIEW' },
  { name: 'Clients', href: '/tabdeal/clients', icon: Users, group: 'CLIENT MANAGEMENT' },
  { name: 'Categories', href: '/tabdeal/categories', icon: ListTree, group: 'CATALOGUE' },
  { name: 'Template Packs', href: '/tabdeal/template-packs', icon: Package, group: 'CATALOGUE' },
  { name: 'Master Templates', href: '/tabdeal/templates', icon: FileText, group: 'CATALOGUE' },
  { name: 'Client Templates', href: '/tabdeal/client-templates', icon: FileText, group: 'CATALOGUE' },
  { name: 'WhatsApp', href: '/tabdeal/whatsapp', icon: MessageSquare, group: 'OPERATIONS' },
  { name: 'Notifications', href: '/tabdeal/notifications', icon: Bell, group: 'OPERATIONS' },
  { name: 'Message Logs', href: '/tabdeal/message-logs', icon: MessageCircle, group: 'OPERATIONS' },
  { name: 'API Keys', href: '/tabdeal/api-keys', icon: Key, group: 'INTEGRATIONS' },
  { name: 'Integrations', href: '/tabdeal/integrations', icon: Plug, group: 'INTEGRATIONS' },
  { name: 'Settings', href: '/tabdeal/settings', icon: Settings, group: 'SYSTEM' },
];

export const clientNavigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, group: 'OVERVIEW' },
  { name: 'WhatsApp', href: '/dashboard/whatsapp', icon: MessageSquare, group: 'WHATSAPP' },
  { name: 'My Templates', href: '/dashboard/templates', icon: FileText, group: 'WHATSAPP' },
  { name: 'Integration', href: '/dashboard/integration', icon: Plug, group: 'INTEGRATION' },
  { name: 'API Keys', href: '/dashboard/integration/keys', icon: Key, group: 'INTEGRATION' },
  { name: 'Notifications', href: '/dashboard/notifications', icon: Bell, group: 'ACTIVITY' },
  { name: 'Message Logs', href: '/dashboard/message-logs', icon: MessageCircle, group: 'ACTIVITY' },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings, group: 'ACCOUNT' },
];
