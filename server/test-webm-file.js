const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');

console.log('Testing WebM file handling...');

// Check uploads directory
const uploadsDir = path.join(__dirname, 'uploads', 'audio');
console.log('Uploads directory:', uploadsDir);
console.log('Uploads directory exists:', fs.existsSync(uploadsDir));

if (fs.existsSync(uploadsDir)) {
  const files = fs.readdirSync(uploadsDir);
  console.log('Files in uploads directory:', files);
  
  // Check each WebM file
  files.forEach(file => {
    if (file.endsWith('.webm')) {
      const filePath = path.join(uploadsDir, file);
      const stats = fs.statSync(filePath);
      
      console.log(`\nFile: ${file}`);
      console.log(`Size: ${stats.size} bytes`);
      console.log(`Created: ${stats.birthtime}`);
      console.log(`Modified: ${stats.mtime}`);
      
      // Try to get file info with ffprobe
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          console.log(`❌ FFprobe error for ${file}:`, err.message);
        } else {
          console.log(`✅ File info for ${file}:`);
          console.log(`  Format: ${metadata.format.format_name}`);
          console.log(`  Duration: ${metadata.format.duration}s`);
          console.log(`  Size: ${metadata.format.size} bytes`);
          
          if (metadata.streams && metadata.streams.length > 0) {
            const audioStream = metadata.streams.find(s => s.codec_type === 'audio');
            if (audioStream) {
              console.log(`  Audio codec: ${audioStream.codec_name}`);
              console.log(`  Sample rate: ${audioStream.sample_rate}Hz`);
              console.log(`  Channels: ${audioStream.channels}`);
            }
          }
        }
      });
    }
  });
} else {
  console.log('Uploads directory does not exist');
}

// Test creating a simple WebM file
console.log('\nTesting WebM file creation...');
const testDir = path.join(__dirname, 'temp');
if (!fs.existsSync(testDir)) {
  fs.mkdirSync(testDir, { recursive: true });
}

const testWebmPath = path.join(testDir, 'test.webm');

// Create a simple test WebM file (1 second of silence)
ffmpeg()
  .input('anullsrc')
  .inputFormat('lavfi')
  .duration(1)
  .toFormat('webm')
  .audioCodec('libvorbis')
  .on('end', () => {
    console.log('✅ Test WebM file created successfully');
    
    if (fs.existsSync(testWebmPath)) {
      const stats = fs.statSync(testWebmPath);
      console.log(`Test file size: ${stats.size} bytes`);
      
      // Try to convert it back
      const testMp3Path = path.join(testDir, 'test_converted.mp3');
      ffmpeg(testWebmPath)
        .toFormat('mp3')
        .on('end', () => {
          console.log('✅ Test WebM to MP3 conversion successful');
          
          // Clean up
          fs.unlinkSync(testWebmPath);
          fs.unlinkSync(testMp3Path);
          console.log('✅ Test files cleaned up');
        })
        .on('error', (error) => {
          console.error('❌ Test conversion failed:', error.message);
        })
        .save(testMp3Path);
    }
  })
  .on('error', (error) => {
    console.error('❌ Test WebM creation failed:', error.message);
  })
  .save(testWebmPath);

console.log('\nTest completed!'); 