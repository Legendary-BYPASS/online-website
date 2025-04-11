import { supabase } from '../utils/supabaseClient'

export default async function handler(req, res) {
  const { hwid } = req.query;
  if (!hwid) return res.status(400).send('NO_HWID');

  const now = new Date();

  // Ambil user dari Supabase
  const { data, error } = await supabase
    .from('FivePrivate') // nama tabel kamu
    .select('*')
    .eq('hwid', hwid)
    .single();

  if (error || !data) return res.status(403).send('INVALID');

  const expDate = new Date(data.expires);

  if (expDate < now) {
    // Hapus user expired
    await supabase.from('FivePrivate').delete().eq('hwid', hwid);
    return res.status(403).send('EXPIRED');
  }

  const response = `${data.username}|${formatDate(expDate)}|${data.hwid}`;
  return res.status(200).send(response);
}

function formatDate(date) {
  const pad = (n) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
