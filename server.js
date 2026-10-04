import mongoose from 'mongoose';
import app from './src/app.js';
import { connectDb } from './src/config/db.js';
import { env } from './src/config/env.js';

await connectDb();

const server = app.listen(env.port, () => {
  console.log(`Deepam API listening on port ${env.port}`);
});

function shutdown(signal) {
  console.log(`${signal} received, closing the server`);
  server.close(async () => {
    await mongoose.disconnect();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
