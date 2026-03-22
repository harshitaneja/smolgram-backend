import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { initDatabase } from './db';
import clientRoutes from './routes/client';
import adminRoutes from './routes/admin';

const app = new Hono();

// Middleware
app.use('*', cors());
app.use('*', logger());

// Health check
app.get('/', (c) => c.json({ message: 'Smolgram Backend', version: '2.0.0', runtime: 'bun' }));

// API routes
app.route('/api/client', clientRoutes);
app.route('/api/admin', adminRoutes);

// Terms & conditions view
app.get('/views/client/termsAndConditions', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: -apple-system, sans-serif; padding: 20px; line-height: 1.6; color: #333; }
        h1 { font-size: 20px; }
        h2 { font-size: 16px; margin-top: 24px; }
        p { font-size: 14px; }
      </style>
    </head>
    <body>
      <h1>Terms and Conditions</h1>
      <p><strong>Effective Date:</strong> March 2026</p>
      
      <h2>1. Research Study Participation</h2>
      <p>By using Smolgram, you agree to participate in a research study examining social media usage patterns. Your participation is voluntary and you may withdraw at any time.</p>
      
      <h2>2. Data Collection</h2>
      <p>We collect usage data including app interaction patterns, time spent, and engagement metrics. All data is anonymized and used solely for research purposes.</p>
      
      <h2>3. Privacy</h2>
      <p>Your personal information will not be shared with third parties. Data is stored securely and accessible only to the research team.</p>
      
      <h2>4. Content Guidelines</h2>
      <p>Users must not post content that is harmful, abusive, or violates applicable laws. The research team reserves the right to remove content and restrict access.</p>
      
      <h2>5. Disclaimer</h2>
      <p>Smolgram is provided "as is" for research purposes. We make no warranties regarding availability or fitness for any particular purpose.</p>
      
      <h2>6. Contact</h2>
      <p>For questions about this study, contact the research team at the provided email address.</p>
    </body>
    </html>
  `);
});

// Start
const port = parseInt(process.env.PORT || '8082');

async function start() {
  await initDatabase();
  console.log(`\n🚀 Smolgram Backend running at http://localhost:${port}`);
  console.log(`   Runtime: Bun ${Bun.version}`);
  console.log(`   Routes:`);
  console.log(`     /api/client  — Mobile app API`);
  console.log(`     /api/admin   — Admin dashboard API`);
  console.log(`     /views       — Terms & conditions\n`);
}

start();

export default {
  port,
  fetch: app.fetch,
};
