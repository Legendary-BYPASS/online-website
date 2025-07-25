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

  if (!hwid) return res.status(400).send(`${encNotFound}`);

  try {
    const response = await fetch(`${PASTEBIN_URL}?t=${Date.now()}`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' }
    });

    const text = await response.text();
    const lines = text.trim().split('\n').map(line => line.trim());

    const config = {};
    const accounts = [];

    let mode = ''; // 'config' atau 'accounts'

    for (const line of lines) {
      if (line.startsWith(';--main-configuration--')) {
        mode = 'config';
        continue;
      }

      if (line.startsWith(';--list-accounts--')) {
        mode = 'accounts';
        continue;
      }

      if (line.startsWith(';') || line === '') continue; // Abaikan komentar dan baris kosong

      if (mode === 'config') {
        const [key, value] = line.split('=');
        if (key && value) config[key.trim()] = value.trim();
      } else if (mode === 'accounts') {
        const [user, expiryStr, storedHwid] = line.split('|');
        if (user && expiryStr && storedHwid) {
          accounts.push({ user, expiryStr, storedHwid });
        }
      }
    }

    // Validasi config wajib
    if (!config.SERVER || !config.VERSI || !config.MD5 || !config.UPDATE || !config.TOKEN || !config.CHATID) {
      return res.status(200).send("INVALID_CONFIG");
    }

    const statusCode = parseInt(config.SERVER);

    const configData = `VERSI=${config.VERSI},MD5=${config.MD5},UPDATE=${config.UPDATE},TOKEN=${config.TOKEN},CHATID=${config.CHATID}`;
    const encryptedConfig = encrypt(configData);

    if (statusCode === 1) {
      return res.status(200).send(`${encryptedConfig}\n${encFreeMode}`);
    }

    if (statusCode === 2) {
      return res.status(200).send(`${encMaintenance}`);
    }

    if (statusCode !== 0) {
      return res.status(200).send(`${encError}`);
    }

    const now = new Date().toISOString();

    for (const acc of accounts) {
      if (acc.storedHwid.trim() === hwid.trim()) {
        const expiryDate = new Date(acc.expiryStr);
        if (expiryDate > new Date()) {
          const userData = `${acc.user}|${acc.expiryStr}|${now}`;
          const encryptedUser = encrypt(userData);
          return res.status(200).send(`${encryptedConfig}\n${encryptedUser}`);
        } else {
          return res.status(200).send(`${encNotActive}`);
        }
      }
    }

    return res.status(200).send(`${encNotFound}`);

  } catch (err) {
    console.error("ERROR: ", err);
    return res.status(200).send(`${encError}`);
  }
}
