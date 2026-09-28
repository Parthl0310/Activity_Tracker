import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Lock, Mail, User } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export const SignupPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signup } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await signup(name, email, password);
      // New user goes straight to Wireframe 1 Profile Setup!
      navigate('/onboarding');
    } catch (err: any) {
      setError('Could not create account');
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
      {/* Ambient background */}
      <div className="ambient-glow-top" />
      <div className="ambient-curve-line" />

      {/* Brand Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem', zIndex: 10 }}>
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
          Automate your daily engineering records & performance reviews
        </p>
      </div>

      {/* Signup Card */}
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '460px',
        padding: '2.5rem 2.25rem',
        zIndex: 10,
        boxShadow: '0 20px 40px -15px rgba(124, 77, 46, 0.15)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#2C1810' }}>Create an Account</h2>
            <p style={{ fontSize: '0.85rem', color: '#7A6355', marginTop: '0.2rem' }}>Step 1: Account credentials</p>
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
              FULL NAME
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Kavya Deshmukh"
                required
                className="input-capsule"
                style={{ paddingLeft: '2.75rem' }}
              />
              <User size={16} style={{ position: 'absolute', left: '1.1rem', top: '50%', transform: 'translateY(-50%)', color: '#A89080' }} />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', color: '#7A6355', marginBottom: '0.4rem' }}>
              WORK EMAIL
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="kavya@techcorp.com"
                required
                className="input-capsule"
                style={{ paddingLeft: '2.75rem' }}
              />
              <Mail size={16} style={{ position: 'absolute', left: '1.1rem', top: '50%', transform: 'translateY(-50%)', color: '#A89080' }} />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', color: '#7A6355', marginBottom: '0.4rem' }}>
              PASSWORD
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                required
                minLength={8}
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
            {loading ? 'Creating Account...' : (
              <>
                <span>Continue to Profile Setup</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.75rem', fontSize: '0.85rem', color: '#7A6355' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#7C4D2E', fontWeight: 600, textDecoration: 'none' }}>
            Sign In
          </Link>
        </div>
      </div>

      <div style={{ marginTop: '2.5rem', color: '#A89080', fontSize: '0.75rem' }}>
        Secure, private, and powered by WorkLog AI.
      </div>
    </div>
  );
};
