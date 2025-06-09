import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import styles from './SystemLogs.module.css';

const BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || '').replace(/\/+$/, '');

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARNING' | 'ERROR' | 'DEBUG';
  category: 'AUTH' | 'APPOINTMENT' | 'USER' | 'SYSTEM' | 'DATABASE' | 'API';
  message: string;
  details?: string;
  userId?: number;
  ipAddress?: string;
}

const SystemLogs: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [levelFilter, setLevelFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    fetchSystemLogs();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [logs, levelFilter, categoryFilter, searchTerm, dateFilter]);

  const fetchSystemLogs = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      
      // Since there might not be a logs endpoint, we'll simulate logs based on user activities
      // In a real system, this would fetch from an actual logging service
      
      // For demonstration, we'll create mock logs based on recent activities
      const mockLogs = generateMockLogs();
      setLogs(mockLogs);
      
    } catch (err: any) {
      console.error('Error fetching system logs:', err);
      setError('Failed to load system logs');
      toast.error('Failed to load system logs');
    } finally {
      setLoading(false);
    }
  };

  const generateMockLogs = (): LogEntry[] => {
    const levels: LogEntry['level'][] = ['INFO', 'WARNING', 'ERROR', 'DEBUG'];
    const categories: LogEntry['category'][] = ['AUTH', 'APPOINTMENT', 'USER', 'SYSTEM', 'DATABASE', 'API'];
    
    const mockMessages = {
      AUTH: [
        'User login successful',
        'Failed login attempt',
        'Password reset requested',
        'User logout',
        'Authentication token expired'
      ],
      APPOINTMENT: [
        'Appointment created',
        'Appointment cancelled',
        'Appointment updated',
        'Appointment reminder sent',
        'Appointment completed'
      ],
      USER: [
        'User profile updated',
        'New user registered',
        'User role changed',
        'User account deactivated',
        'User permissions modified'
      ],
      SYSTEM: [
        'System backup completed',
        'Database maintenance started',
        'Server restart',
        'System configuration updated',
        'Performance monitoring alert'
      ],
      DATABASE: [
        'Database connection established',
        'Query execution completed',
        'Database backup created',
        'Index optimization completed',
        'Database error occurred'
      ],
      API: [
        'API request processed',
        'Rate limit exceeded',
        'API endpoint accessed',
        'Request validation failed',
        'Response time threshold exceeded'
      ]
    };

    const logs: LogEntry[] = [];
    
    for (let i = 0; i < 50; i++) {
      const category = categories[Math.floor(Math.random() * categories.length)];
      const level = levels[Math.floor(Math.random() * levels.length)];
      const messages = mockMessages[category];
      const message = messages[Math.floor(Math.random() * messages.length)];
      
      const date = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000);
      
      logs.push({
        id: `log-${i}`,
        timestamp: date.toISOString(),
        level,
        category,
        message,
        details: level === 'ERROR' ? 'Stack trace and error details would appear here' : undefined,
        userId: Math.random() > 0.5 ? Math.floor(Math.random() * 100) + 1 : undefined,
        ipAddress: `192.168.1.${Math.floor(Math.random() * 254) + 1}`
      });
    }
    
    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  const applyFilters = () => {
    let filtered = [...logs];

    // Level filter
    if (levelFilter !== 'ALL') {
      filtered = filtered.filter(log => log.level === levelFilter);
    }

    // Category filter
    if (categoryFilter !== 'ALL') {
      filtered = filtered.filter(log => log.category === categoryFilter);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(log => 
        log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Date filter
    if (dateFilter) {
      filtered = filtered.filter(log => 
        log.timestamp.split('T')[0] === dateFilter
      );
    }

    setFilteredLogs(filtered);
  };

  const clearLogs = async () => {
    if (window.confirm('Are you sure you want to clear all logs? This action cannot be undone.')) {
      try {
        const token = localStorage.getItem('accessToken');
        // In a real system, this would make an API call to clear logs
        
        setLogs([]);
        setFilteredLogs([]);
        toast.success('Logs cleared successfully');
      } catch (err: any) {
        console.error('Error clearing logs:', err);
        toast.error('Failed to clear logs');
      }
    }
  };

  const exportLogs = () => {
    const csvContent = [
      'Timestamp,Level,Category,Message,User ID,IP Address',
      ...filteredLogs.map(log => 
        `"${log.timestamp}","${log.level}","${log.category}","${log.message}","${log.userId || ''}","${log.ipAddress || ''}"`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system-logs-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Logs exported successfully!');
  };

  const getLevelColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'ERROR': return '#e74c3c';
      case 'WARNING': return '#f39c12';
      case 'INFO': return '#3498db';
      case 'DEBUG': return '#9b59b6';
      default: return '#95a5a6';
    }
  };

  const getCategoryIcon = (category: LogEntry['category']) => {
    switch (category) {
      case 'AUTH': return '🔐';
      case 'APPOINTMENT': return '📅';
      case 'USER': return '👤';
      case 'SYSTEM': return '⚙️';
      case 'DATABASE': return '🗄️';
      case 'API': return '🔌';
      default: return '📝';
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading system logs...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>System Logs</h2>
        <div className={styles.headerActions}>
          <button onClick={exportLogs} className={styles.exportButton}>
            Export Logs
          </button>
          <button onClick={clearLogs} className={styles.clearButton}>
            Clear Logs
          </button>
        </div>
      </div>

      {error && (
        <div className={styles.error}>{error}</div>
      )}

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label>Level:</label>
          <select 
            value={levelFilter} 
            onChange={(e) => setLevelFilter(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="ALL">All Levels</option>
            <option value="ERROR">Error</option>
            <option value="WARNING">Warning</option>
            <option value="INFO">Info</option>
            <option value="DEBUG">Debug</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label>Category:</label>
          <select 
            value={categoryFilter} 
            onChange={(e) => setCategoryFilter(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="ALL">All Categories</option>
            <option value="AUTH">Authentication</option>
            <option value="APPOINTMENT">Appointments</option>
            <option value="USER">User Management</option>
            <option value="SYSTEM">System</option>
            <option value="DATABASE">Database</option>
            <option value="API">API</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label>Date:</label>
          <input 
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className={styles.filterInput}
          />
        </div>

        <div className={styles.filterGroup}>
          <label>Search:</label>
          <input 
            type="text"
            placeholder="Search logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.filterInput}
          />
        </div>
      </div>

      {/* Log Summary */}
      <div className={styles.summary}>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Total:</span>
          <span className={styles.summaryValue}>{filteredLogs.length}</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Errors:</span>
          <span className={styles.summaryValue} style={{ color: '#e74c3c' }}>
            {filteredLogs.filter(log => log.level === 'ERROR').length}
          </span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Warnings:</span>
          <span className={styles.summaryValue} style={{ color: '#f39c12' }}>
            {filteredLogs.filter(log => log.level === 'WARNING').length}
          </span>
        </div>
      </div>

      {/* Logs Table */}
      <div className={styles.logsContainer}>
        {filteredLogs.length === 0 ? (
          <div className={styles.noLogs}>No logs found matching your criteria.</div>
        ) : (
          <div className={styles.logsList}>
            {filteredLogs.map((log) => (
              <div key={log.id} className={styles.logEntry}>
                <div className={styles.logHeader}>
                  <div className={styles.logMeta}>
                    <span className={styles.logIcon}>{getCategoryIcon(log.category)}</span>
                    <span 
                      className={styles.logLevel}
                      style={{ backgroundColor: getLevelColor(log.level) }}
                    >
                      {log.level}
                    </span>
                    <span className={styles.logCategory}>{log.category}</span>
                    <span className={styles.logTimestamp}>
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                  {log.userId && (
                    <span className={styles.logUserId}>User: {log.userId}</span>
                  )}
                </div>
                <div className={styles.logMessage}>{log.message}</div>
                {log.details && (
                  <div className={styles.logDetails}>{log.details}</div>
                )}
                {log.ipAddress && (
                  <div className={styles.logIp}>IP: {log.ipAddress}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemLogs;
