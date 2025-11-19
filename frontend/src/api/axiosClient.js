// frontend/src/api/axiosClient.js
import axios from 'axios';

// Cấu hình đường dẫn đến Backend (Port 5000)
const axiosClient = axios.create({
    baseURL: '', // Nếu bạn A đặt prefix là /api thì sửa thành 'http://localhost:5000/api'
    headers: {
        'Content-Type': 'application/json',
    },
});

// Tự động thêm Token vào mỗi lần gửi request (nếu đã đăng nhập)
axiosClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default axiosClient;