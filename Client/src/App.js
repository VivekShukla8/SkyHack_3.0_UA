import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout, ConfigProvider, App as AntApp, theme } from 'antd';
import 'antd/dist/reset.css';
import './App.css';

// Context
import { ProcessingProvider } from './context/ProcessingContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';

// Auth
import RequireAuth from './auth/RequireAuth';

// Components
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import FlightList from './pages/FlightList';
import Analytics from './pages/Analytics';
import DataUpload from './pages/DataUpload';
import StoredData from './pages/StoredData';
import FlightDetails from './pages/FlightDetails';
import Login from './pages/Login';
import Register from './pages/Register';

const { Content } = Layout;

// Inner shell that reads the theme context and feeds Ant Design's ConfigProvider
function AppShell() {
  const { isDark } = useTheme();

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#3b82f6',
          colorSuccess: '#10b981',
          colorWarning: '#f59e0b',
          colorError: '#ef4444',
          colorBgContainer: isDark ? '#111827' : '#ffffff',
          colorBgElevated: isDark ? '#1e293b' : '#ffffff',
          colorBorder: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
          colorText: isDark ? '#e2e8f0' : '#1e293b',
          colorTextSecondary: isDark ? '#94a3b8' : '#475569',
          colorTextPlaceholder: isDark ? '#64748b' : '#94a3b8',
        },
      }}
    >
      <AntApp>
        <ProcessingProvider>
          <Layout style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
            <Navbar />
            <Layout style={{ background: 'var(--bg-page)' }}>
              <Content style={{ background: 'var(--bg-page)', marginTop: 56 }}>
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/login" element={<div style={{ padding: 24 }}><Login /></div>} />
                  <Route path="/register" element={<div style={{ padding: 24 }}><Register /></div>} />
                  <Route path="/dashboard" element={<RequireAuth><div style={{ padding: 24 }}><Dashboard /></div></RequireAuth>} />
                  <Route path="/flights" element={<RequireAuth><div style={{ padding: 24 }}><FlightList /></div></RequireAuth>} />
                  <Route path="/flights/:id" element={<RequireAuth><div style={{ padding: 24 }}><FlightDetails /></div></RequireAuth>} />
                  <Route path="/analytics" element={<RequireAuth><div style={{ padding: 24 }}><Analytics /></div></RequireAuth>} />
                  <Route path="/upload" element={<RequireAuth><div style={{ padding: 24 }}><DataUpload /></div></RequireAuth>} />
                  <Route path="/stored-data" element={<RequireAuth><div style={{ padding: 24 }}><StoredData /></div></RequireAuth>} />
                </Routes>
              </Content>
            </Layout>
          </Layout>
        </ProcessingProvider>
      </AntApp>
    </ConfigProvider>
  );
}

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AppShell />
      </ThemeProvider>
    </Router>
  );
}

export default App;

