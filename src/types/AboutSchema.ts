// AboutSchema - Interface for About UI component mapping to UnpppsConfig
export interface AboutSchema {
  unpppId: string;
  name: string;
  description: string;
  color: string;
  media?: Array<{
    src: string;
    alt: string;
    type: 'cover' | 'supporting';
  }>;
}

export interface AboutSection {
  id: 'preview' | 'core' | 'automation' | 'search';
  label: string;
  icon: React.ComponentType<{ size?: number | string }>; // Lucide icon component
  content: AboutSectionContent;
  status?: 'ready' | 'not_ready';
}

export interface AboutSectionContent {
  title: string;
  description?: string;
  data?: Record<string, unknown>; // Flexible data structure for different content types
}

export interface AboutConfig {
  schema: AboutSchema;
  sections: AboutSection[];
}