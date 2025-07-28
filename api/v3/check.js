import crypto from 'crypto';
import { DateTime } from 'luxon';

const PASTEBIN_URL = 'https://pastebin.com/raw/zL0U6k9A';
const AES_KEY = Buffer.from(process.env.AES_KEY, 'utf8');
const AES_IV = Buffer.from(process.env.AES_IV, 'utf8');

function encrypt(text) {
  const cipher = crypto.createCipheriv('aes-256-cbc', AES_KEY, AES_IV);
  let encrypted = cipher.update(text, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  return encrypted;
}

function getJakartaISOString() {
  try {
    const jakartaTime = DateTime.now().setZone('Asia/Jakarta');
    
    if (!jakartaTime.isValid) {
      throw new Error(`Invalid time: ${jakartaTime.invalidReason}`);
    }

    return jakartaTime.toFormat("yyyy-MM-dd'T'HH:mm:ss");
  } catch (error) {
    console.error("Error getting Jakarta time:", error);
    // Fallback ke waktu server (opsional)
    return DateTime.now().toFormat("yyyy-MM-dd'T'HH:mm:ss");
  }
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
    const lines = data.trim().split('\n').filter(line => 
      line.trim() !== '' && !line.trim().startsWith(';')
    );

    // Parse konfigurasi utama
    const config = {};
    let i = 0;
    for (; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.includes('|')) break; // Berhenti saat menemukan akun pertama
      
      const [key, value] = line.split('=').map(part => part.trim());
      if (key && value) config[key] = value;
    }

    if (!config.STATUS || !config.VERSI) {
      const encryptedError = encrypt("INVALID_CONFIG");
      return res.status(200).send(`${encryptedError}`);
    }

    const statusCode = parseInt(config.STATUS);
    
    // Enkripsi konfigurasi utama
    const configData = `VERSI=${config.VERSI},MD5=${config.MD5},UPDATE=${config.UPDATE},TOKEN=${config.TOKEN},CHATID=${config.CHATID}`;
    const encryptedConfig = encrypt(configData);

    // Handle Free Mode
    if (statusCode === 1) {
      const encryptedFree = encrypt("FREE_MODE");
      return res.status(200).send(`${encryptedConfig}\n${encryptedFree}`);
    }

    // Handle Maintenance
    if (statusCode === 2) {
      const encryptedMt = encrypt("MAINTENANCE");
      return res.status(200).send(`${encryptedMt}`);
    }

    // Handle Error Status
    if (statusCode !== 0) {
      const encryptedError = encrypt("ERROR");
      return res.status(200).send(`${encryptedError}`);
    }

    // Proses login normal
    const now = DateTime.now().setZone('Asia/Jakarta');

    for (; i < lines.length; i++) {
      const line = lines[i].trim();
      const parts = line.split('|').map(p => p.trim());

      if (parts.length !== 3) continue;

      const [user, expiryStr, storedHwid] = parts;

      if (!user || !expiryStr || !storedHwid) continue;

      if (storedHwid !== hwid.trim()) continue;

      const expiryDate = DateTime.fromFormat(expiryStr, 'yyyy-MM-dd HH:mm', { zone: 'Asia/Jakarta' });

      if (!expiryDate.isValid) continue;

      if (expiryDate > now) {
        const userData = `${user}|${expiryDate.toFormat("yyyy-MM-dd HH:mm")}|${now.toFormat("yyyy-MM-dd HH:mm:ss")}`;
        const encryptedUser = encrypt(userData);
        return res.status(200).send(`${encryptedConfig}\n${encryptedUser}`);
      } else {
        const encryptedExpired = encrypt("SUBSCRIPTION_EXPIRED");
        return res.status(200).send(`${encryptedExpired}`);
      }
    }

    return res.status(200).send(`${encryptedNotfound}`);

  } catch (err) {
    console.error("ERROR:", err);
    const encryptedError = encrypt("SERVER_ERROR");
    return res.status(200).send(`${encryptedError}`);
  }
}
