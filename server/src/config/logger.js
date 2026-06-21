const path = require('path');
const fs = require('fs');
const winston = require('winston');
require('winston-daily-rotate-file');

// Logs live in <server>/logs (this file is at <server>/src/config).
const logDir = path.join(__dirname, '..', '..', 'logs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

const isProd = process.env.NODE_ENV === 'production';

// Structured JSON for files: timestamped, stack traces expanded, printf-style
// (%s) args supported via splat.
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json(),
);

// Human-readable, colorized lines for the console (PM2 captures these too).
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, stack }) =>
    `${timestamp} ${level}: ${stack || message}`),
);

// One rotating file per day; keep 30 days, cap each at 20 MB, gzip rotated ones.
const dailyFile = (filename, level) =>
  new winston.transports.DailyRotateFile({
    dirname: logDir,
    filename,
    datePattern: 'YYYY-MM-DD',
    level,
    maxSize: '20m',
    maxFiles: '30d',
    zippedArchive: true,
  });

const logger = winston.createLogger({
  // In prod capture everything down to HTTP access logs; in dev include debug.
  level: process.env.LOG_LEVEL || (isProd ? 'http' : 'debug'),
  format: fileFormat,
  transports: [
    dailyFile('error-%DATE%.log', 'error'), // errors only — the file to watch
    dailyFile('combined-%DATE%.log'), // everything (http, info, warn, error)
  ],
  // Catch crashes that would otherwise leave no trace.
  exceptionHandlers: [dailyFile('exceptions-%DATE%.log')],
  rejectionHandlers: [dailyFile('rejections-%DATE%.log')],
});

logger.add(new winston.transports.Console({ format: consoleFormat }));

// Lets morgan pipe HTTP access lines through winston (logged at the http level).
logger.stream = { write: (message) => logger.http(message.trim()) };

module.exports = logger;
