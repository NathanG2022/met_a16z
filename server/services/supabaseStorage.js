const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class SupabaseStorageService {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    this.bucket = process.env.SUPABASE_STORAGE_BUCKET || 'noetus';
  }

  // Upload file to Supabase Storage
  async uploadFile(filePath, fileName, contentType = 'audio/mpeg') {
    try {
      const fileBuffer = fs.readFileSync(filePath);
      const fileExt = path.extname(fileName);
      const uniqueFileName = `${uuidv4()}${fileExt}`;
      const filePathInStorage = `${contentType.includes('audio') ? 'audio' : 'video'}/${uniqueFileName}`;

      const { data, error } = await this.supabase.storage
        .from(this.bucket)
        .upload(filePathInStorage, fileBuffer, {
          contentType: contentType,
          upsert: false
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = this.supabase.storage
        .from(this.bucket)
        .getPublicUrl(filePathInStorage);

      return {
        fileName: uniqueFileName,
        filePath: filePathInStorage,
        publicUrl: urlData.publicUrl,
        size: fileBuffer.length
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  // Get signed URL for file access (for private files)
  async getSignedUrl(filePath, expiresIn = 3600) {
    try {
      const { data, error } = await this.supabase.storage
        .from(this.bucket)
        .createSignedUrl(filePath, expiresIn);

      if (error) throw error;
      return data.signedUrl;
    } catch (error) {
      console.error('Error getting signed URL:', error);
      throw error;
    }
  }

  // Delete file from storage
  async deleteFile(filePath) {
    try {
      const { error } = await this.supabase.storage
        .from(this.bucket)
        .remove([filePath]);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  // Upload audio file specifically — content type is inferred from extension
  // so .webm uploads aren't mislabeled as audio/mpeg.
  async uploadAudioFile(filePath, originalName) {
    const ext = path.extname(originalName).toLowerCase();
    const contentType = ext === '.webm' ? 'audio/webm'
      : ext === '.wav' ? 'audio/wav'
      : ext === '.m4a' ? 'audio/mp4'
      : ext === '.ogg' ? 'audio/ogg'
      : 'audio/mpeg';
    return this.uploadFile(filePath, originalName, contentType);
  }

  // Upload video file specifically
  async uploadVideoFile(filePath, originalName) {
    return this.uploadFile(filePath, originalName, 'video/mp4');
  }

  // Check if bucket exists, create if not
  async ensureBucketExists() {
    try {
      const { data: buckets, error } = await this.supabase.storage.listBuckets();
      if (error) throw error;

      const bucketExists = buckets.some(bucket => bucket.name === this.bucket);
      
      if (!bucketExists) {
        const { error: createError } = await this.supabase.storage.createBucket(this.bucket, {
          public: false,
          allowedMimeTypes: ['audio/*', 'video/*', 'application/pdf'],
          fileSizeLimit: 52428800 // 50MB
        });

        if (createError) throw createError;
        console.log(`Created bucket: ${this.bucket}`);
      }
    } catch (error) {
      console.error('Error ensuring bucket exists:', error);
      throw error;
    }
  }

  // Get file info
  async getFileInfo(filePath) {
    try {
      const { data, error } = await this.supabase.storage
        .from(this.bucket)
        .list(path.dirname(filePath), {
          search: path.basename(filePath)
        });

      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('Error getting file info:', error);
      throw error;
    }
  }

  // Download file to local storage (for processing)
  async downloadFile(filePath, localPath) {
    try {
      const { data, error } = await this.supabase.storage
        .from(this.bucket)
        .download(filePath);

      if (error) throw error;

      // Ensure directory exists
      const dir = path.dirname(localPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Write file to local storage
      fs.writeFileSync(localPath, data);
      return localPath;
    } catch (error) {
      console.error('Error downloading file:', error);
      throw error;
    }
  }
}

module.exports = new SupabaseStorageService(); 