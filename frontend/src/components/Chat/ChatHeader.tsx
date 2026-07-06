interface ChatHeaderProps {
  selectedDocId: string | null;
  activeDocName: string | undefined;
  hasMessages: boolean;
  onClearChat: () => void;
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
}

export function ChatHeader({
  selectedDocId,
  activeDocName,
  hasMessages,
  onClearChat,
  onToggleSidebar,
  sidebarOpen,
}: ChatHeaderProps) {
  return (
    <header className="chat-header">
      <div className="chat-header-info">
        {/* Hamburger — visible only on mobile via CSS */}
        <button
          className="mobile-sidebar-toggle"
          onClick={onToggleSidebar}
          aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
        >
          {sidebarOpen ? (
            // X icon when open
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            // Hamburger icon when closed
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          )}
        </button>

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
