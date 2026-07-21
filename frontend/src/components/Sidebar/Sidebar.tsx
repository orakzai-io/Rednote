import React, { useState, useRef, useEffect } from 'react';
import type { DocumentInfo } from '../../types';
import { UploadSection } from './UploadSection';
import { DocumentList } from './DocumentList';
import { useAuth } from '../../hooks/useAuth';
import { ConfirmModal } from '../ConfirmModal';

interface SidebarProps {
  documents: DocumentInfo[];
  selectedDocId: string | null;
  isUploading: boolean;
  uploadError: string | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onDocumentSelect: (id: string) => void;
  onDocumentDelete: (id: string, event: React.MouseEvent) => void;
  onShowAuth: (view: 'login' | 'register') => void;
  sidebarOpen: boolean;
}

export function Sidebar({
  documents,
  selectedDocId,
  isUploading,
  uploadError,
  fileInputRef,
  onFileChange,
  onDocumentSelect,
  onDocumentDelete,
  onShowAuth,
  sidebarOpen,
}: SidebarProps) {
  const { user, logout, deleteAccount } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const executeDeleteAccount = async () => {
    setShowDeleteModal(false);
    try {
      await deleteAccount();
    } catch (err: unknown) {
      console.error(err);
    }
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>RED<span>NOTE</span></h2>
      </div>

      <UploadSection
        fileInputRef={fileInputRef}
        isUploading={isUploading}
        uploadError={uploadError}
        onFileChange={onFileChange}
      />

      <DocumentList
        documents={documents}
        selectedDocId={selectedDocId}
        onSelect={onDocumentSelect}
        onDelete={onDocumentDelete}
      />

      {/* Settings section at bottom */}
      {user && (
        <div
          style={{
            borderTop: '1px solid var(--border-color)',
            padding: '12px 16px',
            position: 'relative',
            backgroundColor: 'var(--bg-card)',
          }}
          ref={menuRef}
        >
          {menuOpen && (
            <div
              style={{
                position: 'absolute',
                bottom: '100%',
                left: '16px',
                right: '16px',
                backgroundColor: '#0c0c0c',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '6px 0',
                marginBottom: '8px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.6)',
                zIndex: 1000,
              }}
            >
              {/* User Info Header in popup */}
              <div
                style={{
                  padding: '8px 12px',
                  borderBottom: '1px solid var(--border-color)',
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)',
                  wordBreak: 'break-all',
                }}
              >
                Signed in as:<br />
                <strong style={{ color: 'var(--text-primary)' }}>{user.email}</strong>
              </div>

              {/* Logout Button */}
              <button
                onClick={() => {
                  setShowSignOutModal(true);
                  setMenuOpen(false);
                }}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Sign Out
              </button>

              {/* Delete Account Button */}
              <button
                onClick={() => {
                  setShowDeleteModal(true);
                  setMenuOpen(false);
                }}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--red-accent)',
                  fontSize: '0.85rem',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(230, 0, 18, 0.08)';
                  e.currentTarget.style.color = 'var(--red-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--red-accent)';
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
                Delete Account
              </button>
            </div>
          )}

          {/* Main Settings Button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px',
              backgroundColor: 'transparent',
              border: '1px solid transparent',
              borderRadius: '6px',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              textAlign: 'left',
              fontFamily: 'inherit',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
              e.currentTarget.style.borderColor = 'var(--border-color)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = 'transparent';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            {/* Avatar badge */}
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '4px',
                backgroundColor: 'var(--red-accent)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600,
                fontSize: '0.85rem',
                flexShrink: 0,
              }}
            >
              {user.email.charAt(0).toUpperCase()}
            </div>

            {/* Info & Gear icon - hidden when sidebar collapsed */}
            <div
              className="settings-info-wrapper"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flex: 1,
                overflow: 'hidden',
              }}
            >
              <span
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {user.email}
              </span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </div>
          </button>
        </div>
      )}

      {/* Guest options if no user logged in */}
      {!user && (
        <div
          style={{
            borderTop: '1px solid var(--border-color)',
            padding: sidebarOpen ? '16px' : '12px 8px',
            backgroundColor: 'var(--bg-card)',
            display: 'flex',
            flexDirection: sidebarOpen ? 'column' : 'row',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          {sidebarOpen ? (
            <>
              <button
                onClick={() => onShowAuth('login')}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  backgroundColor: 'transparent',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                  e.currentTarget.style.borderColor = 'var(--text-secondary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                }}
              >
                Sign In
              </button>
              <button
                onClick={() => onShowAuth('register')}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  backgroundColor: 'var(--red-accent)',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--red-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--red-accent)';
                }}
              >
                Sign Up
              </button>
            </>
          ) : (
            <button
              onClick={() => onShowAuth('login')}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                backgroundColor: 'transparent',
                border: '1px solid var(--border-color)',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              title="Sign In / Register"
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                e.currentTarget.style.color = 'var(--text-primary)';
                e.currentTarget.style.borderColor = 'var(--red-accent)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.borderColor = 'var(--border-color)';
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
            </button>
          )}
        </div>
      )}

      {showDeleteModal && (
        <ConfirmModal
          title="Delete Account"
          message="WARNING: Are you sure you want to delete your account? This action is permanent and will delete all your documents and chat history."
          confirmText="Delete Account"
          cancelText="Cancel"
          onConfirm={executeDeleteAccount}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}

      {showSignOutModal && (
        <ConfirmModal
          title="Sign Out"
          message="Are you sure you want to sign out of your account?"
          confirmText="Sign Out"
          cancelText="Cancel"
          onConfirm={() => {
            setShowSignOutModal(false);
            logout();
          }}
          onCancel={() => setShowSignOutModal(false)}
        />
      )}
    </aside>
  );
}

