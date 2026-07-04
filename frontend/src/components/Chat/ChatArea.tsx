import React from 'react';
import type { Message, DocumentInfo } from '../../types';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';

interface ChatAreaProps {
  messages: Message[];
  inputText: string;
  isStreaming: boolean;
  documents: DocumentInfo[];
  selectedDocId: string | null;
  messagesEndRef: any;
  onInputChange: (value: string) => void;
  onSendMessage: (e: React.FormEvent) => void;
  onClearChat: () => void;
  onSourceClick: (filename: string, content: string, chunkIndex: number) => void;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export function ChatArea({
  messages,
  inputText,
  isStreaming,
  documents,
  selectedDocId,
  messagesEndRef,
  onInputChange,
  onSendMessage,
  onClearChat,
  onSourceClick,
  sidebarOpen,
  onToggleSidebar,
}: ChatAreaProps) {
  const activeDocName = documents.find((d) => d.id === selectedDocId)?.filename;

  return (
    <main className={`chat-area ${sidebarOpen ? '' : 'sidebar-collapsed'}`}>
      <button
        className="sidebar-toggle-arrow"
        onClick={onToggleSidebar}
        title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
      >
        {sidebarOpen ? '‹' : '›'}
      </button>

      <ChatHeader
        selectedDocId={selectedDocId}
        activeDocName={activeDocName}
        hasMessages={messages.length > 0}
        onClearChat={onClearChat}
      />

      <MessageList
        messages={messages}
        isStreaming={isStreaming}
        documents={documents}
        selectedDocId={selectedDocId}
        messagesEndRef={messagesEndRef}
        onSourceClick={onSourceClick}
      />

      <ChatInput
        inputText={inputText}
        isStreaming={isStreaming}
        selectedDocId={selectedDocId}
        activeDocName={activeDocName}
        onChange={onInputChange}
        onSubmit={onSendMessage}
      />
    </main>
  );
}
