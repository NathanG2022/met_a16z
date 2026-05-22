const app = require('./app');
const supabaseStorage = require('./services/supabaseStorage');
require('dotenv').config();

const PORT = process.env.PORT || 5000;

// Initialize Supabase storage bucket
async function initializeStorage() {
  try {
    await supabaseStorage.ensureBucketExists();
    console.log('Supabase storage initialized');
  } catch (error) {
    console.error('Error initializing Supabase storage:', error);
  }
}

// Start server
async function startServer() {
  try {
    // Initialize storage
    await initializeStorage();
    
    // Start server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log('Supabase integration active');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
