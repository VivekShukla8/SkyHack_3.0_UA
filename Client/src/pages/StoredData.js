import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Table,
  Button,
  Select,
  Typography,
  Tag,
  Space,
  Modal,
  Statistic,
  Row,
  Col,
  App,
  Tooltip,
  Empty,
  Descriptions,
} from 'antd';
import {
  EyeOutlined,
  DeleteOutlined,
  DownloadOutlined,
  DatabaseOutlined,
  FileTextOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import axios from '../api/axios';
import moment from 'moment';
import DataProcessor from '../components/DataProcessor';

const { Title, Text } = Typography;
const { Option } = Select;

const DATA_TYPE_OPTIONS = [
  { value: 'flights', label: 'Flight Level Data', color: 'blue' },
  { value: 'pnr', label: 'PNR Flight Level Data', color: 'green' },
  { value: 'pnr-remarks', label: 'PNR Remark Level Data', color: 'orange' },
  { value: 'bags', label: 'Bag Level Data', color: 'purple' },
  { value: 'airports', label: 'Airports Data', color: 'cyan' },
];

const StoredData = () => {
  const { message, modal } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [selectedDataType, setSelectedDataType] = useState('flights');
  const [totalFiles, setTotalFiles] = useState(0);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // View modal state
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [rawData, setRawData] = useState([]);
  const [rawDataMeta, setRawDataMeta] = useState(null);
  const [rawPagination, setRawPagination] = useState({ current: 1, pageSize: 50, total: 0 });

  const fetchStoredData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/json-upload/data/${selectedDataType}`, {
        params: {
          limit: pagination.pageSize,
          offset: (pagination.current - 1) * pagination.pageSize,
        },
      });

      setData(response.data.data || []);
      setTotalFiles(response.data.total || 0);
      setPagination((prev) => ({ ...prev, total: response.data.total || 0 }));
    } catch (error) {
      console.error('Error fetching stored data:', error);
      if (error.response?.status !== 401) {
        message.error('Failed to fetch stored data');
      }
    } finally {
      setLoading(false);
    }
  }, [selectedDataType, pagination.current, pagination.pageSize, message]);

  useEffect(() => {
    fetchStoredData();
  }, [fetchStoredData]);

  // View raw data for a file
  const handleViewData = async (record, page = 1, pageSize = 50) => {
    try {
      setViewLoading(true);
      setSelectedRecord(record);
      setViewModalVisible(true);

      const offset = (page - 1) * pageSize;
      const response = await axios.get(
        `/json-upload/data/${selectedDataType}/${record._id}`,
        { params: { limit: pageSize, offset } }
      );

      setRawData(response.data.data || []);
      setRawDataMeta(response.data.metadata || null);
      setRawPagination({
        current: page,
        pageSize,
        total: response.data.pagination?.total || 0,
      });
    } catch (error) {
      console.error('Error fetching raw data:', error);
      message.error('Failed to load raw records');
    } finally {
      setViewLoading(false);
    }
  };

  // Delete a stored file
  const handleDeleteData = (record) => {
    modal.confirm({
      title: 'Delete Stored Data?',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>This will permanently delete <strong>{record.fileName}</strong> ({record.recordCount} records) from MongoDB.</p>
          <p style={{ color: '#ff4d4f' }}>If you've already processed this file, the processed records in domain collections will remain until you click "Clear All Data" in the Data Processor.</p>
        </div>
      ),
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await axios.delete(`/json-upload/data/${record._id}`);
          message.success(`Deleted ${record.fileName}`);
          fetchStoredData();
        } catch (error) {
          console.error('Error deleting data:', error);
          message.error('Failed to delete data');
        }
      },
    });
  };

  // Download raw data as CSV
  const handleDownloadData = async (record) => {
    try {
      message.loading({ content: 'Preparing download...', key: 'download' });

      const response = await axios.get(
        `/json-upload/data/${selectedDataType}/${record._id}`,
        { params: { limit: 100000, offset: 0 } }
      );

      const records = response.data.data || [];
      if (records.length === 0) {
        message.warning({ content: 'No data to download', key: 'download' });
        return;
      }

      // Build CSV
      const allKeys = new Set();
      records.forEach((row) => Object.keys(row).forEach((k) => allKeys.add(k)));
      const headers = Array.from(allKeys).filter((k) => k !== '_id' && k !== '__v');

      const csvRows = [
        headers.join(','),
        ...records.map((row) =>
          headers
            .map((h) => {
              const val = row[h] ?? '';
              const str = String(val);
              return str.includes(',') || str.includes('"') || str.includes('\n')
                ? `"${str.replace(/"/g, '""')}"`
                : str;
            })
            .join(',')
        ),
      ];

      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = record.fileName.replace(/\.csv$/i, '') + '_export.csv';
      link.click();
      window.URL.revokeObjectURL(url);

      message.success({ content: `Downloaded ${records.length} records`, key: 'download' });
    } catch (error) {
      console.error('Error downloading data:', error);
      message.error({ content: 'Failed to download data', key: 'download' });
    }
  };

  // Build table columns for raw data view
  const buildRawColumns = () => {
    if (rawData.length === 0) return [];
    const keys = Object.keys(rawData[0]).filter((k) => k !== '_id' && k !== '__v');
    return keys.map((key) => ({
      title: key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      dataIndex: key,
      key,
      width: 180,
      ellipsis: true,
      render: (val) => {
        if (val === null || val === undefined) return <Text type="secondary">—</Text>;
        if (typeof val === 'object') return <Text code>{JSON.stringify(val)}</Text>;
        return String(val);
      },
    }));
  };


  const columns = [
    {
      title: 'File Name',
      dataIndex: 'fileName',
      key: 'fileName',
      render: (text) => (
        <Space>
          <FileTextOutlined style={{ color: '#1890ff' }} />
          <Text strong>{text}</Text>
        </Space>
      ),
    },
    {
      title: 'Records',
      dataIndex: 'recordCount',
      key: 'recordCount',
      width: 100,
      sorter: (a, b) => a.recordCount - b.recordCount,
      render: (count) => (
         <Text strong style={{ color: 'var(--accent-blue)' }}>
          {count?.toLocaleString()}
        </Text>
      ),
    },
    {
      title: 'Upload Date',
      dataIndex: 'uploadDate',
      key: 'uploadDate',
      width: 180,
      render: (date) => (
        <Tooltip title={moment(date).format('YYYY-MM-DD HH:mm:ss')}>
          {moment(date).format('MMM DD, YYYY HH:mm')}
        </Tooltip>
      ),
    },
    {
      title: 'File Size',
      dataIndex: 'metadata',
      key: 'fileSize',
      width: 100,
      render: (metadata) => {
        const bytes = metadata?.fileSize || 0;
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 260,
      render: (_, record) => (
        <Space>
          <Tooltip title="View raw records">
            <Button
              type="primary"
              icon={<EyeOutlined />}
              size="small"
              onClick={() => handleViewData(record)}
            >
              View
            </Button>
          </Tooltip>
          <Tooltip title="Download as CSV">
            <Button
              icon={<DownloadOutlined />}
              size="small"
              onClick={() => handleDownloadData(record)}
            >
              Export
            </Button>
          </Tooltip>
          <Tooltip title="Delete this file from MongoDB">
            <Button
              danger
              icon={<DeleteOutlined />}
              size="small"
              onClick={() => handleDeleteData(record)}
            >
              Delete
            </Button>
          </Tooltip>
        </Space>
      ),
    },
  ];

  // Calculate total records across all visible files
  const totalRecords = data.reduce((sum, item) => sum + (item.recordCount || 0), 0);

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>
          <DatabaseOutlined /> Stored Data Management
        </Title>
        <Text type="secondary">
          CSV data stored as JSON in MongoDB. Process it into domain collections to power
          Dashboard, Flights &amp; Analytics. Data persists across sessions.
        </Text>
      </div>

      {/* Data Processor */}
      <div style={{ marginBottom: 24 }}>
        <DataProcessor onProcessingComplete={fetchStoredData} />
      </div>

      {/* Filter + Summary */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={8}>
            <Text strong style={{ marginRight: 8 }}>Data Type:</Text>
            <Select
              value={selectedDataType}
              onChange={(val) => {
                setSelectedDataType(val);
                setPagination((p) => ({ ...p, current: 1 }));
              }}
              style={{ width: 200 }}
            >
              {DATA_TYPE_OPTIONS.map((opt) => (
                <Option key={opt.value} value={opt.value}>
                  <Tag color={opt.color} style={{ marginRight: 4 }}>{opt.value}</Tag>
                  {opt.label}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={12} sm={5}>
            <Statistic
              title="Files"
              value={totalFiles}
              valueStyle={{ fontSize: 18, color: 'var(--accent-blue)' }}
            />
          </Col>
          <Col xs={12} sm={5}>
            <Statistic
              title="Total Records"
              value={totalRecords}
              valueStyle={{ fontSize: 18, color: 'var(--accent-green)' }}
            />
          </Col>
          <Col xs={24} sm={6} style={{ textAlign: 'right' }}>
            <Button icon={<InfoCircleOutlined />} onClick={fetchStoredData} loading={loading}>
              Refresh
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Files Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={data}
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} files`,
          }}
          onChange={(pag) => setPagination(pag)}
          rowKey="_id"
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <span>
                    No <strong>{selectedDataType}</strong> files uploaded yet.{' '}
                    <a href="/upload">Go to Data Upload</a> to import CSV files.
                  </span>
                }
              />
            ),
          }}
        />
      </Card>

      {/* View Raw Data Modal */}
      <Modal
        title={
          <Space>
            <FileTextOutlined />
            <span>Raw Data — {selectedRecord?.fileName}</span>
            {rawDataMeta && (
              <Tag color="blue">{rawDataMeta.totalRecords?.toLocaleString()} total records</Tag>
            )}
          </Space>
        }
        open={viewModalVisible}
        onCancel={() => {
          setViewModalVisible(false);
          setRawData([]);
          setSelectedRecord(null);
        }}
        width="90vw"
        style={{ top: 20 }}
        footer={[
          <Button key="close" onClick={() => setViewModalVisible(false)}>
            Close
          </Button>,
          <Button
            key="download"
            type="primary"
            icon={<DownloadOutlined />}
            onClick={() => selectedRecord && handleDownloadData(selectedRecord)}
          >
            Download as CSV
          </Button>,
        ]}
      >
        {/* File metadata */}
        {rawDataMeta && (
          <Descriptions size="small" column={4} style={{ marginBottom: 16 }}>
            <Descriptions.Item label="File">{rawDataMeta.fileName}</Descriptions.Item>
            <Descriptions.Item label="Records">{rawDataMeta.totalRecords?.toLocaleString()}</Descriptions.Item>
            <Descriptions.Item label="Uploaded">{moment(rawDataMeta.uploadDate).format('MMM DD, YYYY HH:mm')}</Descriptions.Item>
            <Descriptions.Item label="Record Count">{rawDataMeta.recordCount}</Descriptions.Item>
          </Descriptions>
        )}

        {/* Raw data table */}
        <Table
          columns={buildRawColumns()}
          dataSource={rawData}
          loading={viewLoading}
          pagination={{
            current: rawPagination.current,
            pageSize: rawPagination.pageSize,
            total: rawPagination.total,
            showSizeChanger: true,
            pageSizeOptions: ['10', '25', '50', '100'],
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} records`,
            onChange: (page, pageSize) => {
              if (selectedRecord) handleViewData(selectedRecord, page, pageSize);
            },
          }}
          scroll={{ x: 'max-content', y: 400 }}
          rowKey={(_, idx) => idx}
          size="small"
          bordered
        />
      </Modal>
    </div>
  );
};

export default StoredData;
