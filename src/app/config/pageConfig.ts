
import { Info, Users, Zap, User, FileText, Home, Hammer, Shield, Brain, Settings, Palette, PartyPopper } from '@/app/components/icons';

import type { HandDrawnIconComponent } from '@/app/components/icons';
export interface PageConfig {
  title: string;
  icon: HandDrawnIconComponent;
  category?: string;
  /** Cover thumbnail for breadcrumb nav: bare coverId ('cover-023') or absolute path ('/covers/x.png'). */
  cover?: string;
}

export const pageConfig: Record<string, PageConfig> = {
  '/': {
    title: 'App',
    icon: Home,
    category: 'core'
  },
  '/about': {
    title: 'About',
    icon: Info,
    category: 'core'
  },
  '/connect': {
    title: 'Connect',
    icon: Users,
    category: 'core'
  },
  '/build': {
    title: 'Build',
    icon: Hammer,
    category: 'core'
  },
  '/unppp': {
    title: 'UNPPP',
    icon: Brain,
    category: 'tools'
  },
  '/privacy': {
    title: 'Privacy',
    icon: Shield,
    category: 'legal'
  },
  '/swift': {
    title: 'Swift',
    icon: Zap,
    category: 'features'
  },
  '/admin': {
    title: 'Admin',
    icon: Settings,
    category: 'admin'
  },
  '/party': {
    title: 'Party',
    icon: PartyPopper,
    category: 'social'
  },
  '/color': {
    title: 'Color',
    icon: Palette,
    category: 'design'
  },
  '/founders': {
    title: 'Founders',
    icon: User,
    category: 'team'
  },
  '/terms': {
    title: 'Terms',
    icon: FileText,
    category: 'legal'
  },
  // UNPPP Pages - Generated from UnpppsConfig.json
  '/theunpartyapi': {
    title: 'API',
    icon: Brain,
    category: 'unppps'
  },
  '/theunpartybot': {
    title: 'Bot',
    icon: Brain,
    category: 'unppps'
  },
  '/theunpartybrand': {
    title: 'Brand',
    icon: Brain,
    category: 'unppps'
  },
  '/theunpartybudget': {
    title: 'Budget',
    icon: Brain,
    category: 'unppps'
  },
  '/theunpartycharette': {
    title: 'Charette',
    icon: Brain,
    category: 'unppps'
  },
  '/theunpartychat': {
    title: 'Chat',
    icon: Brain,
    category: 'unppps'
  },
  '/theunpartychatty': {
    title: 'Chatty',
    icon: Brain,
    category: 'unppps'
  },
  '/theunpartyclock': {
    title: 'Clock',
    icon: Brain,
    category: 'unppps'
  },
  '/theunpartycloud': {
    title: 'Cloud',
    icon: Brain,
    category: 'unppps'
  },
  '/theunpartycrawler': {
    title: 'Crawler',
    icon: Brain,
    category: 'unppps'
  },
  '/theunpartydashboard': {
    title: 'Dashboard',
    icon: Brain,
    category: 'unppps'
  },
  '/theunpartygrow': {
    title: 'Grow',
    icon: Brain,
    category: 'unppps'
  },
  '/theunpartyinvite': {
    title: 'Invite',
    icon: Brain,
    category: 'unppps'
  },
  '/theunpartylanding': {
    title: 'Landing',
    icon: Brain,
    category: 'unppps'
  },
  '/theunpartylogger': {
    title: 'Logger',
    icon: Brain,
    category: 'unppps'
  },
  '/theunpartymac': {
    title: 'Mac',
    icon: Brain,
    category: 'unppps'
  },
  '/theunpartymood': {
    title: 'Mood',
    icon: Brain,
    category: 'unppps'
  },
  '/theunpartyplayground': {
    title: 'Playground',
    icon: Brain,
    category: 'unppps'
  },
  '/theunpartyporter': {
    title: 'Porter',
    icon: Brain,
    category: 'unppps'
  },
  '/theunpartypost': {
    title: 'Post',
    icon: Brain,
    category: 'unppps'
  },
  '/theunpartyproject': {
    title: 'Project',
    icon: Brain,
    category: 'unppps'
  },
  '/theunpartyrunway': {
    title: 'Runway',
    icon: Brain,
    category: 'unppps'
  },
  '/theunpartysearch': {
    title: 'Search',
    icon: Brain,
    category: 'unppps'
  },
  '/theunpartyseeme': {
    title: 'Seeme',
    icon: Brain,
    category: 'unppps'
  },
  '/theunpartyselector': {
    title: 'Selector',
    icon: Brain,
    category: 'unppps'
  },
  '/theunpartysomewhere': {
    title: 'Somewhere',
    icon: Brain,
    category: 'unppps'
  },
  '/theunpartystarter': {
    title: 'Starter',
    icon: Brain,
    category: 'unppps'
  },
  '/theunpartyswatch': {
    title: 'Swatch',
    icon: Brain,
    category: 'unppps'
  },
  '/theunpartytemplate': {
    title: 'Template',
    icon: Brain,
    category: 'unppps'
  },
  '/theunpartytheme': {
    title: 'Theme',
    icon: Brain,
    category: 'unppps'
  },
  '/theunpartyunppp': {
    title: 'Unppp',
    icon: Brain,
    category: 'unppps'
  },
  '/theunpartyuser': {
    title: 'User',
    icon: Brain,
    category: 'unppps'
  }
};

// Default fallback icon
export const defaultIcon = FileText;

// Get page config with fallback
export function getPageConfig(pathname: string): PageConfig {
  return pageConfig[pathname] || {
    title: pathname.replace('/', '').replace(/\//g, ' / ') || 'Page',
    icon: defaultIcon,
    category: 'other'
  };
}