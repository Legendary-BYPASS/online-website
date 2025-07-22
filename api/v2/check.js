import crypto from 'crypto';

const PASTEBIN_URL = 'https://pastebin.com/raw/FCCNe66k';
const AES_KEY = Buffer.from(process.env.AES_KEY, 'utf8'); // 32 byte
const AES_IV = Buffer.from(process.env.AES_IV, 'utf8');   // 16 byte

function encrypt(text) {
  const cipher = crypto.createCipheriv('aes-256-cbc', AES_KEY, AES_IV);
  let encrypted = cipher.update(text, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  return encrypted;
}

export default async function handler(req, res) {
  const { hwid } = req.method === 'POST' ? req.body : req.query;
  const encryptedNotfound = encrypt("NOT_FOUND");
  if (!hwid) return res.status(400).send(`${encryptedNotfound}`);

  try {
    const response = await fetch(`${PASTEBIN_URL}?t=${Date.now()}`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' }
    });

    const data = await response.text();
    const lines = data.trim().split('\n');

    const configLine = lines[0];
    const configMatch = configLine.match(/STATUS\s*=\s*(\d+),\s*VERSI\s*=\s*([^,]+),\s*MD5\s*=\s*([^,]+),\s*UPDATE\s*=\s*([^,]+),\s*TOKEN\s*=\s*([^,]+),\s*CHATID\s*=\s*([^\s]+)/);
    
    if (!configMatch) {
      return res.status(200).send("Format konfigurasi tidak valid");
    }

    const statusCode = parseInt(configMatch[1]);
    const version = configMatch[2].trim();
    const md5 = configMatch[3].trim();
    const updateUrl = configMatch[4].trim();
    const token = configMatch[5].trim();
    const chatId = configMatch[6].trim();

    // Enkripsi konfigurasi (baris pertama selalu dikirim)
    const configData = `VERSI=${version},MD5=${md5},UPDATE=${updateUrl},TOKEN=${token},CHATID=${chatId}`;
    const encryptedConfig = encrypt(configData);

    // Handle Free Status (STATUS=1)
    if (statusCode === 1) {
      const encryptedFree = encrypt("FREE_MODE");
      return res.status(200).send(`${encryptedConfig}\n${encryptedFree}`);
    }

    // Handle Maintenance (STATUS=2)
    if (statusCode === 2) {
      const encryptedMt = encrypt("MAINTENANCE");
      return res.status(200).send(`${encryptedMt}`);
    }

    // Handle Error Status
    if (statusCode !== 0) {
      const encryptedError = encrypt("ERROR");
      return res.status(200).send(`${encryptedError}`);
    }

    // Proses login normal (STATUS=0)
    const now = new Date().toISOString();

    for (let i = 1; i < lines.length; i++) {
      const [user, expiryStr, storedHwid] = lines[i].trim().split('|');

      if (storedHwid.trim() === hwid.trim()) {
        const expiryDate = new Date(expiryStr);
        if (expiryDate > new Date()) {
          const userData = `${user}|${expiryStr}|${now}`;
          const encryptedUser = encrypt(userData);
          return res.status(200).send(`${encryptedConfig}\n${encryptedUser}`);
        } else {
          const encryptedNonaktif = encrypt("NOT_ACTIVE");
          return res.status(200).send(`${encryptedNonaktif}`);
        }
      }
    }

    return res.status(200).send(`${encryptedNotfound}`);

  } catch (err) {
    console.error("ERROR:", err);
    const encryptedError = encrypt("ERROR");
    return res.status(200).send(`${encryptedError}`);
  }
}
