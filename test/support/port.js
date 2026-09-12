import { createServer } from 'node:net';
import { once } from 'node:events';

// Let the OS choose an available port, avoiding Windows excluded ranges.
// Release it before the child process starts; this is not a port reservation.
export async function availableLoopbackPort() {
  const probe = createServer();
  probe.listen(0, '127.0.0.1');
  await once(probe, 'listening');
  const port = probe.address().port;
  await new Promise((resolve, reject) => probe.close(error => error ? reject(error) : resolve()));
  return port;
}
