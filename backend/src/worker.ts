import './services/queue';
import dotenv from 'dotenv';

dotenv.config();

console.log('🚀 Worker started');
console.log('📊 Queues: campaign, message, import, webhook');

// Keep the process alive
process.on('SIGINT', async () => {
  console.log('\n👋 Worker shutting down...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n👋 Worker shutting down...');
  process.exit(0);
});
