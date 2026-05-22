import { useState } from 'react';
import FileUpload from './FileUpload';

const UploadModal = ({ 
  isOpen, 
  onClose, 
  onUpload, 
  title = "Upload File",
  accept = "*/*",
  multiple = false,
  maxSize = 100 * 1024 * 1024,
  uploadType = "file" // "document", "file"
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);

  const getUploadConfig = () => {
    switch (uploadType) {
      case 'document':
        return {
          title: "Upload Document",
          description: "Drag and drop a document here or click to browse",
          accept: ".pdf,.doc,.docx,.ppt,.pptx,.txt",
          buttonText: "Choose Document",
          maxSize: 50 * 1024 * 1024 // 50MB for documents
        };
      default:
        return {
          title: "Upload File",
          description: "Drag and drop files here or click to browse",
          accept: accept,
          buttonText: "Choose File",
          maxSize: maxSize
        };
    }
  };

  const config = getUploadConfig();

  const handleFileSelect = (file) => {
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      await onUpload(selectedFile);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Reset and close after successful upload
      setTimeout(() => {
        setSelectedFile(null);
        setUploading(false);
        setUploadProgress(0);
        onClose();
      }, 500);

    } catch (error) {
      console.error('Upload failed:', error);
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleClose = () => {
    if (!uploading) {
      setSelectedFile(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="upload-modal-overlay" onClick={handleClose}>
      <div className="upload-modal" onClick={(e) => e.stopPropagation()}>
        <div className="upload-modal-header">
          <h2 className="upload-modal-title">{config.title}</h2>
          <button 
            className="upload-modal-close"
            onClick={handleClose}
            disabled={uploading}
          >
            <span className="material-icons">close</span>
          </button>
        </div>

        <div className="upload-modal-content">
          {!selectedFile ? (
            <FileUpload
              onFileSelect={handleFileSelect}
              accept={config.accept}
              multiple={multiple}
              maxSize={config.maxSize}
              title={config.title}
              description={config.description}
              buttonText={config.buttonText}
            />
          ) : (
            <div className="file-preview">
              <div className="file-preview-header">
                <span className="material-icons">description</span>
                <h3>Selected File</h3>
              </div>
              <div className="file-preview-info">
                <p><strong>Name:</strong> {selectedFile.name}</p>
                <p><strong>Size:</strong> {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                <p><strong>Type:</strong> {selectedFile.type || 'Unknown'}</p>
              </div>
              
              {uploading && (
                <div className="upload-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="progress-text">Uploading... {uploadProgress}%</p>
                </div>
              )}

              <div className="file-preview-actions">
                <button
                  className="btn-secondary"
                  onClick={() => setSelectedFile(null)}
                  disabled={uploading}
                >
                  Choose Different File
                </button>
                <button
                  className="btn-primary"
                  onClick={handleUpload}
                  disabled={uploading}
                >
                  {uploading ? 'Uploading...' : 'Upload File'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadModal; 