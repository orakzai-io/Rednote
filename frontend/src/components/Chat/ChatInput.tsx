import React from 'react';

interface ChatInputProps {
  inputText: string;
  isStreaming: boolean;
  selectedDocId: string | null;
  activeDocName: string | undefined;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function ChatInput({
  inputText,
  isStreaming,
  selectedDocId,
  activeDocName,
  onChange,
  onSubmit,
}: ChatInputProps) {
  return (
    <div className="chat-input-container">
      <form className="chat-input-form" onSubmit={onSubmit}>
        <input
          type="text"
          className="chat-input"
          value={inputText}
          onChange={(e) => onChange(e.target.value)}
          placeholder={
            selectedDocId
              ? `Ask a question about ${activeDocName}...`
              : 'Ask about all uploaded documents...'
          }
          disabled={isStreaming}
        />
        <button
          type="submit"
          className={`send-btn ${inputText.trim() && !isStreaming ? 'active' : ''}`}
          disabled={!inputText.trim() || isStreaming}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </form>
    </div>
  );
}
