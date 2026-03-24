import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Tag,
  Statistic,
  Progress,
  Divider,
  Spin,
  Alert,
  Timeline,
  Descriptions,
  Space,
  Button
} from 'antd';
import {
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  ClockCircleOutlined,
  UserOutlined,
  ShoppingCartOutlined,
  CarOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';
import axios from '../api/axios';
import moment from 'moment';

const { Title, Text } = Typography;

const FlightDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [flight, setFlight] = useState(null);
  const [details, setDetails] = useState(null);

  useEffect(() => {
    fetchFlightDetails();
  }, [id]);

  const fetchFlightDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/flights/${id}/difficulty-details`);
      setFlight(response.data.flight);
      setDetails(response.data.breakdown);
    } catch (error) {
      console.error('Error fetching flight details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (category) => {
    switch (category) {
      case 'Difficult': return '#ff4d4f';
      case 'Medium': return '#faad14';
      case 'Easy': return '#52c41a';
      default: return '#d9d9d9';
    }
  };

  const getDifficultyIcon = (category) => {
    switch (category) {
      case 'Difficult': return <ExclamationCircleOutlined />;
      case 'Medium': return <WarningOutlined />;
      case 'Easy': return <CheckCircleOutlined />;
      default: return null;
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#ff4d4f';
    if (score >= 60) return '#faad14';
    if (score >= 40) return '#1890ff';
    return '#52c41a';
  };

  const radarData = details ? [
    { subject: 'Delay', A: details.delay.score, fullMark: 100 },
    { subject: 'Ground Time', A: details.groundTime.score, fullMark: 100 },
    { subject: 'Passenger Load', A: details.passengerLoad.score, fullMark: 100 },
    { subject: 'Special Services', A: details.specialServices.score, fullMark: 100 },
    { subject: 'Bag Complexity', A: details.bagComplexity.score, fullMark: 100 },
    { subject: 'Aircraft Type', A: details.aircraftType.score, fullMark: 100 },
  ] : [];

  if (loading) {
    return (
      <div className="loading-container">
        <Spin size="large" />
      </div>
    );
  }

  if (!flight || !details) {
    return (
      <Alert
        message="Flight Not Found"
        description="The requested flight could not be found."
        type="error"
        showIcon
      />
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <Space>
          <Button onClick={() => navigate('/flights')}>
            ← Back to Flights
          </Button>
        </Space>
      </div>

      {/* Flight Header */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={[24, 24]}>
          <Col xs={24} md={8}>
            <div style={{ textAlign: 'center' }}>
              <Title level={2} style={{ margin: 0 }}>
                {flight.flight_number}
              </Title>
              <Text type="secondary">{flight.carrier}</Text>
            </div>
          </Col>
          <Col xs={24} md={8}>
            <div style={{ textAlign: 'center' }}>
              <Title level={3} style={{ margin: 0, color: 'var(--text-primary)' }}>
                {flight.scheduled_departure_station_code} → {flight.scheduled_arrival_station_code}
              </Title>
              <Text type="secondary">
                {moment(flight.scheduled_departure_datetime_local).format('MMM DD, YYYY HH:mm')}
              </Text>
            </div>
          </Col>
          <Col xs={24} md={8}>
            <div style={{ textAlign: 'center' }}>
              <Tag
                color={getDifficultyColor(flight.difficulty_category)}
                icon={getDifficultyIcon(flight.difficulty_category)}
                style={{ fontSize: '16px', padding: '8px 16px' }}
              >
                {flight.difficulty_category}
              </Tag>
              <div style={{ marginTop: '8px' }}>
                <Text strong style={{ fontSize: '24px', color: getScoreColor(flight.difficulty_score) }}>
                  {flight.difficulty_score?.toFixed(1) || 'N/A'}
                </Text>
                <Text type="secondary" style={{ marginLeft: '8px' }}>
                  Rank #{flight.difficulty_rank}
                </Text>
              </div>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Key Metrics */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Departure Delay"
              value={flight.departure_delay_minutes || 0}
              suffix="min"
              prefix={<ClockCircleOutlined />}
              valueStyle={{
                color: flight.departure_delay_minutes > 30 ? '#ff4d4f' :
                  flight.departure_delay_minutes > 0 ? '#faad14' : '#52c41a'
              }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Load Factor"
              value={((flight.load_factor || 0) * 100).toFixed(1)}
              suffix="%"
              prefix={<UserOutlined />}
              valueStyle={{
                color: flight.load_factor > 0.9 ? '#ff4d4f' :
                  flight.load_factor > 0.8 ? '#faad14' : '#52c41a'
              }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Ground Time Ratio"
              value={flight.ground_time_ratio?.toFixed(2) || 0}
              prefix={<CarOutlined />}
              valueStyle={{
                color: flight.ground_time_ratio < 1.2 ? '#ff4d4f' :
                  flight.ground_time_ratio < 1.5 ? '#faad14' : '#52c41a'
              }}
            />
          </Card>
        </Col>
      </Row>

      {/* Difficulty Breakdown */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} lg={12}>
          <Card title="Difficulty Score Breakdown" className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar
                  name="Score"
                  dataKey="A"
                  stroke="#1f4e79"
                  fill="#1f4e79"
                  fillOpacity={0.3}
                />
              </RadarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Score Components">
            <div className="score-breakdown">
              {details && Object.entries(details).map(([key, component]) => (
                <div key={key} className="score-item">
                  <div>
                    <Text strong>{component.subject || key}</Text>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {component.details && Object.entries(component.details).map(([k, v]) => (
                        <span key={k}>{k}: {v} </span>
                      ))}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      fontSize: '18px',
                      fontWeight: 'bold',
                      color: getScoreColor(component.score)
                    }}>
                      {component.score}
                    </div>
                    <div className="score-bar">
                      <div
                        className="score-fill"
                        style={{
                          width: `${component.score}%`,
                          backgroundColor: getScoreColor(component.score)
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Flight Details */}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title="Flight Information">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Aircraft">
                {flight.fleet_type} ({flight.total_seats} seats)
              </Descriptions.Item>
              <Descriptions.Item label="Scheduled Departure">
                {moment(flight.scheduled_departure_datetime_local).format('MMM DD, YYYY HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="Scheduled Arrival">
                {moment(flight.scheduled_arrival_datetime_local).format('MMM DD, YYYY HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="Ground Time">
                {flight.scheduled_ground_time_minutes} min (Min: {flight.minimum_turn_minutes} min)
              </Descriptions.Item>
              <Descriptions.Item label="Passengers">
                {flight.total_passengers} / {flight.total_seats}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Operational Metrics">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Special Service Requests">
                {flight.special_service_requests || 0}
              </Descriptions.Item>
              <Descriptions.Item label="Wheelchair Requests">
                {flight.wheelchair_requests || 0}
              </Descriptions.Item>
              <Descriptions.Item label="Unaccompanied Minors">
                {flight.unaccompanied_minors || 0}
              </Descriptions.Item>
              <Descriptions.Item label="Total Bags">
                {flight.total_bags || 0}
              </Descriptions.Item>
              <Descriptions.Item label="Transfer Bags">
                {flight.transfer_bags || 0}
              </Descriptions.Item>
              <Descriptions.Item label="Hot Transfer Bags">
                {flight.hot_transfer_bags || 0}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default FlightDetails;
