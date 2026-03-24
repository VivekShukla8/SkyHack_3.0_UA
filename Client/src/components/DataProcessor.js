import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Card,
  Button,
  Typography,
  Row,
  Col,
  Statistic,
  Alert,
  Space,
  Divider,
  Select,
  Modal,
  Tooltip,
  Badge,
  Spin,
} from 'antd';
import {
  PlayCircleOutlined,
  DatabaseOutlined,
  ReloadOutlined,
  DeleteOutlined,
  ThunderboltOutlined,
  CloudServerOutlined,
  FileTextOutlined,
  UserOutlined,
  ShoppingOutlined,
  EnvironmentOutlined,
  ExclamationCircleOutlined,
  WarningOutlined,
  StopOutlined,
} from '@ant-design/icons';
import axios from '../api/axios';
import { useProcessing } from '../context/ProcessingContext';

const { Text } = Typography;
const { Option } = Select;

const DATA_TYPES = [
  { value: 'flights', label: 'Flights', icon: <ThunderboltOutlined /> },
  { value: 'pnr', label: 'PNR', icon: <UserOutlined /> },
  { value: 'pnr-remarks', label: 'PNR Remarks', icon: <FileTextOutlined /> },
  { value: 'bags', label: 'Bags', icon: <ShoppingOutlined /> },
  { value: 'airports', label: 'Airports', icon: <EnvironmentOutlined /> },
];

const DataProcessor = ({ onProcessingComplete }) => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [processing, setProcessingLocal] = useState(false);
  const [processType, setProcessType] = useState('flights');
  const [processingType, setProcessingType] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const abortRef = useRef(null);

  const { setProcessing: setGlobalProcessing } = useProcessing();
  const isProcessing = processing || processingType;

  // ── Sync global processing state ──────────────────────────────────────
  useEffect(() => {
    setGlobalProcessing(isProcessing);
    return () => setGlobalProcessing(false);
  }, [isProcessing, setGlobalProcessing]);

  // ── beforeunload warning ──────────────────────────────────────────────
  useEffect(() => {
    if (!isProcessing) return;
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = 'Data processing is in progress. Are you sure you want to leave?';
      return e.returnValue;
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isProcessing]);

  // ── Fetch status ──────────────────────────────────────────────────────
  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('/process-data/status');
      setStatus(response.data.status);
    } catch (error) {
      console.error('Error fetching status:', error);
      setFeedback({ type: 'error', message: 'Failed to fetch processing status.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // ── Cancel handler ────────────────────────────────────────────────────
  const cancelProcessing = () => {
    Modal.confirm({
      title: 'Cancel Processing?',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>Are you sure you want to cancel the current processing operation?</p>
          <ul style={{ paddingLeft: 20 }}>
            <li>Data that has already been processed <strong>will remain</strong> in the database.</li>
            <li>Remaining records <strong>will not</strong> be processed.</li>
            <li>The server may still finish records it already started.</li>
          </ul>
          <p style={{ color: '#faad14' }}>
            <strong>This may result in partially processed data.</strong>
          </p>
        </div>
      ),
      okText: 'Yes, Cancel Processing',
      okType: 'danger',
      cancelText: 'Continue Processing',
      onOk: () => {
        if (abortRef.current) {
          abortRef.current.abort();
          abortRef.current = null;
        }
        setProcessingLocal(false);
        setProcessingType(false);
        setFeedback({
          type: 'info',
          message: 'Processing request cancelled. Note: the server may still finish processing records it already started.',
        });
        fetchStatus();
      },
    });
  };

  // ── Process all ───────────────────────────────────────────────────────
  const processAllData = async () => {
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      setProcessingLocal(true);
      setFeedback({ type: 'info', message: 'Processing all stored data… Stay on this page.' });

      const response = await axios.post('/process-data/process-all', {}, {
        signal: controller.signal,
      });

      const { totalProcessed, totalErrors } = response.data;
      setFeedback({
        type: totalErrors > 0 ? 'warning' : 'success',
        message: totalErrors > 0
          ? `Processed ${totalProcessed} records with ${totalErrors} errors.`
          : `Successfully processed ${totalProcessed} records. Dashboard & Analytics updated.`,
      });
      await fetchStatus();
      onProcessingComplete?.();
    } catch (error) {
      if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED') return;
      console.error('Error processing data:', error);
      setFeedback({
        type: 'error',
        message: error.response?.data?.error || 'Failed to process data.',
      });
    } finally {
      setProcessingLocal(false);
      abortRef.current = null;
    }
  };

  // ── Process by type ───────────────────────────────────────────────────
  const processByType = async () => {
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      setProcessingType(true);
      setFeedback({ type: 'info', message: `Processing ${processType} data… Stay on this page.` });

      const response = await axios.post(`/process-data/process/${processType}`, {}, {
        signal: controller.signal,
      });

      const { totalProcessed, totalErrors } = response.data;
      setFeedback({
        type: totalErrors > 0 ? 'warning' : 'success',
        message: `${processType}: ${totalProcessed} records${totalErrors > 0 ? ` (${totalErrors} errors)` : ' processed successfully'}.`,
      });
      await fetchStatus();
      onProcessingComplete?.();
    } catch (error) {
      if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED') return;
      console.error('Error processing type:', error);
      setFeedback({
        type: 'error',
        message: error.response?.data?.error || `Failed to process ${processType} data.`,
      });
    } finally {
      setProcessingType(false);
      abortRef.current = null;
    }
  };

  // ── Clear all ─────────────────────────────────────────────────────────
  const clearAllData = () => {
    Modal.confirm({
      title: 'Clear All Data?',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>This will permanently delete from <strong>MongoDB</strong>:</p>
          <ul>
            <li>All processed Flights, PNRs, Remarks, Bags, Airports</li>
            <li>All your stored JSON uploads</li>
          </ul>
          <p style={{ color: '#ff4d4f' }}>
            <strong>Dashboard and Analytics will show empty data.</strong>
          </p>
        </div>
      ),
      okText: 'Yes, Clear Everything',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          setLoading(true);
          await axios.delete('/process-data/clear-all');
          setFeedback({ type: 'success', message: 'All data cleared from MongoDB.' });
          await fetchStatus();
          onProcessingComplete?.();
        } catch (error) {
          console.error('Error clearing data:', error);
          setFeedback({ type: 'error', message: 'Failed to clear data.' });
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const totalProcessed = (status?.flights || 0) + (status?.pnr || 0) +
    (status?.pnrRemarks || 0) + (status?.bags || 0) + (status?.airports || 0);
  const hasStoredData = (status?.uploadedData || 0) > 0;
  const hasProcessedData = totalProcessed > 0;

  return (
    <Card
      title={
        <Space>
          <CloudServerOutlined style={{ fontSize: 20, color: '#1f4e79' }} />
          <span>Data Processing Pipeline</span>
          {hasProcessedData && (
            <Badge
              count={`${totalProcessed.toLocaleString()} in DB`}
              style={{ backgroundColor: '#52c41a', fontSize: 11 }}
            />
          )}
        </Space>
      }
      extra={
        <Tooltip title="Refresh counts from MongoDB">
          <Button
            icon={<ReloadOutlined spin={loading} />}
            onClick={fetchStatus}
            loading={loading}
            size="small"
          >
            Refresh
          </Button>
        </Tooltip>
      }
    >
      {/* Processing banner */}
      {isProcessing && (
        <Alert
          message={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Space>
                <WarningOutlined />
                <strong>Processing in progress — do not navigate away!</strong>
              </Space>
              <Button
                danger
                size="small"
                icon={<StopOutlined />}
                onClick={cancelProcessing}
              >
                Cancel Processing
              </Button>
            </div>
          }
          type="warning"
          showIcon={false}
          banner
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Description */}
      <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
        Upload CSV files first → click <strong>Process All Data</strong> → data populates Dashboard &amp; Analytics.
        All data is stored <strong>permanently in MongoDB</strong> and scoped to your account.
      </Text>

      {/* Feedback */}
      {feedback && !isProcessing && (
        <Alert
          message={feedback.message}
          type={feedback.type}
          showIcon
          closable
          onClose={() => setFeedback(null)}
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Status Cards */}
      <Spin spinning={loading}>
        <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
          <Col xs={24} sm={8}>
            <Card size="small" style={{ borderLeft: '3px solid #1890ff' }}>
              <Statistic
                title="Stored JSON Files"
                value={status?.uploadedData || 0}
                prefix={<DatabaseOutlined />}
                valueStyle={{ color: '#1890ff', fontSize: 22 }}
              />
              <Text type="secondary" style={{ fontSize: 11 }}>Your uploads (not yet processed)</Text>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card size="small" style={{ borderLeft: `3px solid ${(status?.flights || 0) > 0 ? '#52c41a' : '#d9d9d9'}` }}>
              <Statistic
                title="Flights in DB"
                value={status?.flights || 0}
                prefix={<ThunderboltOutlined />}
                valueStyle={{ color: (status?.flights || 0) > 0 ? '#52c41a' : '#bbb', fontSize: 22 }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card size="small" style={{ borderLeft: `3px solid ${(status?.pnr || 0) > 0 ? '#52c41a' : '#d9d9d9'}` }}>
              <Statistic
                title="PNRs in DB"
                value={status?.pnr || 0}
                prefix={<UserOutlined />}
                valueStyle={{ color: (status?.pnr || 0) > 0 ? '#52c41a' : '#bbb', fontSize: 22 }}
              />
            </Card>
          </Col>
        </Row>
        <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
          <Col xs={24} sm={8}>
            <Card size="small" style={{ borderLeft: `3px solid ${(status?.pnrRemarks || 0) > 0 ? '#52c41a' : '#d9d9d9'}` }}>
              <Statistic title="Remarks in DB" value={status?.pnrRemarks || 0} prefix={<FileTextOutlined />}
                valueStyle={{ color: (status?.pnrRemarks || 0) > 0 ? '#52c41a' : '#bbb', fontSize: 22 }} />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card size="small" style={{ borderLeft: `3px solid ${(status?.bags || 0) > 0 ? '#52c41a' : '#d9d9d9'}` }}>
              <Statistic title="Bags in DB" value={status?.bags || 0} prefix={<ShoppingOutlined />}
                valueStyle={{ color: (status?.bags || 0) > 0 ? '#52c41a' : '#bbb', fontSize: 22 }} />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card size="small" style={{ borderLeft: `3px solid ${(status?.airports || 0) > 0 ? '#52c41a' : '#d9d9d9'}` }}>
              <Statistic title="Airports in DB" value={status?.airports || 0} prefix={<EnvironmentOutlined />}
                valueStyle={{ color: (status?.airports || 0) > 0 ? '#52c41a' : '#bbb', fontSize: 22 }} />
            </Card>
          </Col>
        </Row>
      </Spin>

      <Divider style={{ margin: '16px 0' }} />

      {/* Actions */}
      <Row gutter={[16, 12]} align="middle">
        <Col>
          <Tooltip title={!hasStoredData ? 'Upload CSV files first' : 'Process all stored JSON into MongoDB'}>
            <Button type="primary" icon={<PlayCircleOutlined />} size="large" loading={processing}
              onClick={processAllData} disabled={!hasStoredData || isProcessing} style={{ fontWeight: 600 }}>
              Process All Data
            </Button>
          </Tooltip>
        </Col>
        <Col>
          <Space.Compact>
            <Select value={processType} onChange={setProcessType} style={{ width: 160 }} size="large" disabled={isProcessing}>
              {DATA_TYPES.map((dt) => (
                <Option key={dt.value} value={dt.value}>
                  <Space size={4}>{dt.icon} {dt.label}</Space>
                </Option>
              ))}
            </Select>
            <Tooltip title={`Process only ${processType} data`}>
              <Button icon={<ThunderboltOutlined />} size="large" loading={processingType}
                onClick={processByType} disabled={!hasStoredData || isProcessing}>
                Process
              </Button>
            </Tooltip>
          </Space.Compact>
        </Col>

        {/* Cancel — visible only during processing */}
        {isProcessing && (
          <Col>
            <Button danger icon={<StopOutlined />} size="large" onClick={cancelProcessing}>
              Cancel Processing
            </Button>
          </Col>
        )}

        <Col>
          <Tooltip title="Delete ALL data from MongoDB">
            <Button danger icon={<DeleteOutlined />} size="large" onClick={clearAllData}
              disabled={(!hasStoredData && !hasProcessedData) || isProcessing}>
              Clear All Data
            </Button>
          </Tooltip>
        </Col>
      </Row>

      {/* Workflow */}
      <div style={{ marginTop: 16, padding: '8px 12px', background: '#f6f8fa', borderRadius: 6 }}>
        <Text type="secondary" style={{ fontSize: 13 }}>
          <strong>Workflow:</strong> Upload CSV → Process All Data → Dashboard &amp; Analytics update.
          Data is <strong>permanently stored in MongoDB</strong>, scoped to your account. Use "Clear All Data" to start over.
        </Text>
      </div>
    </Card>
  );
};

export default DataProcessor;
