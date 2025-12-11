require('./tracing'); // Initialize OpenTelemetry
const express = require('express');
const client = require('prom-client');
const winston = require('winston');

const app = express();
const port = process.env.PORT || 3000;
const STABLE_MODE = process.env.STABLE_MODE === 'true';

// --- LOGGING SETUP (Winston) ---
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'transaction-validator' },
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: process.env.LOG_FILE || 'logs/app.log' })
  ]
});

// --- METRICS SETUP (Prometheus) ---
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics();

const transactionCounter = new client.Counter({
  name: 'transaction_requests_total',
  help: 'Total de solicitudes de validación',
  labelNames: ['status', 'method', 'route']
});

const transactionDuration = new client.Histogram({
  name: 'transaction_duration_seconds',
  help: 'Duración de la validación en segundos',
  labelNames: ['status', 'method', 'route'],
  buckets: [0.1, 0.3, 0.5, 1, 1.5, 2, 5]
});

// --- MIDDLEWARE ---
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  logger.info('Incoming request', { method: req.method, url: req.url });
  next();
});

// --- ROUTES ---

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', version: process.env.VERSION || '1.0.0' });
});

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

app.post('/validate', (req, res) => {
  const end = transactionDuration.startTimer();
  
  // Logic to simulate stability or instability
  // If STABLE_MODE is false (default for "old" version), we have issues.
  // If STABLE_MODE is true (new version), we are fast and reliable.
  
  let shouldFail = false;
  let latency = Math.random() * 100; // Normal latency 0-100ms

  if (!STABLE_MODE) {
      // Unstable mode: 0.8% error rate, high latency spikes
      shouldFail = Math.random() < 0.008; 
      if (Math.random() < 0.3) { // 30% chance of high latency
          latency = 500 + Math.random() * 1500; // 500-2000ms
      }
  }

  setTimeout(() => {
    if (shouldFail) {
      end({ status: '500', method: 'POST', route: '/validate' });
      transactionCounter.inc({ status: '500', method: 'POST', route: '/validate' });
      logger.error('Transaction validation failed', { 
          error: 'Database timeout simulation', 
          transactionId: req.body.id 
      });
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      end({ status: '200', method: 'POST', route: '/validate' });
      transactionCounter.inc({ status: '200', method: 'POST', route: '/validate' });
      logger.info('Transaction validated successfully', { 
          transactionId: req.body.id, 
          amount: req.body.amount,
          latency_ms: latency
      });
      res.status(200).json({ status: 'approved' });
    }
  }, latency);
});

if (require.main === module) {
  app.listen(port, () => {
    logger.info(`Transaction Validator Service listening on port ${port}`, { stable_mode: STABLE_MODE });
  });
}

module.exports = app;
