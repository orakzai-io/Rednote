import React from 'react';

interface UploadSectionProps {
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  isUploading: boolean;
  uploadError: string | null;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function UploadSection({
  fileInputRef,
  isUploading,
  uploadError,
  onFileChange,
}: UploadSectionProps) {
  return (
    <div className="upload-section">
      <div
        className="upload-dropzone"
        onClick={() => fileInputRef.current?.click()}
      >
        <p>Upload Document</p>
        <span>PDF, DOCX, TXT up to 10MB</span>
        <input
          type="file"
          ref={fileInputRef}
          onChange={onFileChange}
          accept=".pdf,.docx,.txt"
          style={{ display: 'none' }}
        />
      </div>

      {isUploading && (
        <div className="upload-progress">
          <span>Uploading & Processing...</span>
          <div className="upload-spinner" />
        </div>
      )}

      {uploadError && (
        <div style={{ color: 'var(--red-hover)', fontSize: '0.8rem', marginTop: '8px' }}>
          {uploadError}
        </div>
      )}
    </div>
  );
}
