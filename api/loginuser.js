import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  const { hwid } = req.query;
  if (!hwid) return res.status(400).send('NO_HWID');

  const filePath = path.resolve('./data/data.txt');
  let lines;

  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    lines = raw.trim().split('\n');
  } catch (err) {
    console.error('[ERROR] Tidak bisa membaca file:', err);
    return res.status(500).send('SERVER_ERROR');
  }

  const now = new Date();

  const newLines = [];
  let matchedLine = null;

  for (const line of lines) {
    const [username, expires, storedHwid] = line.trim().split('|');

    // Format waktu: "YYYY-MM-DD HH:mm" => jadi "YYYY-MM-DDTHH:mm:00Z"
    const expDate = new Date(expires.replace(' ', 'T') + ':00Z');

    if (expDate < now) continue; // skip expired user
    if (storedHwid === hwid) matchedLine = line;

    newLines.push(`${username}|${expires}|${storedHwid}`);
  }

  try {
    fs.writeFileSync(filePath, newLines.join('\n'));
  } catch (err) {
    console.error('[ERROR] Gagal menulis ulang file:', err);
    return res.status(500).send('GAGAL_UPDATE_DATABASE');
  }

  if (matchedLine) {
    return res.status(200).send(matchedLine);
  } else {
    return res.status(403).send('INVALID');
  }
}
