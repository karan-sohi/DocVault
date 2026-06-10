import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getUsers, createUser, updateUser, deleteUser } from '../api';
import styles from './UsersPage.module.css';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Add user form
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [adding, setAdding] = useState(false);

  // Edit state
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => {
    getUsers()
      .then(setUsers)
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false));
  };
  
  useEffect(() => { load(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) return toast.error('Name and email required');
    setAdding(true);
    try {
      await createUser({ name: newName, email: newEmail });
      toast.success('User added');
      setNewName('');
      setNewEmail('');
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to add user');
    } finally {
      setAdding(false);
    }
  };

  const startEdit = (u: any) => {
    setEditId(u.id);
    setEditName(u.name);
    setEditEmail(u.email);
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditName('');
    setEditEmail('');
  };

  const handleSave = async (id: string) => {
    setSaving(true);
    try {
      await updateUser(id, { name: editName, email: editEmail });
      toast.success('User updated');
      setEditId(null);
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Remove "${name}" from DocVault? They will be unlinked from all documents.`)) return;
    try {
      await deleteUser(id);
      toast.success('User removed');
      load();
    } catch {
      toast.error('Failed to remove user');
    }
  };

  const initials = (name: string) =>
    name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();

  const colors = ['#e94560', '#7c3aed', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899', '#6366f1', '#14b8a6', '#f97316', '#8b5cf6'];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Users</h1>
          <p className={styles.subtitle}>{users.length} / 10 users registered</p>
        </div>
      </div>

      {/* Add user form */}
      <div className={styles.card}>
        <h2 className={styles.sectionTitle}>Add User</h2>
        <form onSubmit={handleAdd} className={styles.addForm}>
          <input
            className={styles.input}
            placeholder="Full name"
            value={newName}
            onChange={e => setNewName(e.target.value)}
          />
          <input
            className={styles.input}
            placeholder="Email address"
            type="email"
            value={newEmail}
            onChange={e => setNewEmail(e.target.value)}
          />
          <button type="submit" className={styles.addBtn} disabled={adding || users.length >= 10}>
            {adding ? 'Adding…' : '+ Add User'}
          </button>
        </form>
        {users.length >= 10 && (
          <p className={styles.limitNote}>⚠ Maximum of 10 users reached.</p>
        )}
      </div>

      {/* Users list */}
      <div className={styles.card}>
        {loading ? (
          <p className={styles.loading}>Loading…</p>
        ) : users.length === 0 ? (
          <p className={styles.empty}>No users yet. Add one above.</p>
        ) : (
          <div className={styles.userList}>
            {users.map((u, i) => (
              <div key={u.id} className={styles.userRow}>
                {editId === u.id ? (
                  <div className={styles.editRow}>
                    <div
                      className={styles.avatar}
                      style={{ background: colors[i % colors.length] }}
                    >{initials(u.name)}</div>
                    <input
                      className={styles.inlineInput}
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      placeholder="Name"
                    />
                    <input
                      className={styles.inlineInput}
                      value={editEmail}
                      onChange={e => setEditEmail(e.target.value)}
                      placeholder="Email"
                      type="email"
                    />
                    <button className={styles.saveBtn} onClick={() => handleSave(u.id)} disabled={saving}>
                      {saving ? '…' : 'Save'}
                    </button>
                    <button className={styles.cancelEditBtn} onClick={cancelEdit}>Cancel</button>
                  </div>
                ) : (
                  <>
                    <div
                      className={styles.avatar}
                      style={{ background: colors[i % colors.length] }}
                    >{initials(u.name)}</div>
                    <div className={styles.userInfo}>
                      <span className={styles.userName}>{u.name}</span>
                      <span className={styles.userEmail}>{u.email}</span>
                    </div>
                    <div className={styles.userActions}>
                      <button className={styles.editBtn} onClick={() => startEdit(u)}>Edit</button>
                      <button className={styles.deleteBtn} onClick={() => handleDelete(u.id, u.name)}>Remove</button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
