import { supabase } from '../utils/supabaseClient'

const ADMIN_KEY = "ContohKey"; // Ganti sesuai key kamu

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('METHOD_NOT_ALLOWED');

  const { key, username, expires, hwid } = req.body;

  if (key !== ADMIN_KEY) return res.status(403).send('INVALID_KEY');
  if (!username || !expires || !hwid) return res.status(400).send('MISSING_FIELDS');

  // Cek apakah HWID sudah ada
  const { data: existing, error: findError } = await supabase
    .from('FivePrivate')
    .select('*')
    .eq('hwid', hwid)
    .single();

  if (existing) return res.status(409).send('HWID_ALREADY_EXISTS');

  // Tambahkan ke Supabase
  const { error } = await supabase.from('FivePrivate').insert([
    {
      username,
      expires,
      hwid
    }
  ]);

  if (error) {
    console.error(error);
    return res.status(500).send('FAILED_TO_ADD_USER');
  }

  return res.status(200).send('USER_ADDED');
}
