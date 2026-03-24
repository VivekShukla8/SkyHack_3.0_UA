import React, { useState } from 'react';
import { Card, Form, Input, Button, Typography, App as AntApp } from 'antd';
import axios from '../api/axios';
import { useAuth } from '../auth/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const { Title, Text } = Typography;

export default function Register() {
  const { message } = AntApp.useApp();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    try {
      setLoading(true);
      const res = await axios.post('/auth/register', values);
      login(res.data.token, res.data.user);
      message.success('Registered and logged in');
      navigate('/');
    } catch (err) {
      message.error(err?.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
      <Card style={{ maxWidth: 400, width: '100%' }}>
        <Title level={3} style={{ textAlign: 'center' }}>Register</Title>
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
            <Input placeholder="you@example.com" />
          </Form.Item>
          <Form.Item name="password" label="Password" rules={[{ required: true, min: 6 }]}>
            <Input.Password placeholder="Choose a password" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              Register
            </Button>
          </Form.Item>
        </Form>
        <Text type="secondary">Already have an account? <Link to="/login">Sign in</Link></Text>
      </Card>
    </div>
  );
}
