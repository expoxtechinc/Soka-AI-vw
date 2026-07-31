export type Role = 'user' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: Role;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  modelUsed?: string;
  isError?: boolean;
  attachedFile?: {
    name: string;
    type: string;
    url?: string;
  };
}

export type AICategory = 
  | 'AI Chat'
  | 'AI Photo'
  | 'PDF Scanner'
  | 'Translator'
  | 'Coding'
  | 'Assistant';

export interface AITool {
  id: string;
  title: string;
  description: string;
  iconName: string;
  category: AICategory;
  accentColor: string;
  badge?: string;
}

export interface WhatsAppBotStatus {
  connected: boolean;
  phoneNumber: string;
  status: string;
  groupMentionPrefix: string;
  autoRespondGroups: boolean;
  messagesHandled: number;
  lastActive: string;
}
