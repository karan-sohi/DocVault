import { Routes, Route, NavLink } from 'react-router-dom';
import DocumentsPage from './pages/DocumentsPage';
import DocumentDetailPage from './pages/DocumentDetailPage';
import UploadPage from './pages/UploadPage';
import UsersPage from './pages/UsersPage';
import styles from './App.module.css';


export default function App() {
  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>⬡</span>
          <span>Doc<em>Vault</em></span>
        </div>
        <nav className={styles.nav}>
          <NavLink to="/" end className={({ isActive }) => isActive ? styles.activeLink : styles.link}>
            <span>📂</span> Documents
          </NavLink>
          <NavLink to="/upload" className={({ isActive }) => isActive ? styles.activeLink : styles.link}>
            <span>⬆</span> Upload
          </NavLink>
          <NavLink to="/users" className={({ isActive }) => isActive ? styles.activeLink : styles.link}>
            <span>👥</span> Users
          </NavLink>
        </nav>
        <div className={styles.sidebarFooter}>
          <span>DocVault v1.0</span>
        </div>
      </aside>
      <main className={styles.main}>
        <Routes>
          <Route path="/" element={<DocumentsPage />} />
          <Route path="/documents/:id" element={<DocumentDetailPage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/users" element={<UsersPage />} />
        </Routes>
      </main>
    </div>
  );
}
