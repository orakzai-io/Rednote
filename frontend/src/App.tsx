import { useState } from 'react';
import { Sidebar } from './components/Sidebar/Sidebar';
import { ChatArea } from './components/Chat/ChatArea';
import { SourceModal } from './components/SourceModal';
import { LoginPage } from './components/auth/LoginPage';
import { RegisterPage } from './components/auth/RegisterPage';
import { useDocuments } from './hooks/useDocuments';
import { useChat } from './hooks/useChat';
import { useSidebar } from './hooks/useSidebar';
import { useAuth } from './hooks/useAuth';
import type { Source } from './types';

function AppContent({ onShowAuth }: { onShowAuth: (view: 'login' | 'register') => void }) {
  const documentsHook = useDocuments();
  const chatHook = useChat(documentsHook.selectedDocId);
  const sidebarHook = useSidebar();
  const [activeSource, setActiveSource] = useState<Source | null>(null);

  const handleSourceClick = (
    filename: string,
    content: string,
    chunkIndex: number
  ) => {
    setActiveSource({ filename, content, chunk_index: chunkIndex });
  };

  return (
    <div className={`app-container ${sidebarHook.sidebarOpen ? '' : 'sidebar-collapsed'}`}>
      <Sidebar
        documents={documentsHook.documents}
        selectedDocId={documentsHook.selectedDocId}
        isUploading={documentsHook.isUploading}
        uploadError={documentsHook.uploadError}
        fileInputRef={documentsHook.fileInputRef}
        onFileChange={documentsHook.handleFileUpload}
        onDocumentSelect={documentsHook.handleDocumentSelect}
        onDocumentDelete={documentsHook.handleDeleteDocument}
        onShowAuth={onShowAuth}
        sidebarOpen={sidebarHook.sidebarOpen}
      />

      {/* Mobile backdrop — tapping it closes the sidebar */}
      {sidebarHook.sidebarOpen && (
        <div
          className="mobile-backdrop"
          onClick={sidebarHook.toggleSidebar}
          aria-hidden="true"
        />
      )}

      <ChatArea
        messages={chatHook.messages}
        inputText={chatHook.inputText}
        isStreaming={chatHook.isStreaming}
        documents={documentsHook.documents}
        selectedDocId={documentsHook.selectedDocId}
        messagesEndRef={chatHook.messagesEndRef}
        onInputChange={chatHook.setInputText}
        onSendMessage={chatHook.handleSendMessage}
        onClearChat={chatHook.handleClearChat}
        onSourceClick={handleSourceClick}
        sidebarOpen={sidebarHook.sidebarOpen}
        onToggleSidebar={sidebarHook.toggleSidebar}
      />

      {activeSource && (
        <SourceModal
          source={activeSource}
          onClose={() => setActiveSource(null)}
        />
      )}
    </div>
  );
}

function App() {
  const { isAuthenticated, isLoading } = useAuth();
  const [authView, setAuthView] = useState<'login' | 'register' | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-gray-400 text-lg">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated && authView === 'register') {
    return <RegisterPage onSwitchToLogin={() => setAuthView('login')} onCancel={() => setAuthView(null)} />;
  }

  if (!isAuthenticated && authView === 'login') {
    return <LoginPage onSwitchToRegister={() => setAuthView('register')} onCancel={() => setAuthView(null)} />;
  }

  return (
    <>
      <AppContent onShowAuth={setAuthView} />
    </>
  );
}



export default App;