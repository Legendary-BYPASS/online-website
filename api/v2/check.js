import crypto from 'crypto';

const PASTEBIN_URL = 'https://pastebin.com/raw/qjRa0CJQ';
const AES_KEY = Buffer.from(process.env.AES_KEY, 'utf8');
const AES_IV = Buffer.from(process.env.AES_IV, 'utf8');

function encrypt(text) {
  const cipher = crypto.createCipheriv('aes-256-cbc', AES_KEY, AES_IV);
  let encrypted = cipher.update(text, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  return encrypted;
}

function getJakartaISOString() {
  const options = {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  };
  
  const formatter = new Intl.DateTimeFormat('en-US', options);
  const parts = formatter.formatToParts(new Date());
  
  const year = parts.find(p => p.type === 'year').value;
  const month = parts.find(p => p.type === 'month').value;
  const day = parts.find(p => p.type === 'day').value;
  const hour = parts.find(p => p.type === 'hour').value;
  const minute = parts.find(p => p.type === 'minute').value;
  const second = parts.find(p => p.type === 'second').value;
  
  return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
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
      return res.status(200).send(`${encryptedConfig}\n${encryptedMt}`);
    }

    // Handle Error Status
    if (statusCode !== 0) {
      const encryptedError = encrypt("ERROR");
      return res.status(200).send(`${encryptedError}`);
    }

    // Proses login normal
    const now = getJakartaISOString();
    for (; i < lines.length; i++) {
      const [user, expiryStr, storedHwid] = lines[i].trim().split('|').map(part => part.trim());

      if (storedHwid === hwid.trim()) {
        const expiryDate = new Date(expiryStr);
        if (expiryDate > now) {
          const userData = `${user}|${expiryStr}|${now}`;
          const encryptedUser = encrypt(userData);
          return res.status(200).send(`${encryptedConfig}\n${encryptedUser}`);
        } else {
          const encryptedExpired = encrypt("SUBSCRIPTION_EXPIRED");
          return res.status(200).send(`${encryptedExpired}\n{now}`);
        }
      }
    }

    return res.status(200).send(`${encryptedNotfound}`);

  } catch (err) {
    console.error("ERROR:", err);
    const encryptedError = encrypt("SERVER_ERROR");
    return res.status(200).send(`${encryptedError}`);
  }
}
