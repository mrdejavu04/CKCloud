function TransactionForm({
  formData,
  onChange,
  onSubmit,
  isEditing,
  onCancel,
  amountInput,
  onAmountChange,
  dateTime,
  onDateTimeChange,
  amountSuggestions = [],
}) {
  return (
    <div className="panel">
      <div className="panel-header">
        <h2>{isEditing ? 'Cập nhật giao dịch' : 'Thêm giao dịch'}</h2>
      </div>
      <form className="transaction-form" onSubmit={onSubmit}>
        <label>
          Loại
          <select
            name="type"
            value={formData.type}
            onChange={onChange}
            required
          >
            <option value="expense">Chi tiêu</option>
            <option value="income">Thu nhập</option>
          </select>
        </label>
        <label>
          Số tiền
          <input
            name="amountInput"
            inputMode="numeric"
            value={amountInput}
            onChange={onAmountChange}
            list="amount-suggestions"
            autoComplete="off"
            required
          />
          <datalist id="amount-suggestions">
            {amountSuggestions.map((amt) => (
              <option key={amt} value={Number(amt).toLocaleString('vi-VN')} />
            ))}
          </datalist>
        </label>
        <label>
          Danh mục
          <input
            name="categoryName"
            type="text"
            value={formData.categoryName}
            onChange={onChange}
            required
            autoComplete="off"
          />
        </label>
        <label className="wide">
          Ghi chú
          <input
            name="note"
            type="text"
            value={formData.note}
            onChange={onChange}
            placeholder="Nhập ghi chú"
            autoComplete="off"
          />
        </label>
        <label>
          Thời gian
          <input
            type="datetime-local"
            value={dateTime}
            onChange={onDateTimeChange}
            required
          />
        </label>
        <div className="form-actions">
          {isEditing && (
            <button type="button" className="ghost" onClick={onCancel}>
              Hủy
            </button>
          )}
          <button type="submit">{isEditing ? 'Cập nhật' : 'Lưu'}</button>
        </div>
      </form>
    </div>
  );
}

export default TransactionForm;
