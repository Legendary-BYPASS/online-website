import { supabase } from '../utils/supabaseClient'

export default async function handler(req, res) {
  const { hwid } = req.query;
  if (!hwid) return res.status(400).send('NO_HWID');

  const now = new Date();

  // Ambil user dengan HWID yang cocok
  const { data, error } = await supabase
    .from('users') // ganti dengan nama tabel kamu
    .select('*')
    .eq('hwid', hwid)
    .single();

  if (error || !data) return res.status(403).send('INVALID');

  const expDate = new Date(data.expires.replace(' ', 'T') + ':00Z');

  if (expDate < now) {
    // Hapus user yang expired
    await supabase.from('users').delete().eq('id', data.id);
    return res.status(403).send('EXPIRED');
  }

  // Format mirip raw data.txt
  const response = `${data.username}|${data.expires}|${data.hwid}`;
  return res.status(200).send(response);
}
