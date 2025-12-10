function InvoiceBanner({ pending, pendingList = [] }) {
  if (pending > 0) {
    const names = pendingList.slice(0, 3).map((r) => r.title).join(', ');
    const hasMore = pending > 3;
    return (
      <div className="invoice-banner warning">
        Bạn đang có {pending} hóa đơn chưa thanh toán
        {names ? `: ${names}` : ''}
        {hasMore ? ' ...' : ''}.
      </div>
    );
  }
  return (
    <div className="invoice-banner ok">
      Hiện tại bạn không có hóa đơn nào chưa thanh toán.
    </div>
  );
}

export default InvoiceBanner;
