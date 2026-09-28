import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Lock, Mail } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError('Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background ambient lighting */}
      <div className="ambient-glow-top" />
      <div className="ambient-curve-line" />

      {/* Brand Header */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem', zIndex: 10 }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.6rem',
          fontSize: '1.75rem',
          fontWeight: 800,
          color: '#2C1810',
          letterSpacing: '-0.03em',
        }}>
          WorkLog <span style={{ color: '#7C4D2E' }}>AI</span>
        </div>
        <p style={{ color: '#7A6355', fontSize: '0.9rem', marginTop: '0.4rem' }}>
          Intelligent daily activity and performance reporting
        </p>
      </div>

      {/* Login Card */}
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '440px',
        padding: '2.5rem 2.25rem',
        zIndex: 10,
        boxShadow: '0 20px 40px -15px rgba(124, 77, 46, 0.15)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#2C1810' }}>Welcome back</h2>
            <p style={{ fontSize: '0.85rem', color: '#7A6355', marginTop: '0.2rem' }}>Sign in to continue tracking your work</p>
          </div>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            backgroundColor: 'rgba(124, 77, 46, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#C8874A',
          }}>
            <Sparkles size={18} />
          </div>
        </div>

        {error && (
          <div style={{
            backgroundColor: 'rgba(192, 57, 43, 0.1)',
            border: '1px solid rgba(192, 57, 43, 0.25)',
            borderRadius: '10px',
            padding: '0.75rem',
            marginBottom: '1.25rem',
            color: '#C0392B',
            fontSize: '0.85rem',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', color: '#7A6355', marginBottom: '0.4rem' }}>
              WORK EMAIL
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="input-capsule"
                style={{ paddingLeft: '2.75rem' }}
              />
              <Mail size={16} style={{ position: 'absolute', left: '1.1rem', top: '50%', transform: 'translateY(-50%)', color: '#A89080' }} />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', color: '#7A6355' }}>
                PASSWORD
              </label>
              <a href="#forgot" style={{ fontSize: '0.75rem', color: '#7C4D2E', textDecoration: 'none' }}>
                Forgot password?
              </a>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="input-capsule"
                style={{ paddingLeft: '2.75rem' }}
              />
              <Lock size={16} style={{ position: 'absolute', left: '1.1rem', top: '50%', transform: 'translateY(-50%)', color: '#A89080' }} />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{
              marginTop: '0.75rem',
              padding: '0.85rem',
              fontSize: '0.95rem',
              fontWeight: 600,
              width: '100%',
              borderRadius: '9999px',
            }}
          >
            {loading ? 'Signing In...' : (
              <>
                <span>Sign In to WorkLog</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>



        <div style={{ textAlign: 'center', marginTop: '1.75rem', fontSize: '0.85rem', color: '#7A6355' }}>
          Don't have an account?{' '}
          <Link to="/signup" style={{ color: '#7C4D2E', fontWeight: 600, textDecoration: 'none' }}>
            Create Account
          </Link>
        </div>
      </div>

      <div style={{ marginTop: '2.5rem', color: '#A89080', fontSize: '0.75rem' }}>
        Secure, private, and powered by WorkLog AI.
      </div>
    </div>
  );
};
