// Test different import methods
console.log('Testing YouTube Transcript API imports...\n');

try {
  console.log('1. Testing default import...');
  const YouTubeTranscript = require('youtube-transcript-api');
  console.log('✅ Default import successful:', typeof YouTubeTranscript);
  console.log('Available methods:', Object.keys(YouTubeTranscript));
} catch (error) {
  console.log('❌ Default import failed:', error.message);
}

try {
  console.log('\n2. Testing destructured import...');
  const { YouTubeTranscript } = require('youtube-transcript-api');
  console.log('✅ Destructured import successful:', typeof YouTubeTranscript);
  console.log('Available methods:', Object.keys(YouTubeTranscript));
} catch (error) {
  console.log('❌ Destructured import failed:', error.message);
}

try {
  console.log('\n3. Testing direct require...');
  const transcript = require('youtube-transcript-api');
  console.log('✅ Direct require successful:', typeof transcript);
  console.log('Available methods:', Object.keys(transcript));
} catch (error) {
  console.log('❌ Direct require failed:', error.message);
} 