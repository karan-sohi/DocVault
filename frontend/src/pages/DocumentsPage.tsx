import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getDocuments, deleteDocument } from '../api';
import { formatDistanceToNow } from 'date-fns';
import styles from './DocumentsPage.module.css';

export default function DocumentsPage() {
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const load = () => {
    setLoading(true);
    getDocuments()
      .then(setDocs)
      .catch(() => toast.error('Failed to load documents'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string, name: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await deleteDocument(id);
      toast.success('Document deleted');
      load();
    } catch {
      toast.error('Failed to delete document');
    }
  };

  const filtered = docs.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.description?.toLowerCase().includes(search.toLowerCase()) ||
    d.uploader?.name.toLowerCase().includes(search.toLowerCase())
  );

  const fileIcon = (mimeType: string) => {
    if (!mimeType) return '📄';
    if (mimeType.includes('pdf')) return '📕';
    if (mimeType.includes('image')) return '🖼';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return '📊';
    if (mimeType.includes('zip') || mimeType.includes('archive')) return '📦';
    return '📄';
  };

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Documents</h1>
          <p className={styles.subtitle}>{docs.length} document{docs.length !== 1 ? 's' : ''} in vault</p>
        </div>
        <button className={styles.uploadBtn} onClick={() => navigate('/upload')}>
          + Upload Document
        </button>
      </div>

      <input
        className={styles.search}
        placeholder="Search documents…"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      {loading ? (
        <div className={styles.loading}>Loading…</div>
      ) : filtered.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>📭</div>
          <p>No documents yet.</p>
          <Link to="/upload" className={styles.emptyLink}>Upload your first document →</Link>
        </div>
      ) : (
        <div className={styles.grid}>
          {filtered.map(doc => {
            const latestVersion = doc.versions?.[0];
            return (
              <Link to={`/documents/${doc.id}`} key={doc.id} className={styles.card}>
                <div className={styles.cardTop}>
                  <span className={styles.fileIcon}>{fileIcon(latestVersion?.mimeType)}</span>
                  <button
                    className={styles.deleteBtn}
                    onClick={e => handleDelete(doc.id, doc.name, e)}
                    title="Delete document"
                  >✕</button>
                </div>
                <div className={styles.cardBody}>
                  <h3 className={styles.docName}>{doc.name}</h3>
                  {doc.description && <p className={styles.docDesc}>{doc.description}</p>}
                </div>
                <div className={styles.cardFooter}>
                  <span className={styles.badge}>v{doc._count?.versions ?? latestVersion?.versionNumber ?? 1}</span>
                  <span className={styles.meta}>{doc.uploader?.name}</span>
                  <span className={styles.meta}>{formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: true })}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
