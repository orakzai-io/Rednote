import React from 'react';
import type { Message } from '../../types';
import { MessageBubble } from './MessageBubble';

interface MessageListProps {
  messages: Message[];
  isStreaming: boolean;
  documents: { id: string; filename: string }[];
  selectedDocId: string | null;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  onSourceClick: (filename: string, content: string, chunkIndex: number) => void;
}

export function MessageList({
  messages,
  isStreaming,
  documents,
  selectedDocId,
  messagesEndRef,
  onSourceClick,
}: MessageListProps) {
  return (
    <div className="messages-container">
      {messages.length === 0 ? (
        <div className="empty-state">
          <h3>Welcome to <span>REDNOTE</span></h3>
          <p>
            Upload a document and select it to ask specific questions, or query all
            uploaded context at once.
          </p>
          {documents.length > 0 && !selectedDocId && (
            <p style={{ color: 'var(--red-hover)', fontSize: '0.85rem' }}>
              Tip: Click a document on the left sidebar to focus questions specifically to it.
            </p>
          )}
        </div>
      ) : (
        messages.map((msg, index) => (
          <MessageBubble
            key={index}
            message={msg}
            isLastMessageStreaming={isStreaming && index === messages.length - 1}
            onSourceClick={onSourceClick}
          />
        ))
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}
