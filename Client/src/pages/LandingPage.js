import React from 'react';
import './LandingPage.css';
import { Button, Typography, Row, Col, Card, Space } from 'antd';
import {
  ThunderboltOutlined, BarChartOutlined, CloudUploadOutlined,
  SafetyOutlined, RocketOutlined, TeamOutlined,
  DashboardOutlined, LineChartOutlined, DatabaseOutlined,
  CheckCircleOutlined, ArrowRightOutlined, StarFilled,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const { Title, Text, Paragraph } = Typography;

const FEATURES = [
  {
    icon: <ThunderboltOutlined />,
    title: 'Difficulty Scoring',
    desc: 'Our proprietary algorithm evaluates 6 weighted factors — delays, ground time, passenger load, special services, baggage complexity, and aircraft type — to produce a single actionable difficulty score for every flight.',
    color: '#3b82f6',
  },
  {
    icon: <BarChartOutlined />,
    title: 'Real-Time Analytics',
    desc: 'Interactive dashboards with trend analysis, destination breakdowns, hourly difficulty patterns, and data-driven recommendations so operations teams can allocate resources proactively.',
    color: '#f59e0b',
  },
  {
    icon: <CloudUploadOutlined />,
    title: 'Bulk Data Pipeline',
    desc: 'Upload CSV files for flights, PNR records, PNR remarks, baggage, and airports. Our processing engine normalizes, validates, and inserts millions of rows in minutes.',
    color: '#10b981',
  },
  {
    icon: <SafetyOutlined />,
    title: 'User-Scoped Security',
    desc: 'Every dataset is isolated by user account. JWT-based authentication and per-query userId filtering ensure you never see another team\'s data.',
    color: '#8b5cf6',
  },
  {
    icon: <RocketOutlined />,
    title: 'Actionable Insights',
    desc: 'Automated recommendations identify peak difficulty hours, problematic destinations, low ground-time ratios, and high-load patterns — with concrete action items.',
    color: '#ef4444',
  },
  {
    icon: <TeamOutlined />,
    title: 'Multi-User Collaboration',
    desc: 'Multiple analysts can sign up, upload independent datasets, and view personalized analytics without interference — ideal for regional teams or competitive benchmarking.',
    color: '#06b6d4',
  },
];

const SCORE_FACTORS = [
  { label: 'Departure Delay', weight: '25%', color: '#ef4444', desc: 'Minutes of actual vs scheduled departure delay' },
  { label: 'Ground Time', weight: '20%', color: '#f59e0b', desc: 'Scheduled ground time vs minimum turn time ratio' },
  { label: 'Passenger Load', weight: '15%', color: '#3b82f6', desc: 'Load factor — passengers vs total seats' },
  { label: 'Special Services', weight: '15%', color: '#8b5cf6', desc: 'Wheelchair, unaccompanied minor, and SSR requests' },
  { label: 'Bag Complexity', weight: '15%', color: '#10b981', desc: 'Transfer bags, hot transfers, bags-per-passenger ratio' },
  { label: 'Aircraft Type', weight: '10%', color: '#06b6d4', desc: 'Fleet complexity and carrier type adjustment' },
];

const WORKFLOW_STEPS = [
  { num: '01', title: 'Upload Your Data', desc: 'Import CSV files — airports, flights, PNR, remarks, and baggage — in the recommended order.', icon: <CloudUploadOutlined /> },
  { num: '02', title: 'Process & Validate', desc: 'Our engine normalizes headers, maps aliases, validates types, and inserts into MongoDB collections.', icon: <DatabaseOutlined /> },
  { num: '03', title: 'Explore Dashboard', desc: 'View daily summaries, difficulty distributions, fleet status, and top delayed routes at a glance.', icon: <DashboardOutlined /> },
  { num: '04', title: 'Dive Into Analytics', desc: 'Trend analysis, destination breakdowns, hourly patterns, and AI-generated recommendations.', icon: <LineChartOutlined /> },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <div className="landing-page">

      {/* ─── HERO ─────────────────────────────────────────────── */}
      <section className="landing-hero">
        <div className="landing-hero-overlay" />
        <div className="landing-hero-content">
          <div className="landing-hero-badge">
            <StarFilled style={{ fontSize: 12 }} /> United Airlines Operations Intelligence
          </div>
          <Title level={1} className="landing-hero-title">
            Flight Difficulty<br />Score Platform
          </Title>
          <Paragraph className="landing-hero-sub">
            Predict operational complexity before it happens. Our algorithm analyzes delays, ground time,
            passenger loads, special services, and baggage to score every flight — so your ground teams
            know exactly where to focus.
          </Paragraph>
          <Space size={16} wrap>
            {isAuthenticated ? (
              <Button type="primary" size="large" className="landing-cta-primary" onClick={() => navigate('/dashboard')}>
                Go to Dashboard <ArrowRightOutlined />
              </Button>
            ) : (
              <>
                <Button type="primary" size="large" className="landing-cta-primary" onClick={() => navigate('/register')}>
                  Get Started Free <ArrowRightOutlined />
                </Button>
                <Button size="large" className="landing-cta-secondary" onClick={() => navigate('/login')}>
                  Sign In
                </Button>
              </>
            )}
          </Space>

          {/* Stats bar */}
          <div className="landing-hero-stats">
            <div className="landing-hero-stat">
              <div className="landing-hero-stat-value">6</div>
              <div className="landing-hero-stat-label">Scoring Factors</div>
            </div>
            <div className="landing-hero-stat-divider" />
            <div className="landing-hero-stat">
              <div className="landing-hero-stat-value">5</div>
              <div className="landing-hero-stat-label">Data Sources</div>
            </div>
            <div className="landing-hero-stat-divider" />
            <div className="landing-hero-stat">
              <div className="landing-hero-stat-value">100%</div>
              <div className="landing-hero-stat-label">User-Scoped</div>
            </div>
            <div className="landing-hero-stat-divider" />
            <div className="landing-hero-stat">
              <div className="landing-hero-stat-value">Real-time</div>
              <div className="landing-hero-stat-label">Analytics</div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─────────────────────────────────────────── */}
      <section className="landing-section">
        <div className="landing-section-header">
          <Text className="landing-section-tag">CAPABILITIES</Text>
          <Title level={2} className="landing-section-title">Everything You Need for Flight Operations</Title>
          <Paragraph className="landing-section-sub">
            From raw CSV ingestion to actionable insights — one platform to score, rank, and optimize every flight.
          </Paragraph>
        </div>

        <Row gutter={[24, 24]} style={{ maxWidth: 1200, margin: '0 auto' }}>
          {FEATURES.map((f, i) => (
            <Col xs={24} sm={12} lg={8} key={i}>
              <Card className="landing-feature-card" hoverable>
                <div className="landing-feature-icon" style={{ background: `${f.color}15`, color: f.color }}>
                  {f.icon}
                </div>
                <Title level={4} className="landing-feature-title">{f.title}</Title>
                <Text className="landing-feature-desc">{f.desc}</Text>
              </Card>
            </Col>
          ))}
        </Row>
      </section>

      {/* ─── SCORING BREAKDOWN ────────────────────────────────── */}
      <section className="landing-section landing-section-alt">
        <div className="landing-section-header">
          <Text className="landing-section-tag">ALGORITHM</Text>
          <Title level={2} className="landing-section-title">How We Calculate Difficulty</Title>
          <Paragraph className="landing-section-sub">
            Each flight is evaluated across six weighted dimensions. Scores are combined into a single 0–100 index,
            then ranked and categorized as Easy, Medium, or Difficult.
          </Paragraph>
        </div>

        <div className="landing-score-grid">
          {SCORE_FACTORS.map((s, i) => (
            <div className="landing-score-item" key={i}>
              <div className="landing-score-top">
                <div className="landing-score-dot" style={{ background: s.color }} />
                <Text strong className="landing-score-label">{s.label}</Text>
                <Text className="landing-score-weight" style={{ color: s.color }}>{s.weight}</Text>
              </div>
              <div className="landing-score-bar-track">
                <div className="landing-score-bar-fill" style={{ width: s.weight, background: s.color }} />
              </div>
              <Text className="landing-score-desc">{s.desc}</Text>
            </div>
          ))}
        </div>

        {/* Category cards */}
        <Row gutter={[20, 20]} style={{ maxWidth: 800, margin: '40px auto 0' }}>
          {[
            { label: 'Easy', range: 'Bottom 33%', color: '#10b981', emoji: '🟢', desc: 'Smooth operations expected' },
            { label: 'Medium', range: 'Middle 34%', color: '#f59e0b', emoji: '🟡', desc: 'Monitor and prepare' },
            { label: 'Difficult', range: 'Top 33%', color: '#ef4444', emoji: '🔴', desc: 'Needs extra resources' },
          ].map((cat, i) => (
            <Col xs={24} sm={8} key={i}>
              <div className="landing-category-card" style={{ borderTop: `3px solid ${cat.color}` }}>
                <div style={{ fontSize: 28 }}>{cat.emoji}</div>
                <Title level={4} style={{ margin: '8px 0 2px', color: cat.color }}>{cat.label}</Title>
                <Text strong style={{ fontSize: 13 }}>{cat.range}</Text>
                <Text className="landing-category-desc">{cat.desc}</Text>
              </div>
            </Col>
          ))}
        </Row>
      </section>

      {/* ─── HOW IT WORKS ─────────────────────────────────────── */}
      <section className="landing-section">
        <div className="landing-section-header">
          <Text className="landing-section-tag">WORKFLOW</Text>
          <Title level={2} className="landing-section-title">Four Steps to Operational Intelligence</Title>
          <Paragraph className="landing-section-sub">
            Go from raw data to actionable flight difficulty insights in minutes.
          </Paragraph>
        </div>

        <div className="landing-workflow">
          {WORKFLOW_STEPS.map((step, i) => (
            <div className="landing-workflow-step" key={i}>
              <div className="landing-workflow-num">{step.num}</div>
              <div className="landing-workflow-icon">{step.icon}</div>
              <Title level={4} className="landing-workflow-title">{step.title}</Title>
              <Text className="landing-workflow-desc">{step.desc}</Text>
              {i < WORKFLOW_STEPS.length - 1 && <div className="landing-workflow-connector" />}
            </div>
          ))}
        </div>
      </section>

      {/* ─── DASHBOARD PREVIEW ────────────────────────────────── */}
      <section className="landing-section landing-section-alt">
        <div className="landing-section-header">
          <Text className="landing-section-tag">PREVIEW</Text>
          <Title level={2} className="landing-section-title">What You'll See Inside</Title>
          <Paragraph className="landing-section-sub">
            A comprehensive operations command center designed for ground teams, analysts, and operations managers.
          </Paragraph>
        </div>

        <Row gutter={[24, 24]} style={{ maxWidth: 1100, margin: '0 auto' }}>
          {[
            { title: '📊 Dashboard', desc: 'Daily summaries, difficulty distributions, trend charts, fleet status, and top delayed routes — all at a glance.', gradient: 'linear-gradient(135deg, #1a4371 0%, #2b7abf 100%)' },
            { title: '✈️ Flight List', desc: 'Sortable, filterable table of all flights with scores, ranks, delays, load factors, ground time ratios, and difficulty categories.', gradient: 'linear-gradient(135deg, #065f46 0%, #10b981 100%)' },
            { title: '📈 Analytics', desc: 'Trend analysis, destination breakdowns, hourly patterns, difficulty drivers, correlation insights, and AI recommendations.', gradient: 'linear-gradient(135deg, #92400e 0%, #f59e0b 100%)' },
            { title: '☁️ Data Upload', desc: 'Drag-and-drop CSV upload for flights, PNR, remarks, bags, and airports. Guided 5-step upload order with validation.', gradient: 'linear-gradient(135deg, #5b21b6 0%, #8b5cf6 100%)' },
          ].map((p, i) => (
            <Col xs={24} sm={12} key={i}>
              <div className="landing-preview-card">
                <div className="landing-preview-visual" style={{ background: p.gradient }}>
                  <div className="landing-preview-mockup">
                    <div className="landing-preview-dots">
                      <span style={{ background: '#ef4444' }} /><span style={{ background: '#f59e0b' }} /><span style={{ background: '#10b981' }} />
                    </div>
                    <div className="landing-preview-bars">
                      <div style={{ width: '80%' }} /><div style={{ width: '60%' }} /><div style={{ width: '90%' }} /><div style={{ width: '45%' }} />
                    </div>
                  </div>
                </div>
                <div className="landing-preview-body">
                  <Title level={4} style={{ marginBottom: 6, fontSize: 16 }}>{p.title}</Title>
                  <Text className="landing-feature-desc">{p.desc}</Text>
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </section>

      {/* ─── DATA SOURCES ─────────────────────────────────────── */}
      <section className="landing-section">
        <div className="landing-section-header">
          <Text className="landing-section-tag">DATA PIPELINE</Text>
          <Title level={2} className="landing-section-title">Five Data Sources, One Platform</Title>
        </div>

        <div className="landing-datasources">
          {[
            { emoji: '🌐', name: 'Airports', desc: 'IATA codes, country info', color: '#06b6d4' },
            { emoji: '✈️', name: 'Flights', desc: 'Schedules, delays, ground times', color: '#3b82f6' },
            { emoji: '👤', name: 'PNR', desc: 'Passenger records, child flags', color: '#10b981' },
            { emoji: '📝', name: 'PNR Remarks', desc: 'SSRs: wheelchair, UMNR', color: '#f59e0b' },
            { emoji: '🧳', name: 'Bags', desc: 'Tags, types, hot transfers', color: '#8b5cf6' },
          ].map((d, i) => (
            <div className="landing-datasource-item" key={i}>
              <div className="landing-datasource-emoji">{d.emoji}</div>
              <div className="landing-datasource-name" style={{ color: d.color }}>{d.name}</div>
              <div className="landing-datasource-desc">{d.desc}</div>
              {i < 4 && <div className="landing-datasource-arrow">→</div>}
            </div>
          ))}
        </div>
      </section>

      {/* ─── CTA ──────────────────────────────────────────────── */}
      <section className="landing-cta-section">
        <div className="landing-cta-content">
          <Title level={2} className="landing-cta-title">Ready to Score Your Flights?</Title>
          <Paragraph className="landing-cta-sub">
            Create your free account and start uploading flight data in under 2 minutes.
          </Paragraph>
          <Space size={16}>
            {isAuthenticated ? (
              <Button type="primary" size="large" className="landing-cta-primary" onClick={() => navigate('/dashboard')}>
                Open Dashboard <ArrowRightOutlined />
              </Button>
            ) : (
              <>
                <Button type="primary" size="large" className="landing-cta-primary" onClick={() => navigate('/register')}>
                  Create Free Account <ArrowRightOutlined />
                </Button>
                <Button size="large" className="landing-cta-secondary" onClick={() => navigate('/login')}>
                  Sign In
                </Button>
              </>
            )}
          </Space>
          <div className="landing-cta-checks">
            {['No credit card required', 'Unlimited uploads', 'Data stays private'].map((t, i) => (
              <span key={i} className="landing-cta-check"><CheckCircleOutlined /> {t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FOOTER ───────────────────────────────────────────── */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="landing-footer-brand">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="landing-footer-logo">✈</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>United Airlines</div>
                <div style={{ fontSize: 11, opacity: 0.5, textTransform: 'uppercase', letterSpacing: 1 }}>Flight Difficulty Score</div>
              </div>
            </div>
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 12, display: 'block' }}>
              Built for SkyHack 3.0 — Operations Intelligence
            </Text>
          </div>
          <div className="landing-footer-links">
            <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>
              © {new Date().getFullYear()} Flight Difficulty Score Platform. All rights reserved.
            </Text>
          </div>
        </div>
      </footer>
    </div>
  );
}
