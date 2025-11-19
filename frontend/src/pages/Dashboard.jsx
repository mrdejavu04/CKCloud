import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';

function Dashboard() {
    const navigate = useNavigate();
    const [transactions, setTransactions] = useState([]);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // State cho Form thêm mới
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('Ăn uống'); // Mặc định
    const [type, setType] = useState('expense'); // Mặc định là Chi tiêu
    const [description, setDescription] = useState('');

    // Hàm tải dữ liệu
    // Hàm tải dữ liệu
    const fetchData = async () => {
        try {
            // API lấy user bị lỗi 404 thì kệ nó (catch lỗi để không sập)
            const userRes = await axiosClient.get('/api/users/me').catch(err => {
                console.warn("Bỏ qua lỗi lấy user:", err);
                return null;
            });
            if (userRes) setUser(userRes.data);

            // Lấy danh sách giao dịch
            const transRes = await axiosClient.get('/api/transactions');

            // --- ĐOẠN QUAN TRỌNG NHẤT: Kiểm tra dữ liệu trước khi lưu ---
            console.log("Dữ liệu Backend trả về là:", transRes.data); // Xem trong Console

            if (Array.isArray(transRes.data)) {
                // Trường hợp 1: Backend trả về danh sách chuẩn []
                setTransactions(transRes.data);
            } else if (transRes.data && Array.isArray(transRes.data.data)) {
                // Trường hợp 2: Backend trả về { data: [] }
                setTransactions(transRes.data.data);
            } else if (transRes.data && Array.isArray(transRes.data.transactions)) {
                // Trường hợp 3: Backend trả về { transactions: [] }
                setTransactions(transRes.data.transactions);
            } else {
                // Trường hợp xấu nhất: Không tìm thấy danh sách đâu -> Cho thành rỗng để không sập
                console.error("Dữ liệu lạ quá, không đọc được:", transRes.data);
                setTransactions([]);
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

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/');
            return;
        }
        fetchData();
    }, []);

    // Xử lý khi bấm nút "Thêm giao dịch"
    const handleAddTransaction = async (e) => {
        e.preventDefault();
        try {
            // Gửi dữ liệu lên Backend
            // HỎI A: Các trường này tên tiếng Anh là gì? (amount, type, category, description/note?)
            await axiosClient.post('/api/transactions', {
                amount: Number(amount),
                category,
                type,       // 'income' hoặc 'expense'
                description, // hoặc 'note'
                date: new Date()
            });

            alert("Thêm thành công!");

            // Reset form
            setAmount('');
            setDescription('');

            // Tải lại danh sách để thấy dữ liệu mới
            fetchData();

        } catch (error) {
            alert("Lỗi thêm mới: " + (error.response?.data?.message || error.message));
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/');
    };

    if (loading) return <div style={{ textAlign: 'center', marginTop: '20px' }}>Đang tải...</div>;

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', fontFamily: 'Arial' }}>

            {/* HEADER */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #ccc', paddingBottom: '10px' }}>
                <h2>Ví của {user?.name || 'Bạn'} 💰</h2>
                <button onClick={handleLogout} style={{ background: '#ff4d4f', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer' }}>
                    Đăng xuất
                </button>
            </div>

            {/* KHU VỰC FORM THÊM GIAO DỊCH */}
            <div style={{ background: '#f0f2f5', padding: '20px', borderRadius: '10px', marginBottom: '30px' }}>
                <h3>➕ Thêm giao dịch mới</h3>
                <form onSubmit={handleAddTransaction} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>

                    {/* Loại: Thu hay Chi */}
                    <select
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }}
                    >
                        <option value="expense">🔴 Chi tiêu</option>
                        <option value="income">🟢 Thu nhập</option>
                    </select>

                    {/* Số tiền */}
                    <input
                        type="number"
                        placeholder="Số tiền (VNĐ)"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                        style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ddd', flex: 1 }}
                    />

                    {/* Danh mục */}
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }}
                    >
                        <option value="Ăn uống">Ăn uống</option>
                        <option value="Đi lại">Đi lại</option>
                        <option value="Mua sắm">Mua sắm</option>
                        <option value="Lương">Lương</option>
                        <option value="Khác">Khác</option>
                    </select>

                    {/* Ghi chú */}
                    <input
                        type="text"
                        placeholder="Ghi chú (VD: Ăn sáng)"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ddd', flex: 2 }}
                    />

                    <button type="submit" style={{ background: '#1890ff', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
                        Lưu
                    </button>
                </form>
            </div>

            {/* DANH SÁCH LỊCH SỬ */}
            <h3>📜 Lịch sử giao dịch</h3>
            {/* DANH SÁCH LỊCH SỬ - Code an toàn */}
            <ul style={{ listStyle: 'none', padding: 0 }}>
                {/* Chỉ chạy .map nếu transactions ĐÚNG LÀ ARRAY */}
                {Array.isArray(transactions) && transactions.length > 0 ? (
                    transactions.map((t) => (
                        <li key={t._id || Math.random()} style={{ padding: '10px', borderBottom: '1px solid #ccc' }}>
                            {/* Hiển thị tạm description và amount để test */}
                            {t.description || t.note || 'Giao dịch'} : {t.amount}
                        </li>
                    ))
                ) : (
                    <p style={{ color: '#888' }}>Chưa có giao dịch nào (Hoặc lỗi tải).</p>
                )}
            </ul>
        </div>
    );
}

export default Dashboard;