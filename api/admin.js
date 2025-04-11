import { useState } from 'react';
import fs from 'fs';
import path from 'path';

export async function getServerSideProps(context) {
  const { key } = context.query;
  const adminKeyPath = path.resolve('./data/data-admin.txt');
  const dataPath = path.resolve('./data/data.txt');

  const adminKey = fs.readFileSync(adminKeyPath, 'utf8').trim();
  const userData = fs.readFileSync(dataPath, 'utf8').trim().split('\n');

  if (key !== adminKey) {
    return { props: { access: false } };
  }

  const now = new Date();
  let active = 0;
  let expired = 0;

  userData.forEach(line => {
    const [, expires] = line.split('|');
    if (new Date(expires) > now) active++;
    else expired++;
  });

  return {
    props: {
      access: true,
      active,
      expired
    }
  };
}

export default function AdminPage({ access, active, expired }) {
  const [formData, setFormData] = useState({ username: '', expires: '', hwid: '' });
  const [message, setMessage] = useState('');

  if (!access) return <div style={{ padding: 20 }}>Access Denied</div>;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/add-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    setMessage(await res.text());
  };

  return (
    <div style={{ padding: 20, fontFamily: 'sans-serif' }}>
      <h1>Admin Panel</h1>
      <p><strong>Active Users:</strong> {active}</p>
      <p><strong>Expired Users:</strong> {expired}</p>

      <h2>Add New User</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Username: </label>
          <input required value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} />
        </div>
        <div>
          <label>Expires (YYYY-MM-DD HH:mm): </label>
          <input required value={formData.expires} onChange={e => setFormData({ ...formData, expires: e.target.value })} />
        </div>
        <div>
          <label>HWID (hashed): </label>
          <input required value={formData.hwid} onChange={e => setFormData({ ...formData, hwid: e.target.value })} />
        </div>
        <button type="submit">Add User</button>
      </form>
      <p>{message}</p>
    </div>
  );
}