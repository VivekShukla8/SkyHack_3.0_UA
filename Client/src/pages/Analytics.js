import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  DatePicker,
  Table,
  Tag,
  Statistic,
  Spin,
  List,
  Progress,
  Button,
  Empty
} from 'antd';
import {
  LeftOutlined,
  RightOutlined,
  LineChartOutlined,
  ClockCircleOutlined,
  InboxOutlined,
  StarOutlined
} from '@ant-design/icons';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Legend
} from 'recharts';
import axios from '../api/axios';
import dayjs from 'dayjs';
import { useTheme } from '../context/ThemeContext';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const CHART_COLORS = {
  primary: '#1a4371',
  secondary: '#2b7abf',
  danger: '#ef5350',
  warning: '#ffa726',
  success: '#26a69a',
  violet: '#7c4dff',
  cyan: '#00bcd4',
  rose: '#f06292',
};

const Analytics = () => {
  const { isDark } = useTheme();
  const chartTextColor = isDark ? '#64748b' : '#7c8290';
  const chartGridColor = isDark ? '#1e293b' : '#e8ebf0';
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState(null);
  const [dataDateRange, setDataDateRange] = useState(null);
  const [edaData, setEdaData] = useState({});
  const [destinations, setDestinations] = useState([]);
  const [insights, setInsights] = useState({});
  const [trends, setTrends] = useState([]);

  useEffect(() => {
    const fetchDateRange = async () => {
      try {
        const response = await axios.get('/flights/date-range');
        if (response.data.hasData) {
          const minDate = dayjs(response.data.minDate);
          const maxDate = dayjs(response.data.maxDate);
          setDataDateRange({ minDate, maxDate });
          const rangeStart = maxDate.subtract(6, 'day').isAfter(minDate) ? maxDate.subtract(6, 'day') : minDate;
          setDateRange([rangeStart, maxDate]);
        } else {
          setDateRange([dayjs().subtract(6, 'day'), dayjs()]);
        }
      } catch (error) {
        setDateRange([dayjs().subtract(6, 'day'), dayjs()]);
      }
    };
    fetchDateRange();
  }, []);

  const handleDateRangeChange = (dates) => {
    if (dates && dates[0] && dates[1]) setDateRange(dates);
  };

  const navigateDateRange = (direction) => {
    if (!dateRange) return;
    const daysDiff = dateRange[1].diff(dateRange[0], 'day');
    const offset = daysDiff + 1;
    if (direction === 'prev') {
      setDateRange([dateRange[0].subtract(offset, 'day'), dateRange[1].subtract(offset, 'day')]);
    } else {
      setDateRange([dateRange[0].add(offset, 'day'), dateRange[1].add(offset, 'day')]);
    }
  };

  const disabledDate = (current) => {
    if (!current || !dataDateRange) return false;
    return current.isBefore(dataDateRange.minDate, 'day') || current.isAfter(dataDateRange.maxDate, 'day');
  };

  const getPresets = () => {
    if (!dataDateRange) return [];
    const { minDate, maxDate } = dataDateRange;
    return [
      { label: 'Full Data Range', value: [minDate, maxDate] },
      { label: 'Last 7 Days', value: [maxDate.subtract(6, 'day').isAfter(minDate) ? maxDate.subtract(6, 'day') : minDate, maxDate] },
      { label: 'Last 14 Days', value: [maxDate.subtract(13, 'day').isAfter(minDate) ? maxDate.subtract(13, 'day') : minDate, maxDate] },
      { label: 'First Week', value: [minDate, minDate.add(6, 'day').isBefore(maxDate) ? minDate.add(6, 'day') : maxDate] },
    ];
  };

  const fetchAnalyticsData = useCallback(async () => {
    if (!dateRange) return;
    try {
      setLoading(true);
      const s = dateRange[0].format('YYYY-MM-DD'), e = dateRange[1].format('YYYY-MM-DD');
      const [edaRes, destRes, insRes, trendsRes] = await Promise.all([
        axios.get(`/analytics/eda?startDate=${s}&endDate=${e}`),
        axios.get(`/analytics/destinations?startDate=${s}&endDate=${e}`),
        axios.get(`/analytics/insights?startDate=${s}&endDate=${e}`),
        axios.get(`/analytics/trends?startDate=${s}&endDate=${e}`)
      ]);
      setEdaData(edaRes.data);
      setDestinations(destRes.data);
      setInsights(insRes.data);
      setTrends(trendsRes.data);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => { fetchAnalyticsData(); }, [fetchAnalyticsData]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: isDark ? '#1e293b' : 'rgba(15,36,64,0.92)', padding: '12px 16px', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
          <div style={{ color: '#8ec5f2', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>{dayjs(label).format('MMM DD, YYYY')}</div>
          {payload.map((item, i) => (
            <div key={i} style={{ color: item.color, fontSize: 13, fontWeight: 500, marginTop: 2 }}>
              {item.name}: {typeof item.value === 'number' ? item.value.toFixed(2) : item.value}
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const destinationColumns = [
    {
      title: 'Destination',
      dataIndex: '_id',
      key: 'destination',
      render: (text) => <Tag color="blue" style={{ fontWeight: 700 }}>{text}</Tag>,
    },
    {
      title: 'Flights',
      dataIndex: 'totalFlights',
      key: 'totalFlights',
      sorter: (a, b) => a.totalFlights - b.totalFlights,
      render: (v) => <span style={{ fontWeight: 600 }}>{v}</span>,
    },
    {
      title: 'Avg Score',
      dataIndex: 'avgDifficultyScore',
      key: 'avgDifficultyScore',
      render: (score) => (
        <span style={{ color: score > 70 ? '#ef5350' : score > 40 ? '#ffa726' : '#26a69a', fontWeight: 700, fontSize: 15 }}>
          {score?.toFixed(1) || 'N/A'}
        </span>
      ),
      sorter: (a, b) => a.avgDifficultyScore - b.avgDifficultyScore,
    },
    {
      title: 'Avg Delay',
      dataIndex: 'avgDelay',
      key: 'avgDelay',
      render: (delay) => (
        <span style={{ color: delay > 30 ? '#ef5350' : delay > 15 ? '#ffa726' : '#26a69a', fontWeight: 600 }}>
          {delay?.toFixed(1) || '0'} min
        </span>
      ),
      sorter: (a, b) => a.avgDelay - b.avgDelay,
    },
    {
      title: 'Difficulty Rate',
      dataIndex: 'difficultyRate',
      key: 'difficultyRate',
      render: (rate) => (
        <Progress
          percent={(rate * 100).toFixed(1)}
          size="small"
          strokeColor={rate > 0.3 ? '#ef5350' : rate > 0.2 ? '#ffa726' : '#26a69a'}
          trailColor="#e8ebf0"
        />
      ),
      sorter: (a, b) => a.difficultyRate - b.difficultyRate,
    },
    {
      title: 'Load Factor',
      dataIndex: 'avgLoadFactor',
      key: 'avgLoadFactor',
      render: (load) => (
        <span style={{ color: load > 0.9 ? '#ef5350' : load > 0.8 ? '#ffa726' : '#26a69a', fontWeight: 600 }}>
          {((load || 0) * 100).toFixed(1)}%
        </span>
      ),
      sorter: (a, b) => a.avgLoadFactor - b.avgLoadFactor,
    },
  ];

  const timePatternData = insights.timePatterns?.map(item => ({
    hour: `${String(item._id).padStart(2, '0')}:00`,
    difficultyRate: parseFloat((item.difficultyRate * 100).toFixed(1)),
    avgScore: parseFloat(item.avgDifficultyScore?.toFixed(1) || 0),
    flightCount: item.flightCount
  })) || [];

  if (!dateRange) return <div className="loading-container"><Spin size="large" /></div>;

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <Title level={2}><LineChartOutlined style={{ marginRight: 10, color: 'var(--accent-blue)' }} />Analytics & Insights</Title>
        <div className="date-controls">
          <Button icon={<LeftOutlined />} onClick={() => navigateDateRange('prev')} disabled={loading} type="text" />
          <RangePicker
            value={dateRange}
            onChange={handleDateRangeChange}
            style={{ width: 280 }}
            allowClear={false}
            format="DD/MM/YYYY"
            presets={getPresets()}
            disabledDate={disabledDate}
            showTime={false}
            inputReadOnly
          />
          <Button icon={<RightOutlined />} onClick={() => navigateDateRange('next')} disabled={loading} type="text" />
          {dataDateRange && (
            <Text type="secondary" style={{ fontSize: 12, marginLeft: 'auto' }}>
              Data: {dataDateRange.minDate.format('DD/MM/YYYY')} — {dataDateRange.maxDate.format('DD/MM/YYYY')}
            </Text>
          )}
        </div>
      </div>

      <Spin spinning={loading}>
        {/* Summary Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={6}>
            <Card className="stat-card-delay dashboard-card">
              <Statistic title="Average Delay" value={edaData.delayAnalysis?.averageDelay || 0} suffix="min" precision={1} valueStyle={{ color: '#ef5350', fontWeight: 800 }} prefix={<ClockCircleOutlined />} />
              <div className="metric-sub">{edaData.delayAnalysis?.delayedFlights || 0} of {edaData.delayAnalysis?.totalFlights || 0} delayed</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="stat-card-warning dashboard-card">
              <Statistic title="Ground Time Ratio" value={edaData.groundTimeAnalysis?.avgGroundTimeRatio || 0} precision={2} valueStyle={{ color: '#ffa726', fontWeight: 800 }} />
              <div className="metric-sub">{edaData.groundTimeAnalysis?.flightsBelowMinTurn || 0} below min turn</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="stat-card-success dashboard-card">
              <Statistic title="Bags per Flight" value={edaData.bagAnalysis?.avgBagsPerFlight || 0} precision={1} valueStyle={{ color: '#26a69a', fontWeight: 800 }} prefix={<InboxOutlined />} />
              <div className="metric-sub">Transfer: {((edaData.bagAnalysis?.avgTransferRatio || 0) * 100).toFixed(1)}%</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="stat-card-info dashboard-card">
              <Statistic title="Special Requests" value={edaData.specialServiceAnalysis?.avgSpecialRequestsPerFlight || 0} precision={1} valueStyle={{ color: '#42a5f5', fontWeight: 800 }} prefix={<StarOutlined />} />
              <div className="metric-sub">{edaData.specialServiceAnalysis?.totalWheelchairRequests || 0} wheelchairs</div>
            </Card>
          </Col>
        </Row>

        {/* Charts */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} lg={14}>
            <Card title="📈 Difficulty Trends Over Time" className="chart-container">
              {trends.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <AreaChart data={trends}>
                    <defs>
                      <linearGradient id="gradTrendScore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={CHART_COLORS.primary} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={CHART_COLORS.primary} stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="gradTrendRate" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={CHART_COLORS.danger} stopOpacity={0.25} />
                        <stop offset="100%" stopColor={CHART_COLORS.danger} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
                    <XAxis dataKey="date" tickFormatter={(v) => dayjs(v).format('MM/DD')} tick={{ fill: chartTextColor, fontSize: 12 }} />
                    <YAxis tick={{ fill: chartTextColor, fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ paddingTop: 12 }} />
                    <Area type="monotone" dataKey="avgDifficultyScore" stroke={CHART_COLORS.primary} strokeWidth={2.5} fill="url(#gradTrendScore)" name="Avg Difficulty Score" dot={{ r: 4, fill: CHART_COLORS.primary, stroke: '#fff', strokeWidth: 2 }} />
                    <Area type="monotone" dataKey="difficultyRate" stroke={CHART_COLORS.danger} strokeWidth={2.5} fill="url(#gradTrendRate)" name="Difficulty Rate" dot={{ r: 4, fill: CHART_COLORS.danger, stroke: '#fff', strokeWidth: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <Empty description="No trend data" style={{ padding: 60 }} />
              )}
            </Card>
          </Col>
          <Col xs={24} lg={10}>
            <Card title="🕐 Difficulty by Hour" className="chart-container">
              {timePatternData.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={timePatternData}>
                    <defs>
                      <linearGradient id="gradBar" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={CHART_COLORS.violet} stopOpacity={0.9} />
                        <stop offset="100%" stopColor={CHART_COLORS.cyan} stopOpacity={0.7} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
                    <XAxis dataKey="hour" tick={{ fill: chartTextColor, fontSize: 11 }} />
                    <YAxis tick={{ fill: chartTextColor, fontSize: 12 }} />
                    <Tooltip contentStyle={{ background: isDark ? '#1e293b' : 'rgba(15,36,64,0.92)', border: 'none', borderRadius: 10, color: '#fff' }} />
                    <Bar dataKey="difficultyRate" fill="url(#gradBar)" name="Difficulty Rate (%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Empty description="No hourly data" style={{ padding: 60 }} />
              )}
            </Card>
          </Col>
        </Row>

        {/* Destination Table */}
        <Card title="🌍 Destination Difficulty Analysis" style={{ marginBottom: 24 }}>
          <Table dataSource={destinations} columns={destinationColumns} pagination={{ pageSize: 10 }} rowKey="_id" scroll={{ x: 800 }} />
        </Card>

        {/* Insights */}
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card title="⚙️ Common Difficulty Drivers" className="stat-card-primary">
              <List
                dataSource={[
                  { label: 'Average Delay', value: `${insights.difficultyDrivers?.avgDelay?.toFixed(1) || 0} min`, color: '#ef5350' },
                  { label: 'Load Factor', value: `${((insights.difficultyDrivers?.avgLoadFactor || 0) * 100).toFixed(1)}%`, color: '#ffa726' },
                  { label: 'Ground Time Ratio', value: `${insights.difficultyDrivers?.avgGroundTimeRatio?.toFixed(2) || 0}`, color: '#42a5f5' },
                  { label: 'Special Requests', value: `${insights.difficultyDrivers?.avgSpecialRequests?.toFixed(1) || 0} / flight`, color: '#7c4dff' },
                  { label: 'Average Bags', value: `${insights.difficultyDrivers?.avgBags?.toFixed(1) || 0} / flight`, color: '#26a69a' },
                ]}
                renderItem={item => (
                  <List.Item>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                      <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{item.label}</span>
                      <span style={{ fontWeight: 700, fontSize: 15, color: item.color }}>{item.value}</span>
                    </div>
                  </List.Item>
                )}
              />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="💡 Recommendations">
              {insights.recommendations?.length > 0 ? (
                <List
                  dataSource={insights.recommendations}
                  renderItem={item => (
                    <List.Item className={`recommendation-item recommendation-${item.priority?.toLowerCase()}`}>
                      <div>
                        <div style={{ fontWeight: 700, marginBottom: 4, color: 'var(--text-primary)' }}>{item.title}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>{item.description}</div>
                        <div>
                          <Text strong style={{ fontSize: 12 }}>Actions:</Text>
                            <ul style={{ margin: '4px 0 0 16px', fontSize: 12, color: 'var(--text-secondary)' }}>
                            {item.actions?.map((action, i) => <li key={i}>{action}</li>)}
                          </ul>
                        </div>
                      </div>
                    </List.Item>
                  )}
                />
              ) : (
                <Empty description="No recommendations for selected range" />
              )}
            </Card>
          </Col>
        </Row>
      </Spin>
    </div>
  );
};

export default Analytics;
