import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import styles from './BillingOverview.module.css';

const BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || '').replace(/\/+$/, '');

interface BillingStats {
  totalRevenue: number;
  monthlyRevenue: number;
  pendingPayments: number;
  overduePayments: number;
  totalInvoices: number;
  paidInvoices: number;
  unpaidInvoices: number;
  averageInvoiceAmount: number;
}

interface Invoice {
  id: string;
  patientName: string;
  patientId: number;
  doctorName: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue' | 'cancelled';
  issueDate: string;
  dueDate: string;
  paidDate?: string;
  services: string[];
  notes?: string;
}

interface PaymentMethod {
  id: string;
  name: string;
  type: 'cash' | 'card' | 'insurance' | 'transfer';
  isActive: boolean;
}

const BillingOverview: React.FC = () => {
  const [stats, setStats] = useState<BillingStats>({
    totalRevenue: 0,
    monthlyRevenue: 0,
    pendingPayments: 0,
    overduePayments: 0,
    totalInvoices: 0,
    paidInvoices: 0,
    unpaidInvoices: 0,
    averageInvoiceAmount: 0
  });

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  useEffect(() => {
    loadBillingData();
    loadPaymentMethods();
  }, [dateRange, filterStatus]);

  const loadBillingData = async () => {
    try {
      // In a real application, this would fetch from the backend
      // For now, we'll generate mock data
      const mockStats: BillingStats = {
        totalRevenue: 3125000000,
        monthlyRevenue: 462500000,
        pendingPayments: 130000000,
        overduePayments: 45000000,
        totalInvoices: 342,
        paidInvoices: 298,
        unpaidInvoices: 44,
        averageInvoiceAmount: 9125000
      };

      const mockInvoices: Invoice[] = [
        {
          id: 'INV-2024-001',
          patientName: 'Nguyễn Văn An',
          patientId: 101,
          doctorName: 'BS. Trần Minh',
          amount: 6250000,
          status: 'pending',
          issueDate: '2024-12-01',
          dueDate: '2024-12-15',
          services: ['Khám tổng quát', 'Xét nghiệm máu']
        },
        {
          id: 'INV-2024-002',
          patientName: 'Lê Thị Hương',
          patientId: 102,
          doctorName: 'BS. Phạm Quang',
          amount: 12000000,
          status: 'paid',
          issueDate: '2024-11-28',
          dueDate: '2024-12-12',
          paidDate: '2024-12-10',
          services: ['Chụp X-quang', 'Khám tổng quát', 'Kê đơn thuốc']
        },
        {
          id: 'INV-2024-003',
          patientName: 'Trần Văn Hoàng',
          patientId: 103,
          doctorName: 'BS. Đỗ Lan',
          amount: 3750000,
          status: 'overdue',
          issueDate: '2024-11-15',
          dueDate: '2024-11-30',
          services: ['Khám tổng quát']
        },
        {
          id: 'INV-2024-004',
          patientName: 'Phạm Thị Mai',
          patientId: 104,
          doctorName: 'BS. Nguyễn Đức',
          amount: 8000000,
          status: 'paid',
          issueDate: '2024-12-02',
          dueDate: '2024-12-16',
          paidDate: '2024-12-08',
          services: ['Tư vấn phẫu thuật', 'Xét nghiệm']
        },
        {
          id: 'INV-2024-005',
          patientName: 'Vũ Minh Tuấn',
          patientId: 105,
          doctorName: 'BS. Trần Minh',
          amount: 5000000,
          status: 'pending',
          issueDate: '2024-12-05',
          dueDate: '2024-12-19',
          services: ['Tái khám']
        }
      ];

      setStats(mockStats);
      setInvoices(mockInvoices);
    } catch (err: any) {
      console.error('Error loading billing data:', err);
      toast.error('Không thể tải dữ liệu thanh toán');
    } finally {
      setLoading(false);
    }
  };

  const loadPaymentMethods = () => {
    const mockMethods: PaymentMethod[] = [
      { id: '1', name: 'Tiền mặt', type: 'cash', isActive: true },
      { id: '2', name: 'Thẻ tín dụng', type: 'card', isActive: true },
      { id: '3', name: 'Thẻ ghi nợ', type: 'card', isActive: true },
      { id: '4', name: 'Bảo hiểm', type: 'insurance', isActive: true },
      { id: '5', name: 'Chuyển khoản', type: 'transfer', isActive: true }
    ];
    setPaymentMethods(mockMethods);
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesStatus = filterStatus === 'all' || invoice.status === filterStatus;
    const matchesSearch = searchTerm === '' || 
      invoice.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.doctorName.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  const handleMarkAsPaid = async (invoiceId: string) => {
    try {
      // In a real application, this would update the backend
      setInvoices(prev => prev.map(invoice => 
        invoice.id === invoiceId 
          ? { ...invoice, status: 'paid' as const, paidDate: new Date().toISOString().split('T')[0] }
          : invoice
      ));
      toast.success('Hóa đơn đã được đánh dấu là đã thanh toán');
    } catch (err: any) {
      toast.error('Không thể cập nhật trạng thái hóa đơn');
    }
  };

  const handleSendReminder = async (invoiceId: string) => {
    try {
      // In a real application, this would send an email/SMS reminder
      toast.success('Lời nhắc thanh toán đã được gửi đến bệnh nhân');
    } catch (err: any) {
      toast.error('Không thể gửi lời nhắc');
    }
  };

  const exportInvoices = () => {
    const csvContent = [
      ['Mã hóa đơn', 'Bệnh nhân', 'Bác sĩ', 'Số tiền', 'Trạng thái', 'Ngày lập', 'Ngày đến hạn', 'Dịch vụ'].join(','),
      ...filteredInvoices.map(invoice => [
        invoice.id,
        invoice.patientName,
        invoice.doctorName,
        invoice.amount,
        invoice.status,
        invoice.issueDate,
        invoice.dueDate,
        invoice.services.join('; ')
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoices_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid': return 'Đã thanh toán';
      case 'pending': return 'Chờ xử lý';
      case 'overdue': return 'Quá hạn';
      case 'cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'overdue': return '#ef4444';
      case 'cancelled': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Đang tải tổng quan thanh toán...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Tổng quan Thanh toán</h2>
        <div className={styles.headerActions}>
          <button onClick={exportInvoices} className={styles.exportButton}>
            Xuất hóa đơn
          </button>
          <button className={styles.newInvoiceButton}>
            Tạo hóa đơn
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ backgroundColor: '#dcfce7' }}>
            💰
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{formatCurrency(stats.totalRevenue)}</div>
            <div className={styles.statLabel}>Tổng doanh thu</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ backgroundColor: '#dbeafe' }}>
            📈
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{formatCurrency(stats.monthlyRevenue)}</div>
            <div className={styles.statLabel}>Doanh thu tháng</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ backgroundColor: '#fef3c7' }}>
            ⏳
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{formatCurrency(stats.pendingPayments)}</div>
            <div className={styles.statLabel}>Thanh toán chờ xử lý</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ backgroundColor: '#fecaca' }}>
            ⚠️
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{formatCurrency(stats.overduePayments)}</div>
            <div className={styles.statLabel}>Thanh toán quá hạn</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ backgroundColor: '#e0e7ff' }}>
            📄
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{stats.totalInvoices}</div>
            <div className={styles.statLabel}>Tổng hóa đơn</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ backgroundColor: '#f3e8ff' }}>
            📊
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{formatCurrency(stats.averageInvoiceAmount)}</div>
            <div className={styles.statLabel}>Hóa đơn trung bình</div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className={styles.section}>
        <div className={styles.filtersContainer}>
          <div className={styles.filterGroup}>
            <label>Trạng thái:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="paid">Đã thanh toán</option>
              <option value="pending">Chờ xử lý</option>
              <option value="overdue">Quá hạn</option>
              <option value="cancelled">Đã hủy</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label>Khoảng thời gian:</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className={styles.dateInput}
            />
            <span>đến</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className={styles.dateInput}
            />
          </div>

          <div className={styles.filterGroup}>
            <label>Tìm kiếm:</label>
            <input
              type="text"
              placeholder="Tìm kiếm hóa đơn..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Hóa đơn gần đây</h3>
        <div className={styles.tableContainer}>
          <table className={styles.invoicesTable}>
            <thead>
              <tr>
                <th>Mã hóa đơn</th>
                <th>Bệnh nhân</th>
                <th>Bác sĩ</th>
                <th>Số tiền</th>
                <th>Trạng thái</th>
                <th>Ngày lập</th>
                <th>Ngày đến hạn</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map(invoice => (
                <tr key={invoice.id}>
                  <td className={styles.invoiceId}>{invoice.id}</td>
                  <td>{invoice.patientName}</td>
                  <td>{invoice.doctorName}</td>
                  <td className={styles.amount}>{formatCurrency(invoice.amount)}</td>
                  <td>
                    <span 
                      className={styles.statusBadge}
                      style={{ backgroundColor: getStatusColor(invoice.status) }}
                    >
                      {getStatusText(invoice.status)}
                    </span>
                  </td>
                  <td>{new Date(invoice.issueDate).toLocaleDateString()}</td>
                  <td>{new Date(invoice.dueDate).toLocaleDateString()}</td>
                  <td className={styles.actions}>
                    <button
                      onClick={() => {
                        setSelectedInvoice(invoice);
                        setShowInvoiceModal(true);
                      }}
                      className={styles.viewButton}
                    >
                      Xem
                    </button>
                    {invoice.status !== 'paid' && (
                      <>
                        <button
                          onClick={() => handleMarkAsPaid(invoice.id)}
                          className={styles.paidButton}
                        >
                          Đánh dấu đã thanh toán
                        </button>
                        <button
                          onClick={() => handleSendReminder(invoice.id)}
                          className={styles.reminderButton}
                        >
                          Nhắc nhở
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Methods Section */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Phương thức thanh toán</h3>
        <div className={styles.paymentMethodsGrid}>
          {paymentMethods.map(method => (
            <div key={method.id} className={styles.paymentMethodCard}>
              <div className={styles.methodInfo}>
                <span className={styles.methodName}>{method.name}</span>
                <span className={styles.methodType}>{method.type}</span>
              </div>
              <div className={styles.methodStatus}>
                <span className={method.isActive ? styles.active : styles.inactive}>
                  {method.isActive ? 'Hoạt động' : 'Không hoạt động'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Invoice Detail Modal */}
      {showInvoiceModal && selectedInvoice && (
        <div className={styles.modalOverlay} onClick={() => setShowInvoiceModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Chi tiết hóa đơn</h3>
              <button 
                onClick={() => setShowInvoiceModal(false)}
                className={styles.closeButton}
              >
                ×
              </button>
            </div>
            <div className={styles.modalContent}>
              <div className={styles.invoiceDetails}>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Mã hóa đơn:</span>
                  <span>{selectedInvoice.id}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Bệnh nhân:</span>
                  <span>{selectedInvoice.patientName}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Bác sĩ:</span>
                  <span>{selectedInvoice.doctorName}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Số tiền:</span>
                  <span className={styles.amount}>{formatCurrency(selectedInvoice.amount)}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Trạng thái:</span>
                  <span 
                    className={styles.statusBadge}
                    style={{ backgroundColor: getStatusColor(selectedInvoice.status) }}
                  >
                    {getStatusText(selectedInvoice.status)}
                  </span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Ngày lập:</span>
                  <span>{new Date(selectedInvoice.issueDate).toLocaleDateString()}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Ngày đến hạn:</span>
                  <span>{new Date(selectedInvoice.dueDate).toLocaleDateString()}</span>
                </div>
                {selectedInvoice.paidDate && (
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Ngày thanh toán:</span>
                    <span>{new Date(selectedInvoice.paidDate).toLocaleDateString()}</span>
                  </div>
                )}
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Dịch vụ:</span>
                  <div className={styles.servicesList}>
                    {selectedInvoice.services.map((service, index) => (
                      <span key={index} className={styles.serviceItem}>{service}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.modalActions}>
              <button className={styles.printButton}>In hóa đơn</button>
              <button className={styles.emailButton}>Gửi Email</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingOverview;
