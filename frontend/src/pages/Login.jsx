
import { useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';

function Login() {
    const [isLogin, setIsLogin] = useState(true);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Đảm bảo mỗi lần vào màn đăng nhập không dùng nhầm token cũ
    useEffect(() => {
        localStorage.removeItem('token');
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (isLogin) {
                const res = await axiosClient.post('/auth/login', { email, password });
                localStorage.setItem('token', res.data.token);
            } else {
                await axiosClient.post('/auth/register', { name, email, password });
                setIsLogin(true);
            }
            window.location.href = '/dashboard';
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || err.message || 'Đã có lỗi xảy ra');
        } finally {
            setLoading(false);
        }
    };

    const commonInput = {
        width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cfd8e6',
        background: '#ffffff', color: '#0b2b45', fontSize: '14px', boxSizing: 'border-box', outline: 'none',
        position: 'relative', zIndex: 10, pointerEvents: 'auto'
    };

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(180deg,#e9eef6 0%,#cfe1f4 100%)', fontFamily: "'Segoe UI', Arial, sans-serif"
        }}>
            <div style={{
                width: '96%', maxWidth: '460px', borderRadius: '12px', background: 'linear-gradient(180deg,#ffffff,#f7fbff)',
                boxShadow: '0 12px 40px rgba(11,43,69,0.12)', padding: '28px', boxSizing: 'border-box', border: '1px solid rgba(11,43,69,0.04)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: 'linear-gradient(135deg,#1e3c72,#2a5298)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700 }}>CK</div>
                    <div>
                        <h1 style={{ margin: 0, fontSize: 18, color: '#1e3c72' }}>CKCloud</h1>
                        <div style={{ fontSize: 12, color: '#7a8fa6' }}>{isLogin ? 'Đăng nhập để tiếp tục' : 'Tạo tài khoản mới'}</div>
                    </div>
                </div>

                {error && (
                    <div style={{ marginBottom: 12, color: '#8b1f2d', background: '#fff2f2', padding: '8px 10px', borderRadius: 8, border: '1px solid #f5c0c7' }}>{error}</div>
                )}

                <form onSubmit={handleSubmit}>
                    {!isLogin && (
                        <div style={{ marginBottom: 12 }}>
                            <label style={{ display: 'block', fontSize: 12, color: '#0b2b45', marginBottom: 6, fontWeight: 700 }}>Họ tên</label>
                            <input value={name} onChange={e => setName(e.target.value)} placeholder="Nguyễn Văn A" style={commonInput} required={!isLogin} />
                        </div>
                    )}

                    <div style={{ marginBottom: 12 }}>
                        <label style={{ display: 'block', fontSize: 12, color: '#0b2b45', marginBottom: 6, fontWeight: 700 }}>Email</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@domain.com" style={commonInput} required />
                    </div>

                    <div style={{ marginBottom: 14 }}>
                        <label style={{ display: 'block', fontSize: 12, color: '#0b2b45', marginBottom: 6, fontWeight: 700 }}>Mật khẩu</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" style={commonInput} required />
                    </div>

                    <button type="submit" disabled={loading} style={{
                        width: '100%', padding: '12px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 800,
                        color: '#fff', background: 'linear-gradient(90deg,#0b2b45,#123a62)', boxShadow: '0 8px 22px rgba(11,43,69,0.18)'
                    }}>{loading ? (isLogin ? 'Đang đăng nhập...' : 'Đang đăng ký...') : (isLogin ? 'Đăng Nhập' : 'Đăng Ký')}</button>
                </form>

                <div style={{ marginTop: 14, textAlign: 'center', fontSize: 13, color: '#7a8fa6' }}>
                    {isLogin ? 'Chưa có tài khoản? ' : 'Đã có tài khoản? '}
                    <button onClick={() => { setIsLogin(!isLogin); setError(''); }} style={{ background: 'transparent', border: 'none', color: '#1e3c72', fontWeight: 700, cursor: 'pointer' }}>{isLogin ? 'Đăng ký' : 'Đăng nhập'}</button>
                </div>
            </div>
        </div>
    );
}

export default Login;
