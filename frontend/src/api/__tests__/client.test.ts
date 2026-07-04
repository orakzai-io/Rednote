import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFetch = vi.fn();
global.fetch = mockFetch;

// Set VITE_API_URL for tests
import.meta.env.VITE_API_URL = 'http://localhost:8000';

import {
  fetchDocuments,
  uploadDocument,
  deleteDocument,
  streamChat,
} from '../client';

// Mock auth headers
vi.mock('../../lib/auth', () => ({
  getAuthHeaders: vi.fn(() => ({ Authorization: 'Bearer test-token' })),
}));

describe('API client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  // ── fetchDocuments ──

  describe('fetchDocuments', () => {
    it('fetches documents list with auth header', async () => {
      const docs = [
        { id: '1', user_id: 'u1', filename: 'doc1.pdf', status: 'ready', created_at: '2025-01-01' },
      ];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => docs,
      });

      const result = await fetchDocuments();
      expect(result).toEqual(docs);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/documents',
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: 'Bearer test-token' }),
        })
      );
    });

    it('throws on fetch failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, json: async () => ({ detail: 'Failed' }) });
      await expect(fetchDocuments()).rejects.toThrow('Failed to fetch documents');
    });
  });

  // ── uploadDocument ──

  describe('uploadDocument', () => {
    it('uploads a file as FormData', async () => {
      const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: '1', filename: 'test.txt', status: 'ready' }),
      });

      await uploadDocument(file);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/documents/upload',
        expect.objectContaining({
          method: 'POST',
          headers: expect.not.objectContaining({ 'Content-Type': 'application/json' }),
        })
      );
    });

    it('throws on upload failure with detail', async () => {
      const file = new File(['bad'], 'bad.txt', { type: 'text/plain' });
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ detail: 'Unsupported file' }),
      });

      await expect(uploadDocument(file)).rejects.toThrow('Unsupported file');
    });
  });

  // ── deleteDocument ──

  describe('deleteDocument', () => {
    it('sends DELETE request', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true });
      await deleteDocument('doc-123');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/documents/doc-123',
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('throws on delete failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false });
      await expect(deleteDocument('doc-123')).rejects.toThrow('Failed to delete document');
    });
  });

  // ── streamChat ──

  describe('streamChat', () => {
    function createMockStream(chunks: string[]): ReadableStream {
      const encoder = new TextEncoder();
      return new ReadableStream({
        async start(controller) {
          for (const chunk of chunks) {
            controller.enqueue(encoder.encode(chunk));
          }
          controller.close();
        },
      });
    }

    it('calls onChunk with streamed content', async () => {
      const mockBody = createMockStream(['Hello', ' world']);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: mockBody,
      });

      const onChunk = vi.fn();
      const onError = vi.fn();

      await streamChat(
        { messages: [{ role: 'user', content: 'Hi' }], document_id: null },
        { onChunk, onError },
      );

      expect(onChunk).toHaveBeenCalled();
      expect(onError).not.toHaveBeenCalled();
    });

    it('calls onError when request fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ detail: 'Chat error' }),
      });

      const onChunk = vi.fn();
      const onError = vi.fn();

      await streamChat(
        { messages: [{ role: 'user', content: 'Hi' }], document_id: null },
        { onChunk, onError },
      );

      expect(onError).toHaveBeenCalledWith('Chat error');
    });
  });
});