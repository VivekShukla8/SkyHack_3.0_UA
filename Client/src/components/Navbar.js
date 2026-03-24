import React from 'react';
import { Layout, Menu, Button, Space, Typography, Dropdown, Avatar, Modal } from 'antd';
import {
  DashboardOutlined, UnorderedListOutlined, BarChartOutlined,
  CloudUploadOutlined, DatabaseOutlined, UserOutlined,
  LogoutOutlined, LoginOutlined, UserAddOutlined, WarningOutlined,
  SunOutlined, MoonOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useProcessing } from '../context/ProcessingContext';
import { useTheme } from '../context/ThemeContext';

const { Header } = Layout;
const { Text } = Typography;

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token, logout } = useAuth();
  const { isProcessing } = useProcessing();
  const { isDark, toggleTheme } = useTheme();

  const selectedKey = (() => {
    const path = location.pathname;
    if (path === '/') return 'dashboard';
    if (path.startsWith('/flights')) return 'flights';
    if (path.startsWith('/analytics')) return 'analytics';
    if (path.startsWith('/upload')) return 'upload';
    if (path.startsWith('/stored-data')) return 'stored-data';
    return '';
  })();

  const safeNavigate = (path) => {
    if (isProcessing) {
      Modal.confirm({
        title: 'Processing In Progress',
        icon: <WarningOutlined style={{ color: '#faad14' }} />,
        content: (
          <div>
            <p>Data processing is currently running. Navigating away will:</p>
            <ul>
              <li>NOT stop the server-side processing</li>
              <li>Prevent you from seeing the processing results</li>
            </ul>
            <p><strong>Stay on this page or cancel processing first.</strong></p>
          </div>
        ),
        okText: 'Leave Anyway',
        okType: 'danger',
        cancelText: 'Stay Here',
        onOk: () => navigate(path),
      });
    } else {
      navigate(path);
    }
  };

  const navItems = [
    { key: 'dashboard', icon: <DashboardOutlined />, label: 'Dashboard', onClick: () => safeNavigate('/') },
    { key: 'flights', icon: <UnorderedListOutlined />, label: 'Flights', onClick: () => safeNavigate('/flights') },
    { key: 'analytics', icon: <BarChartOutlined />, label: 'Analytics', onClick: () => safeNavigate('/analytics') },
    { key: 'upload', icon: <CloudUploadOutlined />, label: 'Upload', onClick: () => safeNavigate('/upload') },
    { key: 'stored-data', icon: <DatabaseOutlined />, label: 'Data', onClick: () => safeNavigate('/stored-data') },
  ];

  const handleLogout = () => {
    if (isProcessing) {
      Modal.confirm({
        title: 'Processing In Progress',
        icon: <WarningOutlined />,
        content: 'Logging out may disrupt your view of processing results. Continue?',
        okText: 'Sign Out', okType: 'danger', cancelText: 'Stay',
        onOk: () => { logout(); navigate('/login'); },
      });
    } else { logout(); navigate('/login'); }
  };

  const userMenuItems = [
    { key: 'email', label: (<div style={{ padding: '4px 0' }}><div style={{ fontWeight: 600 }}>{user?.email || 'User'}</div><Text type="secondary" style={{ fontSize: 12 }}>Logged in</Text></div>), disabled: true },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: 'Sign out', danger: true, onClick: handleLogout },
  ];

  return (
    <Header
      className="app-navbar"
      style={{
        display: 'flex', alignItems: 'center', padding: '0 28px',
        background: 'var(--navbar-bg)',
        boxShadow: 'var(--navbar-shadow)',
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        height: 56, lineHeight: '56px',
        transition: 'background 0.3s, box-shadow 0.3s',
      }}
    >
      {/* Logo */}
      <div onClick={() => safeNavigate('/')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, marginRight: 36, flexShrink: 0 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 10,
          background: 'linear-gradient(135deg, #60a5fa, #38bdf8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 17, fontWeight: 700, color: '#0a1628',
          boxShadow: '0 3px 10px rgba(96,165,250,0.3)',
        }}>✈</div>
        <div style={{ lineHeight: 1.3 }}>
          <div style={{ color: '#fff', fontSize: 15, fontWeight: 600 }}>United Airlines</div>
          <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10, fontWeight: 400, letterSpacing: 0.8, textTransform: 'uppercase' }}>
            {isProcessing ? '⚡ Processing…' : 'Flight Difficulty Score'}
          </div>
        </div>
      </div>

      {/* Nav Menu */}
      <Menu mode="horizontal" selectedKeys={[selectedKey]} items={navItems} className="nav-menu"
        style={{ flex: 1, background: 'transparent', borderBottom: 'none', lineHeight: '56px', minWidth: 0 }} theme="dark" />

      {/* Right side */}
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Theme Toggle */}
        <div className="theme-toggle" onClick={toggleTheme} title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>
          {isDark ? <SunOutlined /> : <MoonOutlined />}
        </div>

        {/* Auth */}
        {token ? (
          <Dropdown menu={{ items: userMenuItems }} trigger={['click']} placement="bottomRight">
            <div style={{
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
              padding: '4px 14px', borderRadius: 10,
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
              transition: 'all 0.25s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.14)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
            >
              <Avatar size={26} icon={<UserOutlined />} style={{ background: 'linear-gradient(135deg, #60a5fa, #38bdf8)', color: '#0a1628', fontSize: 13 }} />
              <Text style={{ color: '#fff', fontSize: 12, maxWidth: 100, fontWeight: 500 }} ellipsis>{user?.email?.split('@')[0] || 'User'}</Text>
            </div>
          </Dropdown>
        ) : (
          <Space size={8}>
            <Button type="text" icon={<LoginOutlined />} onClick={() => navigate('/login')} style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12 }}>Sign In</Button>
            <Button type="primary" icon={<UserAddOutlined />} onClick={() => navigate('/register')} size="small"
              style={{ background: 'linear-gradient(135deg, #60a5fa, #38bdf8)', border: 'none', color: '#0a1628', fontWeight: 600, borderRadius: 8 }}>Sign Up</Button>
          </Space>
        )}
      </div>
    </Header>
  );
};

export default Navbar;
