import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  const { key } = req.query;
  const adminKey = "ContohKey"; // sementara hardcoded

  if (key !== adminKey) {
    return res.status(403).send("ACCESS DENIED");
  }

  const filePath = path.resolve('./data/data.txt');
  let aktif = 0;
  let expired = 0;
  let listHTML = "";

  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const lines = raw.trim().split('\n');
    const now = new Date();

    for (const line of lines) {
      const [username, expires, hwid] = line.split('|');
      const isExpired = new Date(expires) < now;
      if (isExpired) expired++; else aktif++;
      listHTML += `<li>${username} | ${expires} | ${hwid} ${isExpired ? "(Expired)" : ""}</li>`;
    }
  } catch (err) {
    return res.status(500).send("Gagal membaca data");
  }

  // Render HTML
  res.setHeader('Content-Type', 'text/html');
  res.send(`
    <html>
      <head><title>Admin Panel</title></head>
      <body>
        <h1>Admin Panel</h1>
        <p>Jumlah User Aktif: <strong>${aktif}</strong></p>
        <p>Jumlah User Expired: <strong>${expired}</strong></p>
        <ul>${listHTML}</ul>

        <h3>Tambah User Baru</h3>
        <form action="/api/add-user" method="POST">
          <input name="username" placeholder="Username" /><br>
          <input name="expires" placeholder="2025-12-12 23:50" /><br>
          <input name="hwid" placeholder="HWID" /><br>
          <input type="hidden" name="key" value="${key}" />
          <button type="submit">Tambah</button>
        </form>
      </body>
    </html>
  `);
}
