import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  Briefcase,
  Building,
  Calendar,
  Sparkles,
  Plus,
  X,
  Save,
  CheckCircle2,
  Layers,
  Code,
  FolderGit2,
  FileText,
  Clock,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';
import { getInitials } from '../../utils/stringUtils';

const POPULAR_SKILL_SUGGESTIONS = [
  'TypeScript',
  'Node.js',
  'System Design',
  'Distributed Systems',
  'Microservices',
  'Pinecone Vector DB',
  'Gemini LLM',
  'MongoDB',
  'Docker & K8s',
  'Performance Optimization',
  'CI/CD Pipelines',
  'REST & GraphQL APIs',
];

export const ProfilePage: React.FC = () => {
  const { user, updateProfile, isLoading } = useAuthStore();
  const { addNotification } = useNotificationStore();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    jobRole: user?.jobRole || '',
    department: user?.department || '',
    reviewYear: user?.reviewYear || 2026,
    professionalBackground: user?.professionalBackground || '',
  });

  const [skills, setSkills] = useState<string[]>(user?.skills || []);
  const [currentProjects, setCurrentProjects] = useState<string[]>(user?.currentProjects || []);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [newProjectInput, setNewProjectInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        jobRole: user.jobRole || '',
        department: user.department || '',
        reviewYear: user.reviewYear || 2026,
        professionalBackground: user.professionalBackground || '',
      });
      setSkills(user.skills || []);
      setCurrentProjects(user.currentProjects || []);
      setHasChanges(false);
    }
  }, [user]);

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleAddSkill = (skillToAdd?: string) => {
    const skill = (skillToAdd || newSkillInput).trim();
    if (skill && !skills.includes(skill)) {
      setSkills([...skills, skill]);
      setNewSkillInput('');
      setHasChanges(true);
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
    setHasChanges(true);
  };

  const handleAddProject = () => {
    const proj = newProjectInput.trim();
    if (proj && !currentProjects.includes(proj)) {
      setCurrentProjects([...currentProjects, proj]);
      setNewProjectInput('');
      setHasChanges(true);
    }
  };

  const handleRemoveProject = (projectToRemove: string) => {
    setCurrentProjects(currentProjects.filter((p) => p !== projectToRemove));
    setHasChanges(true);
  };

  const handleReset = () => {
    if (user) {
      setFormData({
        name: user.name || '',
        jobRole: user.jobRole || '',
        department: user.department || '',
        reviewYear: user.reviewYear || 2026,
        professionalBackground: user.professionalBackground || '',
      });
      setSkills(user.skills || []);
      setCurrentProjects(user.currentProjects || []);
      setHasChanges(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateProfile({
        ...formData,
        skills,
        currentProjects,
      });

      setHasChanges(false);
      addNotification({
        type: 'success',
        title: 'Work Profile Updated ✨',
        message: 'Your profile details and professional context have been saved.',
      });
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      addNotification({
        type: 'error',
        title: 'Profile Save Failed',
        message: err.message || 'Unable to update your profile. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate completeness percentage
  const completeness = (() => {
    let score = 0;
    if (formData.name) score += 20;
    if (formData.jobRole) score += 20;
    if (formData.department) score += 20;
    if (skills.length > 0) score += 20;
    if (formData.professionalBackground || currentProjects.length > 0) score += 20;
    return score;
  })();

  const userInitials = user?.initials || getInitials(formData.name || 'User');

  return (
    <div style={{ maxWidth: '980px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Top Hero Card */}
      <div className="glass-panel" style={{
        padding: '2rem 2.25rem',
        borderRadius: '20px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div
          className="mobile-header-stack"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1.5rem',
          }}
        >
          {/* Avatar & User Details */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              backgroundColor: 'rgba(124, 77, 46, 0.12)',
              border: '3px solid #7C4D2E',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.75rem',
              fontWeight: 800,
              color: '#7C4D2E',
              boxShadow: '0 4px 16px rgba(124, 77, 46, 0.2)',
              flexShrink: 0,
            }}>
              {userInitials}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                <h1 style={{
                  fontSize: '1.75rem',
                  fontWeight: 800,
                  color: '#2C1810',
                  margin: 0,
                  letterSpacing: '-0.02em',
                }}>
                  {formData.name || 'Employee Profile'}
                </h1>
                <span style={{
                  backgroundColor: 'rgba(124, 77, 46, 0.12)',
                  color: '#7C4D2E',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '0.2rem 0.6rem',
                  borderRadius: '9999px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                }}>
                  <ShieldCheck size={13} />
                  <span>Cycle {formData.reviewYear}</span>
                </span>
              </div>

              <div style={{
                fontSize: '0.9rem',
                color: '#7A6355',
                marginTop: '0.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                flexWrap: 'wrap',
              }}>
                <span>{formData.jobRole || 'Role not specified'}</span>
                {formData.department && (
                  <>
                    <span>•</span>
                    <span>{formData.department}</span>
                  </>
                )}
                {user?.email && (
                  <>
                    <span>•</span>
                    <span style={{ color: '#A89080' }}>{user.email}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Completeness Meter */}
          <div className="mobile-w-full" style={{
            backgroundColor: 'rgba(254, 252, 248, 0.9)',
            border: '1px solid rgba(139, 90, 43, 0.15)',
            borderRadius: '14px',
            padding: '1rem 1.25rem',
            minWidth: '200px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#7A6355' }}>
                Profile Strength
              </span>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#7C4D2E' }}>
                {completeness}%
              </span>
            </div>
            <div style={{
              height: '6px',
              width: '100%',
              backgroundColor: 'rgba(139, 90, 43, 0.1)',
              borderRadius: '9999px',
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${completeness}%`,
                backgroundColor: completeness === 100 ? '#059669' : '#C8874A',
                borderRadius: '9999px',
                transition: 'width 0.3s ease',
              }} />
            </div>
            <div style={{ fontSize: '0.7rem', color: '#A89080', marginTop: '0.4rem' }}>
              {completeness === 100 ? 'All context grounded for AI' : 'Add skills & bio for best AI results'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Profile Form */}
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

        {/* Section 1: Work Identity & Role */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
            <div style={{ color: '#7C4D2E' }}>
              <Briefcase size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#2C1810', margin: 0 }}>
                Work Identity & Role
              </h2>
              <span style={{ fontSize: '0.8rem', color: '#7A6355' }}>
                Core professional information used across reports and performance evaluations
              </span>
            </div>
          </div>

          <div className="responsive-two-col">
            {/* Full Name */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', color: '#7A6355', marginBottom: '0.45rem' }}>
                FULL NAME
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                placeholder="e.g. Kavya Deshmukh"
                required
                className="input-capsule"
              />
            </div>

            {/* Job Role */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', color: '#7A6355', marginBottom: '0.45rem' }}>
                JOB ROLE / DESIGNATION
              </label>
              <input
                type="text"
                value={formData.jobRole}
                onChange={(e) => handleFieldChange('jobRole', e.target.value)}
                placeholder="e.g. Senior Backend Engineer"
                required
                className="input-capsule"
              />
            </div>

            {/* Department */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', color: '#7A6355', marginBottom: '0.45rem' }}>
                DEPARTMENT / BUSINESS UNIT
              </label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => handleFieldChange('department', e.target.value)}
                placeholder="e.g. Core Engineering"
                required
                className="input-capsule"
              />
            </div>

            {/* Review Year */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', color: '#7A6355', marginBottom: '0.45rem' }}>
                PERFORMANCE REVIEW CYCLE
              </label>
              <select
                value={formData.reviewYear}
                onChange={(e) => handleFieldChange('reviewYear', parseInt(e.target.value))}
                className="select-capsule"
              >
                <option value={2026} style={{ background: '#FBF6EE', color: '#2C1810' }}>2026 (Active Review Period)</option>
                <option value={2025} style={{ background: '#FBF6EE', color: '#2C1810' }}>2025</option>
                <option value={2024} style={{ background: '#FBF6EE', color: '#2C1810' }}>2024</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Technical Skills & Competencies */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
            <div style={{ color: '#7C4D2E' }}>
              <Code size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#2C1810', margin: 0 }}>
                Skills & Technical Competencies
              </h2>
              <span style={{ fontSize: '0.8rem', color: '#7A6355' }}>
                Skills help the AI highlight your key engineering proficiencies in quarterly performance reports
              </span>
            </div>
          </div>

          {/* Active Skills Badges */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem', minHeight: '36px' }}>
            {skills.length === 0 ? (
              <span style={{ fontSize: '0.85rem', color: '#A89080', fontStyle: 'italic' }}>
                No skills added yet. Add your core competencies below.
              </span>
            ) : (
              skills.map((skill) => (
                <span
                  key={skill}
                  style={{
                    backgroundColor: 'rgba(124, 77, 46, 0.12)',
                    color: '#2C1810',
                    border: '1px solid rgba(124, 77, 46, 0.25)',
                    borderRadius: '9999px',
                    padding: '0.35rem 0.75rem',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <span>{skill}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    aria-label={`Remove ${skill}`}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#7A6355',
                      cursor: 'pointer',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <X size={13} />
                  </button>
                </span>
              ))
            )}
          </div>

          {/* Add Skill Input */}
          <div style={{ display: 'flex', gap: '0.5rem', maxWidth: '420px', marginBottom: '1.25rem' }}>
            <input
              type="text"
              value={newSkillInput}
              onChange={(e) => setNewSkillInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddSkill();
                }
              }}
              placeholder="Type a skill (e.g. Distributed Systems)..."
              className="input-capsule"
              style={{ flex: 1 }}
            />
            <button
              type="button"
              onClick={() => handleAddSkill()}
              className="btn-secondary"
              style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', borderRadius: '9999px', whiteSpace: 'nowrap' }}
            >
              <Plus size={14} />
              <span>Add</span>
            </button>
          </div>

          {/* Quick Suggestions */}
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#A89080', marginBottom: '0.5rem', letterSpacing: '0.04em' }}>
              SUGGESTED COMPETENCIES
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {POPULAR_SKILL_SUGGESTIONS.filter((s) => !skills.includes(s)).slice(0, 8).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleAddSkill(s)}
                  style={{
                    backgroundColor: 'rgba(254, 252, 248, 0.9)',
                    border: '1px dashed rgba(139, 90, 43, 0.25)',
                    borderRadius: '9999px',
                    padding: '0.25rem 0.65rem',
                    fontSize: '0.75rem',
                    color: '#7A6355',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(124, 77, 46, 0.08)';
                    e.currentTarget.style.borderColor = '#7C4D2E';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(254, 252, 248, 0.9)';
                    e.currentTarget.style.borderColor = 'rgba(139, 90, 43, 0.25)';
                  }}
                >
                  <Plus size={11} />
                  <span>{s}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Section 3: Active Projects & Repositories */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
            <div style={{ color: '#7C4D2E' }}>
              <FolderGit2 size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#2C1810', margin: 0 }}>
                Active Projects & Key Deliverables
              </h2>
              <span style={{ fontSize: '0.8rem', color: '#7A6355' }}>
                Projects serve as grounding anchors for RAG retrieval and work auto-categorization
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem', minHeight: '36px' }}>
            {currentProjects.length === 0 ? (
              <span style={{ fontSize: '0.85rem', color: '#A89080', fontStyle: 'italic' }}>
                No active projects added yet.
              </span>
            ) : (
              currentProjects.map((proj) => (
                <span
                  key={proj}
                  style={{
                    backgroundColor: 'rgba(200, 135, 74, 0.14)',
                    color: '#4A2E1A',
                    border: '1px solid rgba(200, 135, 74, 0.35)',
                    borderRadius: '9999px',
                    padding: '0.35rem 0.75rem',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <span>{proj}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveProject(proj)}
                    aria-label={`Remove ${proj}`}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#7A6355',
                      cursor: 'pointer',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <X size={13} />
                  </button>
                </span>
              ))
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', maxWidth: '420px' }}>
            <input
              type="text"
              value={newProjectInput}
              onChange={(e) => setNewProjectInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddProject();
                }
              }}
              placeholder="e.g. Auth Service, Search Pipeline..."
              className="input-capsule"
              style={{ flex: 1 }}
            />
            <button
              type="button"
              onClick={handleAddProject}
              className="btn-secondary"
              style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', borderRadius: '9999px', whiteSpace: 'nowrap' }}
            >
              <Plus size={14} />
              <span>Add Project</span>
            </button>
          </div>
        </div>

        {/* Section 4: Professional Bio & Career Objectives */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
            <div style={{ color: '#7C4D2E' }}>
              <FileText size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#2C1810', margin: 0 }}>
                Professional Summary & Self-Review Focus
              </h2>
              <span style={{ fontSize: '0.8rem', color: '#7A6355' }}>
                Summary of your expertise, career highlights, and targets for this review cycle
              </span>
            </div>
          </div>

          <textarea
            value={formData.professionalBackground}
            onChange={(e) => handleFieldChange('professionalBackground', e.target.value)}
            rows={4}
            placeholder="Describe your technical background, domain focus, and key priorities for the 2026 performance review cycle..."
            className="input-capsule"
            style={{
              width: '100%',
              borderRadius: '14px',
              padding: '0.85rem 1rem',
              lineHeight: 1.5,
              resize: 'vertical',
            }}
          />

          {/* AI Grounding Callout */}
          <div style={{
            marginTop: '1rem',
            backgroundColor: 'rgba(251, 246, 238, 0.9)',
            border: '1px solid rgba(139, 90, 43, 0.12)',
            borderRadius: '14px',
            padding: '0.85rem 1.15rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}>
            <div style={{ color: '#7C4D2E', flexShrink: 0 }}>
              <Sparkles size={18} />
            </div>
            <p style={{ fontSize: '0.8rem', color: '#7A6355', margin: 0, lineHeight: 1.45 }}>
              This summary is fed into Gemini during end-of-year report compilation to ensure the generated reviews highlight your leadership and domain impact accurately.
            </p>
          </div>
        </div>

        {/* Sticky Action Footer */}
        <div
          className="mobile-header-stack"
          style={{
            position: 'sticky',
            bottom: '24px',
            zIndex: 30,
            backgroundColor: 'rgba(254, 252, 248, 0.95)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(139, 90, 43, 0.18)',
            borderRadius: '16px',
            padding: '1rem 1.25rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 12px 32px rgba(44, 24, 16, 0.12)',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div style={{ fontSize: '0.825rem', color: hasChanges ? '#7C4D2E' : '#7A6355', fontWeight: 600 }}>
            {hasChanges ? '● Unsaved changes detected' : '✓ All changes up to date'}
          </div>

          <div className="mobile-action-bar" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {hasChanges && (
              <button
                type="button"
                onClick={handleReset}
                disabled={isSaving}
                className="btn-secondary"
                style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem', borderRadius: '9999px' }}
              >
                <RotateCcw size={14} />
                <span>Discard</span>
              </button>
            )}

            <button
              type="submit"
              disabled={isSaving}
              className="btn-primary"
              style={{
                padding: '0.6rem 1.5rem',
                fontSize: '0.85rem',
                fontWeight: 700,
                borderRadius: '9999px',
                minWidth: '150px',
              }}
            >
              <Save size={15} />
              <span>{isSaving ? 'Saving Profile...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
