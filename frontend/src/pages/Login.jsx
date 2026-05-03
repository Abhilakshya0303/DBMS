import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function Login() {
  const { login, register, user } = useAuth();
  const navigate = useNavigate();

  const [mode,    setMode]    = useState('login');   // 'login' | 'register'
  const [form,    setForm]    = useState({ full_name: '', email: '', password: '', role: 'Requester', dept_id: '' });
  const [depts,   setDepts]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    if (user) navigate('/dashboard');
    api.get('/admin/departments').then(({ data }) => setDepts(data.data || [])).catch(() => {});
  }, [user, navigate]);

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setMessage({ text: '', type: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    if (mode === 'login') {
      const res = await login(form.email, form.password);
      if (res.success) {
        navigate('/dashboard');
      } else {
        setMessage({ text: res.message, type: 'error' });
      }
    } else {
      if (!form.full_name.trim()) return setMessage({ text: 'Full name is required.', type: 'error' });
      const res = await register(form);
      if (res.success) {
        setMessage({ text: 'Registered! Please log in.', type: 'success' });
        setMode('login');
        setForm(f => ({ ...f, full_name: '', password: '' }));
      } else {
        setMessage({ text: res.message, type: 'error' });
      }
    }
    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="logo">
          <div style={{ fontSize: 40, marginBottom: 8 }}>🏫</div>
          <h1>Room Allocation System</h1>
          <p>Thapar Institute of Engineering &amp; Technology</p>
        </div>

        {message.text && (
          <div className={`alert alert-${message.type === 'error' ? 'error' : 'success'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className="form-group">
              <label>Full Name</label>
              <input name="full_name" className="form-control" placeholder="Your full name"
                value={form.full_name} onChange={handleChange} required />
            </div>
          )}

          <div className="form-group">
            <label>Email</label>
            <input name="email" type="email" className="form-control" placeholder="you@thapar.edu"
              value={form.email} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input name="password" type="password" className="form-control" placeholder="••••••••"
              value={form.password} onChange={handleChange} required />
          </div>

          {mode === 'register' && (
            <>
              <div className="form-group">
                <label>Role</label>
                <select name="role" className="form-control" value={form.role} onChange={handleChange}>
                  <option value="Requester">Society / Faculty Requester</option>
                  <option value="Staff">Academic Staff</option>
                </select>
              </div>
              <div className="form-group">
                <label>Department</label>
                <select name="dept_id" className="form-control" value={form.dept_id} onChange={handleChange}>
                  <option value="">— Select Department —</option>
                  {depts.map(d => (
                    <option key={d.dept_id} value={d.dept_id}>{d.dept_name}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading} style={{ marginTop: 8 }}>
            {loading ? <span className="spinner" /> : null}
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#6b7280' }}>
          {mode === 'login' ? (
            <>Don't have an account?{' '}
              <button onClick={() => { setMode('register'); setMessage({ text: '', type: '' }); }}
                style={{ color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
                Register
              </button>
            </>
          ) : (
            <>Already registered?{' '}
              <button onClick={() => { setMode('login'); setMessage({ text: '', type: '' }); }}
                style={{ color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
                Sign In
              </button>
            </>
          )}
        </div>

        {/* Demo credentials box */}
        <div className="alert alert-info" style={{ marginTop: 20, fontSize: 12 }}>
          <strong>Demo Credentials</strong><br />
          🔴 Admin: admin@thapar.edu / password123<br />
          🟡 Staff: staff@thapar.edu / password123<br />
          🟢 User: aryan@thapar.edu / password123
        </div>
      </div>
    </div>
  );
}
