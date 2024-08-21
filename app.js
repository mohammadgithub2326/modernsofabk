console.log("enterd app.js")
const express = require('express');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//allowing the localhost  for development

app.use(cors({
    // origin: 'http://localhost:3000' ,// Allow requests from your Next.js app's origin
    allowedHeaders:  ['Content-Type', 'Authorization','x-refresh-token']
  }));

  //active routes
  app.use('/api/v1/active',active)

//user routes
const userRoutes = require('./routes/userRoutes');
app.use('/api/v1/users', userRoutes);
// app.use(".api/v1/users",userRoutes)

//product routes
const productRoutes = require('./routes/productRoutes');
app.use('/api/v1/products', productRoutes,);

//wishlist routes
const wishlistRoutes = require('./routes/wishlistRoutes'); 
app.use('/api/v1/wishlist', wishlistRoutes);
// app.use('/api/wishlist', wishlistRoutes);

//order routes
const orderRoutes = require('./routes/ordersRoutes'); 
app.use('/api/v1/orders', orderRoutes);

module.exports = app;
console.log("exited the app.js")
