// /pages/api/check.js

import crypto from 'crypto';

const PASTEBIN_URL = 'https://pastebin.com/raw/R50rMXKq'; // Ganti dengan Pastebin raw kamu
const SECRET_KEY = process.env.HMAC_SECRET;

function generateHash(hwid, expired) {
  return crypto
    .createHmac('sha256', SECRET_KEY)
    .update(hwid + expired)
    .digest('hex');
}

export default async function handler(req, res) {
  const { hwid } = req.method === 'POST' ? req.body : req.query;

  if (!hwid) return res.status(400).send("HWID tidak ditemukan");

  try {
    const response = await fetch(`${PASTEBIN_URL}?t=${Date.now()}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache'
      }
    });

    const data = await response.text();
    const now = new Date();

    const lines = data.trim().split('\n');

    for (const line of lines) {
      const [member, expiryStr, storedHwid] = line.trim().split('|');

      if (storedHwid === hwid) {
        const expiryDate = new Date(expiryStr);

        if (expiryDate > now) {
          const auth = generateHash(hwid, expiryStr);
          // Respons hanya dalam satu baris teks
          return res.status(200).send(`${auth}|${member}|${expiryStr}`);
        } else {
          const md5 = crypto.createHash('md5').update(hwid + 'salt').digest('hex');
          return res.status(200).send(md5);
        }
      }
    }

    return res.status(404).send("HWID tidak ditemukan");

  } catch (error) {
    return res.status(500).send("Server error");
  }
}
