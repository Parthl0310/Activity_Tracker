import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Check } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';

export const ProfileSetupPage: React.FC = () => {
  const { user, updateProfile } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    jobRole: user?.jobRole || '',
    department: user?.department || '',
    reviewYear: user?.reviewYear || new Date().getFullYear(),
  });

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        name: prev.name || user.name || '',
        jobRole: prev.jobRole || user.jobRole || '',
        department: prev.department || user.department || '',
        reviewYear: user.reviewYear || prev.reviewYear || new Date().getFullYear(),
      }));
    }
  }, [user]);

  const [currentStep, setCurrentStep] = useState(2);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (currentStep === 2) {
      setIsSubmitting(true);
      try {
        await updateProfile(formData);
        setCurrentStep(3);
        addNotification({
          type: 'success',
          title: 'Profile Configured',
          message: 'Your work profile is ready. Click "Start Logging" to access your dashboard.'
        });
      } catch (err) {
        console.error(err);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (currentStep === 3) {
      navigate('/', { replace: true });
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2.5rem 1rem',
      position: 'relative',
      overflow: 'hidden',
      backgroundColor: '#F5EDE0',
    }}>
      {/* Background ambient lighting and curves matching wireframe */}
      <div className="ambient-glow-top" />
      <div className="ambient-curve-line" />

      {/* Top Header Logo */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem', zIndex: 10 }}>
        <h1 style={{
          fontSize: '1.75rem',
          fontWeight: 800,
          color: '#2C1810',
          letterSpacing: '-0.02em',
        }}>
          WorkLog <span style={{ color: '#7C4D2E' }}>AI</span>
        </h1>
      </div>

      {/* Main Glassmorphic Onboarding Card */}
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '560px',
        padding: '2.5rem 2.5rem',
        borderRadius: '24px',
        zIndex: 10,
        boxShadow: '0 25px 50px -12px rgba(124, 77, 46, 0.12)',
        border: '1px solid rgba(139, 90, 43, 0.12)',
        backgroundColor: 'rgba(254, 252, 248, 0.95)',
      }}>
        {/* Card Title and Sparkle */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
          <h2 style={{
            fontSize: '1.45rem',
            fontWeight: 700,
            color: '#2C1810',
            letterSpacing: '-0.02em',
          }}>
            Set up your work profile
          </h2>
          <div style={{ color: '#7C4D2E' }}>
            <Sparkles size={20} />
          </div>
        </div>

        <p style={{
          fontSize: '0.875rem',
          color: '#7A6355',
          marginBottom: '1.75rem',
          lineHeight: '1.4',
        }}>
          This information helps WorkLog understand your professional context.
        </p>

        {/* Stepper Progress */}
        <div className="mobile-scroll-x" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1.25rem',
          paddingBottom: '1.75rem',
          marginBottom: '1.75rem',
          borderBottom: '1px solid rgba(139, 90, 43, 0.1)',
          fontSize: '0.75rem',
          fontWeight: 700,
          letterSpacing: '0.05em',
          whiteSpace: 'nowrap',
        }}>
          {/* Step 1 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#7A6355' }}>
            <div style={{
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              backgroundColor: 'rgba(139, 90, 43, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Check size={10} color="#94A3B8" />
            </div>
            <span>01 ACCOUNT</span>
          </div>

          <span style={{ color: '#A89080' }}>·</span>

          {/* Step 2 (Active or Completed) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: currentStep === 2 ? '#2C1810' : '#7A6355' }}>
            <div style={{
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              backgroundColor: currentStep > 2 ? 'rgba(139, 90, 43, 0.12)' : 'transparent',
              border: currentStep === 2 ? '2px solid #7C4D2E' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {currentStep > 2 ? <Check size={10} color="#94A3B8" /> : (
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#7C4D2E' }} />
              )}
            </div>
            <span style={{ color: currentStep === 2 ? '#2C1810' : '#7A6355' }}>02 PROFILE</span>
          </div>

          <span style={{ color: '#A89080' }}>·</span>

          {/* Step 3 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: currentStep === 3 ? '#2C1810' : '#A89080' }}>
            <div style={{
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              border: currentStep === 3 ? '2px solid #7C4D2E' : '1.5px solid #C4A882',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {currentStep === 3 && <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#7C4D2E' }} />}
            </div>
            <span>03 START LOGGING</span>
          </div>
        </div>

        {/* Setup Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
          
          {currentStep === 2 && (
            <>
              {/* Field: NAME */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em', color: '#7A6355', marginBottom: '0.45rem' }}>
                  NAME
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Kavya Deshmukh"
                  required
                  className="input-capsule"
                />
              </div>

              {/* Field: JOB ROLE */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em', color: '#7A6355', marginBottom: '0.45rem' }}>
                  JOB ROLE
                </label>
                <input
                  type="text"
                  value={formData.jobRole}
                  onChange={(e) => setFormData({ ...formData, jobRole: e.target.value })}
                  placeholder="e.g. Senior Backend Engineer"
                  required
                  className="input-capsule"
                />
              </div>

              {/* Row: DEPARTMENT & REVIEW YEAR */}
              <div className="responsive-two-col">
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em', color: '#7A6355', marginBottom: '0.45rem' }}>
                    DEPARTMENT
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="e.g. Engineering"
                    required
                    className="input-capsule"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em', color: '#7A6355', marginBottom: '0.45rem' }}>
                    REVIEW YEAR
                  </label>
                  <select
                    value={formData.reviewYear}
                    onChange={(e) => setFormData({ ...formData, reviewYear: parseInt(e.target.value) })}
                    className="select-capsule"
                  >
                    <option value={2026} style={{ background: '#FBF6EE', color: '#2C1810' }}>2026</option>
                    <option value={2025} style={{ background: '#FBF6EE', color: '#2C1810' }}>2025</option>
                    <option value={2024} style={{ background: '#FBF6EE', color: '#2C1810' }}>2024</option>
                  </select>
                </div>
              </div>

              {/* AI Info Callout Box (Exact match to Wireframe 1) */}
              <div style={{
                marginTop: '0.5rem',
                backgroundColor: 'rgba(251, 246, 238, 0.9)',
                border: '1px solid rgba(139, 90, 43, 0.12)',
                borderRadius: '16px',
                padding: '1rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.85rem',
              }}>
                <div style={{
                  color: '#7C4D2E',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                }}>
                  <Sparkles size={18} />
                </div>
                <p style={{
                  fontSize: '0.8rem',
                  color: '#7A6355',
                  lineHeight: '1.4',
                  margin: 0,
                }}>
                  We use these details to tailor AI insights and categorize your logs effectively against your role's typical KPIs.
                </p>
              </div>
            </>
          )}

          {currentStep === 3 && (
            <div style={{ textAlign: 'center', padding: '1.5rem 0 0.5rem 0' }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '50%',
                backgroundColor: 'rgba(124, 77, 46, 0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 1.5rem auto', color: '#7C4D2E'
              }}>
                <Sparkles size={32} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#2C1810', marginBottom: '0.5rem' }}>
                Profile Ready
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#7A6355', lineHeight: '1.5', maxWidth: '80%', margin: '0 auto' }}>
                Your work profile has been successfully configured. WorkLog AI is now ready to track your activities and generate insights.
              </p>
            </div>
          )}

          {/* Action Button: Continue -> */}
          <div className="mobile-action-bar" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.75rem', gap: '0.75rem' }}>
            {currentStep === 3 && (
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="btn-secondary"
                style={{
                  padding: '0.75rem 1.75rem',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  borderRadius: '9999px',
                }}
              >
                Back
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary"
              style={{
                padding: '0.75rem 1.75rem',
                fontSize: '0.9rem',
                fontWeight: 600,
                borderRadius: '9999px',
                minWidth: '140px',
              }}
            >
              <span>{isSubmitting ? 'Saving...' : (currentStep === 2 ? 'Continue' : 'Start Logging')}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </form>
      </div>

      {/* Footer Text */}
      <div style={{ marginTop: '2.5rem', color: '#A89080', fontSize: '0.75rem', zIndex: 10 }}>
        Secure, private, and powered by WorkLog AI.
      </div>
    </div>
  );
};
