export default function handler(req, res) {
  const allowedUserAgent = "BlazeM4CK/1.0 (Windows NT 10.0; .NET 8.0; +https://t.me/blzmck)";  // Gantilah dengan User-Agent aplikasi Anda

  // Periksa User-Agent dari request
  const userAgent = req.headers['user-agent'] || '';

  if (userAgent !== allowedUserAgent) {
    return res.status(403).json({ error: "Access Denied" });
  }
  
  const now = new Date();
  const jakartaTime = now.toISOString();
  
  // Ambil IP dari header
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  res.status(200).json({
    time: jakartaTime,
    ip: ip || 'Unknown',
    country: 'Unavailable',
    city: 'Unavailable',
  });
}
