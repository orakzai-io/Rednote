import type { DocumentInfo, Message, Source } from '../types';
import { getAuthHeaders } from '../lib/auth';

export const API_URL = import.meta.env.VITE_API_URL ?? '/api';


export async function fetchDocuments(): Promise<DocumentInfo[]> {
  const res = await fetch(`${API_URL}/documents`, {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
  });
  if (!res.ok) throw new Error('Failed to fetch documents');
  return res.json();
}

export async function uploadDocument(file: File): Promise<void> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_URL}/documents/upload`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
    },
    body: formData,
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || `Upload failed (${res.status})`);
  }
}

export async function deleteDocument(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/documents/${id}`, {
    method: 'DELETE',
    headers: {
      ...getAuthHeaders(),
    },
  });

  if (!res.ok) throw new Error('Failed to delete document');
}

export interface StreamChatPayload {
  messages: Message[];
  document_id: string | null;
}

export interface StreamChatCallbacks {
  onChunk: (displayContent: string, sources: Source[] | undefined) => void;
  onError: (message: string) => void;
}

export async function streamChat(
  payload: StreamChatPayload,
  callbacks: StreamChatCallbacks
): Promise<void> {
  try {
    const res = await fetch(`${API_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || `Chat request failed (${res.status})`);
    }

    if (!res.body) throw new Error('No response body for streaming');

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let streamedContent = '';
    const delimiter = '\n__SOURCES__:';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      streamedContent += decoder.decode(value, { stream: true });

      let displayContent = streamedContent;
      let sources: Source[] | undefined = undefined;

      if (streamedContent.includes(delimiter)) {
        const parts = streamedContent.split(delimiter);
        displayContent = parts[0];
        try {
          sources = JSON.parse(parts[1]);
        } catch {
          // Stream might be incomplete; wait for next chunk
        }
      }

      callbacks.onChunk(displayContent, sources);
    }
  } catch (error: unknown) {
    callbacks.onError(error instanceof Error ? error.message : 'Chat request failed');
  }
}