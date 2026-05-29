import dotenv from 'dotenv';
dotenv.config();

type AppConfig = {
  port: number;
  nodeEnv: string;
  dbUrl: string;
  dbName: string;
  frontendUrl: string;
  jwtSecret: string;
  jwtRefreshSecret: string;
  jwtAccessExpiry: string;
  jwtRefreshExpiry: string;
  redisUrl: string;
  otpTtlSeconds: number;
  otpResendCooldownSeconds: number;
  encryptionKey: string;
  bankCode: string;
  smtp: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    pass: string;
  };
};

const config: AppConfig = {
  port: process.env.PORT ? parseInt(process.env.PORT) : 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  dbUrl: process.env.DB_URI || '',
  dbName: process.env.DB_NAME || '',
  frontendUrl: process.env.FRONTEND_URL || '',
  jwtSecret: process.env.JWT_SECRET || '',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || '',
  jwtAccessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
  jwtRefreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  otpTtlSeconds: 600,        // 10 minutes
  otpResendCooldownSeconds: 60, // 1 minute
  encryptionKey: process.env.ENCRYPTION_KEY || '',
  bankCode: process.env.BANK_CODE || '123456',
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
};

export default config;