import { useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';

const statusClass = {
  overdue: 'badge overdue',
  upcoming: 'badge upcoming',
  paid: 'badge paid',
  pending: 'badge pending',
};

const formatCurrency = (value) => {
  if (!value) return '';
  return Number(value).toLocaleString('vi-VN');
};

function RemindersSection({ refreshKey = 0, onPaid }) {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ title: '', dueDate: '' });
  const [rawAmount, setRawAmount] = useState('');
  const [displayAmount, setDisplayAmount] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchReminders = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axiosClient.get(`/reminders?page=${page}&limit=5`);
      setReminders(res.data?.data || []);
      setTotalPages(res.data?.pagination?.totalPages || 1);
    } catch (err) {
      setError('Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, [refreshKey, page]);

  useEffect(() => {
    const now = new Date();
    const pad = (n) => n.toString().padStart(2, '0');
    const yyyy = now.getFullYear();
    const mm = pad(now.getMonth() + 1);
    const dd = pad(now.getDate());
    setForm((prev) => ({ ...prev, dueDate: `${yyyy}-${mm}-${dd}` }));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAmountChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    setRawAmount(value);
    setDisplayAmount(formatCurrency(value));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axiosClient.post('/reminders', {
        title: form.title,
        amount: Number(rawAmount),
        dueDate: form.dueDate,
      });
      const now = new Date();
      const pad = (n) => n.toString().padStart(2, '0');
      const yyyy = now.getFullYear();
      const mm = pad(now.getMonth() + 1);
      const dd = pad(now.getDate());
      setForm({ title: '', dueDate: `${yyyy}-${mm}-${dd}` });
      setRawAmount('');
      setDisplayAmount('');
      setShowForm(false);
      setPage(1);
      fetchReminders();
    } catch (err) {
      setError('Có lỗi xảy ra');
    }
  };

  const markPaid = async (id) => {
    const confirmPaid = window.confirm('Xác nhận đã thanh toán?');
    if (!confirmPaid) return;
    try {
      await axiosClient.put(`/reminders/${id}`, { status: 'paid' });
      fetchReminders();
      if (onPaid) onPaid();
    } catch (err) {
      setError('Có lỗi xảy ra');
    }
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>Nhắc nhở thanh toán</h2>
        <button type="button" className="ghost" onClick={() => setShowForm((v) => !v)}>
          {showForm ? '×' : '+'}
        </button>
      </div>
      {showForm && (
        <form className="reminder-form" onSubmit={handleSubmit}>
          <input
            name="title"
            placeholder="Tên hóa đơn"
            value={form.title}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            placeholder="Số tiền"
            value={displayAmount}
            onChange={handleAmountChange}
            required
          />
          <input
            name="dueDate"
            type="date"
            value={form.dueDate}
            onChange={handleChange}
            required
          />
          <button type="submit">Thêm nhắc nhở</button>
        </form>
      )}
      {loading && <div className="muted">Đang tải...</div>}
      {error && <div className="error">{error}</div>}
      <div className="reminder-list">
        {reminders.map((r) => (
          <div key={r._id} className="reminder-card">
            <div>
              <div className="title-row">
                <strong>{r.title}</strong>
                <span className={statusClass[r.statusLabel] || 'badge pending'}>
                  {r.statusLabel}
                </span>
              </div>
              <div className="muted">
                {Number(r.amount || 0).toLocaleString('vi-VN')} VND •{' '}
                {new Date(r.dueDate).toLocaleDateString('vi-VN')}
              </div>
            </div>
            <button
              type="button"
              className="ghost"
              disabled={r.status === 'paid'}
              onClick={() => markPaid(r._id)}
            >
              Đã thanh toán
            </button>
          </div>
        ))}
        {!reminders.length && !loading && <div className="muted">Chưa có nhắc nhở</div>}
      </div>
      <div className="pagination" style={{ marginTop: 8 }}>
        <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
          Trang trước
        </button>
        <span>
          Trang {page} / {totalPages}
        </span>
        <button
          type="button"
          onClick={() => setPage((p) => (p < totalPages ? p + 1 : p))}
          disabled={page >= totalPages}
        >
          Trang sau
        </button>
      </div>
    </div>
  );
}

export default RemindersSection;
