// /pages/api/check.js
import crypto from 'crypto';

export default async function handler(req, res) {
  const { hwid } = req.method === 'POST' ? req.body : req.query;

  if (!hwid) return res.status(400).send("HWID tidak ditemukan");

  // Ganti dengan RAW link dari Pastebin (harus public atau unlisted)
  const pastebinURL = 'https://pastebin.com/raw/R50rMXKq';

  try {
    const response = await fetch(pastebinURL);
    const data = await response.text();

    const lines = data.split('\n');
    const now = new Date();

    for (const line of lines) {
      const [member, expiry, storedHwid] = line.trim().split('|');

      if (storedHwid === hwid) {
        const expiryDate = new Date(expiry);

        if (expiryDate > now) {
          return res.status(200).send("Aktif");
        } else {
          // Bisa pakai MD5 jika ingin "tidak aktif" pakai kode acak
          const md5 = crypto.createHash('md5').update(hwid + 'salt').digest('hex');
          return res.status(200).send(md5);
          // atau:
          // return res.status(200).send("Tidak aktif");
        }
      }
    }

    // Jika HWID tidak cocok
    return res.status(404).send("HWID tidak ditemukan");

  } catch (err) {
    return res.status(500).send("Terjadi kesalahan server");
  }
}
