interface ChatHeaderProps {
  selectedDocId: string | null;
  activeDocName: string | undefined;
  hasMessages: boolean;
  onClearChat: () => void;
}

export function ChatHeader({
  selectedDocId,
  activeDocName,
  hasMessages,
  onClearChat,
}: ChatHeaderProps) {
  return (
    <header className="chat-header">
      <div className="chat-header-info">
        <span className="target-badge">
          Target: {selectedDocId ? `Doc (${activeDocName})` : 'All Documents'}
        </span>
      </div>
      {hasMessages && (
        <button className="clear-chat-btn" onClick={onClearChat}>
          Clear Chat
        </button>
      )}
    </header>
  );
}
