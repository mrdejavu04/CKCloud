const formatCurrency = (value = 0) => Number(value || 0).toLocaleString('vi-VN');

function SummaryCards({ totalIncome, totalExpense, balance }) {
  return (
    <div className="summary-cards">
      <div className="card income">
        <p className="label">Thu nhập</p>
        <p className="value">+{formatCurrency(totalIncome)} VND</p>
      </div>
      <div className="card expense">
        <p className="label">Chi tiêu</p>
        <p className="value">-{formatCurrency(totalExpense)} VND</p>
      </div>
      <div className="card balance">
        <p className="label">Số dư</p>
        <p className="value">{formatCurrency(balance)} VND</p>
      </div>
    </div>
  );
}

export default SummaryCards;
