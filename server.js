import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import config from './config/config.js';

import userRoutes from './routes/userRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import productRoutes from './routes/productRoutes.js';
import authRoutes from './routes/authRoutes.js';
import couponRoutes from './routes/couponRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import './events/notificationListener.js';
import './events/orderListener.js';
import './jobs/lowStockNotifier.js';

import requestLogger from './middlewares/requestLogger.js';
import notFound from './middlewares/notFound.js';
import errorHandler from './middlewares/errorHandler.js';
import { isAuthenticated } from './middlewares/auth.js';

import swaggerJsDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import swaggerOptions from './config/swagger.js';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const env = process.env.NODE_ENV || 'development'; // Default to development
dotenv.config({ path: `./.env.${env}` });
const uri = process.env.DB_URI;
//dotenv.config();
const app = express();
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://e-market-luna-luxe-fork-7rjn9svmr.vercel.app"
  ],
  credentials: true
}));
app.use(express.static(path.join(__dirname, 'public')));

// app.use(cors({
//   origin: 'http://localhost:5173',
//   // origin: 'http://localhost:5174',
//   credentials: true
// }))
app.use(express.json());
// console.log(config);

// const PORT = 3001;
const PORT = process.env.PORT || 3000;
// console.log(process.env);

if (process.env.NODE_ENV !== 'test') {
  // Connect to MongoDB
  connectDB();
  // Start server
  app.listen(PORT,() =>
    console.log(`Server running on http://localhost:${PORT}`)
  );
}

// logger
// app.use(requestLogger);

// Test route
// app.get('/', (req, res) => {
//   res.send(`Server is running on http://localhost:${PORT}`);
// });

// Start cron jobs
// lowStockJob.start();

// swager documentation
const specs = swaggerJsDoc(swaggerOptions);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(specs));

// routes
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);

app.use('/api/reviews', reviewRoutes);
app.use('/api/coupons', couponRoutes);

app.use('/api/cart', isAuthenticated, cartRoutes);
app.use('/api/guest-cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.get("/api/test", (req, res) => {
  res.json({ message: "Connexion réussie ✅" });
});

// Catch all unknown routes
app.use(notFound);
app.use(errorHandler);

// CORS (mettre avant les routes !!)





export default app;
