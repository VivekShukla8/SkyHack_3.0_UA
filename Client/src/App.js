import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout, ConfigProvider, App as AntApp } from 'antd';
import 'antd/dist/reset.css';
import './App.css';

// Context
import { ProcessingProvider } from './context/ProcessingContext';
import { ThemeProvider } from './context/ThemeContext';

// Components
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import FlightList from './pages/FlightList';
import Analytics from './pages/Analytics';
import DataUpload from './pages/DataUpload';
import StoredData from './pages/StoredData';
import FlightDetails from './pages/FlightDetails';
import Login from './pages/Login';
import Register from './pages/Register';

const { Content } = Layout;

function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#3b82f6',
          colorSuccess: '#10b981',
          colorWarning: '#f59e0b',
          colorError: '#ef4444',
        },
      }}
    >
      <AntApp>
        <Router>
          <ThemeProvider>
            <ProcessingProvider>
              <Layout style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
                <Navbar />
                <Layout style={{ background: 'var(--bg-page)' }}>
                  <Content style={{ padding: '24px', background: 'var(--bg-page)', marginTop: 56 }}>
                        <Routes>
                          <Route path="/" element={<Dashboard />} />
                          <Route path="/flights" element={<FlightList />} />
                          <Route path="/flights/:id" element={<FlightDetails />} />
                          <Route path="/analytics" element={<Analytics />} />
                          <Route path="/upload" element={<DataUpload />} />
                          <Route path="/stored-data" element={<StoredData />} />
                          <Route path="/login" element={<Login />} />
                          <Route path="/register" element={<Register />} />
                        </Routes>
                  </Content>
                </Layout>
              </Layout>
            </ProcessingProvider>
          </ThemeProvider>
        </Router>
      </AntApp>
    </ConfigProvider>
  );
}

export default App;
