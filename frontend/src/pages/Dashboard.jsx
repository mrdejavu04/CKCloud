import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';

function Dashboard() {
    const navigate = useNavigate();
    const [transactions, setTransactions] = useState([]);
    const [reminders, setReminders] = useState([
        { _id: "1", text: "Tiền điện", amount: 500000, dueDate: "2025-11-25" },
        { _id: "2", text: "Tiền nước", amount: 250000, dueDate: "2025-11-26" },
        { _id: "3", text: "Internet", amount: 200000, dueDate: "2025-11-27" }
    ]);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [amount, setAmount] = useState("");
    const [category, setCategory] = useState("Ăn uống");
    const [type, setType] = useState("expense");
    const [description, setDescription] = useState("");
    const [editingId, setEditingId] = useState(null);

    // Initialize selectedMonth with current month/year
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });

    const fetchData = async () => {
        try {
            const userRes = await axiosClient.get("/api/users/me").catch(() => null);
            if (userRes) setUser(userRes.data);

            const transRes = await axiosClient.get("/api/transactions");
            if (Array.isArray(transRes.data)) {
                setTransactions(transRes.data);
            } else if (transRes.data?.data) {
                setTransactions(transRes.data.data);
            } else if (transRes.data?.transactions) {
                setTransactions(transRes.data.transactions);
            } else {
                setTransactions([]);
            }

            // Fetch reminders if API exists
            try {
                const remindersRes = await axiosClient.get("/api/reminders");
                if (Array.isArray(remindersRes.data)) {
                    setReminders(remindersRes.data);
                } else if (remindersRes.data?.data) {
                    setReminders(remindersRes.data.data);
                } else if (remindersRes.data?.reminders) {
                    setReminders(remindersRes.data.reminders);
                }
            } catch (error) {
                console.error("Lỗi tải reminders:", error);
                // Keep the default reminders if API fails
            }
        } catch (error) {
            console.error("Lỗi tải dữ liệu:", error);
            if (error.response?.status === 401) {
                localStorage.removeItem("token");
                navigate("/");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/");
            return;
        }
        fetchData();
    }, [navigate]);

    // Helper function to filter transactions by selected month
    const getFilteredTransactions = () => {
        if (!transactions || transactions.length === 0) return [];

        const [selectedYear, selectedMonthNum] = selectedMonth.split('-');

        return transactions.filter(t => {
            const transDate = new Date(t.date || Date.now());
            const transYear = String(transDate.getFullYear());
            const transMonth = String(transDate.getMonth() + 1).padStart(2, '0');

            return transYear === selectedYear && transMonth === selectedMonthNum;
        });
    };

    const filteredTransactions = getFilteredTransactions();

    const handleAddTransaction = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                // Cập nhật giao dịch hiện có
                await axiosClient.put(`/api/transactions/${editingId}`, {
                    amount: Number(amount),
                    categoryName: category,
                    type,
                    note: description,
                    date: new Date().toISOString()
                });

                alert("Cập nhật thành công!");
                setEditingId(null);
            } else {
                // Thêm giao dịch mới
                await axiosClient.post("/api/transactions", {
                    amount: Number(amount),
                    categoryName: category,
                    type,
                    note: description,
                    date: new Date().toISOString()
                });

                alert("Thêm thành công!");
            }

            setAmount("");
            setDescription("");
            setCategory("Ăn uống");
            setType("expense");
            await fetchData();
        } catch (error) {
            alert("Lỗi: " + (error.response?.data?.message || error.message));
        }
    };

    const totalIncome = filteredTransactions.filter(t => t.type === "income").reduce((a, c) => a + Number(c.amount), 0);
    const totalExpense = filteredTransactions.filter(t => t.type === "expense").reduce((a, c) => a + Number(c.amount), 0);

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/");
    };

    const handleEditTransaction = (transaction) => {
        setEditingId(transaction._id);
        setAmount(String(transaction.amount));
        setCategory(transaction.category || transaction.categoryName);
        setType(transaction.type);
        setDescription(transaction.description || transaction.note || "");
        // Scroll to form
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleDeleteTransaction = async (id) => {
        if (window.confirm("Bạn chắc chắn muốn xóa giao dịch này?")) {
            try {
                await axiosClient.delete(`/api/transactions/${id}`);
                alert("Xóa thành công!");
                await fetchData();
            } catch (error) {
                alert("Lỗi xóa: " + (error.response?.data?.message || error.message));
            }
        }
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setAmount("");
        setDescription("");
        setCategory("Ăn uống");
        setType("expense");
    };

    if (loading) return (
        <div style={{
            display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh",
            background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)", color: "#1e3c72", fontSize: "16px"
        }}>
            Đang tải dữ liệu...
        </div>
    );

    return (
        <div style={{
            minHeight: "100vh",
            background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
            padding: "0",
            fontFamily: "'Segoe UI', sans-serif",
            color: "#333",
            display: "flex",
            flexDirection: "column"
        }}>
            <div style={{ width: "100%", flex: 1, display: "flex", flexDirection: "column" }}>

                {/* HEADER */}
                <div style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    marginBottom: "0", paddingTop: "20px", paddingBottom: "12px", paddingRight: "20px", paddingLeft: "20px", borderBottom: "2px solid rgba(30, 60, 114, 0.1)"
                }}>
                    <div>
                        <h1 style={{ margin: "0 0 3px 0", fontSize: "26px", fontWeight: "700", color: "#1e3c72", letterSpacing: "-0.3px" }}>
                            Ví của {user?.name || "Bạn"}
                        </h1>
                        <p style={{ margin: 0, fontSize: "12px", color: "#7a8fa6", fontWeight: "400" }}>Quản lý tài chính</p>
                    </div>
                    <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                        {/* Month Filter Dropdown */}
                        <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} style={{
                            padding: "10px 12px", borderRadius: "6px", border: "1px solid rgba(30, 60, 114, 0.2)",
                            background: "white", fontSize: "13px", fontWeight: "600", color: "#1e3c72", cursor: "pointer",
                            transition: "all 0.2s", boxShadow: "0 2px 6px rgba(30, 60, 114, 0.1)"
                        }}
                            onFocus={(e) => {
                                e.currentTarget.style.borderColor = "#1e3c72";
                                e.currentTarget.style.boxShadow = "0 3px 8px rgba(30, 60, 114, 0.15)";
                            }}
                            onBlur={(e) => {
                                e.currentTarget.style.borderColor = "rgba(30, 60, 114, 0.2)";
                                e.currentTarget.style.boxShadow = "0 2px 6px rgba(30, 60, 114, 0.1)";
                            }}>
                            {/* Generate last 12 months */}
                            {Array.from({ length: 12 }, (_, i) => {
                                const date = new Date();
                                date.setMonth(date.getMonth() - i);
                                const year = date.getFullYear();
                                const month = String(date.getMonth() + 1).padStart(2, '0');
                                const monthName = new Date(year, parseInt(month) - 1).toLocaleDateString("vi-VN", { month: "long", year: "numeric" });
                                return (
                                    <option key={`${year}-${month}`} value={`${year}-${month}`}>
                                        {`Tháng ${month}/${year}`}
                                    </option>
                                );
                            })}
                        </select>
                        <button onClick={handleLogout} style={{
                            background: "#1e3c72", color: "white", border: "none",
                            padding: "10px 20px", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontWeight: "600",
                            transition: "all 0.3s", boxShadow: "0 3px 10px rgba(30, 60, 114, 0.15)", whiteSpace: "nowrap"
                        }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = "#152d5c";
                                e.currentTarget.style.boxShadow = "0 5px 14px rgba(30, 60, 114, 0.25)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = "#1e3c72";
                                e.currentTarget.style.boxShadow = "0 3px 10px rgba(30, 60, 114, 0.15)";
                            }}>
                            Đăng xuất
                        </button>
                    </div>
                </div>

                {/* CARDS - 3 CỘT */}
                <div style={{
                    display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "0", paddingTop: "18px", paddingBottom: "18px", paddingRight: "20px", paddingLeft: "20px"
                }}>
                    {/* Card Thu Nhập */}
                    <div style={{
                        padding: "16px", background: "linear-gradient(135deg, #ffffff 0%, #f8fafb 100%)",
                        borderRadius: "12px", boxShadow: "0 4px 12px rgba(30, 60, 114, 0.06)",
                        border: "1px solid rgba(30, 60, 114, 0.05)", transition: "all 0.3s"
                    }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.boxShadow = "0 6px 16px rgba(30, 60, 114, 0.1)";
                            e.currentTarget.style.transform = "translateY(-2px)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.boxShadow = "0 4px 12px rgba(30, 60, 114, 0.06)";
                            e.currentTarget.style.transform = "translateY(0)";
                        }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                            <div style={{
                                width: "36px", height: "36px", background: "linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)",
                                borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: "18px", boxShadow: "0 3px 8px rgba(39, 174, 96, 0.25)"
                            }}>↓</div>
                            <p style={{ margin: 0, fontSize: "11px", color: "#7a8fa6", fontWeight: "600", textTransform: "uppercase" }}>Thu Nhập</p>
                        </div>
                        <p style={{ fontSize: "20px", fontWeight: "700", color: "#27ae60", margin: 0, letterSpacing: "-0.2px" }}>+{totalIncome.toLocaleString()}</p>
                        <p style={{ fontSize: "10px", color: "#7a8fa6", margin: "4px 0 0 0" }}>VNĐ</p>
                    </div>

                    {/* Card Chi Tiêu */}
                    <div style={{
                        padding: "16px", background: "linear-gradient(135deg, #ffffff 0%, #f8fafb 100%)",
                        borderRadius: "12px", boxShadow: "0 4px 12px rgba(30, 60, 114, 0.06)",
                        border: "1px solid rgba(30, 60, 114, 0.05)", transition: "all 0.3s"
                    }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.boxShadow = "0 6px 16px rgba(30, 60, 114, 0.1)";
                            e.currentTarget.style.transform = "translateY(-2px)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.boxShadow = "0 4px 12px rgba(30, 60, 114, 0.06)";
                            e.currentTarget.style.transform = "translateY(0)";
                        }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                            <div style={{
                                width: "36px", height: "36px", background: "linear-gradient(135deg, #e74c3c 0%, #e67e22 100%)",
                                borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: "18px", boxShadow: "0 3px 8px rgba(231, 76, 60, 0.25)"
                            }}>↑</div>
                            <p style={{ margin: 0, fontSize: "11px", color: "#7a8fa6", fontWeight: "600", textTransform: "uppercase" }}>Chi Tiêu</p>
                        </div>
                        <p style={{ fontSize: "20px", fontWeight: "700", color: "#e74c3c", margin: 0, letterSpacing: "-0.2px" }}>-{totalExpense.toLocaleString()}</p>
                        <p style={{ fontSize: "10px", color: "#7a8fa6", margin: "4px 0 0 0" }}>VNĐ</p>
                    </div>

                    {/* Card Số Dư */}
                    <div style={{
                        padding: "16px", background: "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)",
                        borderRadius: "12px", boxShadow: "0 4px 12px rgba(30, 60, 114, 0.1)",
                        border: "1px solid rgba(255, 255, 255, 0.1)", transition: "all 0.3s"
                    }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.boxShadow = "0 6px 16px rgba(30, 60, 114, 0.2)";
                            e.currentTarget.style.transform = "translateY(-2px)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.boxShadow = "0 4px 12px rgba(30, 60, 114, 0.1)";
                            e.currentTarget.style.transform = "translateY(0)";
                        }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                            <div style={{
                                width: "36px", height: "36px", background: "rgba(255, 255, 255, 0.15)",
                                borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px"
                            }}>💰</div>
                            <p style={{ margin: 0, fontSize: "11px", color: "rgba(255, 255, 255, 0.7)", fontWeight: "600", textTransform: "uppercase" }}>Số Dư</p>
                        </div>
                        <p style={{ fontSize: "20px", fontWeight: "700", color: "#ffffff", margin: 0, letterSpacing: "-0.2px" }}>{(totalIncome - totalExpense).toLocaleString()}</p>
                        <p style={{ fontSize: "10px", color: "rgba(255, 255, 255, 0.7)", margin: "4px 0 0 0" }}>VNĐ</p>
                    </div>
                </div>

                {/* BILL REMINDERS */}
                {reminders && reminders.length > 0 && (
                    <div style={{
                        padding: "16px 20px", marginLeft: "0", marginRight: "0",
                        background: "linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)",
                        borderTop: "1px solid rgba(230, 126, 34, 0.15)", borderBottom: "1px solid rgba(230, 126, 34, 0.15)"
                    }}>
                        <h2 style={{ margin: "0 0 12px 0", fontSize: "16px", fontWeight: "700", color: "#d35400" }}>
                            🔔 Thông Báo Hóa Đơn
                        </h2>
                        <div style={{ display: "grid", gap: "10px" }}>
                            {reminders.map((reminder) => {
                                const dueDate = new Date(reminder.dueDate || reminder.date);
                                const today = new Date();
                                const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
                                const isOverdue = daysUntilDue < 0;
                                const isUrgent = daysUntilDue <= 3 && daysUntilDue >= 0;

                                return (
                                    <div key={reminder._id || Math.random()} style={{
                                        display: "grid", gridTemplateColumns: "auto 1fr auto auto", gap: "12px", alignItems: "center",
                                        padding: "12px", borderRadius: "10px",
                                        background: isOverdue ? "rgba(231, 76, 60, 0.08)" : isUrgent ? "rgba(230, 126, 34, 0.08)" : "rgba(255, 255, 255, 0.6)",
                                        border: isOverdue ? "1px solid #e74c3c" : isUrgent ? "1px solid #e67e22" : "1px solid rgba(230, 126, 34, 0.2)",
                                        transition: "all 0.3s"
                                    }}>
                                        <div style={{
                                            width: "32px", height: "32px",
                                            background: isOverdue ? "rgba(231, 76, 60, 0.15)" : isUrgent ? "rgba(230, 126, 34, 0.15)" : "rgba(52, 152, 219, 0.15)",
                                            borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center",
                                            fontSize: "16px", fontWeight: "600"
                                        }}>
                                            {isOverdue ? "⚠️" : isUrgent ? "🔴" : "📄"}
                                        </div>
                                        <div style={{ minWidth: 0 }}>
                                            <strong style={{ fontSize: "13px", color: "#1e3c72", display: "block", marginBottom: "2px" }}>
                                                {reminder.text || reminder.billName || "Hóa đơn"}
                                            </strong>
                                            <div style={{ fontSize: "11px", color: "#7a8fa6" }}>
                                                {isOverdue ? (
                                                    <span style={{ color: "#e74c3c", fontWeight: "600" }}>Quá hạn {Math.abs(daysUntilDue)} ngày</span>
                                                ) : isUrgent ? (
                                                    <span style={{ color: "#e67e22", fontWeight: "600" }}>Sắp đến hạn trong {daysUntilDue} ngày</span>
                                                ) : (
                                                    <span>Đến hạn trong {daysUntilDue} ngày</span>
                                                )}
                                                <span style={{ marginLeft: "8px", color: "#b0bcc6" }}>
                                                    • {dueDate.toLocaleDateString("vi-VN", { year: "numeric", month: "2-digit", day: "2-digit" })}
                                                </span>
                                            </div>
                                        </div>
                                        <div style={{ fontSize: "13px", fontWeight: "700", color: "#e67e22", whiteSpace: "nowrap" }}>
                                            {Number(reminder.amount).toLocaleString()} VNĐ
                                        </div>
                                        <button onClick={() => alert(`Đã ghi nhận hóa đơn: ${reminder.text}`)} style={{
                                            background: "#3498db", color: "white", border: "none",
                                            padding: "6px 12px", borderRadius: "5px", cursor: "pointer",
                                            fontSize: "12px", transition: "all 0.2s", fontWeight: "600",
                                            boxShadow: "0 2px 6px rgba(52, 152, 219, 0.15)"
                                        }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = "#2980b9";
                                                e.currentTarget.style.boxShadow = "0 3px 8px rgba(52, 152, 219, 0.25)";
                                                e.currentTarget.style.transform = "translateY(-1px)";
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = "#3498db";
                                                e.currentTarget.style.boxShadow = "0 2px 6px rgba(52, 152, 219, 0.15)";
                                                e.currentTarget.style.transform = "translateY(0)";
                                            }}>
                                            ✓ Thanh toán
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* FORM */}
                <div style={{
                    padding: "16px 20px", marginLeft: "0", marginRight: "0", background: editingId ? "linear-gradient(135deg, #fff3cd 0%, #ffe8a8 100%)" : "linear-gradient(135deg, #ffffff 0%, #f8fafb 100%)",
                    borderRadius: "0", boxShadow: "0 4px 12px rgba(30, 60, 114, 0.06)",
                    border: "none", borderTop: "1px solid rgba(30, 60, 114, 0.05)", borderBottom: "1px solid rgba(30, 60, 114, 0.05)", marginBottom: "0"
                }}>
                    <h2 style={{ margin: "0 0 14px 0", fontSize: "16px", fontWeight: "700", color: "#1e3c72" }}>
                        {editingId ? "✏️ Cập Nhật Giao Dịch" : "➕ Thêm Giao Dịch"}
                    </h2>
                    <form onSubmit={handleAddTransaction} style={{
                        display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px"
                    }}>
                        <div>
                            <label style={{ display: "block", fontSize: "10px", fontWeight: "600", color: "#1e3c72", marginBottom: "4px", textTransform: "uppercase" }}>Loại</label>
                            <select value={type} onChange={(e) => setType(e.target.value)} style={{
                                width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #e8ecf1",
                                background: "#f8fafb", fontSize: "12px", fontWeight: "500", color: "#1e3c72", cursor: "pointer",
                                transition: "all 0.2s", boxSizing: "border-box"
                            }}
                                onFocus={(e) => {
                                    e.currentTarget.style.borderColor = "#1e3c72";
                                    e.currentTarget.style.background = "#fff";
                                }}
                                onBlur={(e) => {
                                    e.currentTarget.style.borderColor = "#e8ecf1";
                                    e.currentTarget.style.background = "#f8fafb";
                                }}>
                                <option value="expense">Chi Tiêu</option>
                                <option value="income">Thu Nhập</option>
                            </select>
                        </div>

                        <div>
                            <label style={{ display: "block", fontSize: "10px", fontWeight: "600", color: "#1e3c72", marginBottom: "4px", textTransform: "uppercase" }}>Số Tiền</label>
                            <input type="number" placeholder="50000" value={amount} onChange={(e) => setAmount(e.target.value)} required
                                style={{
                                    width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #e8ecf1",
                                    background: "#f8fafb", fontSize: "12px", fontWeight: "500", color: "#1e3c72",
                                    transition: "all 0.2s", boxSizing: "border-box"
                                }}
                                onFocus={(e) => {
                                    e.currentTarget.style.borderColor = "#1e3c72";
                                    e.currentTarget.style.background = "#fff";
                                }}
                                onBlur={(e) => {
                                    e.currentTarget.style.borderColor = "#e8ecf1";
                                    e.currentTarget.style.background = "#f8fafb";
                                }} />
                        </div>

                        <div>
                            <label style={{ display: "block", fontSize: "10px", fontWeight: "600", color: "#1e3c72", marginBottom: "4px", textTransform: "uppercase" }}>Danh Mục</label>
                            <select value={category} onChange={(e) => setCategory(e.target.value)} style={{
                                width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #e8ecf1",
                                background: "#f8fafb", fontSize: "12px", fontWeight: "500", color: "#1e3c72", cursor: "pointer",
                                transition: "all 0.2s", boxSizing: "border-box"
                            }}
                                onFocus={(e) => {
                                    e.currentTarget.style.borderColor = "#1e3c72";
                                    e.currentTarget.style.background = "#fff";
                                }}
                                onBlur={(e) => {
                                    e.currentTarget.style.borderColor = "#e8ecf1";
                                    e.currentTarget.style.background = "#f8fafb";
                                }}>
                                <option value="Ăn uống">Ăn Uống</option>
                                <option value="Đi lại">Đi Lại</option>
                                <option value="Mua sắm">Mua Sắm</option>
                                <option value="Lương">Lương</option>
                                <option value="Khác">Khác</option>
                            </select>
                        </div>

                        <div style={{ display: "flex", gap: "6px", alignItems: "flex-end" }}>
                            <button type="submit" style={{
                                background: "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)", color: "white",
                                border: "none", padding: "8px 12px", borderRadius: "6px", cursor: "pointer",
                                fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.2px",
                                transition: "all 0.3s", boxShadow: "0 3px 8px rgba(30, 60, 114, 0.15)",
                                flex: 1, height: "40px", display: "flex", alignItems: "center", justifyContent: "center"
                            }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.boxShadow = "0 5px 12px rgba(30, 60, 114, 0.25)";
                                    e.currentTarget.style.transform = "translateY(-1px)";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.boxShadow = "0 3px 8px rgba(30, 60, 114, 0.15)";
                                    e.currentTarget.style.transform = "translateY(0)";
                                }}>
                                {editingId ? "🔄 Cập nhật" : "💾 Lưu"}
                            </button>
                            {editingId && (
                                <button type="button" onClick={handleCancelEdit} style={{
                                    background: "#e74c3c", color: "white",
                                    border: "none", padding: "8px 12px", borderRadius: "6px", cursor: "pointer",
                                    fontSize: "12px", fontWeight: "700", transition: "all 0.3s",
                                    boxShadow: "0 3px 8px rgba(231, 76, 60, 0.15)", height: "40px",
                                    display: "flex", alignItems: "center", justifyContent: "center"
                                }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.boxShadow = "0 5px 12px rgba(231, 76, 60, 0.25)";
                                        e.currentTarget.style.transform = "translateY(-1px)";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.boxShadow = "0 3px 8px rgba(231, 76, 60, 0.15)";
                                        e.currentTarget.style.transform = "translateY(0)";
                                    }}>
                                    ✕ Hủy
                                </button>
                            )}
                        </div>
                    </form>

                    {/* Ghi Chú - Full width */}
                    <div style={{ marginTop: "10px" }}>
                        <label style={{ display: "block", fontSize: "10px", fontWeight: "600", color: "#1e3c72", marginBottom: "4px", textTransform: "uppercase" }}>Ghi Chú</label>
                        <input type="text" placeholder="Ăn sáng..." value={description} onChange={(e) => setDescription(e.target.value)}
                            style={{
                                width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #e8ecf1",
                                background: "#f8fafb", fontSize: "12px", fontWeight: "500", color: "#1e3c72",
                                transition: "all 0.2s", boxSizing: "border-box"
                            }}
                            onFocus={(e) => {
                                e.currentTarget.style.borderColor = "#1e3c72";
                                e.currentTarget.style.background = "#fff";
                            }}
                            onBlur={(e) => {
                                e.currentTarget.style.borderColor = "#e8ecf1";
                                e.currentTarget.style.background = "#f8fafb";
                            }} />
                    </div>
                </div>

                {/* DANH SÁCH */}
                <div style={{ paddingLeft: "20px", paddingRight: "20px", paddingTop: "18px", paddingBottom: "20px", flex: 1 }}>
                    <h2 style={{ margin: "0 0 12px 0", fontSize: "16px", fontWeight: "700", color: "#1e3c72" }}>📜 Lịch Sử Giao Dịch</h2>
                    <div style={{ display: "grid", gap: "10px" }}>
                        {filteredTransactions.length > 0 ? (
                            filteredTransactions.map((t) => (
                                <div key={t._id || Math.random()} style={{
                                    display: "grid", gridTemplateColumns: "auto 1fr auto auto auto",
                                    gap: "12px", alignItems: "center", padding: "12px",
                                    background: "linear-gradient(135deg, #ffffff 0%, #f8fafb 100%)",
                                    borderRadius: "10px", boxShadow: "0 2px 8px rgba(30, 60, 114, 0.04)",
                                    border: "1px solid rgba(30, 60, 114, 0.05)", transition: "all 0.3s"
                                }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.boxShadow = "0 4px 12px rgba(30, 60, 114, 0.1)";
                                        e.currentTarget.style.transform = "translateX(2px)";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.boxShadow = "0 2px 8px rgba(30, 60, 114, 0.04)";
                                        e.currentTarget.style.transform = "translateX(0)";
                                    }}>
                                    <div style={{
                                        width: "32px", height: "32px",
                                        background: t.type === "income" ? "rgba(39, 174, 96, 0.1)" : "rgba(231, 76, 60, 0.1)",
                                        borderRadius: "6px", display: "flex", alignItems: "center",
                                        justifyContent: "center", fontSize: "16px", fontWeight: "600"
                                    }}>
                                        {t.type === "income" ? "↓" : "↑"}
                                    </div>
                                    <div style={{ minWidth: 0 }}>
                                        <strong style={{ fontSize: "13px", color: "#1e3c72", display: "block", marginBottom: "2px" }}>{t.category || t.categoryName}</strong>
                                        <div style={{ fontSize: "11px", color: "#7a8fa6", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                            {t.description || t.note || "Không có ghi chú"}
                                            <span style={{ fontSize: "10px", color: "#b0bcc6", marginLeft: "6px" }}>
                                                • {new Date(t.date || Date.now()).toLocaleDateString("vi-VN", { year: "numeric", month: "2-digit", day: "2-digit" })} {new Date(t.date || Date.now()).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                                            </span>
                                        </div>
                                    </div>
                                    <div style={{ fontWeight: "700", fontSize: "13px", color: t.type === "income" ? "#27ae60" : "#e74c3c", whiteSpace: "nowrap" }}>
                                        {t.type === "income" ? "+" : "-"}{Number(t.amount).toLocaleString()}
                                    </div>
                                    {/* Edit Button */}
                                    <button onClick={() => handleEditTransaction(t)} style={{
                                        background: "#3498db", color: "white", border: "none",
                                        padding: "6px 10px", borderRadius: "5px", cursor: "pointer",
                                        fontSize: "13px", transition: "all 0.2s", boxShadow: "0 2px 6px rgba(52, 152, 219, 0.15)",
                                        whiteSpace: "nowrap", fontWeight: "600"
                                    }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = "#2980b9";
                                            e.currentTarget.style.boxShadow = "0 3px 8px rgba(52, 152, 219, 0.25)";
                                            e.currentTarget.style.transform = "translateY(-1px)";
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = "#3498db";
                                            e.currentTarget.style.boxShadow = "0 2px 6px rgba(52, 152, 219, 0.15)";
                                            e.currentTarget.style.transform = "translateY(0)";
                                        }}>
                                        ✏️ Sửa
                                    </button>
                                    {/* Delete Button */}
                                    <button onClick={() => handleDeleteTransaction(t._id)} style={{
                                        background: "#e74c3c", color: "white", border: "none",
                                        padding: "6px 10px", borderRadius: "5px", cursor: "pointer",
                                        fontSize: "13px", transition: "all 0.2s", boxShadow: "0 2px 6px rgba(231, 76, 60, 0.15)",
                                        whiteSpace: "nowrap", fontWeight: "600"
                                    }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = "#c0392b";
                                            e.currentTarget.style.boxShadow = "0 3px 8px rgba(231, 76, 60, 0.25)";
                                            e.currentTarget.style.transform = "translateY(-1px)";
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = "#e74c3c";
                                            e.currentTarget.style.boxShadow = "0 2px 6px rgba(231, 76, 60, 0.15)";
                                            e.currentTarget.style.transform = "translateY(0)";
                                        }}>
                                        🗑️ Xóa
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div style={{
                                padding: "24px 12px", textAlign: "center",
                                background: "linear-gradient(135deg, #ffffff 0%, #f8fafb 100%)",
                                borderRadius: "10px", border: "2px dashed rgba(30, 60, 114, 0.1)", color: "#7a8fa6"
                            }}>
                                <p style={{ fontSize: "13px", fontWeight: "500", margin: "0 0 4px 0" }}>Chưa có giao dịch</p>
                                <p style={{ fontSize: "11px", color: "#b0bcc6", margin: 0 }}>Hãy thêm giao dịch mới</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
