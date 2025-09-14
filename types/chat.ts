// Shared chat-related types used by client, API route, and server helpers

export type ChatMessage = {
  role: 'assistant' | 'user';
  content: string;
  /** ISO timestamp when the message was created */
  timestamp: string;
  confidence?: number;
};

export type EscalationInfo = {
  name: string;
  contact: string;
  email: string;
  details?: string;
};
