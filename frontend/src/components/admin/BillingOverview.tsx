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
        totalRevenue: 125000,
        monthlyRevenue: 18500,
        pendingPayments: 5200,
        overduePayments: 1800,
        totalInvoices: 342,
        paidInvoices: 298,
        unpaidInvoices: 44,
        averageInvoiceAmount: 365
      };

      const mockInvoices: Invoice[] = [
        {
          id: 'INV-2024-001',
          patientName: 'John Smith',
          patientId: 101,
          doctorName: 'Dr. Johnson',
          amount: 250,
          status: 'pending',
          issueDate: '2024-12-01',
          dueDate: '2024-12-15',
          services: ['Consultation', 'Blood Test']
        },
        {
          id: 'INV-2024-002',
          patientName: 'Sarah Connor',
          patientId: 102,
          doctorName: 'Dr. Smith',
          amount: 480,
          status: 'paid',
          issueDate: '2024-11-28',
          dueDate: '2024-12-12',
          paidDate: '2024-12-10',
          services: ['X-Ray', 'Consultation', 'Prescription']
        },
        {
          id: 'INV-2024-003',
          patientName: 'Mike Johnson',
          patientId: 103,
          doctorName: 'Dr. Brown',
          amount: 150,
          status: 'overdue',
          issueDate: '2024-11-15',
          dueDate: '2024-11-30',
          services: ['Consultation']
        },
        {
          id: 'INV-2024-004',
          patientName: 'Emma Wilson',
          patientId: 104,
          doctorName: 'Dr. Davis',
          amount: 320,
          status: 'paid',
          issueDate: '2024-12-02',
          dueDate: '2024-12-16',
          paidDate: '2024-12-08',
          services: ['Surgery Consultation', 'Lab Tests']
        },
        {
          id: 'INV-2024-005',
          patientName: 'Robert Brown',
          patientId: 105,
          doctorName: 'Dr. Johnson',
          amount: 200,
          status: 'pending',
          issueDate: '2024-12-05',
          dueDate: '2024-12-19',
          services: ['Follow-up Consultation']
        }
      ];

      setStats(mockStats);
      setInvoices(mockInvoices);
    } catch (err: any) {
      console.error('Error loading billing data:', err);
      toast.error('Failed to load billing data');
    } finally {
      setLoading(false);
    }
  };

  const loadPaymentMethods = () => {
    const mockMethods: PaymentMethod[] = [
      { id: '1', name: 'Cash', type: 'cash', isActive: true },
      { id: '2', name: 'Credit Card', type: 'card', isActive: true },
      { id: '3', name: 'Debit Card', type: 'card', isActive: true },
      { id: '4', name: 'Insurance', type: 'insurance', isActive: true },
      { id: '5', name: 'Bank Transfer', type: 'transfer', isActive: true }
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
      toast.success('Invoice marked as paid');
    } catch (err: any) {
      toast.error('Failed to update invoice status');
    }
  };

  const handleSendReminder = async (invoiceId: string) => {
    try {
      // In a real application, this would send an email/SMS reminder
      toast.success('Payment reminder sent to patient');
    } catch (err: any) {
      toast.error('Failed to send reminder');
    }
  };

  const exportInvoices = () => {
    const csvContent = [
      ['Invoice ID', 'Patient', 'Doctor', 'Amount', 'Status', 'Issue Date', 'Due Date', 'Services'].join(','),
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
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading billing overview...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Billing Overview</h2>
        <div className={styles.headerActions}>
          <button onClick={exportInvoices} className={styles.exportButton}>
            Export Invoices
          </button>
          <button className={styles.newInvoiceButton}>
            Create Invoice
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
            <div className={styles.statLabel}>Total Revenue</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ backgroundColor: '#dbeafe' }}>
            📈
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{formatCurrency(stats.monthlyRevenue)}</div>
            <div className={styles.statLabel}>Monthly Revenue</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ backgroundColor: '#fef3c7' }}>
            ⏳
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{formatCurrency(stats.pendingPayments)}</div>
            <div className={styles.statLabel}>Pending Payments</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ backgroundColor: '#fecaca' }}>
            ⚠️
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{formatCurrency(stats.overduePayments)}</div>
            <div className={styles.statLabel}>Overdue Payments</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ backgroundColor: '#e0e7ff' }}>
            📄
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{stats.totalInvoices}</div>
            <div className={styles.statLabel}>Total Invoices</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ backgroundColor: '#f3e8ff' }}>
            📊
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{formatCurrency(stats.averageInvoiceAmount)}</div>
            <div className={styles.statLabel}>Average Invoice</div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className={styles.section}>
        <div className={styles.filtersContainer}>
          <div className={styles.filterGroup}>
            <label>Status:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">All Statuses</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label>Date Range:</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className={styles.dateInput}
            />
            <span>to</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className={styles.dateInput}
            />
          </div>

          <div className={styles.filterGroup}>
            <label>Search:</label>
            <input
              type="text"
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Recent Invoices</h3>
        <div className={styles.tableContainer}>
          <table className={styles.invoicesTable}>
            <thead>
              <tr>
                <th>Invoice ID</th>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Issue Date</th>
                <th>Due Date</th>
                <th>Actions</th>
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
                      {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
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
                      View
                    </button>
                    {invoice.status !== 'paid' && (
                      <>
                        <button
                          onClick={() => handleMarkAsPaid(invoice.id)}
                          className={styles.paidButton}
                        >
                          Mark Paid
                        </button>
                        <button
                          onClick={() => handleSendReminder(invoice.id)}
                          className={styles.reminderButton}
                        >
                          Remind
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
        <h3 className={styles.sectionTitle}>Payment Methods</h3>
        <div className={styles.paymentMethodsGrid}>
          {paymentMethods.map(method => (
            <div key={method.id} className={styles.paymentMethodCard}>
              <div className={styles.methodInfo}>
                <span className={styles.methodName}>{method.name}</span>
                <span className={styles.methodType}>{method.type}</span>
              </div>
              <div className={styles.methodStatus}>
                <span className={method.isActive ? styles.active : styles.inactive}>
                  {method.isActive ? 'Active' : 'Inactive'}
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
              <h3>Invoice Details</h3>
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
                  <span className={styles.detailLabel}>Invoice ID:</span>
                  <span>{selectedInvoice.id}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Patient:</span>
                  <span>{selectedInvoice.patientName}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Doctor:</span>
                  <span>{selectedInvoice.doctorName}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Amount:</span>
                  <span className={styles.amount}>{formatCurrency(selectedInvoice.amount)}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Status:</span>
                  <span 
                    className={styles.statusBadge}
                    style={{ backgroundColor: getStatusColor(selectedInvoice.status) }}
                  >
                    {selectedInvoice.status.charAt(0).toUpperCase() + selectedInvoice.status.slice(1)}
                  </span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Issue Date:</span>
                  <span>{new Date(selectedInvoice.issueDate).toLocaleDateString()}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Due Date:</span>
                  <span>{new Date(selectedInvoice.dueDate).toLocaleDateString()}</span>
                </div>
                {selectedInvoice.paidDate && (
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Paid Date:</span>
                    <span>{new Date(selectedInvoice.paidDate).toLocaleDateString()}</span>
                  </div>
                )}
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Services:</span>
                  <div className={styles.servicesList}>
                    {selectedInvoice.services.map((service, index) => (
                      <span key={index} className={styles.serviceItem}>{service}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.modalActions}>
              <button className={styles.printButton}>Print Invoice</button>
              <button className={styles.emailButton}>Send Email</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingOverview;
