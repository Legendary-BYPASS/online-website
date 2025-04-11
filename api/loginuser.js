import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  const { hwid } = req.query;
  if (!hwid) return res.status(400).send('INVALID');

  const filePath = path.resolve('./data/data.txt');
  const data = fs.readFileSync(filePath, 'utf8');
  const lines = data.split('\n');

  for (const line of lines) {
    const [username, expires, storedHwid] = line.split('|');
    if (storedHwid === hwid) {
      return res.status(200).send(`${username}|${expires}|${storedHwid}`);
    }
  }
  return res.status(404).send('INVALID');
}