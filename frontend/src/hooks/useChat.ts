import { useState, useRef, useEffect } from 'react';
import type { Message } from '../types';
import { streamChat } from '../api/client';

// Helper to parse quota errors and generate user-friendly messages
function parseQuotaError(content: string): { message: string; retryAfter?: number } | null {
  const rpmMatch = content.match(/\[QUOTA_ERROR:rpm_exhausted:try_after_(\d+)_seconds\]/);
  if (rpmMatch) {
    return {
      message: 'Rate limit exceeded (requests per minute). Please wait before sending another message.',
      retryAfter: parseInt(rpmMatch[1], 10),
    };
  }
  
  const tpdMatch = content.match(/\[QUOTA_ERROR:tpd_exhausted:try_after_midnight\]/);
  if (tpdMatch) {
    return {
      message: 'Token limit exceeded for today. Please try again after 12:00 AM.',
      retryAfter: undefined,
    };
  }
  
  const genericMatch = content.match(/\[QUOTA_ERROR:(\w+):([^\]]+)\]/);
  if (genericMatch) {
    return {
      message: `Rate limit exceeded. Please try again later.`,
      retryAfter: undefined,
    };
  }
  
  return null;
}

export function useChat(selectedDocId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isStreaming) return;

    const userMessage: Message = { role: 'user', content: inputText.trim() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputText('');
    setIsStreaming(true);

    // Placeholder for streaming assistant response
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

    try {
      await streamChat(
        { messages: updatedMessages, document_id: selectedDocId },
        {
          onChunk: (displayContent, sources) => {
            // Check for quota errors in the stream
            const quotaError = parseQuotaError(displayContent);
            if (quotaError) {
              setMessages((prev) => {
                const next = [...prev];
                if (next.length > 0) {
                  next[next.length - 1] = {
                    role: 'assistant',
                    content: quotaError.message,
                  };
                }
                return next;
              });
              setIsStreaming(false);
              return;
            }
            
            setMessages((prev) => {
              const next = [...prev];
              if (next.length > 0) {
                next[next.length - 1] = {
                  role: 'assistant',
                  content: displayContent,
                  sources,
                };
              }
              return next;
            });
          },
          onError: (message) => {
            setMessages((prev) => {
              const next = [...prev];
              if (next.length > 0) {
                next[next.length - 1] = { role: 'assistant', content: `Error: ${message}` };
              }
              return next;
            });
          },
        }
      );
    } catch (err: any) {
      console.error(err);
      setMessages((prev) => {
        const next = [...prev];
        if (next.length > 0) {
          next[next.length - 1] = {
            role: 'assistant',
            content: `Error: ${err.message || 'An error occurred while streaming response.'}`,
          };
        }
        return next;
      });
    } finally {
      setIsStreaming(false);
    }
  };

  const handleClearChat = () => setMessages([]);

  return {
    messages,
    inputText,
    setInputText,
    isStreaming,
    messagesEndRef,
    handleSendMessage,
    handleClearChat,
  };
}
