const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
dotenv.config();


const app = require("./app");
app.use(express.json())
const PORT = process.env.PORT ;


// Connect to MongoDB
mongoose.connect(process.env.CONECTION_STRING, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));



// Start the server
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

// Graceful shutdown (optional)
process.on('SIGINT', () => {
  mongoose.connection.close(() => {
    console.log('MongoDB disconnected');
    process.exit(0);
  });
});
