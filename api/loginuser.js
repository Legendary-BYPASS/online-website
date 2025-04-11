import fs from 'fs';
import path from 'path';

// Untuk fetch dari server
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

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

  // Ambil waktu server dari API waktu milikmu
  let now;
  try {
    const response = await fetch('https://apiku-online.vercel.app/api/time', {
      headers: {
        'User-Agent': 'BlazeM4CK/2.1 (Linux; Ubuntu 20.04; .NET 8.0; support@blazem4ck.com)'
      }
    });
    const data = await response.json();
    now = new Date(data.time); // contoh format: "2025-12-12T23:50:00"
  } catch (err) {
    console.error('[ERROR] Gagal ambil waktu server:', err);
    return res.status(500).send('WAKTU_TIDAK_TERSEDIA');
  }

  const newLines = [];
  let matchedLine = null;

  for (const line of lines) {
    const [username, expires, storedHwid] = line.trim().split('|');
    const expDate = new Date(expires);

    if (expDate < now) continue; // Hapus user expired
    if (storedHwid === hwid) matchedLine = line; // Cek HWID cocok

    newLines.push(`${username}|${expires}|${storedHwid}`);
  }

  // Simpan ulang hanya data yang masih aktif
  try {
    fs.writeFileSync(filePath, newLines.join('\n'));
  } catch (err) {
    console.error('[ERROR] Gagal menulis ulang file:', err);
    return res.status(500).send('GAGAL_UPDATE_DATABASE');
  }

  if (matchedLine) {
    return res.status(200).send(matchedLine); // Kirim baris mentah ke WinFormApp
  } else {
    return res.status(403).send('INVALID');
  }
}
