import crypto from 'crypto';

const PASTEBIN_URL = 'https://pastebin.com/raw/R50rMXKq';
const AES_KEY = Buffer.from(process.env.AES_KEY); // 32 bytes
const AES_IV = Buffer.from(process.env.AES_IV); // 16 bytes

function encrypt(text) {
  const cipher = crypto.createCipheriv('aes-256-cbc', AES_KEY, AES_IV);
  let encrypted = cipher.update(text, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  return encrypted;
}

export default async function handler(req, res) {
  const { hwid } = req.method === 'POST' ? req.body : req.query;
  if (!hwid) return res.status(400).send("HWID tidak ditemukan");

  try {
    const response = await fetch(`${PASTEBIN_URL}?t=${Date.now()}`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' }
    });

    const data = await response.text();
    const now = new Date();
    const lines = data.trim().split('\n');

    for (const line of lines) {
      const [user, expiryStr, storedHwid] = line.trim().split('|');

      if (storedHwid === hwid) {
        const expiryDate = new Date(expiryStr);
        if (expiryDate > now) {
          const raw = `${user}|${expiryStr}`;
          const encrypted = encrypt(raw);
          return res.status(200).send(encrypted);
        } else {
          return res.status(200).send("Tidak aktif");
        }
      }
    }

    return res.status(200).send("HWID tidak ditemukan");

  } catch (err) {
    return res.status(200).send("Server sedang dalam pemeliharaan");
  }
}
