import axios from 'axios';


const axiosClient = axios.create({
  baseURL: 'http://moneycare-alb-1679138998.ap-southeast-2.elb.amazonaws.com/api',
  headers: { 'Content-Type': 'application/json' },
});


axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default axiosClient;
