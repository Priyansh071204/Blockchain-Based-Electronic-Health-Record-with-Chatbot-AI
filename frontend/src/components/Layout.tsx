import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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
  const [isDarkMode, setIsDarkMode] = useState(
    document.documentElement.getAttribute('data-theme') === 'dark'
  );
  const navigate = useNavigate();

  const toggleTheme = () => {
    const newTheme = !isDarkMode ? 'dark' : 'light';
    setIsDarkMode(!isDarkMode);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
  }, []);

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
      {/* Sidebar */}
      <aside className={`main-sidenav ${isSidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="logo-area" onClick={() => navigate('/')}>
            <Shield className="logo-icon-svg" size={24} />
            <span className="logo-text">EHR <span className="text-cyan">BLOCKCHAIN</span></span>
          </div>
          
          <div className="user-profile-summary">
            <div className="profile-avatar">{userInitials}</div>
            {isSidebarOpen && (
              <div className="profile-info">
                <span className="msp-label">MSP Verified</span>
                <span className="user-id font-mono">{user?.email}</span>
                <span className={`badge-tech success mt-1 role-${user?.role}`}>{user?.role}</span>
              </div>
            )}
          </div>
        </div>

        <nav className="sidebar-links">
          {navItems.map((item) => (
            <NavLink 
              key={item.label}
              to={item.link}
              className={({ isActive }) => `nav-rail-item ${isActive ? 'active' : ''}`}
            >
              {item.icon}
              {isSidebarOpen && <span className="nav-label">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="version-tag">PROTOCOL v0.5.0</div>
          <div className="node-status scanline">
            <span className="status-dot"></span>
            <span>NETWORK ONLINE</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="main-content-wrapper">
        <header className="top-bar">
          <div className="header-left">
            <button className="icon-btn menu-toggle" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
              <Menu size={18} />
            </button>
            <div className="search-premium">
              <Search className="search-icon" size={14} />
              <input type="text" placeholder="Protocol query..." />
            </div>
          </div>
          
          <div className="toolbar-actions">
            <button className="icon-btn" onClick={toggleTheme}>
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            
            <button className="icon-btn bell-btn">
              <Bell size={18} />
              <span className="badge-count">2</span>
            </button>

            <div className="user-avatar-trigger">
              <div className="top-avatar" onClick={() => logout()}>
                <LogOut size={14} />
              </div>
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
