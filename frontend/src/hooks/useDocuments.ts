import { useState, useEffect, useRef } from 'react';
import type { DocumentInfo } from '../types';
import {
  fetchDocuments as apiFetchDocuments,
  uploadDocument as apiUploadDocument,
  deleteDocument as apiDeleteDocument,
} from '../api/client';

export function useDocuments() {
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadDocuments = async () => {
    try {
      const data = await apiFetchDocuments();
      setDocuments(data);
    } catch (err) {
      console.error('Error fetching documents:', err);
    }
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    loadDocuments();
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size exceeds the 10MB limit.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      await apiUploadDocument(file);
      await loadDocuments();
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: unknown) {
      console.error(err);
      setUploadError(err instanceof Error ? err.message : 'Error uploading file.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDocument = async (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      await apiDeleteDocument(id);
      if (selectedDocId === id) setSelectedDocId(null);
      await loadDocuments();
    } catch (err) {
      console.error('Error deleting document:', err);
      alert('Failed to delete document.');
    }
  };

  const handleDocumentSelect = (id: string) => {
    setSelectedDocId((prev) => (prev === id ? null : id));
  };

  return {
    documents,
    selectedDocId,
    isUploading,
    uploadError,
    fileInputRef,
    handleFileUpload,
    handleDeleteDocument,
    handleDocumentSelect,
  };
}
