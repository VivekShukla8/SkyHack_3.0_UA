import React, { useState, useEffect, useCallback } from 'react';
import { Card, Row, Col, Statistic, Typography, Spin, Empty, Button, DatePicker } from 'antd';
import {
  ClockCircleOutlined, ExclamationCircleOutlined,
  ThunderboltOutlined, FieldTimeOutlined, LeftOutlined, RightOutlined
} from '@ant-design/icons';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, BarChart, Bar
} from 'recharts';
import axios from '../api/axios';
import dayjs from 'dayjs';
import { useTheme } from '../context/ThemeContext';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const PIE_COLORS = { Difficult: '#ef4444', Medium: '#f59e0b', Easy: '#10b981' };

const Dashboard = () => {
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [dataDateRange, setDataDateRange] = useState(null);
  const [dashboardData, setDashboardData] = useState({});
  const [dailySummary, setDailySummary] = useState({});
  const [trends, setTrends] = useState([]);
  const [topDifficultFlights, setTopDifficultFlights] = useState([]);

  useEffect(() => {
    const fetchDateRange = async () => {
      try {
        const res = await axios.get('/flights/date-range');
        if (res.data.hasData) {
          const min = dayjs(res.data.minDate), max = dayjs(res.data.maxDate);
          setDataDateRange({ minDate: min, maxDate: max });
          const rangeStart = max.subtract(6, 'day').isAfter(min) ? max.subtract(6, 'day') : min;
          setDateRange([rangeStart, max]);
          setSelectedDate(max.format('YYYY-MM-DD'));
        } else {
          setDateRange([dayjs().subtract(6, 'day'), dayjs()]);
          setSelectedDate(dayjs().format('YYYY-MM-DD'));
        }
      } catch { setDateRange([dayjs().subtract(6, 'day'), dayjs()]); setSelectedDate(dayjs().format('YYYY-MM-DD')); }
    };
    fetchDateRange();
  }, []);

  const fetchDashboardData = useCallback(async () => {
    if (!dateRange || !selectedDate) return;
    try {
      setLoading(true);
      const [edaRes, summaryRes] = await Promise.all([
        axios.get(`/analytics/eda?startDate=${dateRange[0].format('YYYY-MM-DD')}&endDate=${dateRange[1].format('YYYY-MM-DD')}`),
        axios.get(`/flights/daily/${selectedDate}/summary`)
      ]);
      setDashboardData(edaRes.data);
      setDailySummary(summaryRes.data);
      setTopDifficultFlights(summaryRes.data.topDifficultFlights || []);
    } catch (e) { console.error('Error:', e); }
    finally { setLoading(false); }
  }, [dateRange, selectedDate]);

  const fetchTrends = useCallback(async () => {
    if (!dateRange) return;
    try {
      const res = await axios.get(`/analytics/trends?startDate=${dateRange[0].format('YYYY-MM-DD')}&endDate=${dateRange[1].format('YYYY-MM-DD')}`);
      setTrends(res.data);
    } catch (e) { console.error('Error:', e); }
  }, [dateRange]);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);
  useEffect(() => { fetchTrends(); }, [fetchTrends]);

  const navigateWeek = (dir) => {
    if (!dateRange) return;
    const d = dateRange[1].diff(dateRange[0], 'day') + 1;
    setDateRange(dir === 'prev'
      ? [dateRange[0].subtract(d, 'day'), dateRange[1].subtract(d, 'day')]
      : [dateRange[0].add(d, 'day'), dateRange[1].add(d, 'day')]
    );
  };

  const handleDateRangeChange = (dates) => { if (dates) setDateRange(dates); };
  const handleSingleDateChange = (date) => { if (date) setSelectedDate(date.format('YYYY-MM-DD')); };
  const disabledDate = (current) => {
    if (!dataDateRange) return false;
    return current && (current < dataDateRange.minDate.startOf('day') || current > dataDateRange.maxDate.endOf('day'));
  };

  // Derived data
  const totalFlights = dashboardData.delayAnalysis?.totalFlights || 0;
  const delayedFlights = dashboardData.delayAnalysis?.delayedFlights || 0;
  const avgDelay = dashboardData.delayAnalysis?.averageDelay || 0;
  const delayRate = totalFlights > 0 ? ((delayedFlights / totalFlights) * 100).toFixed(1) : 0;
  const groundRatio = dashboardData.groundTimeAnalysis?.avgGroundTimeRatio || 0;
  const belowMinTurn = dashboardData.groundTimeAnalysis?.flightsBelowMinTurn || 0;
  const avgScore = dailySummary.summary?.averageDifficultyScore || 0;

  const pieData = dailySummary.categoryBreakdown?.map(item => ({
    name: item._id, value: item.count, color: PIE_COLORS[item._id] || '#94a3b8'
  })) || [];

  // Top delayed routes from topDifficultFlights
  const topRoutes = topDifficultFlights
    .filter(f => f.difficulty_score > 0)
    .slice(0, 4)
    .map(f => ({
      route: `${f.scheduled_departure_station_code}→${f.scheduled_arrival_station_code}`,
      score: f.difficulty_score
    }));

  // Score by day bars from trends
  const dayBars = trends.map(t => ({
    day: dayjs(t.date).format('DD'),
    score: t.avgDifficultyScore || 0,
    color: t.avgDifficultyScore > 40 ? '#ef4444' : t.avgDifficultyScore > 25 ? '#f59e0b' : '#10b981'
  }));

  const chartTextColor = isDark ? '#64748b' : '#94a3b8';
  const gridColor = isDark ? '#1e293b' : '#e2e8f0';

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: isDark ? 'rgba(0,0,0,0.9)' : 'rgba(15,23,42,0.92)', padding: '10px 14px', borderRadius: 8, border: 'none' }}>
        <div style={{ color: '#8ec5f2', fontSize: 11, fontWeight: 600, marginBottom: 4 }}>{dayjs(label).format('MMM DD')}</div>
        {payload.map((p, i) => (
          <div key={i} style={{ color: p.color, fontSize: 12, fontWeight: 500 }}>{p.name}: {p.value?.toFixed(1)}</div>
        ))}
      </div>
    );
  };

  if (!dateRange || loading) return <div className="loading-container"><Spin size="large" /></div>;

  // Difficulty category label
  const scoreLabel = avgScore > 50 ? 'High difficulty' : avgScore > 25 ? 'Medium difficulty' : 'Low difficulty';
  const scoreLabelClass = avgScore > 50 ? 'stat-tag-red' : avgScore > 25 ? 'stat-tag-blue' : 'stat-tag-green';

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <Title level={2} style={{ marginBottom: 0 }}>Flight Difficulty Dashboard</Title>
          {dataDateRange && (
            <div className="page-header-sub">
              Data: {dataDateRange.minDate.format('DD MMM YYYY')} — {dataDateRange.maxDate.format('DD MMM YYYY')}
            </div>
          )}
        </div>
        <div className="date-controls">
          <Button icon={<LeftOutlined />} onClick={() => navigateWeek('prev')} type="text" size="small" />
          <RangePicker
            value={dateRange}
            onChange={handleDateRangeChange}
            style={{ width: 260 }}
            allowClear={false}
            format="DD/MM/YYYY"
            disabledDate={disabledDate}
            inputReadOnly
          />
          <Button icon={<RightOutlined />} onClick={() => navigateWeek('next')} type="text" size="small" />
          <DatePicker
            value={selectedDate ? dayjs(selectedDate) : null}
            onChange={handleSingleDateChange}
            format="DD/MM/YYYY"
            disabledDate={disabledDate}
            allowClear={false}
            inputReadOnly
          />
          {dataDateRange && (
            <Text type="secondary" style={{ fontSize: 12, marginLeft: 'auto' }}>
              Data: {dataDateRange.minDate.format('DD/MM/YYYY')} — {dataDateRange.maxDate.format('DD/MM/YYYY')}
            </Text>
          )}
        </div>
      </div>

      {/* ── Stat Cards ─────────────────────────────────────── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={12} md={6}>
          <Card className="dashboard-card stat-card-delay">
            <div className="stat-icon-badge red"><ClockCircleOutlined /></div>
            <Statistic title="AVERAGE DELAY" value={avgDelay} suffix="min" precision={1} className="stat-val-red" />
            <div className="metric-sub">{delayedFlights} of {totalFlights} flights delayed</div>
            <div><span className="stat-tag stat-tag-red">↑ Above target</span></div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="dashboard-card stat-card-warning">
            <div className="stat-icon-badge amber"><ExclamationCircleOutlined /></div>
            <Statistic title="DELAYED FLIGHTS" value={delayedFlights} className="stat-val-amber" />
            <div className="metric-sub">of {totalFlights} total flights</div>
            <div><span className="stat-tag stat-tag-amber">{delayRate}% delay rate</span></div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="dashboard-card stat-card-success">
            <div className="stat-icon-badge green"><FieldTimeOutlined /></div>
            <Statistic title="GROUND TIME RATIO" value={groundRatio} precision={2} className="stat-val-green" />
            <div className="metric-sub">{belowMinTurn} below min turn</div>
            <div><span className="stat-tag stat-tag-green">Within threshold</span></div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="dashboard-card stat-card-primary">
            <div className="stat-icon-badge blue"><ThunderboltOutlined /></div>
            <Statistic title="AVG DIFFICULTY SCORE" value={avgScore} precision={1} className="stat-val-blue" />
            <div><span className={`stat-tag ${scoreLabelClass}`}>{scoreLabel}</span></div>
          </Card>
        </Col>
      </Row>

      {/* ── Charts Row ─────────────────────────────────────── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} lg={14}>
          <Card className="chart-container" title="Difficulty Score Trends">
            {trends.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={trends}>
                  <defs>
                    <linearGradient id="gradDelay" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity={0.01} />
                    </linearGradient>
                    <linearGradient id="gradScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="date" tickFormatter={v => dayjs(v).format('MM/DD')} tick={{ fill: chartTextColor, fontSize: 11 }} />
                  <YAxis tick={{ fill: chartTextColor, fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ paddingTop: 8, fontSize: 12 }} />
                  <Area type="monotone" dataKey="avgDelay" stroke="#ef4444" strokeWidth={2} fill="url(#gradDelay)" name="Avg Delay (min)" dot={{ r: 3.5, fill: '#ef4444', stroke: '#fff', strokeWidth: 2 }} />
                  <Area type="monotone" dataKey="avgDifficultyScore" stroke="#3b82f6" strokeWidth={2} fill="url(#gradScore)" name="Avg Difficulty Score" dot={{ r: 3.5, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : <Empty description="No trend data" style={{ padding: 40 }} />}
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card className="chart-container" title={`Distribution — ${dayjs(selectedDate).format('DD/MM')}`}>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={100} dataKey="value"
                    label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {pieData.map((e, i) => <Cell key={i} fill={e.color} stroke={isDark ? '#111827' : '#fff'} strokeWidth={3} />)}
                  </Pie>
                  <Legend formatter={(val) => <span style={{ color: 'var(--text-primary)', fontSize: 12, fontWeight: 600 }}>{val}</span>} />
                </PieChart>
              </ResponsiveContainer>
            ) : <Empty description="No flights for date" style={{ padding: 40 }} />}
          </Card>
        </Col>
      </Row>

      {/* ── Bottom Row — Routes, Score by Day, Fleet Status ── */}
      <Row gutter={[16, 16]}>
        {/* Top Delayed Routes */}
        <Col xs={24} md={8}>
          <Card className="chart-container" title="Top Delayed Routes">
            {topRoutes.length > 0 ? topRoutes.map((r, i) => {
              const maxScore = Math.max(...topRoutes.map(x => x.score));
              const pct = maxScore > 0 ? (r.score / maxScore * 100) : 0;
              return (
                <div key={i} className="route-bar-row">
                  <span className="route-bar-label">{r.route}</span>
                  <div className="route-bar-track">
                    <div className="route-bar-fill" style={{ width: `${pct}%`, background: r.score > 40 ? '#ef4444' : '#f59e0b' }} />
                  </div>
                  <span className="route-bar-value" style={{ color: r.score > 40 ? '#ef4444' : '#f59e0b' }}>+{r.score.toFixed(0)}</span>
                </div>
              );
            }) : <Empty description="No data" />}
          </Card>
        </Col>

        {/* Score by Day */}
        <Col xs={24} md={8}>
          <Card className="chart-container" title="Score Distribution by Day">
            {dayBars.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={dayBars}>
                  <XAxis dataKey="day" tick={{ fill: chartTextColor, fontSize: 11 }} />
                  <YAxis tick={{ fill: chartTextColor, fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: isDark ? '#1e293b' : '#fff', border: 'none', borderRadius: 8, color: 'var(--text-primary)' }} />
                  <Bar dataKey="score" radius={[4, 4, 0, 0]} name="Avg Score">
                    {dayBars.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <Empty description="No data" />}
          </Card>
        </Col>

        {/* Fleet Status */}
        <Col xs={24} md={8}>
          <Card className="chart-container" title="Fleet Status">
            <div className="fleet-row">
              <span className="fleet-label">On-Time</span>
              <div className="fleet-bar"><div className="fleet-bar-fill" style={{ width: `${totalFlights > 0 ? ((totalFlights - delayedFlights) / totalFlights * 100) : 0}%`, background: '#10b981' }} /></div>
              <span className="fleet-value" style={{ color: '#10b981' }}>{totalFlights - delayedFlights}</span>
            </div>
            <div className="fleet-row">
              <span className="fleet-label">Delayed</span>
              <div className="fleet-bar"><div className="fleet-bar-fill" style={{ width: `${totalFlights > 0 ? (delayedFlights / totalFlights * 100) : 0}%`, background: '#ef4444' }} /></div>
              <span className="fleet-value" style={{ color: '#ef4444' }}>{delayedFlights}</span>
            </div>
            <div className="fleet-row">
              <span className="fleet-label">Below Min Turn</span>
              <div className="fleet-bar"><div className="fleet-bar-fill" style={{ width: `${totalFlights > 0 ? (belowMinTurn / totalFlights * 100) : 0}%`, background: '#f59e0b' }} /></div>
              <span className="fleet-value" style={{ color: '#f59e0b' }}>{belowMinTurn}</span>
            </div>
            <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--divider)', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total Flights</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{totalFlights.toLocaleString()}</span>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
