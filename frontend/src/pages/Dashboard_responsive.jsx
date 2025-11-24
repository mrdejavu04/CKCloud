import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';

function Dashboard() {
    const navigate = useNavigate();

    // --- STATE QUẢN LÝ DỮ LIỆU ---
    const [transactions, setTransactions] = useState([]);
    const [reminders, setReminders] = useState([
        { _id: "1", text: "Tiền điện", amount: 500000, dueDate: "2025-11-25" },
        { _id: "2", text: "Tiền nước", amount: 250000, dueDate: "2025-11-26" },
        { _id: "3", text: "Internet", amount: 200000, dueDate: "2025-11-27" }
    ]);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

    // --- STATE QUẢN LÝ FORM NHẬP LIỆU ---
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('Ăn uống');
    const [type, setType] = useState('expense');
    const [description, setDescription] = useState('');
    const [editingId, setEditingId] = useState(null);

    // Initialize selectedMonth with current month/year
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });

    // --- 1. HÀM TẢI DỮ LIỆU TỪ SERVER ---
    const fetchData = async () => {
        try {
            const userRes = await axiosClient.get('/api/users/me').catch(() => null);
            if (userRes) setUser(userRes.data);

            const transRes = await axiosClient.get('/api/transactions');
            console.log("Dữ liệu tải về:", transRes.data);

            if (Array.isArray(transRes.data)) {
                setTransactions(transRes.data);
            } else if (transRes.data && Array.isArray(transRes.data.data)) {
                setTransactions(transRes.data.data);
            } else if (transRes.data && Array.isArray(transRes.data.transactions)) {
                setTransactions(transRes.data.transactions);
            } else {
                setTransactions([]);
            }

            // Fetch reminders if API exists
            try {
                const remindersRes = await axiosClient.get('/api/reminders');
                if (Array.isArray(remindersRes.data)) {
                    setReminders(remindersRes.data);
                } else if (remindersRes.data?.data) {
                    setReminders(remindersRes.data.data);
                } else if (remindersRes.data?.reminders) {
                    setReminders(remindersRes.data.reminders);
                }
            } catch (error) {
                console.error("Lỗi tải reminders:", error);
            }

        } catch (error) {
            console.error("Lỗi tải dữ liệu:", error);
            if (error.response && error.response.status === 401) {
                localStorage.removeItem('token');
                navigate('/');
            }
        } finally {
            setLoading(false);
        }
    };

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

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/');
            return;
        }
        fetchData();
    }, []);

    // --- 2. HÀM XỬ LÝ THÊM GIAO DỊCH ---
    const handleAddTransaction = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                // Cập nhật giao dịch hiện có
                await axiosClient.put(`/api/transactions/${editingId}`, {
                    amount: Number(amount),
                    category,
                    type,
                    description,
                    date: new Date()
                });

                alert("Cập nhật thành công!");
                setEditingId(null);
            } else {
                // Thêm giao dịch mới
                await axiosClient.post('/api/transactions', {
                    amount: Number(amount),
                    category,
                    type,
                    description,
                    date: new Date()
                });

                alert("Thêm thành công!");
            }

            setAmount('');
            setDescription('');
            setCategory('Ăn uống');
            setType('expense');
            await fetchData();

        } catch (error) {
            console.error(error);
            alert("Lỗi: " + (error.response?.data?.message || error.message));
        }
    };

    const handleEditTransaction = (transaction) => {
        setEditingId(transaction._id);
        setAmount(String(transaction.amount));
        setCategory(transaction.category || transaction.categoryName);
        setType(transaction.type);
        setDescription(transaction.description || transaction.note || "");
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
        setAmount('');
        setDescription('');
        setCategory('Ăn uống');
        setType('expense');
    };

    // --- 3. TÍNH TOÁN TỔNG TIỀN ---
    const totalIncome = Array.isArray(filteredTransactions) ? filteredTransactions
        .filter(t => t.type === 'income')
        .reduce((acc, curr) => acc + Number(curr.amount), 0) : 0;

    const totalExpense = Array.isArray(filteredTransactions) ? filteredTransactions
        .filter(t => t.type === 'expense')
        .reduce((acc, curr) => acc + Number(curr.amount), 0) : 0;

    // --- 4. HÀM ĐĂNG XUẤT ---
    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/');
    };

    // --- RESPONSIVE LISTENER ---
    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Helper breakpoints
    const isMobile = windowWidth < 640;
    const isTablet = windowWidth >= 640 && windowWidth < 1024;
    const isDesktop = windowWidth >= 1024;

    if (loading) return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            color: '#1e3c72'
        }}>
            <div style={{ fontSize: '18px', fontWeight: '500' }}>Đang tải dữ liệu...</div>
        </div>
    );

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
            padding: isMobile ? '16px' : isTablet ? '20px' : '30px 20px',
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            color: '#333',
            transition: 'padding 0.3s ease'
        }}>
            <div style={{
                maxWidth: isMobile ? '100%' : '1000px',
                margin: '0 auto',
                transition: 'max-width 0.3s ease'
            }}>

                {/* HEADER */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: isMobile ? 'flex-start' : 'center',
                    flexDirection: isMobile ? 'column' : 'row',
                    gap: isMobile ? '12px' : '0',
                    marginBottom: isMobile ? '24px' : isTablet ? '30px' : '40px',
                    paddingBottom: isMobile ? '12px' : '20px',
                    borderBottom: '2px solid rgba(30, 60, 114, 0.1)'
                }}>
                    <div>
                        <h1 style={{
                            margin: '0 0 5px 0',
                            fontSize: isMobile ? '22px' : isTablet ? '28px' : '32px',
                            fontWeight: '700',
                            color: '#1e3c72',
                            letterSpacing: '-0.5px'
                        }}>
                            Ví của {user?.name || 'Bạn'}
                        </h1>
                        <p style={{
                            margin: 0,
                            fontSize: isMobile ? '12px' : '14px',
                            color: '#7a8fa6',
                            fontWeight: '400'
                        }}>
                            Quản lý tài chính của bạn
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
                        {/* Month Filter Dropdown */}
                        <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} style={{
                            padding: '10px 12px', borderRadius: '6px', border: '1px solid rgba(30, 60, 114, 0.2)',
                            background: 'white', fontSize: '13px', fontWeight: '600', color: '#1e3c72', cursor: 'pointer',
                            transition: 'all 0.2s', boxShadow: '0 2px 6px rgba(30, 60, 114, 0.1)'
                        }}
                            onFocus={(e) => {
                                e.currentTarget.style.borderColor = '#1e3c72';
                                e.currentTarget.style.boxShadow = '0 3px 8px rgba(30, 60, 114, 0.15)';
                            }}
                            onBlur={(e) => {
                                e.currentTarget.style.borderColor = 'rgba(30, 60, 114, 0.2)';
                                e.currentTarget.style.boxShadow = '0 2px 6px rgba(30, 60, 114, 0.1)';
                            }}>
                            {/* Generate last 12 months */}
                            {Array.from({ length: 12 }, (_, i) => {
                                const date = new Date();
                                date.setMonth(date.getMonth() - i);
                                const year = date.getFullYear();
                                const month = String(date.getMonth() + 1).padStart(2, '0');
                                return (
                                    <option key={`${year}-${month}`} value={`${year}-${month}`}>
                                        {`Tháng ${month}/${year}`}
                                    </option>
                                );
                            })}
                        </select>
                        <button
                            onClick={handleLogout}
                            style={{
                                background: '#1e3c72',
                                color: 'white',
                                border: 'none',
                                padding: isMobile ? '10px 20px' : '12px 28px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: isMobile ? '12px' : '14px',
                                fontWeight: '600',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 4px 12px rgba(30, 60, 114, 0.15)',
                                whiteSpace: 'nowrap'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.background = '#152d5c';
                                e.target.style.boxShadow = '0 6px 16px rgba(30, 60, 114, 0.25)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.background = '#1e3c72';
                                e.target.style.boxShadow = '0 4px 12px rgba(30, 60, 114, 0.15)';
                            }}
                        >
                            Đăng xuất
                        </button>
                    </div>
                </div>

                {/* BÁO CÁO TỔNG QUAN - CARDS */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
                    gap: isMobile ? '16px' : '20px',
                    marginBottom: isMobile ? '24px' : isTablet ? '30px' : '40px'
                }}>
                    {/* CARD TỔNG THU */}
                    <div style={{
                        padding: isMobile ? '20px' : '28px',
                        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafb 100%)',
                        borderRadius: '12px',
                        boxShadow: '0 4px 12px rgba(30, 60, 114, 0.06)',
                        border: '1px solid rgba(30, 60, 114, 0.05)',
                        transition: 'all 0.3s ease'
                    }}
                        onMouseEnter={(e) => {
                            if (!isMobile) {
                                e.currentTarget.style.boxShadow = '0 12px 32px rgba(30, 60, 114, 0.12)';
                                e.currentTarget.style.transform = 'translateY(-4px)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!isMobile) {
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(30, 60, 114, 0.06)';
                                e.currentTarget.style.transform = 'translateY(0)';
                            }
                        }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            marginBottom: '12px'
                        }}>
                            <div style={{
                                width: isMobile ? '40px' : '48px',
                                height: isMobile ? '40px' : '48px',
                                background: 'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)',
                                borderRadius: '10px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: isMobile ? '20px' : '24px',
                                boxShadow: '0 4px 12px rgba(39, 174, 96, 0.3)',
                                flexShrink: 0
                            }}>
                                ↓
                            </div>
                            <div>
                                <p style={{
                                    margin: '0',
                                    fontSize: isMobile ? '11px' : '13px',
                                    color: '#7a8fa6',
                                    fontWeight: '500',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.3px'
                                }}>
                                    Thu Nhập
                                </p>
                            </div>
                        </div>
                        <p style={{
                            fontSize: isMobile ? '24px' : '32px',
                            fontWeight: '700',
                            color: '#27ae60',
                            margin: '0',
                            letterSpacing: '-0.5px',
                            wordBreak: 'break-word'
                        }}>
                            +{totalIncome.toLocaleString()}
                        </p>
                        <p style={{
                            fontSize: '11px',
                            color: '#7a8fa6',
                            margin: '6px 0 0 0',
                            fontWeight: '400'
                        }}>
                            VNĐ
                        </p>
                    </div>

                    {/* CARD TỔNG CHI */}
                    <div style={{
                        padding: isMobile ? '20px' : '28px',
                        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafb 100%)',
                        borderRadius: '12px',
                        boxShadow: '0 4px 12px rgba(30, 60, 114, 0.06)',
                        border: '1px solid rgba(30, 60, 114, 0.05)',
                        transition: 'all 0.3s ease'
                    }}
                        onMouseEnter={(e) => {
                            if (!isMobile) {
                                e.currentTarget.style.boxShadow = '0 12px 32px rgba(30, 60, 114, 0.12)';
                                e.currentTarget.style.transform = 'translateY(-4px)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!isMobile) {
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(30, 60, 114, 0.06)';
                                e.currentTarget.style.transform = 'translateY(0)';
                            }
                        }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            marginBottom: '12px'
                        }}>
                            <div style={{
                                width: isMobile ? '40px' : '48px',
                                height: isMobile ? '40px' : '48px',
                                background: 'linear-gradient(135deg, #e74c3c 0%, #e74c3c 100%)',
                                borderRadius: '10px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: isMobile ? '20px' : '24px',
                                boxShadow: '0 4px 12px rgba(231, 76, 60, 0.3)',
                                flexShrink: 0
                            }}>
                                ↑
                            </div>
                            <div>
                                <p style={{
                                    margin: '0',
                                    fontSize: isMobile ? '11px' : '13px',
                                    color: '#7a8fa6',
                                    fontWeight: '500',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.3px'
                                }}>
                                    Chi Tiêu
                                </p>
                            </div>
                        </div>
                        <p style={{
                            fontSize: isMobile ? '24px' : '32px',
                            fontWeight: '700',
                            color: '#e74c3c',
                            margin: '0',
                            letterSpacing: '-0.5px',
                            wordBreak: 'break-word'
                        }}>
                            -{totalExpense.toLocaleString()}
                        </p>
                        <p style={{
                            fontSize: '11px',
                            color: '#7a8fa6',
                            margin: '6px 0 0 0',
                            fontWeight: '400'
                        }}>
                            VNĐ
                        </p>
                    </div>

                    {/* CARD SỐ DƯ */}
                    <div style={{
                        padding: isMobile ? '20px' : '28px',
                        background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
                        borderRadius: '12px',
                        boxShadow: '0 4px 12px rgba(30, 60, 114, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        transition: 'all 0.3s ease',
                        gridColumn: isMobile ? 'span 1' : isTablet ? 'span 2' : 'span 1'
                    }}
                        onMouseEnter={(e) => {
                            if (!isMobile) {
                                e.currentTarget.style.boxShadow = '0 12px 32px rgba(30, 60, 114, 0.25)';
                                e.currentTarget.style.transform = 'translateY(-4px)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!isMobile) {
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(30, 60, 114, 0.1)';
                                e.currentTarget.style.transform = 'translateY(0)';
                            }
                        }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            marginBottom: '12px'
                        }}>
                            <div style={{
                                width: isMobile ? '40px' : '48px',
                                height: isMobile ? '40px' : '48px',
                                background: 'rgba(255, 255, 255, 0.2)',
                                borderRadius: '10px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: isMobile ? '20px' : '24px',
                                flexShrink: 0
                            }}>
                                💰
                            </div>
                            <div>
                                <p style={{
                                    margin: '0',
                                    fontSize: isMobile ? '11px' : '13px',
                                    color: 'rgba(255, 255, 255, 0.7)',
                                    fontWeight: '500',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.3px'
                                }}>
                                    Số Dư
                                </p>
                            </div>
                        </div>
                        <p style={{
                            fontSize: isMobile ? '24px' : '32px',
                            fontWeight: '700',
                            color: '#ffffff',
                            margin: '0',
                            letterSpacing: '-0.5px',
                            wordBreak: 'break-word'
                        }}>
                            {(totalIncome - totalExpense).toLocaleString()}
                        </p>
                        <p style={{
                            fontSize: '11px',
                            color: 'rgba(255, 255, 255, 0.7)',
                            margin: '6px 0 0 0',
                            fontWeight: '400'
                        }}>
                            VNĐ
                        </p>
                    </div>
                </div>

                {/* FORM THÊM GIAO DỊCH */}
                <div style={{
                    padding: isMobile ? '20px' : '32px',
                    background: 'linear-gradient(135deg, #ffffff 0%, #f8fafb 100%)',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(30, 60, 114, 0.06)',
                    border: '1px solid rgba(30, 60, 114, 0.05)',
                    marginBottom: isMobile ? '24px' : isTablet ? '30px' : '40px'
                }}>
                    <h2 style={{
                        margin: '0 0 16px 0',
                        fontSize: isMobile ? '16px' : '20px',
                        fontWeight: '700',
                        color: '#1e3c72',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        ➕ Thêm Giao Dịch
                    </h2>
                    <form onSubmit={handleAddTransaction} style={{
                        display: 'grid',
                        gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
                        gap: isMobile ? '12px' : '16px',
                        alignItems: 'flex-end'
                    }}>

                        {/* Loại Giao Dịch */}
                        <div style={{ gridColumn: 'span 1' }}>
                            <label style={{
                                display: 'block',
                                fontSize: isMobile ? '11px' : '13px',
                                fontWeight: '600',
                                color: '#1e3c72',
                                marginBottom: '6px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.2px'
                            }}>
                                Loại
                            </label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: isMobile ? '10px 12px' : '12px 14px',
                                    borderRadius: '8px',
                                    border: '2px solid #e8ecf1',
                                    background: '#f8fafb',
                                    cursor: 'pointer',
                                    fontSize: isMobile ? '12px' : '14px',
                                    fontWeight: '500',
                                    color: '#1e3c72',
                                    transition: 'all 0.2s ease',
                                    boxSizing: 'border-box'
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = '#1e3c72';
                                    e.target.style.background = '#ffffff';
                                    e.target.style.boxShadow = '0 0 0 3px rgba(30, 60, 114, 0.1)';
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = '#e8ecf1';
                                    e.target.style.background = '#f8fafb';
                                    e.target.style.boxShadow = 'none';
                                }}
                            >
                                <option value="expense">🔴 Chi Tiêu</option>
                                <option value="income">🟢 Thu Nhập</option>
                            </select>
                        </div>

                        {/* Số Tiền */}
                        <div style={{ gridColumn: 'span 1' }}>
                            <label style={{
                                display: 'block',
                                fontSize: isMobile ? '11px' : '13px',
                                fontWeight: '600',
                                color: '#1e3c72',
                                marginBottom: '6px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.2px'
                            }}>
                                Số Tiền
                            </label>
                            <input
                                type="number"
                                placeholder="50000"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                required
                                style={{
                                    width: '100%',
                                    padding: isMobile ? '10px 12px' : '12px 14px',
                                    borderRadius: '8px',
                                    border: '2px solid #e8ecf1',
                                    background: '#f8fafb',
                                    fontSize: isMobile ? '12px' : '14px',
                                    fontWeight: '500',
                                    color: '#1e3c72',
                                    transition: 'all 0.2s ease',
                                    boxSizing: 'border-box'
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = '#1e3c72';
                                    e.target.style.background = '#ffffff';
                                    e.target.style.boxShadow = '0 0 0 3px rgba(30, 60, 114, 0.1)';
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = '#e8ecf1';
                                    e.target.style.background = '#f8fafb';
                                    e.target.style.boxShadow = 'none';
                                }}
                            />
                        </div>

                        {/* Danh Mục */}
                        <div style={{ gridColumn: 'span 1' }}>
                            <label style={{
                                display: 'block',
                                fontSize: isMobile ? '11px' : '13px',
                                fontWeight: '600',
                                color: '#1e3c72',
                                marginBottom: '6px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.2px'
                            }}>
                                Danh Mục
                            </label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: isMobile ? '10px 12px' : '12px 14px',
                                    borderRadius: '8px',
                                    border: '2px solid #e8ecf1',
                                    background: '#f8fafb',
                                    cursor: 'pointer',
                                    fontSize: isMobile ? '12px' : '14px',
                                    fontWeight: '500',
                                    color: '#1e3c72',
                                    transition: 'all 0.2s ease',
                                    boxSizing: 'border-box'
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = '#1e3c72';
                                    e.target.style.background = '#ffffff';
                                    e.target.style.boxShadow = '0 0 0 3px rgba(30, 60, 114, 0.1)';
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = '#e8ecf1';
                                    e.target.style.background = '#f8fafb';
                                    e.target.style.boxShadow = 'none';
                                }}
                            >
                                <option value="Ăn uống">🍴 Ăn Uống</option>
                                <option value="Đi lại">🚗 Đi Lại</option>
                                <option value="Mua sắm">🛍️ Mua Sắm</option>
                                <option value="Lương">💼 Lương</option>
                                <option value="Khác">📌 Khác</option>
                            </select>
                        </div>

                        {/* Ghi Chú */}
                        <div style={{ gridColumn: isMobile ? 'span 1' : 'span 1' }}>
                            <label style={{
                                display: 'block',
                                fontSize: isMobile ? '11px' : '13px',
                                fontWeight: '600',
                                color: '#1e3c72',
                                marginBottom: '6px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.2px'
                            }}>
                                Ghi Chú
                            </label>
                            <input
                                type="text"
                                placeholder="Ăn sáng..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: isMobile ? '10px 12px' : '12px 14px',
                                    borderRadius: '8px',
                                    border: '2px solid #e8ecf1',
                                    background: '#f8fafb',
                                    fontSize: isMobile ? '12px' : '14px',
                                    fontWeight: '500',
                                    color: '#1e3c72',
                                    transition: 'all 0.2s ease',
                                    boxSizing: 'border-box'
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = '#1e3c72';
                                    e.target.style.background = '#ffffff';
                                    e.target.style.boxShadow = '0 0 0 3px rgba(30, 60, 114, 0.1)';
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = '#e8ecf1';
                                    e.target.style.background = '#f8fafb';
                                    e.target.style.boxShadow = 'none';
                                }}
                            />
                        </div>

                        {/* Nút Lưu */}
                        <button
                            type="submit"
                            style={{
                                background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
                                color: 'white',
                                border: 'none',
                                padding: isMobile ? '10px 16px' : '12px 32px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: isMobile ? '12px' : '14px',
                                fontWeight: '700',
                                textTransform: 'uppercase',
                                letterSpacing: '0.3px',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 4px 12px rgba(30, 60, 114, 0.2)',
                                gridColumn: 'span 1',
                                height: isMobile ? '44px' : '48px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.boxShadow = '0 6px 16px rgba(30, 60, 114, 0.3)';
                                e.target.style.transform = 'translateY(-2px)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.boxShadow = '0 4px 12px rgba(30, 60, 114, 0.2)';
                                e.target.style.transform = 'translateY(0)';
                            }}
                        >
                            {isMobile ? '💾' : '💾 Lưu'}
                        </button>
                    </form>
                </div>

                {/* BILL REMINDERS */}
                {reminders && reminders.length > 0 && (
                    <div style={{
                        padding: isMobile ? '16px' : '20px',
                        marginBottom: isMobile ? '24px' : '30px',
                        background: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)',
                        borderRadius: '12px',
                        border: '1px solid rgba(230, 126, 34, 0.15)'
                    }}>
                        <h2 style={{
                            margin: '0 0 12px 0',
                            fontSize: isMobile ? '16px' : '18px',
                            fontWeight: '700',
                            color: '#d35400',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            🔔 Thông Báo Hóa Đơn
                        </h2>
                        <div style={{ display: 'grid', gap: '10px' }}>
                            {reminders.map((reminder) => {
                                const dueDate = new Date(reminder.dueDate || reminder.date);
                                const today = new Date();
                                const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
                                const isOverdue = daysUntilDue < 0;
                                const isUrgent = daysUntilDue <= 3 && daysUntilDue >= 0;

                                return (
                                    <div key={reminder._id || Math.random()} style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: isMobile ? 'flex-start' : 'center',
                                        flexDirection: isMobile ? 'column' : 'row',
                                        gap: isMobile ? '10px' : '12px',
                                        padding: isMobile ? '12px' : '16px',
                                        borderRadius: '10px',
                                        background: isOverdue ? 'rgba(231, 76, 60, 0.08)' : isUrgent ? 'rgba(230, 126, 34, 0.08)' : 'rgba(255, 255, 255, 0.6)',
                                        border: isOverdue ? '1px solid #e74c3c' : isUrgent ? '1px solid #e67e22' : '1px solid rgba(230, 126, 34, 0.2)',
                                        transition: 'all 0.3s'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                                            <div style={{
                                                width: '32px',
                                                height: '32px',
                                                background: isOverdue ? 'rgba(231, 76, 60, 0.15)' : isUrgent ? 'rgba(230, 126, 34, 0.15)' : 'rgba(52, 152, 219, 0.15)',
                                                borderRadius: '6px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '16px',
                                                flexShrink: 0
                                            }}>
                                                {isOverdue ? '⚠️' : isUrgent ? '🔴' : '📄'}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <strong style={{ fontSize: isMobile ? '13px' : '14px', color: '#1e3c72', display: 'block', marginBottom: '2px' }}>
                                                    {reminder.text || reminder.billName || 'Hóa đơn'}
                                                </strong>
                                                <div style={{ fontSize: isMobile ? '11px' : '12px', color: '#7a8fa6' }}>
                                                    {isOverdue ? (
                                                        <span style={{ color: '#e74c3c', fontWeight: '600' }}>Quá hạn {Math.abs(daysUntilDue)} ngày</span>
                                                    ) : isUrgent ? (
                                                        <span style={{ color: '#e67e22', fontWeight: '600' }}>Sắp đến hạn trong {daysUntilDue} ngày</span>
                                                    ) : (
                                                        <span>Đến hạn trong {daysUntilDue} ngày</span>
                                                    )}
                                                    <span style={{ marginLeft: '8px', color: '#b0bcc6' }}>
                                                        • {dueDate.toLocaleDateString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
                                            <div style={{ fontSize: isMobile ? '13px' : '14px', fontWeight: '700', color: '#e67e22', whiteSpace: 'nowrap' }}>
                                                {Number(reminder.amount).toLocaleString()} VNĐ
                                            </div>
                                            <button onClick={() => alert(`Đã ghi nhận hóa đơn: ${reminder.text}`)} style={{
                                                background: '#3498db', color: 'white', border: 'none',
                                                padding: '6px 12px', borderRadius: '5px', cursor: 'pointer',
                                                fontSize: '12px', transition: 'all 0.2s', fontWeight: '600',
                                                boxShadow: '0 2px 6px rgba(52, 152, 219, 0.15)', whiteSpace: 'nowrap'
                                            }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.background = '#2980b9';
                                                    e.currentTarget.style.boxShadow = '0 3px 8px rgba(52, 152, 219, 0.25)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.background = '#3498db';
                                                    e.currentTarget.style.boxShadow = '0 2px 6px rgba(52, 152, 219, 0.15)';
                                                }}>
                                                ✓ Thanh toán
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* DANH SÁCH GIAO DỊCH */}
                <div>
                    <h2 style={{
                        margin: '0 0 16px 0',
                        fontSize: isMobile ? '16px' : '20px',
                        fontWeight: '700',
                        color: '#1e3c72',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        📜 Lịch Sử
                    </h2>

                    <div style={{
                        display: 'grid',
                        gap: isMobile ? '10px' : '12px'
                    }}>
                        {Array.isArray(filteredTransactions) && filteredTransactions.length > 0 ? (
                            filteredTransactions.map((t) => (
                                <div
                                    key={t._id || Math.random()}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        flexDirection: isMobile ? 'column' : 'row',
                                        gap: isMobile ? '10px' : '0',
                                        alignItems: isMobile ? 'flex-start' : 'center',
                                        padding: isMobile ? '16px' : '20px',
                                        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafb 100%)',
                                        borderRadius: '12px',
                                        boxShadow: '0 2px 8px rgba(30, 60, 114, 0.04)',
                                        border: '1px solid rgba(30, 60, 114, 0.05)',
                                        transition: 'all 0.3s ease',
                                        cursor: 'pointer'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!isMobile) {
                                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(30, 60, 114, 0.1)';
                                            e.currentTarget.style.transform = 'translateX(4px)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!isMobile) {
                                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(30, 60, 114, 0.04)';
                                            e.currentTarget.style.transform = 'translateX(0)';
                                        }
                                    }}
                                >
                                    <div style={{ flex: 1, width: isMobile ? '100%' : 'auto' }}>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            marginBottom: '6px'
                                        }}>
                                            <div style={{
                                                width: '32px',
                                                height: '32px',
                                                background: t.type === 'income'
                                                    ? 'rgba(39, 174, 96, 0.1)'
                                                    : 'rgba(231, 76, 60, 0.1)',
                                                borderRadius: '8px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '16px',
                                                fontWeight: '600',
                                                flexShrink: 0
                                            }}>
                                                {t.type === 'income' ? '↓' : '↑'}
                                            </div>
                                            <div>
                                                <strong style={{
                                                    fontSize: isMobile ? '13px' : '15px',
                                                    color: '#1e3c72',
                                                    display: 'block'
                                                }}>
                                                    {t.category || t.categoryName}
                                                </strong>
                                            </div>
                                        </div>
                                        <div style={{
                                            color: '#7a8fa6',
                                            fontSize: isMobile ? '12px' : '13px',
                                            marginLeft: '42px'
                                        }}>
                                            {t.description || t.note || 'Không có ghi chú'}
                                            <span style={{
                                                fontSize: '11px',
                                                color: '#b0bcc6',
                                                marginLeft: '8px',
                                                fontWeight: '400'
                                            }}>
                                                • {new Date(t.date || Date.now()).toLocaleDateString('vi-VN', {
                                                    weekday: 'short',
                                                    year: 'numeric',
                                                    month: '2-digit',
                                                    day: '2-digit'
                                                })}
                                            </span>
                                        </div>
                                    </div>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: isMobile ? '8px' : '10px',
                                        flexWrap: isMobile ? 'wrap' : 'nowrap',
                                        textAlign: isMobile ? 'left' : 'right',
                                        minWidth: isMobile ? 'auto' : '200px',
                                        justifyContent: isMobile ? 'flex-start' : 'flex-end'
                                    }}>
                                        <div style={{
                                            fontWeight: '700',
                                            fontSize: isMobile ? '14px' : '16px',
                                            color: t.type === 'income' ? '#27ae60' : '#e74c3c',
                                            letterSpacing: '-0.3px',
                                            minWidth: isMobile ? 'auto' : '100px',
                                            textAlign: isMobile ? 'left' : 'right'
                                        }}>
                                            {t.type === 'income' ? '+' : '-'} {Number(t.amount).toLocaleString()} ₫
                                        </div>
                                        <button onClick={() => handleEditTransaction(t)} style={{
                                            background: '#3498db', color: 'white', border: 'none',
                                            padding: '6px 10px', borderRadius: '5px', cursor: 'pointer',
                                            fontSize: '12px', transition: 'all 0.2s', boxShadow: '0 2px 6px rgba(52, 152, 219, 0.15)',
                                            whiteSpace: 'nowrap', fontWeight: '600'
                                        }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = '#2980b9';
                                                e.currentTarget.style.boxShadow = '0 3px 8px rgba(52, 152, 219, 0.25)';
                                                e.currentTarget.style.transform = 'translateY(-1px)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = '#3498db';
                                                e.currentTarget.style.boxShadow = '0 2px 6px rgba(52, 152, 219, 0.15)';
                                                e.currentTarget.style.transform = 'translateY(0)';
                                            }}>
                                            ✏️ Sửa
                                        </button>
                                        <button onClick={() => handleDeleteTransaction(t._id)} style={{
                                            background: '#e74c3c', color: 'white', border: 'none',
                                            padding: '6px 10px', borderRadius: '5px', cursor: 'pointer',
                                            fontSize: '12px', transition: 'all 0.2s', boxShadow: '0 2px 6px rgba(231, 76, 60, 0.15)',
                                            whiteSpace: 'nowrap', fontWeight: '600'
                                        }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = '#c0392b';
                                                e.currentTarget.style.boxShadow = '0 3px 8px rgba(231, 76, 60, 0.25)';
                                                e.currentTarget.style.transform = 'translateY(-1px)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = '#e74c3c';
                                                e.currentTarget.style.boxShadow = '0 2px 6px rgba(231, 76, 60, 0.15)';
                                                e.currentTarget.style.transform = 'translateY(0)';
                                            }}>
                                            🗑️ Xóa
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div style={{
                                padding: isMobile ? '30px 16px' : '40px 20px',
                                textAlign: 'center',
                                background: 'linear-gradient(135deg, #ffffff 0%, #f8fafb 100%)',
                                borderRadius: '12px',
                                border: '2px dashed rgba(30, 60, 114, 0.1)',
                                color: '#7a8fa6'
                            }}>
                                <p style={{
                                    fontSize: isMobile ? '14px' : '16px',
                                    fontWeight: '500',
                                    margin: '0 0 6px 0'
                                }}>
                                    Chưa có giao dịch
                                </p>
                                <p style={{
                                    fontSize: isMobile ? '12px' : '13px',
                                    color: '#b0bcc6',
                                    margin: 0
                                }}>
                                    Hãy thêm giao dịch mới
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
