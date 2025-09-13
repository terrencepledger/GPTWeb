// Shared chat-related types used by client, API route, and server helpers

export type ChatMessage = {
  role: 'assistant' | 'user';
  content: string;
  confidence?: number;
};

export type EscalationInfo = {
  name: string;
  contact: string;
  email: string;
  details?: string;
};
