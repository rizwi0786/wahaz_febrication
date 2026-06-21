require('dotenv').config();
const app = require('./src/app');
const prisma = require('./src/config/db');
const logger = require('./src/config/logger');

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await prisma.$connect();
    logger.info('[db] connected');
    app.listen(PORT, () => {
      logger.info(`[server] listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    logger.error('[server] failed to start', { stack: err.stack });
    process.exit(1);
  }
}

process.on('SIGINT', async () => {
  logger.info('[server] shutting down (SIGINT)');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('[server] shutting down (SIGTERM)');
  await prisma.$disconnect();
  process.exit(0);
});

start();
