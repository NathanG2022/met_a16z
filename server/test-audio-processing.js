const AudioProcessor = require('./services/audioProcessor');
const path = require('path');

async function testAudioProcessing() {
  console.log('🧪 Testing Audio Processing...\n');
  
  const audioProcessor = new AudioProcessor();
  
  try {
    // Test with a sample audio file (you'll need to create one)
    const testAudioPath = path.join(__dirname, 'temp', 'test-audio.mp3');
    
    console.log('1. Testing audio processing pipeline...');
    console.log(`   Audio file: ${testAudioPath}`);
    
    const result = await audioProcessor.processAudio(testAudioPath, 'test-note-123', {
      language: 'en',
      prompt: 'This is a test recording for audio processing.'
    });
    
    if (result.success) {
      console.log('✅ Audio processing successful:');
      console.log('   Transcription length:', result.transcription.length);
      console.log('   Language:', result.language);
      console.log('   Duration:', result.duration);
      console.log('   Word count:', result.words?.length || 0);
      console.log('   Summary:', result.summary ? 'Generated' : 'Not generated');
    } else {
      console.log('❌ Audio processing failed:');
      console.log('   Error:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testAudioProcessing();
}

module.exports = { testAudioProcessing }; 