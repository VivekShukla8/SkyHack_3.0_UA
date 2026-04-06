import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Table,
  Input,
  Select,
  DatePicker,
  Button,
  Tag,
  Typography,
  Row,
  Col,
  Statistic,
  Tooltip,
  Empty
} from 'antd';
import {
  SearchOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  EyeOutlined,
  UnorderedListOutlined,
  ThunderboltOutlined,
  FireOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

const FlightList = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [flights, setFlights] = useState([]);
  const [total, setTotal] = useState(0);
  const [dateReady, setDateReady] = useState(false);
  const [dataDateRange, setDataDateRange] = useState(null);
  const [filters, setFilters] = useState({
    date: '',
    category: undefined,
    carrier: undefined,
    origin: '',
    destination: '',
    search: ''
  });
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });

  useEffect(() => {
    const fetchDateRange = async () => {
      try {
        const response = await axios.get('/flights/date-range');
        if (response.data.hasData) {
          const maxDate = dayjs(response.data.maxDate);
          const minDate = dayjs(response.data.minDate);
          setDataDateRange({ minDate, maxDate });
          setFilters(prev => ({ ...prev, date: maxDate.format('YYYY-MM-DD') }));
        } else {
          setFilters(prev => ({ ...prev, date: dayjs().format('YYYY-MM-DD') }));
        }
      } catch (error) {
        setFilters(prev => ({ ...prev, date: dayjs().format('YYYY-MM-DD') }));
      }
      setDateReady(true);
    };
    fetchDateRange();
  }, []);

  const fetchFlights = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        ...filters,
        limit: pagination.pageSize,
        offset: (pagination.current - 1) * pagination.pageSize,
        sortBy: 'difficulty_score',
        sortOrder: 'desc'
      };
      const response = await axios.get('/flights', { params });
      setFlights(response.data.flights);
      setTotal(response.data.total);
      setPagination(prev => ({ ...prev, total: response.data.total }));
    } catch (error) {
      console.error('Error fetching flights:', error);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, pagination.current, pagination.pageSize]);

  useEffect(() => {
    if (!dateReady) return;
    fetchFlights();
  }, [fetchFlights, dateReady]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleTableChange = (pag) => setPagination(pag);

  const disabledDate = (current) => {
    if (!current || !dataDateRange) return false;
    return current.isBefore(dataDateRange.minDate, 'day') || current.isAfter(dataDateRange.maxDate, 'day');
  };

  const getDifficultyColor = (cat) => ({ Difficult: 'red', Medium: 'orange', Easy: 'green' }[cat] || 'default');
  const getDifficultyIcon = (cat) => ({
    Difficult: <ExclamationCircleOutlined />,
    Medium: <WarningOutlined />,
    Easy: <CheckCircleOutlined />,
  }[cat] || null);

  const columns = [
    {
      title: 'Flight',
      dataIndex: 'flight_number',
      key: 'flight_number',
      width: 120,
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>{text}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{record.carrier}</div>
        </div>
      ),
    },
    {
      title: 'Route',
      key: 'route',
      width: 150,
      render: (record) => (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
            {record.scheduled_departure_station_code}
            <span style={{ color: 'var(--text-muted)', margin: '0 4px' }}>→</span>
            {record.scheduled_arrival_station_code}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {dayjs(record.scheduled_departure_datetime_local).format('HH:mm')}
          </div>
        </div>
      ),
    },
    {
      title: 'Aircraft',
      key: 'aircraft',
      width: 120,
      render: (record) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{record.fleet_type}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{record.total_seats} seats</div>
        </div>
      ),
    },
    {
      title: 'Delay',
      dataIndex: 'departure_delay_minutes',
      key: 'delay',
      width: 80,
      render: (delay) => {
        if (!delay || delay <= 0) return <span style={{ color: '#26a69a', fontWeight: 600 }}>On time</span>;
        return (
          <span style={{ color: delay > 30 ? '#ef5350' : '#ffa726', fontWeight: 700, fontSize: 14 }}>
            +{delay}m
          </span>
        );
      },
    },
    {
      title: 'Load',
      dataIndex: 'load_factor',
      key: 'load_factor',
      width: 90,
      render: (lf) => {
        const pct = ((lf || 0) * 100).toFixed(1);
        const color = lf > 0.9 ? '#ef5350' : lf > 0.8 ? '#ffa726' : '#26a69a';
        return (
          <div style={{ position: 'relative' }}>
            <div style={{ fontWeight: 700, color, fontSize: 14 }}>{pct}%</div>
            <div style={{ height: 3, borderRadius: 2, background: 'var(--divider)', marginTop: 4 }}>
              <div style={{ height: '100%', borderRadius: 2, background: color, width: `${Math.min(pct, 100)}%`, transition: 'width 0.3s ease' }} />
            </div>
          </div>
        );
      },
    },
    {
      title: 'Ground Time',
      key: 'ground_time',
      width: 110,
      render: (record) => {
        const ratio = record.ground_time_ratio || 0;
        const color = ratio < 1.2 ? '#ef5350' : ratio < 1.5 ? '#ffa726' : '#26a69a';
        return (
          <div>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{record.scheduled_ground_time_minutes}m</div>
            <div style={{ fontSize: 12, color, fontWeight: 600 }}>{ratio.toFixed(2)}× min</div>
          </div>
        );
      },
    },
    {
      title: 'Score',
      dataIndex: 'difficulty_score',
      key: 'difficulty_score',
      width: 100,
      render: (score) => {
        const color = score > 70 ? '#ef5350' : score > 40 ? '#ffa726' : '#26a69a';
        return (
          <div style={{
            textAlign: 'center',
            background: `${color}12`,
            borderRadius: 8,
            padding: '6px 0',
          }}>
            <div style={{ fontSize: 20, fontWeight: 800, color }}>{score?.toFixed(1) || '—'}</div>
          </div>
        );
      },
    },
    {
      title: 'Category',
      dataIndex: 'difficulty_category',
      key: 'difficulty_category',
      width: 110,
      render: (cat) => <Tag color={getDifficultyColor(cat)} icon={getDifficultyIcon(cat)} style={{ fontWeight: 700 }}>{cat}</Tag>,
    },
    {
      title: 'Rank',
      dataIndex: 'difficulty_rank',
      key: 'difficulty_rank',
      width: 70,
      render: (rank) => (
        <span style={{ fontWeight: 800, fontSize: 15, color: rank <= 3 ? '#ef5350' : rank <= 10 ? '#ffa726' : '#7c8290' }}>
          #{rank}
        </span>
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 60,
      render: (record) => (
        <Tooltip title="View Details">
          <Button type="primary" icon={<EyeOutlined />} size="small" onClick={() => navigate(`/flights/${record._id}`)} />
        </Tooltip>
      ),
    },
  ];

  const categoryStats = flights.reduce((acc, f) => {
    const cat = f.difficulty_category || 'Unknown';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <Title level={2}><UnorderedListOutlined style={{ marginRight: 10, color: '#2b7abf' }} />Flight Difficulty List</Title>
        {dataDateRange && (
          <Text type="secondary" style={{ fontSize: 12 }}>
            Data: {dataDateRange.minDate.format('DD/MM/YYYY')} — {dataDateRange.maxDate.format('DD/MM/YYYY')}
          </Text>
        )}
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: 20 }} className="filter-section">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <DatePicker
              value={filters.date ? dayjs(filters.date) : null}
              onChange={(date) => date && handleFilterChange('date', date.format('YYYY-MM-DD'))}
              style={{ width: '100%' }}
              placeholder="Select Date"
              format="DD/MM/YYYY"
              disabledDate={disabledDate}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select value={filters.category} onChange={(v) => handleFilterChange('category', v)} style={{ width: '100%' }} placeholder="Difficulty Category" allowClear>
              <Option value="Difficult">🔴 Difficult</Option>
              <Option value="Medium">🟡 Medium</Option>
              <Option value="Easy">🟢 Easy</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select value={filters.carrier} onChange={(v) => handleFilterChange('carrier', v)} style={{ width: '100%' }} placeholder="Carrier" allowClear>
              <Option value="Mainline">✈️ Mainline</Option>
              <Option value="Express">🛩️ Express</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Input placeholder="Search flights..." value={filters.search} onChange={(e) => handleFilterChange('search', e.target.value)} prefix={<SearchOutlined style={{ color: 'var(--text-muted)' }} />} />
          </Col>
        </Row>
      </Card>

      {/* Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={8}>
          <Card className="stat-card-primary dashboard-card">
            <Statistic title="Total Flights" value={total} prefix={<UnorderedListOutlined />} valueStyle={{ fontWeight: 800, color: 'var(--accent-blue)' }} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="stat-card-delay dashboard-card">
            <Statistic title="Difficult Flights" value={categoryStats.Difficult || 0} prefix={<FireOutlined />} valueStyle={{ color: '#ef5350', fontWeight: 800 }} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="stat-card-violet dashboard-card">
            <Statistic
              title="Avg Score"
              value={flights.length > 0 ? flights.reduce((s, f) => s + (f.difficulty_score || 0), 0) / flights.length : 0}
              precision={1}
              prefix={<ThunderboltOutlined />}
              valueStyle={{ color: '#7c4dff', fontWeight: 800 }}
            />
          </Card>
        </Col>
      </Row>

      {/* Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={flights}
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} flights`,
          }}
          onChange={handleTableChange}
          rowKey="_id"
          scroll={{ x: 1100 }}
          locale={{ emptyText: <Empty description="No flights found for this date" /> }}
        />
      </Card>
    </div>
  );
};

export default FlightList;
