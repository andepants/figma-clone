#!/usr/bin/env node

/**
 * Start Firebase emulators with dynamically assigned available ports
 * Useful for running multiple git worktrees simultaneously
 */

import { spawn } from 'child_process';
import net from 'net';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Check if a port is available on both IPv4 and IPv6
 */
async function isPortAvailable(port) {
  // Check IPv4
  const ipv4Available = await new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    server.listen(port, '127.0.0.1');
  });

  if (!ipv4Available) return false;

  // Check IPv6
  const ipv6Available = await new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    server.listen(port, '::1');
  });

  return ipv6Available;
}

/**
 * Find the next available port starting from a base port
 */
async function findAvailablePort(startPort, maxAttempts = 100) {
  for (let i = 0; i < maxAttempts; i++) {
    const port = startPort + i;
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`Could not find available port starting from ${startPort} after ${maxAttempts} attempts`);
}

/**
 * Find available ports for all Firebase emulators
 */
async function findAvailablePorts() {
  // Default port ranges for Firebase emulators
  const portConfig = {
    auth: await findAvailablePort(9099),
    functions: await findAvailablePort(5001),
    firestore: await findAvailablePort(9150),
    database: await findAvailablePort(9000),
    hosting: await findAvailablePort(5002),
    pubsub: await findAvailablePort(8085),
    storage: await findAvailablePort(9199),
    eventarc: await findAvailablePort(9299),
    ui: await findAvailablePort(4000),
    hub: await findAvailablePort(4400),
    logging: await findAvailablePort(4500),
  };

  return portConfig;
}

/**
 * Create a temporary firebase.json with available ports
 */
async function createTempFirebaseConfig(ports) {
  const configPath = path.join(__dirname, '..', 'firebase.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

  // Update emulator ports
  config.emulators = {
    ...config.emulators,
    auth: { port: ports.auth },
    functions: { port: ports.functions },
    firestore: { port: ports.firestore },
    database: { port: ports.database },
    hosting: { port: ports.hosting },
    pubsub: { port: ports.pubsub },
    storage: { port: ports.storage },
    eventarc: { port: ports.eventarc },
    ui: {
      enabled: true,
      port: ports.ui,
    },
    singleProjectMode: true,
  };

  const tempConfigPath = path.join(__dirname, '..', 'firebase.emulator.json');
  fs.writeFileSync(tempConfigPath, JSON.stringify(config, null, 2));

  return tempConfigPath;
}

/**
 * Start Firebase emulators with available ports
 */
async function startEmulators() {
  console.log('🔍 Finding available ports for Firebase emulators...\n');

  const ports = await findAvailablePorts();

  console.log('✅ Found available ports:');
  console.log(`   Auth:      http://localhost:${ports.auth}`);
  console.log(`   Functions: http://localhost:${ports.functions}`);
  console.log(`   Firestore: http://localhost:${ports.firestore}`);
  console.log(`   Database:  http://localhost:${ports.database}`);
  console.log(`   Hosting:   http://localhost:${ports.hosting}`);
  console.log(`   Storage:   http://localhost:${ports.storage}`);
  console.log(`   UI:        http://localhost:${ports.ui}`);
  console.log('');

  const tempConfigPath = await createTempFirebaseConfig(ports);

  console.log('🚀 Starting Firebase emulators...\n');

  const firebase = spawn('firebase', ['emulators:start', '--config', tempConfigPath], {
    stdio: 'inherit',
  });

  // Clean up temp config on exit
  const cleanup = () => {
    if (fs.existsSync(tempConfigPath)) {
      fs.unlinkSync(tempConfigPath);
    }
  };

  process.on('SIGINT', () => {
    cleanup();
    process.exit(0);
  });

  process.on('exit', cleanup);

  firebase.on('close', (code) => {
    cleanup();
    process.exit(code);
  });
}

// Run the script
startEmulators().catch((err) => {
  console.error('❌ Error starting emulators:', err.message);
  process.exit(1);
});
