import crypto from 'crypto';

const PASTEBIN_URL = 'https://pastebin.com/raw/qjRa0CJQ';
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
  const encNotFound = encrypt("NOT_FOUND");
  const encFreeMode = encrypt("FREE_MODE");
  const encMaintenance = encrypt("MAINTENANCE");
  const encError = encrypt("ERROR");
  const encNotActive = encrypt("NOT_ACTIVE");

  if (!hwid) return res.status(400).send(encNotFound);

  try {
    const response = await fetch(`${PASTEBIN_URL}?t=${Date.now()}`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' }
    });

    const data = await response.text();
    const lines = data.trim().split('\n');

    let config = {};
    let inConfig = false;
    let inAccounts = false;
    const accounts = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith(';--main-configuration--')) {
        inConfig = true;
        inAccounts = false;
        continue;
      }
      if (trimmed.startsWith(';--list-accounts--')) {
        inConfig = false;
        inAccounts = true;
        continue;
      }

      if (inConfig && trimmed.includes('=')) {
        const [key, value] = trimmed.split('=');
        config[key.trim()] = value.trim();
      }

      if (inAccounts && trimmed.includes('|')) {
        const parts = trimmed.split('|');
        if (parts.length === 3) {
          accounts.push({
            username: parts[0].trim(),
            expiry: parts[1].trim(),
            hwid: parts[2].trim()
          });
        }
      }
    }

    const statusCode = parseInt(config.SERVER || '1'); // default to 1 (FREE_MODE) if missing
    const version = config.VERSI || '';
    const md5 = config.MD5 || '';
    const updateUrl = config.UPDATE || '';
    const token = config.TOKEN || '';
    const chatId = config.CHATID || '';

    const configData = `VERSI=${version},MD5=${md5},UPDATE=${updateUrl},TOKEN=${token},CHATID=${chatId}`;
    const encryptedConfig = encrypt(configData);

    // FREE MODE
    if (statusCode === 1) {
      return res.status(200).send(`${encryptedConfig}\n${encFreeMode}`);
    }

    // MAINTENANCE
    if (statusCode === 2) {
      return res.status(200).send(encMaintenance);
    }

    // ERROR STATUS
    if (statusCode !== 0) {
      return res.status(200).send(encError);
    }

    // LOGIN (STATUS = 0)
    const now = new Date().toISOString();

    for (const acc of accounts) {
      if (acc.hwid === hwid) {
        const expiryDate = new Date(acc.expiry);
        if (expiryDate > new Date()) {
          const userData = `${acc.username}|${acc.expiry}|${now}`;
          const encryptedUser = encrypt(userData);
          return res.status(200).send(`${encryptedConfig}\n${encryptedUser}`);
        } else {
          return res.status(200).send(encNotActive);
        }
      }
    }

    return res.status(200).send(encNotFound);

  } catch (err) {
    console.error("ERROR:", err);
    return res.status(200).send(encError);
  }
}
