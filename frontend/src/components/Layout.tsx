import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  LayoutDashboard, 
  ClipboardList, 
  Activity, 
  User, 
  Search, 
  Moon, 
  Sun, 
  Bell, 
  LogOut, 
  Menu,
  Users,
  Stethoscope
} from 'lucide-react';
import './Layout.css';

const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return (savedTheme || document.documentElement.getAttribute('data-theme') || 'dark') === 'dark';
  });
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 'record-sync',
      title: 'Ledger sync complete',
      message: 'Latest record activity has been verified on the mock Fabric network.',
      time: 'Just now',
      unread: true,
    },
    {
      id: 'security-review',
      title: 'Security monitor active',
      message: 'Access policies and role checks are running normally.',
      time: '8 min ago',
      unread: true,
    },
  ]);
  const navigate = useNavigate();
  const unreadCount = notifications.filter((notification) => notification.unread).length;

  const toggleTheme = () => {
    setIsDarkMode((current) => {
      const newTheme = current ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
      return !current;
    });
  };

  const toggleNotifications = () => {
    setIsNotificationsOpen((current) => !current);
    setNotifications((current) => current.map((notification) => ({ ...notification, unread: false })));
  };

  const clearNotifications = () => {
    setNotifications([]);
    setIsNotificationsOpen(false);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const getNavItems = () => {
    if (!user) return [];
    
    const common = [
      { label: 'Profile', link: '/profile', icon: <User size={20} /> },
    ];

    const roleItems: Record<string, any[]> = {
      admin: [
        { label: 'Dashboard', link: '/admin', icon: <LayoutDashboard size={20} /> },
        { label: 'Doctors', link: '/admin/doctors', icon: <Stethoscope size={20} /> },
        { label: 'Patients', link: '/admin/patients', icon: <Users size={20} /> },
      ],
      doctor: [
        { label: 'Dashboard', link: '/doctor', icon: <LayoutDashboard size={20} /> },
        { label: 'My Patients', link: '/doctor/patients', icon: <Users size={20} /> },
        { label: 'Authored Records', link: '/doctor/records', icon: <ClipboardList size={20} /> },
        { label: 'New Record', link: '/doctor/records/new', icon: <ClipboardList size={20} /> },
      ],
      patient: [
        { label: 'Dashboard', link: '/patient', icon: <LayoutDashboard size={20} /> },
        { label: 'My Records', link: '/patient/records', icon: <ClipboardList size={20} /> },
        { label: 'My Vitals', link: '/patient/vitals', icon: <Activity size={20} /> },
      ]
    };

    return [...(roleItems[user.role] || []), ...common];
  };

  const navItems = getNavItems();

  const userInitials = user?.email?.substring(0, 2).toUpperCase() || '??';

  return (
    <div className="app-container">
      {/* Animated Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 260 : 80 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="main-sidenav"
      >
        <div className="sidebar-header">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="logo-area" 
            onClick={() => navigate('/')}
          >
            <Shield className="logo-icon-svg" size={24} />
            {isSidebarOpen && (
              <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="logo-text"
              >
                MedChain <span className="text-cyan">EHR</span>
              </motion.span>
            )}
          </motion.div>
          
          <div className="user-profile-summary">
            <div className="profile-avatar">{userInitials}</div>
            <AnimatePresence>
              {isSidebarOpen && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="profile-info"
                >
                  <span className="msp-label">Signed in</span>
                  <span className="user-id font-mono">{user?.email}</span>
                  <span className={`badge-tech success mt-1 role-${user?.role}`}>{user?.role}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <nav className="sidebar-links">
          {navItems.map((item, index) => (
            <NavLink 
              key={item.label}
              to={item.link}
              className={({ isActive }) => `nav-rail-item ${isActive ? 'active' : ''}`}
            >
              <motion.div
                whileHover={{ scale: 1.2, color: 'var(--lume-cyan)' }}
                transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                style={{ display: 'flex', alignItems: 'center' }}
              >
                {item.icon}
              </motion.div>
              <AnimatePresence>
                {isSidebarOpen && (
                  <motion.span 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ delay: index * 0.05 }}
                    className="nav-label"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="version-tag">MedChain workspace</div>
          <div className="node-status scanline">
            <span className="status-dot"></span>
            {isSidebarOpen && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                System online
              </motion.span>
            )}
          </div>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <div className="main-content-wrapper">
        <header className="top-bar">
          <div className="header-left">
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="icon-btn menu-toggle" 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              <Menu size={18} />
            </motion.button>
            <div className="search-premium">
              <Search className="search-icon" size={14} />
              <input type="text" placeholder="Search patients, doctors, records..." />
            </div>
          </div>
          
          <div className="toolbar-actions">
            <motion.button 
              whileHover={{ scale: 1.1, rotate: 15 }}
              whileTap={{ scale: 0.9 }}
              className="icon-btn" 
              onClick={toggleTheme}
              type="button"
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-pressed={!isDarkMode}
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </motion.button>
            
            <div className="notification-menu">
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={`icon-btn bell-btn ${isNotificationsOpen ? 'active' : ''}`}
                onClick={toggleNotifications}
                type="button"
                aria-label="Open notifications"
                aria-expanded={isNotificationsOpen}
              >
                <Bell size={18} />
                {unreadCount > 0 && <span className="badge-count">{unreadCount}</span>}
              </motion.button>

              <AnimatePresence>
                {isNotificationsOpen && (
                  <motion.div
                    className="notification-panel"
                    initial={{ opacity: 0, y: -8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.98 }}
                    transition={{ duration: 0.18 }}
                  >
                    <div className="notification-header">
                      <div>
                        <span className="msp-label">Notifications</span>
                        <strong>{notifications.length ? `${notifications.length} updates` : 'All clear'}</strong>
                      </div>
                      {notifications.length > 0 && (
                        <button type="button" onClick={clearNotifications}>Clear</button>
                      )}
                    </div>

                    <div className="notification-list">
                      {notifications.length > 0 ? notifications.map((notification) => (
                        <div className="notification-item" key={notification.id}>
                          <span className="notification-dot" />
                          <div>
                            <strong>{notification.title}</strong>
                            <p>{notification.message}</p>
                            <time>{notification.time}</time>
                          </div>
                        </div>
                      )) : (
                        <div className="notification-empty">No new alerts.</div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="user-avatar-trigger">
              <motion.div 
                whileHover={{ scale: 1.1, backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                whileTap={{ scale: 0.9 }}
                className="top-avatar" 
                onClick={() => logout()}
              >
                <LogOut size={14} />
              </motion.div>
            </div>
          </div>
        </header>

        <main className="page-container">
          <div className="content-wrapper">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;

