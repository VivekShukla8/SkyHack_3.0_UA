import React, { useState } from 'react';
import {
  Card,
  Upload,
  Button,
  Select,
  Typography,
  Row,
  Col,
  Progress,
  List,
  Tag,
  Alert,
  Space,
  Divider,
  App,
  Steps,
  Badge,
  Tooltip,
} from 'antd';
import {
  InboxOutlined,
  UploadOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CloudUploadOutlined,
  ThunderboltOutlined,
  UserOutlined,
  FileTextOutlined,
  ShoppingOutlined,
  EnvironmentOutlined,
  RightOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import axios from '../api/axios';

const { Title, Text, Paragraph } = Typography;
const { Dragger } = Upload;
const { Option } = Select;

const DATA_TYPES = [
  {
    value: 'airports',
    label: 'Airports Data',
    description: 'Airport codes, countries, and location info',
    icon: <EnvironmentOutlined />,
    color: '#13c2c2',
    step: 1,
    columns: ['airport_iata_code', 'iso_country_code'],
  },
  {
    value: 'flights',
    label: 'Flight Level Data',
    description: 'Schedules, delays, aircraft, ground times',
    icon: <ThunderboltOutlined />,
    color: '#1890ff',
    step: 2,
    columns: [
      'company_id', 'flight_number', 'scheduled_departure_date_local',
      'scheduled_departure_station_code', 'scheduled_arrival_station_code',
      'total_seats', 'fleet_type', 'carrier',
      'scheduled_ground_time_minutes', 'minimum_turn_minutes',
    ],
  },
  {
    value: 'pnr',
    label: 'PNR Flight Level Data',
    description: 'Passenger records, child/stroller flags',
    icon: <UserOutlined />,
    color: '#52c41a',
    step: 3,
    columns: [
      'company_id', 'flight_number', 'scheduled_departure_date_local',
      'record_locator', 'total_pax', 'is_child', 'basic_economy_pax',
    ],
  },
  {
    value: 'pnr-remarks',
    label: 'PNR Remark Level Data',
    description: 'Special service requests (wheelchair, UMNR, etc.)',
    icon: <FileTextOutlined />,
    color: '#fa8c16',
    step: 4,
    columns: ['record_locator', 'pnr_creation_date', 'flight_number', 'special_service_request'],
  },
  {
    value: 'bags',
    label: 'Bag Level Data',
    description: 'Baggage tags, types, transfers',
    icon: <ShoppingOutlined />,
    color: '#722ed1',
    step: 5,
    columns: [
      'company_id', 'flight_number', 'scheduled_departure_date_local',
      'bag_tag_unique_number', 'bag_type',
    ],
  },
];

const DataUpload = () => {
  const { message } = App.useApp();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedDataType, setSelectedDataType] = useState('flights');
  const [uploadResults, setUploadResults] = useState(() => {
    const saved = localStorage.getItem('uploadResults');
    return saved ? JSON.parse(saved) : [];
  });

  const selectedType = DATA_TYPES.find((dt) => dt.value === selectedDataType);

  const saveResults = (results) => {
    setUploadResults(results);
    localStorage.setItem('uploadResults', JSON.stringify(results));
  };

  const uploadProps = {
    name: 'file',
    multiple: false,
    accept: '.csv',
    showUploadList: false,
    beforeUpload: (file) => {
      const isCSV = file.type === 'text/csv' || file.name.endsWith('.csv');
      if (!isCSV) {
        message.error('Only CSV files are allowed');
        return false;
      }
      if (file.size / 1024 / 1024 > 500) {
        message.error('File must be smaller than 500MB');
        return false;
      }
      return true;
    },
    customRequest: async ({ file, onSuccess, onError }) => {
      try {
        setUploading(true);
        setUploadProgress(0);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('dataType', selectedDataType);

        const response = await axios.post('/upload/csv', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (evt) => {
            const pct = Math.round((evt.loaded * 100) / evt.total);
            setUploadProgress(pct);
          },
        });

        setUploadProgress(100);

        const result = {
          id: Date.now(),
          dataType: selectedDataType,
          fileName: file.name,
          fileSize: file.size,
          status: 'success',
          recordsProcessed: response.data.recordsProcessed,
          recordsInserted: response.data.recordsInserted,
          errors: (response.data.errors || []).length,
          timestamp: new Date().toLocaleString(),
        };

        saveResults([result, ...uploadResults]);
        const count = result.recordsProcessed ?? result.recordsInserted ?? 0;
        message.success(`Uploaded ${count} ${selectedDataType} records. Go to Stored Data to process.`);
        onSuccess(response.data);
      } catch (error) {
        console.error('Upload error:', error);
        const result = {
          id: Date.now(),
          dataType: selectedDataType,
          fileName: file.name,
          fileSize: file.size,
          status: 'error',
          error: error.response?.data?.error || 'Upload failed',
          timestamp: new Date().toLocaleString(),
        };
        saveResults([result, ...uploadResults]);
        message.error(error.response?.data?.error || 'Upload failed');
        onError(error);
      } finally {
        setUploading(false);
        setTimeout(() => setUploadProgress(0), 1500);
      }
    },
  };

  const formatSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const successCount = uploadResults.filter((r) => r.status === 'success').length;
  const errorCount = uploadResults.filter((r) => r.status === 'error').length;

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ marginBottom: 4 }}>
          <CloudUploadOutlined style={{ marginRight: 8 }} />
          Data Upload
        </Title>
        <Text type="secondary">
          Import CSV files into MongoDB. After uploading, go to{' '}
          <a href="/stored-data"><strong>Stored Data</strong></a> to process them into domain collections.
        </Text>
      </div>

      {/* Recommended Order */}
      <Card
        size="small"
        style={{ marginBottom: 24, borderLeft: '3px solid #1890ff' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <InfoCircleOutlined style={{ color: '#1890ff' }} />
          <Text strong style={{ marginRight: 8 }}>Recommended upload order:</Text>
          {DATA_TYPES.map((dt, i) => (
            <React.Fragment key={dt.value}>
              <Tag
                color={selectedDataType === dt.value ? dt.color : 'default'}
                icon={dt.icon}
                style={{
                  cursor: 'pointer',
                  fontWeight: selectedDataType === dt.value ? 700 : 400,
                  border: selectedDataType === dt.value ? `2px solid ${dt.color}` : undefined,
                }}
                onClick={() => setSelectedDataType(dt.value)}
              >
                {dt.step}. {dt.label}
              </Tag>
              {i < DATA_TYPES.length - 1 && (
                <RightOutlined style={{ fontSize: 10, color: 'var(--text-muted)' }} />
              )}
            </React.Fragment>
          ))}
        </div>
      </Card>

      <Row gutter={[24, 24]}>
        {/* Left — Upload Area */}
        <Col xs={24} lg={14}>
          <Card
            title={
              <Space>
                <UploadOutlined />
                <span>Upload CSV File</span>
              </Space>
            }
          >
            {/* Data Type Selector */}
            <div style={{ marginBottom: 20 }}>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>
                Select Data Type
              </Text>
              <Select
                value={selectedDataType}
                onChange={setSelectedDataType}
                style={{ width: '100%' }}
                size="large"
              >
                {DATA_TYPES.map((dt) => (
                  <Option key={dt.value} value={dt.value}>
                    <Space>
                      <span style={{ color: dt.color }}>{dt.icon}</span>
                      <span>{dt.label}</span>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        — {dt.description}
                      </Text>
                    </Space>
                  </Option>
                ))}
              </Select>
            </div>

            {/* Selected type info */}
            {selectedType && (
              <div
                style={{
                  padding: '12px 16px',
                  background: `${selectedType.color}08`,
                  border: `1px solid ${selectedType.color}30`,
                  borderRadius: 8,
                  marginBottom: 20,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ color: selectedType.color, fontSize: 18 }}>{selectedType.icon}</span>
                  <Text strong>{selectedType.label}</Text>
                  <Tag color={selectedType.color} style={{ marginLeft: 'auto' }}>Step {selectedType.step}/5</Tag>
                </div>
                <Text type="secondary" style={{ fontSize: 13 }}>{selectedType.description}</Text>
                <div style={{ marginTop: 8 }}>
                  <Text style={{ fontSize: 12 }} type="secondary">
                    <strong>Key columns:</strong>{' '}
                    {selectedType.columns.slice(0, 5).map((col) => (
                      <Tag key={col} style={{ fontSize: 11, margin: 2 }}>{col}</Tag>
                    ))}
                    {selectedType.columns.length > 5 && (
                      <Tooltip title={selectedType.columns.slice(5).join(', ')}>
                        <Tag style={{ fontSize: 11, margin: 2, cursor: 'help' }}>
                          +{selectedType.columns.length - 5} more
                        </Tag>
                      </Tooltip>
                    )}
                  </Text>
                </div>
              </div>
            )}

            {/* Dragger */}
            <Dragger {...uploadProps} disabled={uploading}>
              <p className="ant-upload-drag-icon">
                <InboxOutlined style={{ color: selectedType?.color || '#1890ff', fontSize: 48 }} />
              </p>
              <p className="ant-upload-text" style={{ fontSize: 16 }}>
                Click or drag a <strong>.csv</strong> file here
              </p>
              <p className="ant-upload-hint">
                Max file size: 500MB • Only CSV format supported
              </p>
            </Dragger>

            {/* Upload progress */}
            {uploading && (
              <div style={{ marginTop: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text strong>Uploading...</Text>
                  <Text type="secondary">{uploadProgress}%</Text>
                </div>
                <Progress
                  percent={uploadProgress}
                  status={uploadProgress === 100 ? 'success' : 'active'}
                  strokeColor={selectedType?.color}
                  showInfo={false}
                />
              </div>
            )}
          </Card>
        </Col>

        {/* Right — Upload History */}
        <Col xs={24} lg={10}>
          <Card
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Space>
                  <span>Upload History</span>
                  {uploadResults.length > 0 && (
                    <Badge
                      count={uploadResults.length}
                      style={{ backgroundColor: '#1f4e79' }}
                    />
                  )}
                </Space>
                {uploadResults.length > 0 && (
                  <Space size={12}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      <CheckCircleOutlined style={{ color: '#52c41a' }} /> {successCount}
                      {errorCount > 0 && (
                        <span style={{ marginLeft: 8 }}>
                          <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} /> {errorCount}
                        </span>
                      )}
                    </Text>
                    <Tooltip title="Clear history">
                      <Button
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => saveResults([])}
                        type="text"
                        danger
                      />
                    </Tooltip>
                  </Space>
                )}
              </div>
            }
            style={{ height: '100%' }}
            bodyStyle={{ maxHeight: 520, overflow: 'auto' }}
          >
            {uploadResults.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 20px' }}>
                <CloudUploadOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 12 }} />
                <Paragraph type="secondary">
                  No uploads yet. Select a data type and upload a CSV file to get started.
                </Paragraph>
              </div>
            ) : (
              <List
                dataSource={uploadResults}
                renderItem={(item) => {
                  const dt = DATA_TYPES.find((d) => d.value === item.dataType);
                  return (
                    <List.Item
                      style={{
                        padding: '12px 0',
                        borderBottom: '1px solid #f5f5f5',
                      }}
                    >
                      <div style={{ width: '100%' }}>
                        {/* File name + status */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <Space>
                            {item.status === 'success' ? (
                              <CheckCircleOutlined style={{ color: '#52c41a' }} />
                            ) : (
                              <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
                            )}
                            <Text strong style={{ fontSize: 13 }}>{item.fileName}</Text>
                          </Space>
                          <Tag
                            color={item.status === 'success' ? 'success' : 'error'}
                            style={{ fontSize: 11 }}
                          >
                            {item.status.toUpperCase()}
                          </Tag>
                        </div>
                        {/* Meta row */}
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingLeft: 22 }}>
                          <Tag color={dt?.color} style={{ fontSize: 11 }}>{dt?.label || item.dataType}</Tag>
                          <Text type="secondary" style={{ fontSize: 11 }}>{item.timestamp}</Text>
                          {item.fileSize && (
                            <Text type="secondary" style={{ fontSize: 11 }}>{formatSize(item.fileSize)}</Text>
                          )}
                        </div>
                        {/* Result */}
                        <div style={{ paddingLeft: 22, marginTop: 4 }}>
                          {item.status === 'success' ? (
                            <Text type="success" style={{ fontSize: 12 }}>
                              {item.recordsProcessed ?? item.recordsInserted ?? 0} rows stored
                              {item.errors > 0 && ` • ${item.errors} errors`}
                            </Text>
                          ) : (
                            <Text type="danger" style={{ fontSize: 12 }}>{item.error}</Text>
                          )}
                        </div>
                      </div>
                    </List.Item>
                  );
                }}
              />
            )}
          </Card>
        </Col>
      </Row>

      {/* Important Notes */}
      <Alert
        message="Important Notes"
        description={
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 2 }}>
            <li>Upload CSV files with headers matching the data dictionary</li>
            <li>After uploading, go to <a href="/stored-data"><strong>Stored Data</strong></a> to process files into domain collections</li>
            <li>Processing populates Dashboard, Flights &amp; Analytics with live data</li>
            <li>Duplicate records are skipped during processing</li>
            <li>Date formats: ISO (YYYY-MM-DD) or standard datetime</li>
          </ul>
        }
        type="info"
        showIcon
        style={{ marginTop: 24 }}
      />
    </div>
  );
};

export default DataUpload;
