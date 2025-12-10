import { useEffect, useState } from 'react';
import { PieChart, Pie, Tooltip, Legend, Cell } from 'recharts';
import axiosClient from '../api/axiosClient';

const COLORS = ['#2f6fed', '#d9480f', '#2f9e44', '#f59f00', '#845ef7', '#15aabf'];

const getMonthName = (m) => `Tháng ${m}`;

function MonthlyChart() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const totalExpense = chartData.reduce((sum, item) => sum + (item.total || 0), 0);
  const sorted = [...chartData].sort((a, b) => (b.total || 0) - (a.total || 0));
  const top = sorted.slice(0, 5);
  const others = sorted.slice(5);
  const othersTotal = others.reduce((sum, item) => sum + (item.total || 0), 0);
  const pieData = othersTotal > 0 ? [...top, { categoryName: 'Khác', total: othersTotal }] : top;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await axiosClient.get('/reports/by-category', {
          params: { year, month },
        });
        setChartData(res.data?.byCategory || []);
      } catch (err) {
        setError('Không tải được dữ liệu');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [year, month]);

  const prevMonth = () => setMonth((m) => (m === 1 ? 12 : m - 1));
  const nextMonth = () => setMonth((m) => (m === 12 ? 1 : m + 1));

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>Chi tiêu theo danh mục (tháng)</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button type="button" className="ghost" onClick={prevMonth}>
            Tháng trước
          </button>
          <strong>{getMonthName(month)} / {year}</strong>
          <button type="button" className="ghost" onClick={nextMonth}>
            Tháng sau
          </button>
          <input
            type="number"
            min="2000"
            max="2100"
            value={year}
            onChange={(e) => setYear(Number(e.target.value) || now.getFullYear())}
            style={{ width: 90 }}
          />
        </div>
      </div>
      {loading && <div className="muted">Đang tải...</div>}
      {error && <div className="error">{error}</div>}
      {!loading && chartData.length === 0 && <div className="muted">Chưa có dữ liệu</div>}
      {!loading && chartData.length > 0 && (
        <>
          <div className="muted" style={{ marginBottom: 8 }}>
            Tổng chi tiêu tháng: {Number(totalExpense).toLocaleString('vi-VN')} VND
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <PieChart width={400} height={300}>
              <Pie
                data={pieData}
                dataKey="total"
                nameKey="categoryName"
                outerRadius={120}
                label={false}
              >
                {pieData.map((entry, index) => (
                  <Cell key={entry.categoryName} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
            <div className="category-table" style={{ minWidth: 220 }}>
              <div className="category-row header">
                <span>Danh mục</span>
                <span>Tổng chi</span>
              </div>
              {pieData.map((item) => (
                <div key={item.categoryName} className="category-row">
                  <span>{item.categoryName}</span>
                  <span>{Number(item.total || 0).toLocaleString('vi-VN')}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default MonthlyChart;
