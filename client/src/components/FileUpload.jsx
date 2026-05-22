import { useState, useRef, useCallback } from 'react';

const FileUpload = ({ 
  onFileSelect, 
  accept = "*/*", 
  multiple = false, 
  maxSize = 100 * 1024 * 1024, // 100MB default
  title = "Upload File",
  description = "Drag and drop files here or click to browse",
  buttonText = "Choose File"
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const validateFile = (file) => {
    // Check file size
    if (file.size > maxSize) {
      return `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (${(maxSize / 1024 / 1024).toFixed(2)}MB)`;
    }

    // Check file type if accept is specified
    if (accept !== "*/*") {
      const acceptedTypes = accept.split(',').map(type => type.trim());
      const fileType = file.type;
      const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
      
      const isAccepted = acceptedTypes.some(type => {
        if (type.startsWith('.')) {
          return fileExtension === type.toLowerCase();
        } else if (type.includes('*')) {
          const baseType = type.split('*')[0];
          return fileType.startsWith(baseType);
        } else {
          return fileType === type;
        }
      });

      if (!isAccepted) {
        return `File type ${file.type} is not supported. Accepted types: ${accept}`;
      }
    }

    return null;
  };

  const handleFiles = useCallback((files) => {
    setError(null);
    
    const fileArray = Array.from(files);
    
    if (!multiple && fileArray.length > 1) {
      setError('Only one file can be selected');
      return;
    }

    const validFiles = [];
    const errors = [];

    fileArray.forEach(file => {
      const validationError = validateFile(file);
      if (validationError) {
        errors.push(`${file.name}: ${validationError}`);
      } else {
        validFiles.push(file);
      }
    });

    if (errors.length > 0) {
      setError(errors.join('\n'));
    }

    if (validFiles.length > 0) {
      onFileSelect(multiple ? validFiles : validFiles[0]);
    }
  }, [onFileSelect, multiple, accept, maxSize]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    handleFiles(files);
  }, [handleFiles]);

  const handleFileInputChange = useCallback((e) => {
    const files = e.target.files;
    handleFiles(files);
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  }, [handleFiles]);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="file-upload-container">
      <div
        className={`file-upload-area ${isDragOver ? 'drag-over' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <div className="file-upload-content">
          <div className="file-upload-icon">
            <span className="material-icons">cloud_upload</span>
          </div>
          <h3 className="file-upload-title">{title}</h3>
          <p className="file-upload-description">{description}</p>
          <div className="file-upload-info">
            <span>Max file size: {formatFileSize(maxSize)}</span>
            {accept !== "*/*" && (
              <span>Accepted types: {accept}</span>
            )}
          </div>
          <button
            type="button"
            className="file-upload-button"
            onClick={(e) => {
              e.stopPropagation();
              handleClick();
            }}
          >
            {buttonText}
          </button>
        </div>
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileInputChange}
        className="file-input-hidden"
      />

      {error && (
        <div className="file-upload-error">
          <span className="material-icons">error</span>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default FileUpload; 