import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const { username, expires, hwid } = req.body;
  if (!username || !expires || !hwid) return res.status(400).send('Missing fields');

  const filePath = path.resolve('./data/data.txt');
  const newEntry = `\n${username}|${expires}|${hwid}`;
  fs.appendFileSync(filePath, newEntry);

  return res.status(200).send('User added');
}