import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import { getUsers, uploadDocument } from '../api';
import styles from './UploadPage.module.css';

interface NotifRule {
  userId: string;
  type: 'DEADLINE' | 'FREQUENCY';
  deadlineAt?: string;
  frequencyDays?: number;
}

export default function UploadPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [uploadedBy, setUploadedBy] = useState('');
  const [changeNote, setChangeNote] = useState('Initial upload');
  const [notifications, setNotifications] = useState<NotifRule[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // New rule form state
  const [newRuleUser, setNewRuleUser] = useState('');
  const [newRuleType, setNewRuleType] = useState<'DEADLINE' | 'FREQUENCY'>('DEADLINE');
  const [newRuleDeadline, setNewRuleDeadline] = useState('');
  const [newRuleFrequency, setNewRuleFrequency] = useState('7');

  useEffect(() => {
    getUsers().then(u => {
      setUsers(u);
      if (u.length) {
        setUploadedBy(u[0].id);
        setNewRuleUser(u[0].id);
      }
    });
  }, []);

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted.length > 0) {
      const f = accepted[0];
      setFile(f);
      if (!name) setName(f.name.replace(/\.[^.]+$/, ''));
    }
  }, [name]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    maxSize: 100 * 1024 * 1024,
  });

  const addRule = () => {
    if (!newRuleUser) return toast.error('Select a user');
    if (newRuleType === 'DEADLINE' && !newRuleDeadline) return toast.error('Set a deadline');
    if (newRuleType === 'FREQUENCY' && !newRuleFrequency) return toast.error('Set frequency days');

    const rule: NotifRule = {
      userId: newRuleUser,
      type: newRuleType,
      deadlineAt: newRuleType === 'DEADLINE' ? newRuleDeadline : undefined,
      frequencyDays: newRuleType === 'FREQUENCY' ? parseInt(newRuleFrequency) : undefined,
    };
    setNotifications(prev => [...prev, rule]);
    toast.success('Notification rule added');
  };

  const removeRule = (idx: number) => {
    setNotifications(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return toast.error('Please select a file');
    if (!name.trim()) return toast.error('Document name is required');
    if (!uploadedBy) return toast.error('Select who is uploading');

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('name', name);
      fd.append('description', description);
      fd.append('uploadedBy', uploadedBy);
      fd.append('changeNote', changeNote);
      fd.append('notifications', JSON.stringify(notifications));

      const doc = await uploadDocument(fd);
      toast.success('Document uploaded successfully!');
      navigate(`/documents/${doc.id}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Upload failed');
    } finally {
      setSubmitting(false);
    }
  };

  const getUserName = (id: string) => users.find(u => u.id === id)?.name ?? id;

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Upload Document</h1>
      <p className={styles.subtitle}>Add a new document to the vault with optional notification rules.</p>

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Drop zone */}
        <div
          {...getRootProps()}
          className={`${styles.dropzone} ${isDragActive ? styles.dropzoneActive : ''} ${file ? styles.dropzoneFilled : ''}`}
        >
          <input {...getInputProps()} />
          {file ? (
            <div className={styles.filePreview}>
              <span className={styles.fileEmoji}>📄</span>
              <div>
                <div className={styles.fileName}>{file.name}</div>
                <div className={styles.fileMeta}>{(file.size / 1024).toFixed(1)} KB · {file.type || 'unknown type'}</div>
              </div>
              <button
                type="button"
                className={styles.removeFile}
                onClick={e => { e.stopPropagation(); setFile(null); }}
              >✕</button>
            </div>
          ) : (
            <div className={styles.dropContent}>
              <span className={styles.dropIcon}>⬆</span>
              <p>{isDragActive ? 'Drop it here…' : 'Drag & drop a file, or click to browse'}</p>
              <span className={styles.dropHint}>Any file type · Max 100 MB</span>
            </div>
          )}
        </div>

        {/* Document metadata */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Document Details</h2>
          <div className={styles.grid2}>
            <div className={styles.field}>
              <label>Document Name *</label>
              <input
                className={styles.input}
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Q4 Financial Report"
                required
              />
            </div>
            <div className={styles.field}>
              <label>Uploading as *</label>
              <select className={styles.select} value={uploadedBy} onChange={e => setUploadedBy(e.target.value)}>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
          </div>
          <div className={styles.field}>
            <label>Description</label>
            <textarea
              className={styles.textarea}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Optional description of this document…"
              rows={2}
            />
          </div>
          <div className={styles.field}>
            <label>Initial version note</label>
            <input
              className={styles.input}
              value={changeNote}
              onChange={e => setChangeNote(e.target.value)}
              placeholder="What does this version contain?"
            />
          </div>
        </div>

        {/* Notification rules */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Notification Rules <span className={styles.optional}>(optional)</span></h2>
          <p className={styles.hint}>Set up email reminders for this document. Rules can also be edited later.</p>

          <div className={styles.ruleBuilder}>
            <div className={styles.grid3}>
              <div className={styles.field}>
                <label>User to notify</label>
                <select className={styles.select} value={newRuleUser} onChange={e => setNewRuleUser(e.target.value)}>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div className={styles.field}>
                <label>Type</label>
                <select
                  className={styles.select}
                  value={newRuleType}
                  onChange={e => setNewRuleType(e.target.value as 'DEADLINE' | 'FREQUENCY')}
                >
                  <option value="DEADLINE">Deadline (one-time)</option>
                  <option value="FREQUENCY">Recurring frequency</option>
                </select>
              </div>
              {newRuleType === 'DEADLINE' ? (
                <div className={styles.field}>
                  <label>Deadline date/time</label>
                  <input
                    type="datetime-local"
                    className={styles.input}
                    value={newRuleDeadline}
                    onChange={e => setNewRuleDeadline(e.target.value)}
                  />
                </div>
              ) : (
                <div className={styles.field}>
                  <label>Every N days</label>
                  <input
                    type="number"
                    className={styles.input}
                    min="1"
                    value={newRuleFrequency}
                    onChange={e => setNewRuleFrequency(e.target.value)}
                  />
                </div>
              )}
            </div>
            <button type="button" className={styles.addRuleBtn} onClick={addRule}>
              + Add Rule
            </button>
          </div>

          {notifications.length > 0 && (
            <div className={styles.rulesList}>
              {notifications.map((rule, i) => (
                <div key={i} className={styles.ruleChip}>
                  <span>{rule.type === 'DEADLINE' ? '📅' : '🔄'}</span>
                  <span><strong>{getUserName(rule.userId)}</strong></span>
                  <span className={styles.ruleChipDesc}>
                    {rule.type === 'DEADLINE'
                      ? `Deadline: ${new Date(rule.deadlineAt!).toLocaleString()}`
                      : `Every ${rule.frequencyDays} day(s)`}
                  </span>
                  <button type="button" className={styles.removeChip} onClick={() => removeRule(i)}>✕</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.actions}>
          <button type="button" className={styles.cancelBtn} onClick={() => navigate('/')}>
            Cancel
          </button>
          <button type="submit" className={styles.submitBtn} disabled={submitting}>
            {submitting ? 'Uploading…' : '⬆ Upload Document'}
          </button>
        </div>
      </form>
    </div>
  );
}
