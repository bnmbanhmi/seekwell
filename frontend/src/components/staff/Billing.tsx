import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './Billing.module.css';

const BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || '').replace(/\/+$/, '');

interface Patient {
  id: number;
  full_name: string;
  phone_number?: string;
  email?: string;
  address?: string;
}

interface BillItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Invoice {
  id: string;
  patientId: number;
  patient?: Patient;
  items: BillItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  createdDate: string;
  dueDate: string;
  paidDate?: string;
  notes?: string;
}

interface PaymentRecord {
  id: string;
  invoiceId: string;
  amount: number;
  method: 'cash' | 'card' | 'insurance' | 'bank_transfer';
  date: string;
  reference?: string;
}

const Billing: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [newInvoice, setNewInvoice] = useState<Partial<Invoice>>({
    items: [],
    subtotal: 0,
    tax: 0,
    discount: 0,
    total: 0,
    status: 'draft',
  });
  const [newItem, setNewItem] = useState<Partial<BillItem>>({
    description: '',
    quantity: 1,
    unitPrice: 0,
  });
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentRecord['method']>('cash');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Invoice['status']>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPatients();
    loadInvoices();
  }, []);

  const fetchPatients = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${BACKEND_URL}/patients`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPatients(response.data);
    } catch (err) {
      console.error('Failed to fetch patients:', err);
      setError('Failed to load patients.');
    } finally {
      setLoading(false);
    }
  };

  const loadInvoices = () => {
    // Load from localStorage (in a real app, this would be from backend)
    const stored = localStorage.getItem('clinicInvoices');
    if (stored) {
      const invoicesData = JSON.parse(stored);
      // Enrich with patient data when available
      setInvoices(invoicesData);
    }
  };

  const saveInvoices = (invoicesData: Invoice[]) => {
    localStorage.setItem('clinicInvoices', JSON.stringify(invoicesData));
    setInvoices(invoicesData);
  };

  const calculateItemTotal = (item: Partial<BillItem>) => {
    return (item.quantity || 0) * (item.unitPrice || 0);
  };

  const calculateInvoiceTotal = (items: BillItem[], discount: number = 0, taxRate: number = 0.1) => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * taxRate;
    const total = subtotal + tax - discount;
    return { subtotal, tax, total };
  };

  const addItemToInvoice = () => {
    if (!newItem.description || !newItem.quantity || !newItem.unitPrice) {
      alert('Please fill in all item fields');
      return;
    }

    const item: BillItem = {
      id: Date.now().toString(),
      description: newItem.description!,
      quantity: newItem.quantity!,
      unitPrice: newItem.unitPrice!,
      total: calculateItemTotal(newItem),
    };

    const updatedItems = [...(newInvoice.items || []), item];
    const totals = calculateInvoiceTotal(updatedItems, newInvoice.discount);

    setNewInvoice({
      ...newInvoice,
      items: updatedItems,
      ...totals,
    });

    setNewItem({
      description: '',
      quantity: 1,
      unitPrice: 0,
    });
  };

  const removeItemFromInvoice = (itemId: string) => {
    const updatedItems = (newInvoice.items || []).filter(item => item.id !== itemId);
    const totals = calculateInvoiceTotal(updatedItems, newInvoice.discount);

    setNewInvoice({
      ...newInvoice,
      items: updatedItems,
      ...totals,
    });
  };

  const createInvoice = () => {
    if (!selectedPatient || !newInvoice.items?.length) {
      alert('Please select a patient and add at least one item');
      return;
    }

    const invoice: Invoice = {
      id: Date.now().toString(),
      patientId: selectedPatient.id,
      patient: selectedPatient,
      items: newInvoice.items!,
      subtotal: newInvoice.subtotal!,
      tax: newInvoice.tax!,
      discount: newInvoice.discount || 0,
      total: newInvoice.total!,
      status: 'draft',
      createdDate: new Date().toISOString(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      notes: newInvoice.notes,
    };

    const existingInvoices = JSON.parse(localStorage.getItem('clinicInvoices') || '[]');
    saveInvoices([...existingInvoices, invoice]);

    // Reset form
    setNewInvoice({
      items: [],
      subtotal: 0,
      tax: 0,
      discount: 0,
      total: 0,
      status: 'draft',
    });
    setSelectedPatient(null);
    setShowCreateInvoice(false);

    alert('Invoice created successfully!');
  };

  const processPayment = () => {
    if (!selectedInvoice || paymentAmount <= 0) {
      alert('Please enter a valid payment amount');
      return;
    }

    const payment: PaymentRecord = {
      id: Date.now().toString(),
      invoiceId: selectedInvoice.id,
      amount: paymentAmount,
      method: paymentMethod,
      date: new Date().toISOString(),
      reference: `PAY-${Date.now()}`,
    };

    // Update invoice status
    const updatedInvoices = invoices.map(invoice =>
      invoice.id === selectedInvoice.id
        ? { 
            ...invoice, 
            status: paymentAmount >= invoice.total ? 'paid' : invoice.status,
            paidDate: paymentAmount >= invoice.total ? new Date().toISOString() : undefined,
          }
        : invoice
    );

    saveInvoices(updatedInvoices);

    // Save payment record
    const existingPayments = JSON.parse(localStorage.getItem('clinicPayments') || '[]');
    localStorage.setItem('clinicPayments', JSON.stringify([...existingPayments, payment]));

    setShowPaymentModal(false);
    setSelectedInvoice(null);
    setPaymentAmount(0);

    alert('Payment processed successfully!');
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.patient?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         invoice.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: Invoice['status']) => {
    const statusClasses = {
      'draft': styles.statusDraft,
      'sent': styles.statusSent,
      'paid': styles.statusPaid,
      'overdue': styles.statusOverdue,
    };
    return statusClasses[status];
  };

  const getStatusLabel = (status: Invoice['status']) => {
    const labels = {
      'draft': 'Draft',
      'sent': 'Sent',
      'paid': 'Paid',
      'overdue': 'Overdue',
    };
    return labels[status];
  };

  const getTotalStats = () => {
    const totalRevenue = invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.total, 0);
    const pendingAmount = invoices.filter(inv => inv.status === 'sent').reduce((sum, inv) => sum + inv.total, 0);
    const overdueAmount = invoices.filter(inv => inv.status === 'overdue').reduce((sum, inv) => sum + inv.total, 0);
    
    return {
      totalInvoices: invoices.length,
      totalRevenue,
      pendingAmount,
      overdueAmount,
    };
  };

  const stats = getTotalStats();

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading billing data...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Billing & Invoices</h2>
        <p className={styles.subtitle}>Manage patient billing and payment processing</p>
      </div>

      {error && (
        <div className={styles.error}>{error}</div>
      )}

      {/* Statistics */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>📋</div>
          <div className={styles.statInfo}>
            <h4>Total Invoices</h4>
            <p className={styles.statNumber}>{stats.totalInvoices}</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>💰</div>
          <div className={styles.statInfo}>
            <h4>Total Revenue</h4>
            <p className={styles.statNumber}>${stats.totalRevenue.toFixed(2)}</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>⏳</div>
          <div className={styles.statInfo}>
            <h4>Pending Amount</h4>
            <p className={styles.statNumber}>${stats.pendingAmount.toFixed(2)}</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>⚠️</div>
          <div className={styles.statInfo}>
            <h4>Overdue Amount</h4>
            <p className={styles.statNumber}>${stats.overdueAmount.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className={styles.controls}>
        <div className={styles.searchAndFilter}>
          <input
            type="text"
            placeholder="Search invoices by patient name or invoice ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className={styles.filterSelect}
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
        <button
          className={styles.createButton}
          onClick={() => setShowCreateInvoice(true)}
        >
          Create Invoice
        </button>
      </div>

      {/* Invoices List */}
      <div className={styles.invoicesList}>
        <h3 className={styles.sectionTitle}>Invoices</h3>
        {filteredInvoices.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No invoices found</p>
          </div>
        ) : (
          <div className={styles.invoicesTable}>
            <div className={styles.tableHeader}>
              <div>Invoice ID</div>
              <div>Patient</div>
              <div>Date</div>
              <div>Amount</div>
              <div>Status</div>
              <div>Actions</div>
            </div>
            {filteredInvoices.map((invoice) => (
              <div key={invoice.id} className={styles.tableRow}>
                <div className={styles.invoiceId}>#{invoice.id.slice(-6)}</div>
                <div>{invoice.patient?.full_name || 'Unknown Patient'}</div>
                <div>{new Date(invoice.createdDate).toLocaleDateString()}</div>
                <div className={styles.amount}>${invoice.total.toFixed(2)}</div>
                <div>
                  <span className={`${styles.statusBadge} ${getStatusBadge(invoice.status)}`}>
                    {getStatusLabel(invoice.status)}
                  </span>
                </div>
                <div className={styles.actions}>
                  {invoice.status !== 'paid' && (
                    <button
                      className={styles.payButton}
                      onClick={() => {
                        setSelectedInvoice(invoice);
                        setPaymentAmount(invoice.total);
                        setShowPaymentModal(true);
                      }}
                    >
                      Process Payment
                    </button>
                  )}
                  <button className={styles.viewButton}>View</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Invoice Modal */}
      {showCreateInvoice && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Create New Invoice</h3>
              <button
                className={styles.closeButton}
                onClick={() => setShowCreateInvoice(false)}
              >
                ×
              </button>
            </div>

            <div className={styles.modalBody}>
              {/* Patient Selection */}
              <div className={styles.formGroup}>
                <label>Select Patient:</label>
                <select
                  value={selectedPatient?.id || ''}
                  onChange={(e) => {
                    const patient = patients.find(p => p.id === Number(e.target.value));
                    setSelectedPatient(patient || null);
                  }}
                  className={styles.select}
                >
                  <option value="">Choose a patient...</option>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.full_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Add Items */}
              <div className={styles.itemsSection}>
                <h4>Invoice Items</h4>
                <div className={styles.addItemForm}>
                  <input
                    type="text"
                    placeholder="Description"
                    value={newItem.description}
                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                    className={styles.input}
                  />
                  <input
                    type="number"
                    placeholder="Quantity"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
                    className={styles.inputSmall}
                  />
                  <input
                    type="number"
                    placeholder="Unit Price"
                    value={newItem.unitPrice}
                    onChange={(e) => setNewItem({ ...newItem, unitPrice: Number(e.target.value) })}
                    className={styles.inputSmall}
                  />
                  <button
                    type="button"
                    onClick={addItemToInvoice}
                    className={styles.addButton}
                  >
                    Add Item
                  </button>
                </div>

                {/* Items List */}
                {newInvoice.items && newInvoice.items.length > 0 && (
                  <div className={styles.itemsList}>
                    {newInvoice.items.map((item) => (
                      <div key={item.id} className={styles.itemRow}>
                        <div className={styles.itemDescription}>{item.description}</div>
                        <div>{item.quantity} × ${item.unitPrice.toFixed(2)}</div>
                        <div className={styles.itemTotal}>${item.total.toFixed(2)}</div>
                        <button
                          onClick={() => removeItemFromInvoice(item.id)}
                          className={styles.removeButton}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Totals */}
                {newInvoice.items && newInvoice.items.length > 0 && (
                  <div className={styles.totalsSection}>
                    <div className={styles.totalRow}>
                      <span>Subtotal:</span>
                      <span>${newInvoice.subtotal?.toFixed(2)}</span>
                    </div>
                    <div className={styles.totalRow}>
                      <span>Tax (10%):</span>
                      <span>${newInvoice.tax?.toFixed(2)}</span>
                    </div>
                    <div className={styles.totalRow}>
                      <span>Discount:</span>
                      <input
                        type="number"
                        value={newInvoice.discount}
                        onChange={(e) => {
                          const discount = Number(e.target.value);
                          const totals = calculateInvoiceTotal(newInvoice.items!, discount);
                          setNewInvoice({ ...newInvoice, discount, ...totals });
                        }}
                        className={styles.discountInput}
                      />
                    </div>
                    <div className={`${styles.totalRow} ${styles.finalTotal}`}>
                      <span>Total:</span>
                      <span>${newInvoice.total?.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className={styles.formGroup}>
                <label>Notes:</label>
                <textarea
                  value={newInvoice.notes || ''}
                  onChange={(e) => setNewInvoice({ ...newInvoice, notes: e.target.value })}
                  className={styles.textarea}
                  placeholder="Additional notes or instructions..."
                />
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                className={styles.cancelButton}
                onClick={() => setShowCreateInvoice(false)}
              >
                Cancel
              </button>
              <button
                className={styles.createInvoiceButton}
                onClick={createInvoice}
              >
                Create Invoice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedInvoice && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Process Payment</h3>
              <button
                className={styles.closeButton}
                onClick={() => setShowPaymentModal(false)}
              >
                ×
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.paymentInfo}>
                <h4>Invoice Details</h4>
                <p><strong>Patient:</strong> {selectedInvoice.patient?.full_name}</p>
                <p><strong>Invoice ID:</strong> #{selectedInvoice.id.slice(-6)}</p>
                <p><strong>Total Amount:</strong> ${selectedInvoice.total.toFixed(2)}</p>
              </div>

              <div className={styles.formGroup}>
                <label>Payment Amount:</label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className={styles.input}
                  step="0.01"
                  max={selectedInvoice.total}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Payment Method:</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentRecord['method'])}
                  className={styles.select}
                >
                  <option value="cash">Cash</option>
                  <option value="card">Credit/Debit Card</option>
                  <option value="insurance">Insurance</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                className={styles.cancelButton}
                onClick={() => setShowPaymentModal(false)}
              >
                Cancel
              </button>
              <button
                className={styles.processPaymentButton}
                onClick={processPayment}
              >
                Process Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Billing;
