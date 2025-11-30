const net = require('net');

const [, , host, port, timeoutMs = '5000'] = process.argv;

if (!host || !port) {
  console.error('Usage: node Src/checkSmtpEgress.js <host> <port> [timeoutMs]');
  process.exit(1);
}

const timeout = parseInt(timeoutMs, 10) || 5000;
console.log(`Checking TCP connectivity to ${host}:${port} with ${timeout}ms timeout...`);

const socket = new net.Socket();
let finished = false;

const timer = setTimeout(() => {
  if (finished) return;
  finished = true;
  socket.destroy();
  console.error(`Timeout after ${timeout}ms connecting to ${host}:${port}`);
  process.exit(2);
}, timeout);

socket.setNoDelay(true);

socket.connect(Number(port), host, () => {
  if (finished) return;
  finished = true;
  clearTimeout(timer);
  console.log(`TCP connect succeeded to ${host}:${port}`);
  socket.end();
  process.exit(0);
});

socket.on('error', (err) => {
  if (finished) return;
  finished = true;
  clearTimeout(timer);
  console.error(`Connection error to ${host}:${port}:`, err && err.message ? err.message : err);
  process.exit(3);
});
