function Pagination({ pagination, onPageChange }) {
  const { page = 1, totalPages = 1 } = pagination || {};
  return (
    <div className="pagination">
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
      >
        Trang trước
      </button>
      <span>
        Trang {page} / {totalPages || 1}
      </span>
      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= (totalPages || 1)}
      >
        Trang sau
      </button>
    </div>
  );
}

export default Pagination;
