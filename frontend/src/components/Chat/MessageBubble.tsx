import type { Message } from '../../types';

// Check if content is a quota error message
function isQuotaError(content: string): boolean {
  return content.includes('Rate limit exceeded') || 
         content.includes('Token limit exceeded') ||
         content.includes('Please wait before sending another message') ||
         content.includes('try again after');
}

interface MessageBubbleProps {
  message: Message;
  isLastMessageStreaming: boolean;
  onSourceClick: (filename: string, content: string, chunkIndex: number) => void;
}

export function MessageBubble({
  message,
  isLastMessageStreaming,
  onSourceClick,
}: MessageBubbleProps) {
  const isQuota = message.role === 'assistant' && isQuotaError(message.content);
  
  return (
    <div className={`message-bubble-wrapper ${message.role}`}>
      <div className={`message-bubble ${message.role} ${isQuota ? 'quota-error' : ''}`}>
        <div className="message-content">
          {message.content || (isLastMessageStreaming ? '▮' : '')}
        </div>
      </div>
      {message.role === 'assistant' && message.sources && message.sources.length > 0 && (
        <div className="sources-container">
          <span className="sources-title">Sources:</span>
          <div className="sources-list-inline">
            {message.sources.map((source, idx) => (
              <button
                key={idx}
                className="source-pill"
                onClick={() =>
                  onSourceClick(source.filename, source.content, source.chunk_index)
                }
              >
                <svg
                  className="source-icon"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                <span className="source-filename" title={source.filename}>
                  {source.filename}
                </span>
                <span className="source-index">Chunk {source.chunk_index + 1}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
