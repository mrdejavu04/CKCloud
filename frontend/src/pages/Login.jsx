
import { useState } from 'react';
import axiosClient from '../api/axiosClient';

function Login() {
    const [isLogin, setIsLogin] = useState(true); // Trạng thái: đang ở màn Login hay Register

    // State cho form
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isLogin) {
                // --- LOGIC ĐĂNG NHẬP ---
                const res = await axiosClient.post('/api/auth/login', { email, password });
                localStorage.setItem('token', res.data.token);
                alert("Đăng nhập thành công! Token: " + res.data.token.substring(0, 15) + "...");
                // Sau này sẽ navigate('/dashboard') ở đây
            } else {
                // --- LOGIC ĐĂNG KÝ ---
                // Thường API đăng ký là /api/auth/register
                await axiosClient.post('/api/auth/register', {
                    name,
                    email,
                    password
                });
                alert("Đăng ký thành công! Hãy chuyển sang Đăng nhập.");
                setIsLogin(true); // Chuyển về màn hình đăng nhập
            }
            window.location.href = '/dashboard'

        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.message || error.message;
            alert(isLogin ? `Đăng nhập thất bại: ${msg}` : `Đăng ký thất bại: ${msg}`);
        }
    };

    return (
        <div style={{ padding: '50px', maxWidth: '400px', margin: '0 auto', fontFamily: 'Arial' }}>
            <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px' }}>
                <h2 style={{ textAlign: 'center' }}>
                    {isLogin ? 'ĐĂNG NHẬP' : 'ĐĂNG KÝ TÀI KHOẢN'}
                </h2>

                <form onSubmit={handleSubmit}>
                    {/* Chỉ hiện ô Nhập tên khi đang Đăng ký */}
                    {!isLogin && (
                        <div style={{ marginBottom: '10px' }}>
                            <label>Họ tên:</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                                required={!isLogin}
                            />
                        </div>
                    )}

                    <div style={{ marginBottom: '10px' }}>
                        <label>Email:</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                            required
                        />
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label>Mật khẩu:</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        style={{
                            width: '100%',
                            padding: '10px',
                            backgroundColor: isLogin ? '#007bff' : '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        {isLogin ? 'Đăng Nhập' : 'Đăng Ký Ngay'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '15px' }}>
                    {isLogin ? 'Chưa có tài khoản? ' : 'Đã có tài khoản? '}
                    <span
                        onClick={() => setIsLogin(!isLogin)}
                        style={{ color: 'blue', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                        {isLogin ? 'Đăng ký tại đây' : 'Đăng nhập lại'}
                    </span>
                </p>
            </div>
        </div>
    );
}

export default Login;

// // ... đoạn alert thành công ...
// window.location.href = '/dashboard'; // Chuyển hướng sang Dashboard