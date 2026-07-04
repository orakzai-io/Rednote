import React from 'react';
import type { DocumentInfo } from '../../types';

interface DocumentListProps {
  documents: DocumentInfo[];
  selectedDocId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string, event: React.MouseEvent) => void;
}

export function DocumentList({
  documents,
  selectedDocId,
  onSelect,
  onDelete,
}: DocumentListProps) {
  return (
    <div className="documents-container">
      <h3>Documents</h3>
      <div className="document-list">
        {documents.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '10px 0' }}>
            No documents uploaded yet.
          </div>
        ) : (
          documents.map((doc) => (
            <div
              key={doc.id}
              className={`document-item ${selectedDocId === doc.id ? 'active' : ''}`}
              onClick={() => onSelect(doc.id)}
            >
              <div className="document-info">
                <span className="document-name" title={doc.filename}>
                  {doc.filename}
                </span>
                <div className="document-meta">
                  <span className={`status-badge ${doc.status}`}>{doc.status}</span>
                  <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <button
                className="delete-btn"
                title="Delete document"
                onClick={(e) => onDelete(doc.id, e)}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
