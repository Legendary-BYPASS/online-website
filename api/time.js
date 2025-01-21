export default function handler(req, res) {
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
