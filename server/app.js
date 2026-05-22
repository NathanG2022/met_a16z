require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { requireAuth } = require('./services/supabaseAuth');

console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '***configured***' : '***missing***');

const app = express();

// Enable CORS
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const noteRoutes = require('./routes/noteRoutes');
app.use('/api/notes', noteRoutes);

app.get('/protected', requireAuth, (req, res) => {
  res.json({ message: 'You are authenticated!', user: req.user });
});

module.exports = app;
