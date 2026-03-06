require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const marksRouter = require('./routes/marks');
const sessionRouter = require('./routes/session');

const app = express();

app.use(cors());
app.use(bodyParser.json({ limit: '2mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/marks', marksRouter);
app.use('/api/session', sessionRouter);

app.use((err, req, res, next) => {
  console.error('[server] Unhandled error', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`[server] NotifyED backend listening on port ${PORT}`);
});

module.exports = app;
