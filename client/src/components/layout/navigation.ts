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
  href?: string;
  icon: LucideIcon;
  children?: { name: string; href: string; icon: LucideIcon }[];
};

export const superadminNavigation: NavItem[] = [
  { name: 'Dashboard', href: '/tabdeal', icon: LayoutDashboard },
  { name: 'Clients', href: '/tabdeal/clients', icon: Users },
  {
    name: 'Master Data',
    icon: Database,
    children: [
      { name: 'Categories', href: '/tabdeal/categories', icon: ListTree },
      { name: 'Template Packs', href: '/tabdeal/template-packs', icon: Package },
      { name: 'Notification Templates', href: '/tabdeal/templates', icon: FileText },
      { name: 'Client Templates', href: '/tabdeal/client-templates', icon: FileText },
    ],
  },
  { name: 'WhatsApp', href: '/tabdeal/whatsapp', icon: MessageSquare },
  { name: 'API Keys', href: '/tabdeal/api-keys', icon: Key },
  { name: 'Notifications', href: '/tabdeal/notifications', icon: Bell },
  { name: 'Message Logs', href: '/tabdeal/message-logs', icon: MessageCircle },
  { name: 'Integrations', href: '/tabdeal/integrations', icon: Plug },
  { name: 'Settings', href: '/tabdeal/settings', icon: Settings },
];

export const clientNavigation: NavItem[] = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'WhatsApp', href: '/dashboard/whatsapp', icon: MessageSquare },
  { name: 'My Templates', href: '/dashboard/templates', icon: FileText },
  { name: 'Integration Center', href: '/dashboard/integrations', icon: Plug },
  { name: 'Notifications', href: '/dashboard/notifications', icon: Bell },
  { name: 'Message Logs', href: '/dashboard/message-logs', icon: MessageCircle },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];
