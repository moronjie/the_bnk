import express from 'express';
import { errorHandler } from './middleware/errorHandler';
import mongoose from 'mongoose';
import config from './config';
import cors from 'cors';
import { connectDB } from './config/db';
import applyRoutes from './router';

const app = express();
const PORT = config.port || 5000;

app.use(
  cors({
    origin: [config.frontendUrl || 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', applyRoutes);

// Error Handling Middleware
app.use(errorHandler);

connectDB(
  config.dbUrl!,
  config.dbName!,
);

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

mongoose.connection.once('connected', () => {
  console.log('Connected to MongoDB');
  
  app.listen(PORT, () => {
    console.log(
      `Server running on port ${PORT} in ${config.nodeEnv} mode`,
    );
  });
});
