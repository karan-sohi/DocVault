import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import {
  getDocument, getUsers, uploadVersion, downloadVersion,
  createNotificationRule, deleteNotificationRule,
} from '../api';
import styles from './DocumentDetailPage.module.css';

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [doc, setDoc] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'versions' | 'notifications'>('versions');

  // Version upload form
  const [versionFile, setVersionFile] = useState<File | null>(null);
  const [versionNote, setVersionNote] = useState('');
  const [versionUploader, setVersionUploader] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Notification form
  const [notifUserId, setNotifUserId] = useState('');
  const [notifType, setNotifType] = useState<'DEADLINE' | 'FREQUENCY'>('DEADLINE');
  const [notifDeadline, setNotifDeadline] = useState('');
  const [notifFrequency, setNotifFrequency] = useState('7');
  const [addingNotif, setAddingNotif] = useState(false);

  const load = async () => {
    if (!id) return;
    try {
      const [docData, usersData] = await Promise.all([getDocument(id), getUsers()]);
      setDoc(docData);
      setUsers(usersData);
      if (!versionUploader && usersData.length) setVersionUploader(usersData[0].id);
      if (!notifUserId && usersData.length) setNotifUserId(usersData[0].id);
    } catch {
      toast.error('Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handleVersionUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!versionFile) return toast.error('Please select a file');
    if (!versionUploader) return toast.error('Please select who is uploading');
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', versionFile);
      fd.append('uploadedBy', versionUploader);
      fd.append('changeNote', versionNote);
      await uploadVersion(id!, fd);
      toast.success('New version uploaded');
      setVersionFile(null);
      setVersionNote('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      await load();
    } catch {
      toast.error('Failed to upload version');
    } finally {
      setUploading(false);
    }
  };

  const handleAddNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifUserId) return toast.error('Select a user');
    if (notifType === 'DEADLINE' && !notifDeadline) return toast.error('Set a deadline date');
    if (notifType === 'FREQUENCY' && !notifFrequency) return toast.error('Set frequency days');
    setAddingNotif(true);
    try {
      await createNotificationRule({
        documentId: id,
        userId: notifUserId,
        type: notifType,
        deadlineAt: notifType === 'DEADLINE' ? notifDeadline : undefined,
        frequencyDays: notifType === 'FREQUENCY' ? parseInt(notifFrequency) : undefined,
      });
      toast.success('Notification rule added');
      await load();
    } catch {
      toast.error('Failed to add notification rule');
    } finally {
      setAddingNotif(false);
    }
  };

  const handleDeleteNotif = async (ruleId: string) => {
    try {
      await deleteNotificationRule(ruleId);
      toast.success('Notification rule removed');
      await load();
    } catch {
      toast.error('Failed to remove rule');
    }
  };

  if (loading) return <div className={styles.loading}>Loading…</div>;
  if (!doc) return <div className={styles.loading}>Document not found</div>;

  return (
    <div>
      <button className={styles.back} onClick={() => navigate('/')}>← Back</button>

      <div className={styles.docHeader}>
        <div>
          <h1 className={styles.title}>{doc.name}</h1>
          {doc.description && <p className={styles.desc}>{doc.description}</p>}
          <div className={styles.metaRow}>
            <span>By <strong>{doc.uploader?.name}</strong></span>
            <span>·</span>
            <span>{doc.versions.length} version{doc.versions.length !== 1 ? 's' : ''}</span>
            <span>·</span>
            <span>Created {format(new Date(doc.createdAt), 'MMM d, yyyy')}</span>
          </div>
        </div>
      </div>

      {/* Upload new version */}
      <div className={styles.card}>
        <h2 className={styles.sectionTitle}>Upload New Version</h2>
        <form onSubmit={handleVersionUpload} className={styles.versionForm}>
          <div className={styles.formRow}>
            <label>File</label>
            <input
              ref={fileInputRef}
              type="file"
              className={styles.fileInput}
              onChange={e => setVersionFile(e.target.files?.[0] ?? null)}
            />
            {versionFile && <span className={styles.fileName}>{versionFile.name}</span>}
          </div>
          <div className={styles.formRow}>
            <label>Uploaded by</label>
            <select
              className={styles.select}
              value={versionUploader}
              onChange={e => setVersionUploader(e.target.value)}
            >
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <div className={styles.formRow}>
            <label>Change note</label>
            <input
              className={styles.input}
              placeholder="What changed in this version?"
              value={versionNote}
              onChange={e => setVersionNote(e.target.value)}
            />
          </div>
          <button type="submit" className={styles.btn} disabled={uploading}>
            {uploading ? 'Uploading…' : 'Upload Version'}
          </button>
        </form>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={activeTab === 'versions' ? styles.activeTab : styles.tab}
          onClick={() => setActiveTab('versions')}
        >
          📋 Version History ({doc.versions.length})
        </button>
        <button
          className={activeTab === 'notifications' ? styles.activeTab : styles.tab}
          onClick={() => setActiveTab('notifications')}
        >
          🔔 Notifications ({doc.notificationRules?.length ?? 0})
        </button>
      </div>

      {activeTab === 'versions' && (
        <div className={styles.card}>
          {doc.versions.length === 0 ? (
            <p className={styles.empty}>No versions yet.</p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Version</th>
                  <th>File</th>
                  <th>Size</th>
                  <th>Uploaded by</th>
                  <th>Note</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {doc.versions.map((v: any) => (
                  <tr key={v.id}>
                    <td>
                      <span className={styles.versionBadge}>v{v.versionNumber}</span>
                    </td>
                    <td className={styles.mono}>{v.fileName}</td>
                    <td>{formatBytes(Number(v.sizeBytes))}</td>
                    <td>{users.find(u => u.id === v.uploadedBy)?.name ?? v.uploadedBy}</td>
                    <td className={styles.note}>{v.changeNote ?? '—'}</td>
                    <td>{format(new Date(v.createdAt), 'MMM d, yyyy HH:mm')}</td>
                    <td>
                      <button
                        className={styles.downloadBtn}
                        onClick={() => downloadVersion(doc.id, v.id)}
                      >↓ Download</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'notifications' && (
        <div>
          <div className={styles.card}>
            <h2 className={styles.sectionTitle}>Add Notification Rule</h2>
            <form onSubmit={handleAddNotification} className={styles.notifForm}>
              <div className={styles.formRow}>
                <label>Notify user</label>
                <select
                  className={styles.select}
                  value={notifUserId}
                  onChange={e => setNotifUserId(e.target.value)}
                >
                  {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
                </select>
              </div>
              <div className={styles.formRow}>
                <label>Notification type</label>
                <div className={styles.radioGroup}>
                  <label className={styles.radio}>
                    <input
                      type="radio" value="DEADLINE"
                      checked={notifType === 'DEADLINE'}
                      onChange={() => setNotifType('DEADLINE')}
                    /> Deadline
                  </label>
                  <label className={styles.radio}>
                    <input
                      type="radio" value="FREQUENCY"
                      checked={notifType === 'FREQUENCY'}
                      onChange={() => setNotifType('FREQUENCY')}
                    /> Recurring frequency
                  </label>
                </div>
              </div>
              {notifType === 'DEADLINE' ? (
                <div className={styles.formRow}>
                  <label>Deadline date</label>
                  <input
                    type="datetime-local"
                    className={styles.input}
                    value={notifDeadline}
                    onChange={e => setNotifDeadline(e.target.value)}
                  />
                  <span className={styles.hint}>Email sent 24h before deadline</span>
                </div>
              ) : (
                <div className={styles.formRow}>
                  <label>Every N days</label>
                  <input
                    type="number"
                    className={styles.input}
                    min="1"
                    value={notifFrequency}
                    onChange={e => setNotifFrequency(e.target.value)}
                    style={{ width: '120px' }}
                  />
                  <span className={styles.hint}>Recurring email every {notifFrequency} day(s)</span>
                </div>
              )}
              <button type="submit" className={styles.btn} disabled={addingNotif}>
                {addingNotif ? 'Adding…' : 'Add Rule'}
              </button>
            </form>
          </div>

          <div className={styles.card}>
            <h2 className={styles.sectionTitle}>Active Rules</h2>
            {!doc.notificationRules?.length ? (
              <p className={styles.empty}>No notification rules yet.</p>
            ) : (
              <div className={styles.rulesList}>
                {doc.notificationRules.map((rule: any) => (
                  <div key={rule.id} className={styles.ruleRow}>
                    <div className={styles.ruleIcon}>
                      {rule.type === 'DEADLINE' ? '📅' : '🔄'}
                    </div>
                    <div className={styles.ruleInfo}>
                      <strong>{rule.user?.name}</strong>
                      <span className={styles.ruleDesc}>
                        {rule.type === 'DEADLINE'
                          ? `Deadline: ${format(new Date(rule.deadlineAt), 'MMM d, yyyy HH:mm')}`
                          : `Every ${rule.frequencyDays} day(s)`}
                      </span>
                      {rule.lastNotifiedAt && (
                        <span className={styles.ruleDesc}>
                          Last notified: {format(new Date(rule.lastNotifiedAt), 'MMM d, yyyy HH:mm')}
                        </span>
                      )}
                    </div>
                    <button
                      className={styles.deleteRuleBtn}
                      onClick={() => handleDeleteNotif(rule.id)}
                    >Remove</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
