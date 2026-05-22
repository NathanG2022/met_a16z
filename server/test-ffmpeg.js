const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');

console.log('Testing FFmpeg installation...');

// Test 1: Check if ffmpeg is available
console.log('\n1. Checking FFmpeg availability...');
try {
  ffmpeg.getAvailableFormats((err, formats) => {
    if (err) {
      console.error('❌ FFmpeg not available:', err.message);
      console.log('\nTo install FFmpeg:');
      console.log('Windows: Download from https://ffmpeg.org/download.html');
      console.log('macOS: brew install ffmpeg');
      console.log('Linux: sudo apt-get install ffmpeg');
    } else {
      console.log('✅ FFmpeg is available');
      console.log(`Found ${Object.keys(formats).length} supported formats`);
    }
  });
} catch (error) {
  console.error('❌ FFmpeg check failed:', error.message);
}

// Test 2: Check ffmpeg version
console.log('\n2. Checking FFmpeg version...');
try {
  ffmpeg.getAvailableCodecs((err, codecs) => {
    if (err) {
      console.error('❌ Could not get codecs:', err.message);
    } else {
      console.log('✅ FFmpeg codecs available');
      console.log('Supported audio codecs:', Object.keys(codecs).filter(codec => 
        codecs[codec].type === 'audio'
      ).slice(0, 5).join(', ') + '...');
    }
  });
} catch (error) {
  console.error('❌ Codec check failed:', error.message);
}

// Test 3: Check if we can create a simple audio file
console.log('\n3. Testing audio file creation...');
const testDir = path.join(__dirname, 'temp');
if (!fs.existsSync(testDir)) {
  fs.mkdirSync(testDir, { recursive: true });
}

const testOutputPath = path.join(testDir, 'test.mp3');

// Create a simple test audio file (1 second of silence)
ffmpeg()
  .input('anullsrc')
  .inputFormat('lavfi')
  .duration(1)
  .toFormat('mp3')
  .on('end', () => {
    console.log('✅ Test audio file created successfully');
    
    // Check if file exists and has content
    if (fs.existsSync(testOutputPath)) {
      const stats = fs.statSync(testOutputPath);
      console.log(`File size: ${stats.size} bytes`);
      
      // Clean up
      fs.unlinkSync(testOutputPath);
      console.log('✅ Test file cleaned up');
    }
  })
  .on('error', (error) => {
    console.error('❌ Test audio creation failed:', error.message);
  })
  .save(testOutputPath);

console.log('\n4. Checking environment...');
console.log('Node.js version:', process.version);
console.log('Platform:', process.platform);
console.log('Architecture:', process.arch);
console.log('Current directory:', process.cwd());

// Check if temp directory exists
const tempDir = path.join(__dirname, 'temp');
console.log('Temp directory exists:', fs.existsSync(tempDir));

// Check uploads directory
const uploadsDir = path.join(__dirname, 'uploads');
console.log('Uploads directory exists:', fs.existsSync(uploadsDir));

console.log('\nTest completed!'); 