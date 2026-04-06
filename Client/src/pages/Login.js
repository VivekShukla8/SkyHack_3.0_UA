import React, { useState } from 'react';
import { Card, Form, Input, Button, Typography, App as AntApp } from 'antd';
import axios from '../api/axios';
import { useAuth } from '../auth/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';

const { Title, Text } = Typography;

export default function Login() {
  const { message } = AntApp.useApp();
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  // Redirect back to the page that triggered the auth guard
  const from = location.state?.from?.pathname || '/dashboard';

  const onFinish = async (values) => {
    try {
      setLoading(true);
      const res = await axios.post('/auth/login', values);
      login(res.data.token, res.data.user);
      message.success('Logged in successfully');
      navigate(from, { replace: true });
    } catch (err) {
      message.error(err?.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
      <Card style={{ maxWidth: 400, width: '100%' }}>
        <Title level={3} style={{ textAlign: 'center' }}>Sign in</Title>
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
            <Input placeholder="you@example.com" />
          </Form.Item>
          <Form.Item name="password" label="Password" rules={[{ required: true }]}>
            <Input.Password placeholder="Your password" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              Login
            </Button>
          </Form.Item>
        </Form>
        <Text type="secondary">
          New user? <Link to="/register">Sign up</Link>
        </Text>
      </Card>
    </div>
  );
}

