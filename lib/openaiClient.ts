import OpenAI from 'openai';

let cachedClient: OpenAI | null = null;

export function getOpenAIClient(client?: OpenAI): OpenAI {
  if (client) {
    return client;
  }

  if (!cachedClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not set');
    }

    cachedClient = new OpenAI({ apiKey });
  }

  return cachedClient;
}

