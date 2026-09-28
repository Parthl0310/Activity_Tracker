import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Sparkles, AlertCircle, Info, X } from 'lucide-react';
import { useNotificationStore, AppNotification } from '../../store/notificationStore';

interface ToastItemProps {
  toast: AppNotification;
  onClose: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onClose }) => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);
  const duration = toast.duration || 4500;
  const startTimeRef = useRef(Date.now());
  const remainingRef = useRef(duration);

  useEffect(() => {
    if (isPaused) return;

    startTimeRef.current = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const newRemaining = Math.max(0, remainingRef.current - elapsed);
      setProgress((newRemaining / duration) * 100);

      if (newRemaining <= 0) {
        clearInterval(interval);
        onClose(toast.id);
      }
    }, 50);

    return () => {
      clearInterval(interval);
      remainingRef.current = Math.max(0, remainingRef.current - (Date.now() - startTimeRef.current));
    };
  }, [isPaused, duration, toast.id, onClose]);

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return (
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: 'rgba(5, 150, 105, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <CheckCircle2 size={18} color="#059669" />
          </div>
        );
      case 'ai':
        return (
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: 'rgba(200, 135, 74, 0.16)',
            border: '1px solid rgba(200, 135, 74, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 0 12px rgba(200, 135, 74, 0.25)',
          }}>
            <Sparkles size={17} color="#B07848" />
          </div>
        );
      case 'error':
        return (
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: 'rgba(220, 38, 38, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <AlertCircle size={18} color="#DC2626" />
          </div>
        );
      default:
        return (
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: 'rgba(124, 77, 46, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Info size={18} color="#7C4D2E" />
          </div>
        );
    }
  };

  const getBorderColor = () => {
    switch (toast.type) {
      case 'ai': return 'rgba(200, 135, 74, 0.4)';
      case 'success': return 'rgba(5, 150, 105, 0.3)';
      case 'error': return 'rgba(220, 38, 38, 0.3)';
      default: return 'rgba(139, 90, 43, 0.2)';
    }
  };

  const getProgressBarColor = () => {
    switch (toast.type) {
      case 'ai': return 'linear-gradient(90deg, #C8874A, #7C4D2E)';
      case 'success': return '#059669';
      case 'error': return '#DC2626';
      default: return '#7C4D2E';
    }
  };

  const handleClick = () => {
    if (toast.targetRoute) {
      navigate(toast.targetRoute);
      onClose(toast.id);
    }
  };

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onClick={handleClick}
      style={{
        width: '360px',
        maxWidth: 'calc(100vw - 32px)',
        backgroundColor: 'rgba(254, 252, 248, 0.96)',
        backdropFilter: 'blur(16px)',
        border: `1px solid ${getBorderColor()}`,
        borderRadius: '14px',
        boxShadow: '0 12px 32px -4px rgba(44, 24, 16, 0.18), 0 4px 12px rgba(44, 24, 16, 0.08)',
        overflow: 'hidden',
        position: 'relative',
        cursor: toast.targetRoute ? 'pointer' : 'default',
        transform: 'translateY(0)',
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        animation: 'worklogToastSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem', padding: '1rem 1.15rem 1.15rem 1.15rem' }}>
        {getIcon()}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: '0.875rem',
            fontWeight: 700,
            color: '#2C1810',
            letterSpacing: '-0.01em',
            marginBottom: '0.2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}>
            <span>{toast.title}</span>
          </div>
          <div style={{
            fontSize: '0.8rem',
            color: '#5A3E2B',
            lineHeight: 1.45,
            wordBreak: 'break-word',
          }}>
            {toast.message}
          </div>
          {toast.targetRoute && (
            <div style={{
              fontSize: '0.725rem',
              color: '#7C4D2E',
              fontWeight: 600,
              marginTop: '0.35rem',
              textDecoration: 'underline',
            }}>
              View details →
            </div>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose(toast.id);
          }}
          aria-label="Close notification"
          style={{
            background: 'transparent',
            border: 'none',
            color: '#A89080',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 0.15s, background-color 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#2C1810';
            e.currentTarget.style.backgroundColor = 'rgba(124, 77, 46, 0.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#A89080';
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <X size={15} />
        </button>
      </div>

      {/* Progress Bar Timer */}
      <div style={{
        height: '3px',
        width: '100%',
        backgroundColor: 'rgba(139, 90, 43, 0.08)',
        position: 'absolute',
        bottom: 0,
        left: 0,
      }}>
        <div style={{
          height: '100%',
          width: `${progress}%`,
          background: getProgressBarColor(),
          transition: 'width 50ms linear',
        }} />
      </div>
    </div>
  );
};

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useNotificationStore();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container-wrapper">
      <style>{`
        @keyframes worklogToastSlideIn {
          from {
            opacity: 0;
            transform: translateY(16px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={removeToast} />
      ))}
    </div>
  );
};
