import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Clock, Eye, EyeOff, Lock, User } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import Input from '../components/Input';
import Button from '../components/Button';
import './Login.css';

export function Login() {
  const [username, setUsername] = useState('leader');
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/attendance';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password) {
      setError('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu');
      return;
    }

    try {
      setLoading(true);
      await login(username, password);
      navigate(from, { replace: true });
    } catch (err) {
      const serverMsg = err.response?.data?.message || err.response?.data?.error;
      setError(serverMsg || err.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo-icon">
            <Clock size={32} />
          </div>
          <h1 className="login-title">ỐC LẮC CÔ MAI</h1>
          <p className="login-subtitle">Đăng nhập tài khoản quản lý để tiếp tục</p>
        </div>

        {error && <div className="login-error-alert">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <Input
            label="Tên đăng nhập"
            placeholder="Nhập username (ví dụ: leader)"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            icon={User}
            required
            autoFocus
          />

          <Input
            label="Mật khẩu"
            type={showPassword ? 'text' : 'password'}
            placeholder="Nhập mật khẩu (ví dụ: 123456)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={Lock}
            endIcon={showPassword ? EyeOff : Eye}
            onEndIconClick={() => setShowPassword(!showPassword)}
            required
          />

          <div className="login-hint">
            <span>Tài khoản thử nghiệm: <strong>leader</strong> / <strong>123456</strong></span>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            className="login-submit-btn"
          >
            Đăng nhập
          </Button>
        </form>
      </div>
    </div>
  );
}

export default Login;
