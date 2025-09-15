// Shared chat-related types used by client, API route, and server helpers

export type ChatMessage = {
  role: 'assistant' | 'user';
  content: string;
  /** ISO timestamp when the message was created */
  timestamp: string;
  confidence?: number;
  /** If the assistant suggests optional escalation (low confidence), show link */
  softEscalate?: boolean;
};

export type EscalationInfo = {
  name: string;
  contact: string;
  email: string;
  details?: string;
};
