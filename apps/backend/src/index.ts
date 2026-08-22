import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { initTelemetry } from './telemetry';
initTelemetry();

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic Health Check Route
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', message: 'Welcome to flowCTRL API' });
});


app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', message: 'flowCTRL API is running' });
});

// Protected Route Example
import { requireAuth, requireRole } from './middleware/auth';

app.get('/api/dashboard', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  res.status(200).json({
    message: 'Welcome to your Mission Control Center',
    user
  });
});

// Admin Route Example
app.get('/api/admin', requireAuth, requireRole(['ADMIN', 'SUPER_ADMIN']), (req: Request, res: Response) => {
  res.status(200).json({
    message: 'Welcome to the Admin Panel'
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
