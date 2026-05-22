require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const youtubeProcessor = require('./services/youtubeProcessor');

async function testYouTubeTranscript() {
  console.log('🧪 Testing YouTube Transcript API...\n');
  
  // Test with a video that has captions
  const testUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
  
  try {
    console.log(`Testing URL: ${testUrl}`);
    
    // Test validation
    console.log('\n1. Testing URL validation...');
    const validation = await youtubeProcessor.validateUrl(testUrl);
    
    if (validation.isValid) {
      console.log('✅ URL validation successful:');
      console.log('  Video ID:', validation.videoId);
      console.log('  Title:', validation.title);
      console.log('  Duration:', validation.duration, 'seconds');
      console.log('  Thumbnail:', validation.thumbnail);
      console.log('  Author:', validation.author);
      
      // Test transcript retrieval
      console.log('\n2. Testing transcript retrieval...');
      const testNoteId = uuidv4();
      const transcript = await youtubeProcessor.getTranscript(validation.videoId, testNoteId);
      
      if (transcript && !transcript.includes('Failed to get transcript') && !transcript.includes('No transcript is available')) {
        console.log('✅ Transcript retrieval successful!');
        console.log('  Transcript length:', transcript.length, 'characters');
        console.log('  First 200 characters:', transcript.substring(0, 200) + '...');
        
        // Test summary generation
        console.log('\n3. Testing summary generation...');
        const summary = await youtubeProcessor.generateSummary(transcript, testNoteId);
        
        if (summary && !summary.includes('Failed to generate summary')) {
          console.log('✅ Summary generation successful!');
          console.log('  Summary length:', summary.length, 'characters');
          console.log('  Summary:', summary);
        } else {
          console.log('❌ Summary generation failed:', summary);
        }
      } else {
        console.log('❌ Transcript retrieval failed:', transcript);
      }
    } else {
      console.log('❌ URL validation failed:', validation.error);
    }
    
  } catch (error) {
    console.error('❌ Error during testing:', error.message);
  }
  
  console.log('\n🎉 YouTube Transcript API test completed!');
}

// Run test
testYouTubeTranscript().catch(console.error); 