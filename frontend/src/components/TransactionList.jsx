const formatCurrency = (value = 0) => Number(value || 0).toLocaleString('vi-VN');
const formatDateTime = (isoString) => {
  const d = new Date(isoString);
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

function TransactionList({ transactions, onEdit, onDelete }) {
  if (!transactions?.length) {
    return (
      <div className="panel">
        <div className="empty">Chưa có giao dịch</div>
      </div>
    );
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>Lịch sử giao dịch</h2>
      </div>
      <div className="transaction-list">
        {transactions.map((t) => (
          <div key={t._id} className="transaction-card">
            <div className={`icon ${t.type === 'income' ? 'income' : 'expense'}`}>
              {t.type === 'income' ? '+' : '-'}
            </div>
            <div className="info">
              <div className="title">{t.note || 'Không có ghi chú'}</div>
              <div className="transaction-meta">
                {(t.categoryName || t.category || 'Danh mục')} • {formatDateTime(t.date || Date.now())}
              </div>
            </div>
            <div className="amount-row">
              <span className={`amount ${t.type === 'income' ? 'income' : 'expense'}`}>
                {t.type === 'income' ? '+' : '-'}
                {formatCurrency(t.amount)}
              </span>
              <div className="actions">
                <button type="button" onClick={() => onEdit(t)} aria-label="Sửa giao dịch">
                  ✏
                </button>
                <button
                  type="button"
                  className="danger"
                  onClick={() => onDelete(t)}
                  aria-label="Xóa giao dịch"
                >
                  🗑
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TransactionList;
