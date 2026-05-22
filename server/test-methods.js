const YouTubeTranscript = require('youtube-transcript-api');

console.log('Testing YouTube Transcript API methods...\n');

console.log('YouTubeTranscript type:', typeof YouTubeTranscript);
console.log('YouTubeTranscript:', YouTubeTranscript);

// Try to call the function directly
try {
  console.log('\nTrying to call YouTubeTranscript directly...');
  const result = YouTubeTranscript('dQw4w9WgXcQ');
  console.log('✅ Direct call successful:', result);
} catch (error) {
  console.log('❌ Direct call failed:', error.message);
}

// Try to call with await
async function testAsync() {
  try {
    console.log('\nTrying to call YouTubeTranscript with await...');
    const result = await YouTubeTranscript('dQw4w9WgXcQ');
    console.log('✅ Async call successful:', result);
  } catch (error) {
    console.log('❌ Async call failed:', error.message);
  }
}

testAsync(); 