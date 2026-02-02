import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { Key } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/login`, { email, password });
      login(response.data.user);
      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.response?.data?.detail || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container py-16">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <Key className="h-12 w-12 mx-auto text-primary mb-4" />
            <h1 className="text-4xl font-black mb-2 tracking-tight" style={{ fontFamily: 'Chivo, sans-serif' }} data-testid="login-title">
              Welcome Back
            </h1>
            <p className="text-text-secondary">Log in to your All Remotes account</p>
          </div>

          <div className="bg-white border border-border rounded-sm p-8">
            <form onSubmit={handleSubmit} data-testid="login-form">
              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-sm font-medium mb-2 block">Email</label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    data-testid="email-input"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Password</label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    data-testid="password-input"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-red-600 text-white hover:bg-red-700 h-12 text-base font-bold uppercase tracking-wide mb-4 shadow-md"
                data-testid="login-button"
              >
                {loading ? 'Logging in...' : 'Log In'}
              </Button>

              <p className="text-center text-sm text-text-secondary">
                Don't have an account?{' '}
                <Link to="/register" className="text-primary font-medium hover:underline" data-testid="register-link">
                  Register here
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
