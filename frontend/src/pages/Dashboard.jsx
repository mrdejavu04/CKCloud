import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import SummaryCards from '../components/SummaryCards';
import TransactionForm from '../components/TransactionForm';
import TransactionList from '../components/TransactionList';
import Pagination from '../components/Pagination';
import RemindersSection from '../components/RemindersSection';
import MonthlyChart from '../components/MonthlyChart';
import InvoiceBanner from '../components/InvoiceBanner';

const DEFAULT_FORM = {
  type: 'expense',
  categoryName: '',
  note: '',
  date: '',
};

function Dashboard() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 5, totalPages: 1, total: 0 });
  const [summary, setSummary] = useState({ totalIncome: 0, totalExpense: 0, balance: 0, byCategory: [] });
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [amountInput, setAmountInput] = useState('');
  const [amountValue, setAmountValue] = useState(0);
  const [dateTime, setDateTime] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pendingInvoices, setPendingInvoices] = useState(0);
  const [pendingList, setPendingList] = useState([]);
  const [userName, setUserName] = useState('');
  const [remindersRefresh, setRemindersRefresh] = useState(0);

  const pad = (n) => n.toString().padStart(2, '0');
  const buildCurrentDateTime = (value) => {
    const d = value ? new Date(value) : new Date();
    d.setSeconds(0, 0);
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const min = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  };

  const fetchSummary = async () => {
    try {
      const res = await axiosClient.get('/reports/summary');
      setSummary({
        totalIncome: res.data?.totalIncome || 0,
        totalExpense: res.data?.totalExpense || 0,
        balance: res.data?.balance || 0,
        byCategory: res.data?.byCategory || [],
      });
    } catch {
      // ignore summary errors
    }
  };

  const fetchTransactions = async (targetPage = 1) => {
    setLoading(true);
    setError('');
    try {
      const res = await axiosClient.get('/transactions', {
        params: { page: targetPage, limit: pagination.limit || 5 },
      });
      const data = res.data?.data || res.data?.transactions || [];
      const meta = res.data?.pagination || {
        page: targetPage,
        limit: pagination.limit || 5,
        total: data.length,
        totalPages: res.data?.pagination?.totalPages || 1,
      };
      setTransactions(data);
      setPagination({ ...meta, page: targetPage });
      fetchSummary();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError('Có lỗi xảy ra');
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }
    setDateTime(buildCurrentDateTime());
    fetchTransactions(1);
    fetchPendingInvoices();
    fetchUser();
  }, [navigate]);

  const fetchPendingInvoices = async () => {
    try {
      const res = await axiosClient.get('/reminders/summary');
      setPendingInvoices(res.data?.pendingInvoices || 0);
      setPendingList(res.data?.pendingList || []);
    } catch {
      setPendingInvoices(0);
      setPendingList([]);
    }
  };

  const fetchUser = async () => {
    try {
      const res = await axiosClient.get('/auth/me');
      setUserName(res.data?.user?.name || '');
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/');
      }
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAmountChange = (e) => {
    const digitsOnly = e.target.value.replace(/\D/g, '');
    const numeric = Number(digitsOnly || 0);
    setAmountValue(numeric);
    setAmountInput(digitsOnly ? numeric.toLocaleString('vi-VN') : '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      amount: Number(amountValue),
      type: formData.type,
      categoryName: formData.categoryName,
      note: formData.note,
      dateTime,
    };

    try {
      if (editingId) {
        await axiosClient.put(`/transactions/${editingId}`, payload);
      } else {
        await axiosClient.post('/transactions', payload);
      }
      setFormData(DEFAULT_FORM);
      setAmountInput('');
      setAmountValue(0);
      setDateTime(buildCurrentDateTime());
      setEditingId(null);
      fetchTransactions(pagination.page || 1);
      fetchPendingInvoices();
      setRemindersRefresh((prev) => prev + 1);
    } catch (err) {
      setError('Có lỗi xảy ra');
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/');
      }
    }
  };

  const handleEdit = (transaction) => {
    setEditingId(transaction._id);
    setFormData({
      type: transaction.type || 'expense',
      categoryName: transaction.categoryName || transaction.category || '',
      note: transaction.note || '',
      date: transaction.date,
    });
    setAmountValue(Number(transaction.amount || 0));
    setAmountInput(Number(transaction.amount || 0).toLocaleString('vi-VN'));
    setDateTime(buildCurrentDateTime(transaction.date));
  };

  const handleDelete = async (transaction) => {
    const confirmDelete = window.confirm('Bạn có chắc muốn xóa giao dịch này?');
    if (!confirmDelete) return;

    try {
      await axiosClient.delete(`/transactions/${transaction._id}`);
      const nextPage = transactions.length === 1 && (pagination.page || 1) > 1 ? (pagination.page || 1) - 1 : pagination.page;
      fetchTransactions(nextPage);
    } catch (err) {
      setError('Có lỗi xảy ra');
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > (pagination.totalPages || 1)) return;
    fetchTransactions(newPage);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  const handleReminderPaid = () => {
    fetchPendingInvoices();
    fetchTransactions(pagination.page || 1);
  };

  return (
    <div className="dashboard">
      <header className="header">
        <div>
          <h1>Quản lý chi tiêu</h1>
          <p>Theo dõi thu chi, nhắc nhở hóa đơn</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="muted">Xin chào, {userName || 'bạn'}</span>
          <button type="button" className="ghost" onClick={handleLogout}>
            Đăng xuất
          </button>
        </div>
      </header>
      <InvoiceBanner pending={pendingInvoices} pendingList={pendingList} />

      <SummaryCards
        totalIncome={summary.totalIncome}
        totalExpense={summary.totalExpense}
        balance={summary.balance}
      />

      <div className="grid">
        <TransactionForm
          formData={formData}
          onChange={handleFormChange}
          onSubmit={handleSubmit}
          isEditing={!!editingId}
          onCancel={() => {
            setEditingId(null);
            setFormData(DEFAULT_FORM);
            setAmountInput('');
            setAmountValue(0);
            setDateTime(buildCurrentDateTime());
          }}
          amountInput={amountInput}
          onAmountChange={handleAmountChange}
          dateTime={dateTime}
          onDateTimeChange={(e) => setDateTime(e.target.value)}
        />

        <div className="panel">
          <div className="panel-header">
            <h2>Chi tiêu theo danh mục</h2>
          </div>
          <div className="category-table">
            <div className="category-row header">
              <span>Danh mục</span>
              <span>Tổng chi (VND)</span>
            </div>
            {(summary.byCategory || []).map((item) => (
              <div key={item.categoryName} className="category-row">
                <span>{item.categoryName}</span>
                <span>{Number(item.total || 0).toLocaleString('vi-VN')}</span>
              </div>
            ))}
            {!summary.byCategory?.length && <div className="muted">Chưa có dữ liệu</div>}
          </div>
        </div>
      </div>

      <MonthlyChart />

      <TransactionList transactions={transactions} onEdit={handleEdit} onDelete={handleDelete} />
      <Pagination pagination={pagination} onPageChange={handlePageChange} />
      {loading && <div className="muted">Đang tải...</div>}
      {error && <div className="error">{error}</div>}

      <RemindersSection refreshKey={remindersRefresh} onPaid={handleReminderPaid} />
    </div>
  );
}

export default Dashboard;
