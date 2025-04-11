import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  const { hwid } = req.query;

  if (!hwid) return res.status(400).send('NO_HWID');

  const filePath = path.resolve('./data/data.txt'); // atau coba './data/data.txt' tergantung lokasi file kamu
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const lines = raw.trim().split('\n');

    for (const line of lines) {
      const [username, expires, storedHwid] = line.trim().split('|');

      // Debug log untuk bantu lihat yang dicocokkan
      console.log(`[DEBUG] Comparing: ${storedHwid} === ${hwid}`);

      if (storedHwid === hwid) {
        return res.status(200).send(line); // valid
      }
    }

    return res.status(403).send('INVALID'); // tidak cocok
  } catch (err) {
    console.error('[ERROR] Gagal baca file:', err);
    return res.status(500).send('SERVER_ERROR');
  }
}
