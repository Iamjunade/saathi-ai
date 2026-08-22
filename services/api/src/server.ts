import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { Server as SocketIOServer } from 'socket.io';
import { eventBus } from './events/eventBus';
import { casesRouter } from './cases/cases.router';
import { actionsRouter } from './actions/actions.router';
import { hospitalsRouter } from './hospitals/hospitals.router';
import { civicRouter } from './civic/civic.router';
import { auditRouter } from './audit/audit.router';
import { prisma } from './db';
import { seedDatabase } from '../prisma/seed';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Socket.io initialization with CORS
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  },
});

eventBus.init(io);

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== 'test') {
      console.log(`[API] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// Health check endpoint
app.get(['/health', '/api/health'], (_req, res) => {
  res.json({
    status: 'ok',
    service: 'SAATHI Core Backend API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/cases', casesRouter);
app.use('/api/actions', actionsRouter);
app.use('/api/hospitals', hospitalsRouter);
app.use('/api/civic', civicRouter);
app.use('/api/audit-logs', auditRouter);

// 404 Handler
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint not found' });
});

// Auto-seed if database is empty on startup
async function ensureDatabaseSeeded() {
  try {
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      console.log('🔄 Empty database detected. Running automatic initial seed...');
      await seedDatabase();
    }
  } catch (err) {
    console.warn('Database connection check/auto-seed warning:', err);
  }
}

export async function startServer(port: number = Number(process.env.PORT) || 4000) {
  return new Promise<http.Server>((resolve) => {
    const s = server.listen(port, async () => {
      console.log(`🚀 [SAATHI API] Server running on http://localhost:${port}`);
      console.log(`📡 [Socket.io] Real-time event bus active on ws://localhost:${port}`);
      await ensureDatabaseSeeded();
      resolve(s);
    });
  });
}

if (process.env.AUTO_START !== 'false' && require.main === module) {
  startServer();
}

export { app, server, io };
