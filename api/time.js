import crypto from 'crypto';

const ALLOWED_USER_AGENT = process.env.UA_SECRET;
const BEARER_TOKEN = process.env.BEARER_SECRET;
const HMAC_SECRET = process.env.HMAC_SECRET;

function isValidSignature(timestamp, clientSignature) {
  const now = Date.now();
  const timeDiff = Math.abs(now - parseInt(timestamp, 10));

  if (timeDiff > 60000) return false; // 1 menit toleransi waktu

  const hmac = crypto.createHmac('sha256', HMAC_SECRET);
  hmac.update(timestamp);
  const expectedSignature = hmac.digest('hex');

  return expectedSignature === clientSignature;
}

export default function handler(req, res) {
  const userAgent = req.headers['user-agent'] || '';
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  const timestamp = req.headers['x-timestamp'];
  const signature = req.headers['x-signature'];

  if (userAgent !== ALLOWED_USER_AGENT) {
    return res.status(403).send("Invalid User-Agent");
  }

  if (token !== BEARER_TOKEN) {
    return res.status(403).send("Invalid Bearer Token");
  }

  if (!timestamp || !signature || !isValidSignature(timestamp, signature)) {
    return res.status(403).send("Invalid Signature or Timestamp");
  }

  const now = new Date().toISOString();
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown';

  res.setHeader('Content-Type', 'text/plain');
  res.status(200).send(`${now}\n${ip}`);
}
