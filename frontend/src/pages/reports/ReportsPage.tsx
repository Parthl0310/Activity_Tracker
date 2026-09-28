import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, 
  Download, 
  Sparkles, 
  CheckCircle2, 
  Calendar, 
  ChevronDown, 
  Edit2, 
  RotateCcw, 
  Check, 
  X, 
  Lock,
  Unlock,
  Loader2,
  GitMerge,
  Layers,
  Plus,
  ArrowRight,
  TrendingUp,
  Cpu,
  Clock,
  ShieldCheck,
  CheckSquare,
  Trash2
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useActivityStore } from '../../store/activityStore';
import { useNotificationStore } from '../../store/notificationStore';
import { apiClient } from '../../services/apiClient';

const REPORT_SECTIONS = [
  { key: 'executiveSummary', title: '1. Executive Summary', aiSupported: true },
  { key: 'majorContributions', title: '2. Major Contributions', aiSupported: true },
  { key: 'technicalWork', title: '3. Technical Work', aiSupported: true },
  { key: 'skillsDemonstrated', title: '4. Skills Demonstrated', aiSupported: true },
  { key: 'projects', title: '5. Projects', aiSupported: true },
  { key: 'learningAndDevelopment', title: '6. Learning & Development', aiSupported: true },
  { key: 'achievedGoals', title: '7. Achieved Goals', aiSupported: true },
  { key: 'overallYearSummary', title: '8. Overall Year Summary', aiSupported: true },
];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const ReportsPage: React.FC = () => {
  const { user } = useAuthStore();
  const { activities } = useActivityStore();
  const { addNotification } = useNotificationStore();
  
  const [selectedPeriod, setSelectedPeriod] = useState<'yearly' | 'monthly' | 'weekly'>('yearly');
  
  // Annual Report State
  const [report, setReport] = useState<any>(null);
  const [versions, setVersions] = useState<any[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [isGeneratingYearly, setIsGeneratingYearly] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [isDeletingDraft, setIsDeletingDraft] = useState(false);

  // Section Editing State
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editContent, setEditContent] = useState<string>('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [regeneratingSection, setRegeneratingSection] = useState<string | null>(null);

  // Merge Reports Modal State
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [mergeBaseVer, setMergeBaseVer] = useState<number>(1);
  const [mergeCompareVer, setMergeCompareVer] = useState<number>(2);
  const [mergedSections, setMergedSections] = useState<Record<string, string>>({});
  const [mergeChoices, setMergeChoices] = useState<Record<string, 'base' | 'compare' | 'combined' | 'custom'>>({});
  const [isMerging, setIsMerging] = useState(false);

  // Monthly Report State
  const currentMonthIdx = new Date().getMonth(); // 0-11
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonthIdx + 1); // 1-12
  const [monthlySummary, setMonthlySummary] = useState<any>(null);
  const [isGeneratingMonthly, setIsGeneratingMonthly] = useState(false);
  const [isDeletingMonthly, setIsDeletingMonthly] = useState(false);

  // Weekly Report State
  // Calculate default Monday of current week
  const defaultMonday = useMemo(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  }, []);

  const [selectedWeekOffset, setSelectedWeekOffset] = useState<number>(0); // 0 = current week, 1 = last week, 2 = 2 weeks ago
  const [weeklySummary, setWeeklySummary] = useState<any>(null);
  const [isGeneratingWeekly, setIsGeneratingWeekly] = useState(false);

  const reviewYear = user?.reviewYear || new Date().getFullYear();

  // Selected Week Start & End Dates based on offset
  const selectedWeekRange = useMemo(() => {
    const start = new Date(defaultMonday);
    start.setDate(start.getDate() - selectedWeekOffset * 7);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  }, [defaultMonday, selectedWeekOffset]);

  // Load versions list for yearly reports
  const fetchReportVersions = async () => {
    try {
      const res: any = await apiClient.reports.listVersions(reviewYear);
      const vers = res.data?.versions || [];
      setVersions(vers);
      return vers;
    } catch {
      setVersions([]);
      return [];
    }
  };

  // 1. Fetch Yearly Report
  useEffect(() => {
    if (selectedPeriod === 'yearly') {
      fetchReportVersions().then((vers) => {
        const verToFetch = selectedVersion || (vers.length > 0 ? vers[0].version : undefined);
        apiClient.reports
          .get(reviewYear, verToFetch)
          .then((res: any) => {
            if (res.data?.report) {
              setReport(res.data.report);
              setSelectedVersion(res.data.report.version);
            } else {
              setReport(null);
            }
          })
          .catch(() => {
            setReport(null);
          });
      });
    }
  }, [reviewYear, selectedPeriod, selectedVersion]);

  // 2. Fetch Monthly Summary
  useEffect(() => {
    if (selectedPeriod === 'monthly') {
      apiClient.summaries
        .getMonthly(reviewYear, selectedMonth)
        .then((res: any) => {
          setMonthlySummary(res.data?.summary || null);
        })
        .catch(() => {
          setMonthlySummary(null);
        });
    }
  }, [reviewYear, selectedPeriod, selectedMonth]);

  // 3. Fetch Weekly Summary
  useEffect(() => {
    if (selectedPeriod === 'weekly') {
      apiClient.summaries
        .getWeekly(selectedWeekRange.start.toISOString())
        .then((res: any) => {
          setWeeklySummary(res.data?.summary || null);
        })
        .catch(() => {
          setWeeklySummary(null);
        });
    }
  }, [selectedPeriod, selectedWeekRange]);

  // ================= ANNUAL REPORT HANDLERS =================
  const handleGenerateYearlyReport = async (forceNewVersion = false) => {
    setIsGeneratingYearly(true);
    try {
      const res: any = await apiClient.reports.generate(reviewYear, forceNewVersion);
      const newRep = res.data?.report || null;
      setReport(newRep);
      if (newRep) {
        setSelectedVersion(newRep.version);
        addNotification({
          type: 'success',
          title: forceNewVersion ? `Draft Version ${newRep.version} Created` : 'Annual Report Generated',
          message: `Successfully synthesized all 8 sections with RAG for review year ${reviewYear}.`,
        });
      }
      await fetchReportVersions();
    } catch (e: any) {
      console.error(e);
      addNotification({
        type: 'error',
        title: 'Report Generation Failed',
        message: e?.message || 'Ensure you have logged activities or summaries for this year.',
      });
    } finally {
      setIsGeneratingYearly(false);
    }
  };

  const handleSwitchVersion = (verNum: number) => {
    setSelectedVersion(verNum);
    apiClient.reports
      .get(reviewYear, verNum)
      .then((res: any) => {
        if (res.data?.report) {
          setReport(res.data.report);
          addNotification({
            type: 'info',
            title: `Loaded Version ${verNum}`,
            message: `Switched view to Version ${verNum} (${res.data.report.status}).`,
          });
        }
      })
      .catch((err) => {
        console.error(err);
      });
  };

  const handleFinalize = async () => {
    if (!window.confirm('Are you sure you want to lock and finalize this report version? Sections will be protected.')) {
      return;
    }
    setIsFinalizing(true);
    try {
      const res: any = await apiClient.reports.finalize(reviewYear, report?.version);
      setReport(res.data?.report || report);
      await fetchReportVersions();
      addNotification({
        type: 'success',
        title: 'Report Finalized & Locked',
        message: `Version ${report?.version} is now locked and protected from accidental edits.`,
      });
    } catch (err: any) {
      console.error('Failed to finalize report:', err);
      addNotification({
        type: 'error',
        title: 'Failed to Finalize',
        message: err.message || 'Could not finalize report.',
      });
    } finally {
      setIsFinalizing(false);
    }
  };

  const handleUnlock = async () => {
    if (!window.confirm('Unlock this report? This will allow edits and AI regenerations on this version again.')) {
      return;
    }
    setIsUnlocking(true);
    try {
      const res: any = await apiClient.reports.unlock(reviewYear, report?.version);
      setReport(res.data?.report || report);
      await fetchReportVersions();
      addNotification({
        type: 'success',
        title: 'Report Unlocked',
        message: `Version ${report?.version} is now in draft mode. Sections are editable.`,
      });
    } catch (err: any) {
      console.error('Failed to unlock report:', err);
      addNotification({
        type: 'error',
        title: 'Failed to Unlock',
        message: err.message || 'Could not unlock report.',
      });
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleDeleteDraft = async () => {
    if (!report) return;
    const ver = report.version;
    if (report?.status === 'final') {
      addNotification({
        type: 'warning',
        title: 'Report Locked',
        message: 'Locked and finalized reports cannot be deleted. Unlock the report first.',
      });
      return;
    }
    if (!window.confirm(`Are you sure you want to delete Report Draft Version ${ver}? This action cannot be undone.`)) {
      return;
    }
    setIsDeletingDraft(true);
    try {
      const res: any = await apiClient.reports.deleteDraft(reviewYear, ver);
      const remainingVers = await fetchReportVersions();
      if (remainingVers && remainingVers.length > 0) {
        const latest = remainingVers[0];
        setSelectedVersion(latest.version);
        setReport(latest);
      } else {
        setSelectedVersion(null);
        setReport(null);
      }
      addNotification({
        type: 'success',
        title: 'Draft Deleted',
        message: res?.message || `Report Draft Version ${ver} deleted successfully.`,
      });
    } catch (err: any) {
      console.error('Failed to delete report draft:', err);
      addNotification({
        type: 'error',
        title: 'Delete Failed',
        message: err.message || 'Could not delete report draft.',
      });
    } finally {
      setIsDeletingDraft(false);
    }
  };

  const handleRegenerateSection = async (sectionKey: string) => {
    setRegeneratingSection(sectionKey);
    try {
      const res: any = await apiClient.reports.regenerateSection(reviewYear, sectionKey, report?.version);
      setReport(res.data?.report || report);
      addNotification({
        type: 'ai',
        title: 'Section Regenerated',
        message: `Regenerated section '${sectionKey}' using updated RAG context.`,
      });
    } catch (err: any) {
      console.error('Failed to regenerate section:', err);
      addNotification({
        type: 'error',
        title: 'Regeneration Error',
        message: err.message || 'Failed to regenerate section.',
      });
    } finally {
      setRegeneratingSection(null);
    }
  };

  const handleStartEdit = (sectionKey: string, currentContent: string) => {
    setEditingSection(sectionKey);
    setEditContent(currentContent || '');
  };

  const handleSaveEdit = async (sectionKey: string) => {
    setIsSavingEdit(true);
    try {
      const res: any = await apiClient.reports.editSection(reviewYear, sectionKey, editContent, report?.version);
      setReport(res.data?.report || report);
      setEditingSection(null);
      addNotification({
        type: 'success',
        title: 'Section Saved',
        message: `Successfully saved manual edits to '${sectionKey}'.`,
      });
    } catch (err: any) {
      console.error('Failed to save section edit:', err);
      addNotification({
        type: 'error',
        title: 'Save Failed',
        message: err.message || 'Failed to save section.',
      });
    } finally {
      setIsSavingEdit(false);
    }
  };

  // ================= MERGE REPORTS MODAL LOGIC =================
  const handleOpenMergeModal = () => {
    if (versions.length < 2) {
      alert('You need at least 2 generated report versions to perform a merge.');
      return;
    }
    const verA = versions[0].version;
    const verB = versions[1].version;
    setMergeBaseVer(verA);
    setMergeCompareVer(verB);

    const docA = versions.find((v) => v.version === verA)?.report || {};
    const docB = versions.find((v) => v.version === verB)?.report || {};

    const initialMerged: Record<string, string> = {};
    const initialChoices: Record<string, any> = {};

    REPORT_SECTIONS.forEach((sec) => {
      const textA = docA[sec.key] || '';
      const textB = docB[sec.key] || '';
      initialMerged[sec.key] = textA || textB;
      initialChoices[sec.key] = 'base';
    });

    setMergedSections(initialMerged);
    setMergeChoices(initialChoices);
    setShowMergeModal(true);
  };

  const handleMergeChoiceChange = (
    secKey: string, 
    choice: 'base' | 'compare' | 'combined' | 'custom'
  ) => {
    const docA = versions.find((v) => v.version === mergeBaseVer)?.report || {};
    const docB = versions.find((v) => v.version === mergeCompareVer)?.report || {};
    const textA = docA[secKey] || '';
    const textB = docB[secKey] || '';

    setMergeChoices((prev) => ({ ...prev, [secKey]: choice }));

    if (choice === 'base') {
      setMergedSections((prev) => ({ ...prev, [secKey]: textA }));
    } else if (choice === 'compare') {
      setMergedSections((prev) => ({ ...prev, [secKey]: textB }));
    } else if (choice === 'combined') {
      setMergedSections((prev) => ({
        ...prev,
        [secKey]: `${textA}\n\n${textB}`,
      }));
    }
  };

  const handleSaveMergedReport = async () => {
    setIsMerging(true);
    try {
      const res: any = await apiClient.reports.merge(reviewYear, mergedSections);
      const newRep = res.data?.report;
      setShowMergeModal(false);
      await fetchReportVersions();
      if (newRep) {
        setReport(newRep);
        setSelectedVersion(newRep.version);
        addNotification({
          type: 'success',
          title: 'Reports Merged Successfully',
          message: `Consolidated report created as Version ${newRep.version} (Draft).`,
        });
      }
    } catch (err: any) {
      console.error('Failed to merge reports:', err);
      addNotification({
        type: 'error',
        title: 'Merge Failed',
        message: err.message || 'Could not create merged report.',
      });
    } finally {
      setIsMerging(false);
    }
  };

  // ================= MONTHLY SUMMARY HANDLERS =================
  const handleGenerateMonthly = async () => {
    setIsGeneratingMonthly(true);
    try {
      const res: any = await apiClient.summaries.generateMonthly(reviewYear, selectedMonth);
      setMonthlySummary(res.data?.summary || null);
      addNotification({
        type: 'success',
        title: 'Monthly Report Generated',
        message: `RAG synthesis complete for ${MONTH_NAMES[selectedMonth - 1]} ${reviewYear}.`,
      });
    } catch (err: any) {
      console.error('Failed to generate monthly summary:', err);
      addNotification({
        type: 'error',
        title: 'Monthly Report Error',
        message: err.message || 'Could not generate monthly report.',
      });
    } finally {
      setIsGeneratingMonthly(false);
    }
  };

  const handleDeleteMonthly = async () => {
    if (!monthlySummary) return;
    if (!window.confirm(`Are you sure you want to delete the Monthly Summary for ${MONTH_NAMES[selectedMonth - 1]} ${reviewYear}?`)) {
      return;
    }
    setIsDeletingMonthly(true);
    try {
      await apiClient.summaries.deleteMonthly(reviewYear, selectedMonth);
      setMonthlySummary(null);
      addNotification({
        type: 'success',
        title: 'Monthly Summary Deleted',
        message: `Monthly report for ${MONTH_NAMES[selectedMonth - 1]} ${reviewYear} deleted. You can generate a new one anytime.`,
      });
    } catch (err: any) {
      console.error('Failed to delete monthly summary:', err);
      addNotification({
        type: 'error',
        title: 'Delete Failed',
        message: err.message || 'Could not delete monthly summary.',
      });
    } finally {
      setIsDeletingMonthly(false);
    }
  };

  // ================= WEEKLY SUMMARY HANDLERS =================
  const handleGenerateWeekly = async () => {
    setIsGeneratingWeekly(true);
    try {
      const res: any = await apiClient.summaries.generateWeekly(
        selectedWeekRange.start.toISOString(),
        selectedWeekRange.end.toISOString()
      );
      setWeeklySummary(res.data?.summary || null);
      addNotification({
        type: 'success',
        title: 'Weekly Report Generated',
        message: `RAG intermediate snippet complete for the week of ${selectedWeekRange.start.toLocaleDateString()}.`,
      });
    } catch (err: any) {
      console.error('Failed to generate weekly summary:', err);
      addNotification({
        type: 'error',
        title: 'Weekly Report Error',
        message: err.message || 'Could not generate weekly report.',
      });
    } finally {
      setIsGeneratingWeekly(false);
    }
  };

  // Filter raw activities based on selected period
  const filteredActivities = activities.filter((act) => {
    if (!act.workDate) return false;
    const date = new Date(act.workDate);

    if (selectedPeriod === 'yearly') {
      return date.getFullYear() === reviewYear;
    }
    if (selectedPeriod === 'monthly') {
      return date.getFullYear() === reviewYear && date.getMonth() === selectedMonth - 1;
    }
    if (selectedPeriod === 'weekly') {
      return date >= selectedWeekRange.start && date <= selectedWeekRange.end;
    }
    return true;
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Top Header & Export (Screen Only) */}
      <div
        className="no-print mobile-header-stack"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '2.15rem',
              fontWeight: 800,
              color: '#2C1810',
              letterSpacing: '-0.03em',
            }}
          >
            Performance Evaluation & RAG Reports
          </h1>
          <p
            style={{
              fontSize: '0.925rem',
              color: '#7A6355',
              marginTop: '0.35rem',
            }}
          >
            AI-grounded performance evaluation pipeline — inspect intermediate weekly snippets, monthly syntheses, and annual review packets.
          </p>
        </div>

        <button className="btn-primary" style={{ padding: '0.65rem 1.35rem' }} onClick={handlePrint}>
          <Download size={15} />
          <span>Export PDF</span>
        </button>
      </div>

      {/* Modern Filter Segmented Control Tabs (Screen Only) */}
      <div
        className="no-print mobile-scroll-x"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          backgroundColor: 'rgba(255, 255, 255, 0.65)',
          padding: '0.4rem',
          borderRadius: '16px',
          border: '1px solid rgba(139, 90, 43, 0.15)',
          backdropFilter: 'blur(10px)',
          width: 'fit-content',
          maxWidth: '100%',
          whiteSpace: 'nowrap',
        }}
      >
        <button
          onClick={() => setSelectedPeriod('yearly')}
          style={{
            padding: '0.6rem 1.25rem',
            borderRadius: '12px',
            border: 'none',
            background: selectedPeriod === 'yearly' ? '#7C4D2E' : 'transparent',
            color: selectedPeriod === 'yearly' ? '#FFFFFF' : '#7A6355',
            fontWeight: selectedPeriod === 'yearly' ? 700 : 500,
            fontSize: '0.875rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s ease',
            boxShadow: selectedPeriod === 'yearly' ? '0 4px 12px rgba(124, 77, 46, 0.25)' : 'none',
          }}
        >
          <Calendar size={15} />
          <span>Annual Evaluation Report</span>
          <span
            style={{
              fontSize: '0.7rem',
              padding: '0.15rem 0.45rem',
              borderRadius: '9999px',
              background: selectedPeriod === 'yearly' ? 'rgba(255,255,255,0.25)' : 'rgba(124, 77, 46, 0.1)',
              color: selectedPeriod === 'yearly' ? '#FFF' : '#7C4D2E',
            }}
          >
            {reviewYear}
          </span>
        </button>

        <button
          onClick={() => setSelectedPeriod('monthly')}
          style={{
            padding: '0.6rem 1.25rem',
            borderRadius: '12px',
            border: 'none',
            background: selectedPeriod === 'monthly' ? '#7C4D2E' : 'transparent',
            color: selectedPeriod === 'monthly' ? '#FFFFFF' : '#7A6355',
            fontWeight: selectedPeriod === 'monthly' ? 700 : 500,
            fontSize: '0.875rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s ease',
            boxShadow: selectedPeriod === 'monthly' ? '0 4px 12px rgba(124, 77, 46, 0.25)' : 'none',
          }}
        >
          <TrendingUp size={15} />
          <span>Monthly Summary</span>
          <span
            style={{
              fontSize: '0.7rem',
              padding: '0.15rem 0.45rem',
              borderRadius: '9999px',
              background: selectedPeriod === 'monthly' ? 'rgba(255,255,255,0.25)' : 'rgba(124, 77, 46, 0.1)',
              color: selectedPeriod === 'monthly' ? '#FFF' : '#7C4D2E',
            }}
          >
            RAG Level 2
          </span>
        </button>

        <button
          onClick={() => setSelectedPeriod('weekly')}
          style={{
            padding: '0.6rem 1.25rem',
            borderRadius: '12px',
            border: 'none',
            background: selectedPeriod === 'weekly' ? '#7C4D2E' : 'transparent',
            color: selectedPeriod === 'weekly' ? '#FFFFFF' : '#7A6355',
            fontWeight: selectedPeriod === 'weekly' ? 700 : 500,
            fontSize: '0.875rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s ease',
            boxShadow: selectedPeriod === 'weekly' ? '0 4px 12px rgba(124, 77, 46, 0.25)' : 'none',
          }}
        >
          <Clock size={15} />
          <span>Weekly Snippet</span>
          <span
            style={{
              fontSize: '0.7rem',
              padding: '0.15rem 0.45rem',
              borderRadius: '9999px',
              background: selectedPeriod === 'weekly' ? 'rgba(255,255,255,0.25)' : 'rgba(124, 77, 46, 0.1)',
              color: selectedPeriod === 'weekly' ? '#FFF' : '#7C4D2E',
            }}
          >
            RAG Level 1
          </span>
        </button>
      </div>

      {/* =========================================================================
          VIEW 1: ANNUAL EVALUATION REPORT (Full 8 Sections, Lock/Unlock, Multi-version, Merge)
          ========================================================================= */}
      {selectedPeriod === 'yearly' && (
        <div className="glass-panel printable-report" style={{ padding: '2rem' }}>
          {/* Executive Formal Print Header (Visible ONLY on print/PDF) */}
          <div className="print-only print-document-header">
            <div className="doc-eyebrow">ActivityTracker Enterprise • Grounded Dossier</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h1>Annual Performance Evaluation Packet</h1>
                <p className="doc-subtitle">
                  Calendar Year {reviewYear} Comprehensive Engineering Performance & Impact Dossier
                </p>
              </div>
              <div style={{ textAlign: 'right', fontSize: '8pt', color: '#64748B' }}>
                <div>Date: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
                <div>Status: {report?.status === 'final' ? 'FINALIZED & LOCKED' : 'WORKING DRAFT'}</div>
              </div>
            </div>

            <div className="print-meta-grid">
              <div className="print-meta-item">
                <span className="meta-label">Candidate Name</span>
                <strong>{user?.name || 'Professional Engineer'}</strong>
              </div>
              <div className="print-meta-item">
                <span className="meta-label">Job Role & Title</span>
                <strong>{user?.jobRole || 'Software Engineer'}</strong>
              </div>
              <div className="print-meta-item">
                <span className="meta-label">Review Cycle</span>
                <strong>Full Year {reviewYear}</strong>
              </div>
              <div className="print-meta-item">
                <span className="meta-label">Report Status</span>
                <strong style={{ color: report?.status === 'final' ? '#1E3A8A' : '#15803D' }}>
                  {report?.status === 'final' ? 'Locked & Finalized' : 'Draft Revision'}
                </strong>
              </div>
              <div className="print-meta-item">
                <span className="meta-label">Document Version</span>
                <strong>Version {report?.version || 1}</strong>
              </div>
              <div className="print-meta-item">
                <span className="meta-label">Grounding Evidence</span>
                <strong>{filteredActivities.length} Work Entries Synthesized</strong>
              </div>
            </div>
          </div>

          {/* Header Bar (Screen Only) */}
          <div
            className="no-print mobile-header-stack"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.75rem',
              flexWrap: 'wrap',
              gap: '1rem',
              borderBottom: '1px solid rgba(139, 90, 43, 0.12)',
              paddingBottom: '1.5rem',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                <span className="tag-chip tag-chip-category" style={{ fontSize: '0.75rem' }}>
                  {reviewYear} Annual Evaluation
                </span>

                {/* Status indicator badge */}
                <span
                  style={{
                    fontSize: '0.75rem',
                    color: report?.status === 'final' ? '#1E3A8A' : '#15803D',
                    backgroundColor: report?.status === 'final' ? 'rgba(30, 58, 138, 0.1)' : 'rgba(21, 128, 61, 0.1)',
                    border: `1px solid ${report?.status === 'final' ? 'rgba(30, 58, 138, 0.25)' : 'rgba(21, 128, 61, 0.25)'}`,
                    borderRadius: '9999px',
                    padding: '0.2rem 0.65rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontWeight: 700,
                  }}
                >
                  {report?.status === 'final' ? <Lock size={12} /> : <CheckCircle2 size={12} />}
                  {report?.status === 'final' ? `Version ${report?.version} (Locked & Finalized)` : `Version ${report?.version || 1} (Draft Revision)`}
                </span>

                {/* Multi-version badge */}
                {versions.length > 1 && (
                  <span
                    style={{
                      fontSize: '0.75rem',
                      color: '#7C4D2E',
                      backgroundColor: 'rgba(124, 77, 46, 0.08)',
                      padding: '0.2rem 0.6rem',
                      borderRadius: '9999px',
                      fontWeight: 600,
                    }}
                  >
                    {versions.length} versions generated
                  </span>
                )}
              </div>

              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#2C1810', margin: 0 }}>
                {user?.name || 'Engineer'} — {user?.jobRole || 'Software Engineer'} Review Packet
              </h2>
            </div>

            {/* Action Buttons: Version Switcher, Lock/Unlock, Generate New Version, Merge */}
            <div className="mobile-action-bar" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
              {/* Version Switcher Dropdown */}
              {versions.length > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ fontSize: '0.8rem', color: '#7A6355', fontWeight: 600 }}>Version:</span>
                  <select
                    value={report?.version || selectedVersion || 1}
                    onChange={(e) => handleSwitchVersion(parseInt(e.target.value, 10))}
                    style={{
                      padding: '0.4rem 0.8rem',
                      borderRadius: '8px',
                      border: '1px solid rgba(139, 90, 43, 0.2)',
                      background: '#FFF',
                      fontSize: '0.8rem',
                      color: '#2C1810',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {versions.map((v) => (
                      <option key={v.version} value={v.version}>
                        Version {v.version} ({v.status === 'final' ? 'Locked' : 'Draft'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Lock / Unlock Toggle Button */}
              {report && (
                report.status === 'final' ? (
                  <button
                    onClick={handleUnlock}
                    disabled={isUnlocking}
                    className="btn-secondary"
                    style={{ fontSize: '0.8rem', padding: '0.45rem 0.95rem', color: '#B45309', borderColor: 'rgba(180, 83, 9, 0.3)' }}
                    title="Unlock this report to allow edits"
                  >
                    {isUnlocking ? <Loader2 size={13} className="animate-spin" /> : <Unlock size={13} />}
                    <span>{isUnlocking ? 'Unlocking...' : 'Unlock Report'}</span>
                  </button>
                ) : (
                  <button
                    onClick={handleFinalize}
                    disabled={isFinalizing}
                    className="btn-secondary"
                    style={{ fontSize: '0.8rem', padding: '0.45rem 0.95rem' }}
                    title="Finalize and lock this report"
                  >
                    {isFinalizing ? <Loader2 size={13} className="animate-spin" /> : <Lock size={13} />}
                    <span>{isFinalizing ? 'Finalizing...' : 'Lock & Finalize'}</span>
                  </button>
                )
              )}

              {/* Generate New Report Version Button */}
              {report && (
                <button
                  onClick={() => handleGenerateYearlyReport(true)}
                  disabled={isGeneratingYearly}
                  className="btn-secondary"
                  style={{ fontSize: '0.8rem', padding: '0.45rem 0.95rem' }}
                  title="Generate another report version with RAG"
                >
                  {isGeneratingYearly ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                  <span>{isGeneratingYearly ? 'Synthesizing...' : 'Generate New Version'}</span>
                </button>
              )}

              {/* Merge Reports Button (Available when >= 2 versions exist) */}
              {versions.length >= 2 && (
                <button
                  onClick={handleOpenMergeModal}
                  className="btn-primary"
                  style={{ fontSize: '0.8rem', padding: '0.45rem 1rem', background: '#4A2E1A' }}
                  title="Merge sections from 2 versions into a final report"
                >
                  <GitMerge size={14} />
                  <span>Merge Reports</span>
                </button>
              )}

              {/* Delete Draft Button (Only available for draft revisions; locked reports cannot be deleted) */}
              {report && report.status !== 'final' && (
                <button
                  onClick={handleDeleteDraft}
                  disabled={isDeletingDraft}
                  className="btn-secondary"
                  style={{
                    fontSize: '0.8rem',
                    padding: '0.45rem 0.85rem',
                    color: '#DC2626',
                    borderColor: 'rgba(220, 38, 38, 0.3)',
                    backgroundColor: 'rgba(220, 38, 38, 0.05)',
                  }}
                  title={`Delete Draft Version ${report.version}`}
                >
                  {isDeletingDraft ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                  <span>{isDeletingDraft ? 'Deleting...' : 'Delete Draft'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Generated Report Content: All 8 Sections with Isolated Controls */}
          {report && report.report && (
            <div
              className="printable-report"
              style={{
                marginBottom: '2rem',
                padding: '1.75rem',
                backgroundColor: 'white',
                borderRadius: '16px',
                border: '1px solid rgba(139, 90, 43, 0.12)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.75rem',
              }}
            >
              {REPORT_SECTIONS.map((sec) => {
                const content = report.report[sec.key] || '';
                const isEditingThis = editingSection === sec.key;
                const isRegeneratingThis = regeneratingSection === sec.key;

                return (
                  <div
                    key={sec.key}
                    className="report-section-card"
                    style={{
                      borderBottom: '1px solid #f0ece6',
                      paddingBottom: '1.25rem',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '0.6rem',
                      }}
                    >
                      <h3 style={{ fontSize: '1.05rem', color: '#2C1810', margin: 0, fontWeight: 700 }}>
                        {sec.title}
                      </h3>

                      {report.status !== 'final' && (
                        <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {!isEditingThis && (
                            <>
                              <button
                                onClick={() => handleStartEdit(sec.key, content)}
                                title="Edit Section"
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: '#7A6355',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.3rem',
                                  fontSize: '0.75rem',
                                  padding: '0.2rem 0.5rem',
                                  borderRadius: '6px',
                                }}
                              >
                                <Edit2 size={13} />
                                <span>Edit</span>
                              </button>
                              {sec.aiSupported && (
                                <button
                                  onClick={() => handleRegenerateSection(sec.key)}
                                  disabled={isRegeneratingThis}
                                  title="Regenerate this section with AI"
                                  style={{
                                    background: 'rgba(124, 77, 46, 0.07)',
                                    border: '1px solid rgba(124, 77, 46, 0.2)',
                                    color: '#7C4D2E',
                                    cursor: isRegeneratingThis ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.3rem',
                                    fontSize: '0.75rem',
                                    padding: '0.2rem 0.5rem',
                                    borderRadius: '6px',
                                  }}
                                >
                                  {isRegeneratingThis ? (
                                    <Loader2 size={13} className="animate-spin" />
                                  ) : (
                                    <RotateCcw size={13} />
                                  )}
                                  <span>{isRegeneratingThis ? 'Regenerating...' : 'Regenerate'}</span>
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {isEditingThis ? (
                      <>
                        <div className="no-print" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            rows={6}
                            className="input-capsule"
                            style={{ width: '100%', borderRadius: '12px', resize: 'vertical' }}
                          />
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                            <button
                              onClick={() => setEditingSection(null)}
                              className="btn-secondary"
                              style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem' }}
                            >
                              <X size={13} />
                              <span>Cancel</span>
                            </button>
                            <button
                              onClick={() => handleSaveEdit(sec.key)}
                              disabled={isSavingEdit}
                              className="btn-primary"
                              style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem' }}
                            >
                              <Check size={13} />
                              <span>{isSavingEdit ? 'Saving...' : 'Save Section'}</span>
                            </button>
                          </div>
                        </div>
                        <p
                          className="print-only"
                          style={{
                            whiteSpace: 'pre-wrap',
                            fontSize: '9.5pt',
                            lineHeight: '1.6',
                            color: '#1E293B',
                            margin: 0,
                          }}
                        >
                          {editContent || content}
                        </p>
                      </>
                    ) : (
                      <p
                        style={{
                          whiteSpace: 'pre-wrap',
                          fontSize: '0.9rem',
                          color: '#4A2E1A',
                          lineHeight: '1.65',
                          margin: 0,
                        }}
                      >
                        {content || 'No information generated for this section.'}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Empty State when no annual report exists */}
          {!report && (
            <div
              style={{
                textAlign: 'center',
                padding: '3.5rem 2rem',
                marginBottom: '2rem',
                backgroundColor: 'rgba(124, 77, 46, 0.04)',
                borderRadius: '16px',
                border: '1px dashed rgba(124, 77, 46, 0.25)',
              }}
            >
              <Sparkles size={36} color="#C8874A" style={{ marginBottom: '1rem' }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#2C1810', marginBottom: '0.5rem' }}>
                No Annual Report Generated for {reviewYear}
              </h3>
              <p style={{ color: '#7A6355', marginBottom: '1.5rem', fontSize: '0.925rem', maxWidth: '500px', margin: '0 auto 1.5rem' }}>
                Ground the entire year of work entries, achievements, and goals through the multi-stage RAG evaluation pipeline.
              </p>
              <button
                onClick={() => handleGenerateYearlyReport(false)}
                disabled={isGeneratingYearly}
                className="btn-primary no-print"
                style={{ padding: '0.75rem 1.85rem' }}
              >
                {isGeneratingYearly ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                <span>{isGeneratingYearly ? 'Synthesizing with RAG...' : 'Generate 8-Section AI Report'}</span>
              </button>
            </div>
          )}

          {/* Supporting Work Activities for Annual Cycle */}
          <div className="report-section-card" style={{ marginTop: '2rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#2C1810', marginBottom: '1rem' }}>
              Supporting Work Records ({filteredActivities.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }} className="print-container">
              {filteredActivities.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#A89080' }}>
                  <p>No work records logged for {reviewYear}.</p>
                </div>
              ) : (
                filteredActivities.map((act) => (
                  <div
                    key={act.id}
                    className="glass-card-interactive report-print-item"
                    style={{ padding: '1rem 1.25rem', borderRadius: '14px' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
                      <FileText size={15} color="#7C4D2E" />
                      <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#4A2E1A' }}>
                        {act.title || act.project || 'Work Entry'} — {act.displayDate}
                      </span>
                      {act.category && (
                        <span className="tag-chip tag-chip-category" style={{ fontSize: '0.7rem' }}>
                          {act.category}
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '0.85rem', lineHeight: '1.55', color: '#4A2E1A', margin: 0 }}>
                      {act.aiRefinedText || act.text}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Executive Document Footer for Print */}
          <div className="print-only print-document-footer">
            <span>ActivityTracker AI Performance Engine • Confidential Dossier</span>
            <span>Evaluation Year: {reviewYear}</span>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 2: MONTHLY SUMMARY (RAG Level 2 Intermediate Synthesis)
          ========================================================================= */}
      {selectedPeriod === 'monthly' && (
        <div className="glass-panel printable-report" style={{ padding: '2rem' }}>
          {/* Executive Formal Print Header (Visible ONLY on print/PDF) */}
          <div className="print-only print-document-header">
            <div className="doc-eyebrow">ActivityTracker RAG Level 2 • Intermediate Synthesis</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h1>{MONTH_NAMES[selectedMonth - 1]} {reviewYear} Performance Synthesis</h1>
                <p className="doc-subtitle">
                  Intermediate Monthly Milestone Packet & Evidence-Grounded Review
                </p>
              </div>
              <div style={{ textAlign: 'right', fontSize: '8pt', color: '#64748B' }}>
                <div>Date: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
                <div>Pipeline: RAG Level 2 Synthesis</div>
              </div>
            </div>

            <div className="print-meta-grid">
              <div className="print-meta-item">
                <span className="meta-label">Candidate Name</span>
                <strong>{user?.name || 'Professional Engineer'}</strong>
              </div>
              <div className="print-meta-item">
                <span className="meta-label">Job Role & Title</span>
                <strong>{user?.jobRole || 'Software Engineer'}</strong>
              </div>
              <div className="print-meta-item">
                <span className="meta-label">Evaluation Period</span>
                <strong>{MONTH_NAMES[selectedMonth - 1]} {reviewYear}</strong>
              </div>
              <div className="print-meta-item">
                <span className="meta-label">RAG Confidence Score</span>
                <strong style={{ color: '#15803D' }}>
                  {Math.round((monthlySummary?.confidenceScore || 0.95) * 100)}% Verified
                </strong>
              </div>
              <div className="print-meta-item">
                <span className="meta-label">Grounding Evidence</span>
                <strong>{monthlySummary?.summary?.entryCount || filteredActivities.length} Activities Grounded</strong>
              </div>
              <div className="print-meta-item">
                <span className="meta-label">Vector Status</span>
                <strong style={{ color: '#7C4D2E' }}>Embedded for Annual Synthesis</strong>
              </div>
            </div>
          </div>

          {/* Month Selector Bar (Screen Only) */}
          <div
            className="no-print mobile-header-stack"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
              marginBottom: '1.75rem',
              borderBottom: '1px solid rgba(139, 90, 43, 0.12)',
              paddingBottom: '1.25rem',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem', flexWrap: 'wrap' }}>
                <span className="tag-chip tag-chip-category" style={{ fontSize: '0.75rem' }}>
                  RAG Pipeline Level 2
                </span>
                <span style={{ fontSize: '0.8rem', color: '#7A6355', fontWeight: 600 }}>
                  {filteredActivities.length} activities logged in {MONTH_NAMES[selectedMonth - 1]}
                </span>
              </div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#2C1810', margin: 0 }}>
                {MONTH_NAMES[selectedMonth - 1]} {reviewYear} Intermediate Monthly Synthesis
              </h2>
            </div>

            {/* Month Dropdown & Generate Button */}
            <div className="mobile-action-bar" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
                style={{
                  padding: '0.55rem 1rem',
                  borderRadius: '10px',
                  border: '1px solid rgba(139, 90, 43, 0.25)',
                  background: '#FFF',
                  fontSize: '0.875rem',
                  color: '#2C1810',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {MONTH_NAMES.map((mName, idx) => (
                  <option key={idx + 1} value={idx + 1}>
                    {mName} {reviewYear}
                  </option>
                ))}
              </select>

              <button
                onClick={handleGenerateMonthly}
                disabled={isGeneratingMonthly}
                className="btn-primary"
                style={{ padding: '0.55rem 1.25rem' }}
              >
                {isGeneratingMonthly ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : monthlySummary ? (
                  <RotateCcw size={15} />
                ) : (
                  <Sparkles size={15} />
                )}
                <span>
                  {isGeneratingMonthly
                    ? 'Synthesizing...'
                    : monthlySummary
                    ? 'Regenerate Monthly Report'
                    : 'Generate Monthly Report ✨'}
                </span>
              </button>

              {monthlySummary && (
                <button
                  onClick={handleDeleteMonthly}
                  disabled={isDeletingMonthly}
                  className="btn-secondary"
                  style={{
                    padding: '0.55rem 0.85rem',
                    color: '#DC2626',
                    borderColor: 'rgba(220, 38, 38, 0.3)',
                    backgroundColor: 'rgba(220, 38, 38, 0.05)',
                  }}
                  title="Delete this monthly summary"
                >
                  {isDeletingMonthly ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                </button>
              )}
            </div>
          </div>

          {/* Render Actual Intermediate Monthly Summary */}
          {monthlySummary ? (
            <div
              className="printable-report"
              style={{
                marginBottom: '2rem',
                padding: '1.75rem',
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                border: '1px solid rgba(139, 90, 43, 0.15)',
                boxShadow: '0 8px 24px rgba(124, 77, 46, 0.06)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem',
              }}
            >
              {/* Top Banner with Confidence & Vectorization Status */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                  backgroundColor: 'rgba(124, 77, 46, 0.05)',
                  padding: '0.75rem 1rem',
                  borderRadius: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShieldCheck size={16} color="#15803D" />
                  <span style={{ fontSize: '0.825rem', fontWeight: 600, color: '#2C1810' }}>
                    Confidence Score: {Math.round((monthlySummary.confidenceScore || 0.95) * 100)}%
                  </span>
                  <span style={{ fontSize: '0.8rem', color: '#7A6355' }}>• Synthesized across {monthlySummary.summary?.entryCount || filteredActivities.length} logs</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Cpu size={14} color="#7C4D2E" />
                  <span style={{ fontSize: '0.775rem', fontWeight: 600, color: '#7C4D2E' }}>
                    Vectorized Chunks Stored for Yearly RAG
                  </span>
                </div>
              </div>

              {/* Monthly AI Narrative */}
              <div className="report-section-card">
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#2C1810', marginBottom: '0.6rem' }}>
                  Executive Monthly Narrative
                </h3>
                <div
                  style={{
                    backgroundColor: '#FEFCF8',
                    border: '1px solid rgba(139, 90, 43, 0.12)',
                    padding: '1.25rem',
                    borderRadius: '12px',
                    fontSize: '0.925rem',
                    lineHeight: '1.7',
                    color: '#3D2518',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {monthlySummary.summary?.aiSummary || 'No monthly synthesis narrative available.'}
                </div>
              </div>

              {/* Major Work Areas */}
              {monthlySummary.summary?.majorWorkAreas && monthlySummary.summary.majorWorkAreas.length > 0 && (
                <div className="report-section-card">
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#2C1810', marginBottom: '0.6rem' }}>
                    Major Work Areas & Strategic Deliverables
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {monthlySummary.summary.majorWorkAreas.map((area: string, idx: number) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '0.65rem',
                          backgroundColor: '#FFF',
                          border: '1px solid rgba(139, 90, 43, 0.1)',
                          padding: '0.75rem 1rem',
                          borderRadius: '10px',
                        }}
                      >
                        <CheckCircle2 size={16} color="#C8874A" style={{ marginTop: '2px', flexShrink: 0 }} />
                        <span style={{ fontSize: '0.875rem', color: '#2C1810', lineHeight: '1.5' }}>
                          {area}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Skills Demonstrated */}
              {monthlySummary.summary?.skillsDemonstrated && monthlySummary.summary.skillsDemonstrated.length > 0 && (
                <div className="report-section-card">
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#2C1810', marginBottom: '0.6rem' }}>
                    Skills Demonstrated
                  </h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {monthlySummary.summary.skillsDemonstrated.map((skill: string, idx: number) => (
                      <span
                        key={idx}
                        className="tag-chip tag-chip-skill"
                        style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div
              style={{
                textAlign: 'center',
                padding: '3.5rem 2rem',
                marginBottom: '2rem',
                backgroundColor: 'rgba(124, 77, 46, 0.04)',
                borderRadius: '16px',
                border: '1px dashed rgba(124, 77, 46, 0.25)',
              }}
            >
              <TrendingUp size={36} color="#C8874A" style={{ marginBottom: '1rem' }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#2C1810', marginBottom: '0.5rem' }}>
                No Monthly Intermediate Report Found for {MONTH_NAMES[selectedMonth - 1]} {reviewYear}
              </h3>
              <p style={{ color: '#7A6355', marginBottom: '1.5rem', fontSize: '0.925rem', maxWidth: '520px', margin: '0 auto 1.5rem' }}>
                Run the Level 2 RAG pipeline to synthesize weekly snippets, identify key project milestones, and generate vector embeddings for this month.
              </p>
              <button
                onClick={handleGenerateMonthly}
                disabled={isGeneratingMonthly}
                className="btn-primary no-print"
                style={{ padding: '0.75rem 1.85rem' }}
              >
                {isGeneratingMonthly ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                <span>{isGeneratingMonthly ? 'Synthesizing with RAG...' : `Generate ${MONTH_NAMES[selectedMonth - 1]} Report ✨`}</span>
              </button>
            </div>
          )}

          {/* Supporting Monthly Activities */}
          <div className="report-section-card" style={{ marginTop: '2rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#2C1810', marginBottom: '1rem' }}>
              Supporting Daily Work Entries for {MONTH_NAMES[selectedMonth - 1]} ({filteredActivities.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }} className="print-container">
              {filteredActivities.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#A89080' }}>
                  <p>No work records found for {MONTH_NAMES[selectedMonth - 1]} {reviewYear}.</p>
                </div>
              ) : (
                filteredActivities.map((act) => (
                  <div
                    key={act.id}
                    className="glass-card-interactive report-print-item"
                    style={{ padding: '1rem 1.25rem', borderRadius: '14px' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
                      <FileText size={15} color="#7C4D2E" />
                      <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#4A2E1A' }}>
                        {act.title || act.project || 'Work Entry'} — {act.displayDate}
                      </span>
                      {act.category && (
                        <span className="tag-chip tag-chip-category" style={{ fontSize: '0.7rem' }}>
                          {act.category}
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '0.85rem', lineHeight: '1.55', color: '#4A2E1A', margin: 0 }}>
                      {act.aiRefinedText || act.text}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Executive Document Footer for Print */}
          <div className="print-only print-document-footer">
            <span>ActivityTracker AI Performance Engine • Monthly Synthesis</span>
            <span>Period: {MONTH_NAMES[selectedMonth - 1]} {reviewYear}</span>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 3: WEEKLY SNIPPET (RAG Level 1 Intermediate Report)
          ========================================================================= */}
      {selectedPeriod === 'weekly' && (
        <div className="glass-panel printable-report" style={{ padding: '2rem' }}>
          {/* Executive Formal Print Header (Visible ONLY on print/PDF) */}
          <div className="print-only print-document-header">
            <div className="doc-eyebrow">ActivityTracker RAG Level 1 • Intermediate Digest</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h1>Weekly Performance Snippet</h1>
                <p className="doc-subtitle">
                  Week of {selectedWeekRange.start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – {selectedWeekRange.end.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <div style={{ textAlign: 'right', fontSize: '8pt', color: '#64748B' }}>
                <div>Date: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
                <div>Status: {weeklySummary?.status?.toUpperCase() || 'VERIFIED'}</div>
              </div>
            </div>

            <div className="print-meta-grid">
              <div className="print-meta-item">
                <span className="meta-label">Candidate Name</span>
                <strong>{user?.name || 'Professional Engineer'}</strong>
              </div>
              <div className="print-meta-item">
                <span className="meta-label">Job Role & Title</span>
                <strong>{user?.jobRole || 'Software Engineer'}</strong>
              </div>
              <div className="print-meta-item">
                <span className="meta-label">Date Window</span>
                <strong>
                  {selectedWeekRange.start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – {selectedWeekRange.end.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </strong>
              </div>
              <div className="print-meta-item">
                <span className="meta-label">Confidence Score</span>
                <strong style={{ color: '#15803D' }}>
                  {Math.round((weeklySummary?.confidenceScore || 0.95) * 100)}% Grounded
                </strong>
              </div>
              <div className="print-meta-item">
                <span className="meta-label">Logged Entries</span>
                <strong>{weeklySummary?.summary?.entryCount || filteredActivities.length} Activities</strong>
              </div>
              <div className="print-meta-item">
                <span className="meta-label">RAG Pipeline Level</span>
                <strong style={{ color: '#7C4D2E' }}>Level 1 (Weekly Intermediate)</strong>
              </div>
            </div>
          </div>

          {/* Week Selector Bar (Screen Only) */}
          <div
            className="no-print mobile-header-stack"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
              marginBottom: '1.75rem',
              borderBottom: '1px solid rgba(139, 90, 43, 0.12)',
              paddingBottom: '1.25rem',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem', flexWrap: 'wrap' }}>
                <span className="tag-chip tag-chip-category" style={{ fontSize: '0.75rem' }}>
                  RAG Pipeline Level 1
                </span>
                <span style={{ fontSize: '0.8rem', color: '#7A6355', fontWeight: 600 }}>
                  {filteredActivities.length} activities logged this week
                </span>
              </div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#2C1810', margin: 0 }}>
                Week of {selectedWeekRange.start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – {selectedWeekRange.end.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </h2>
            </div>

            {/* Week Selector Pills & Generate Button */}
            <div className="mobile-action-bar" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <div
                style={{
                  display: 'flex',
                  gap: '0.25rem',
                  backgroundColor: '#FFF',
                  border: '1px solid rgba(139, 90, 43, 0.2)',
                  borderRadius: '10px',
                  padding: '0.25rem',
                }}
              >
                <button
                  onClick={() => setSelectedWeekOffset(0)}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: selectedWeekOffset === 0 ? '#7C4D2E' : 'transparent',
                    color: selectedWeekOffset === 0 ? '#FFF' : '#7A6355',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  This Week
                </button>
                <button
                  onClick={() => setSelectedWeekOffset(1)}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: selectedWeekOffset === 1 ? '#7C4D2E' : 'transparent',
                    color: selectedWeekOffset === 1 ? '#FFF' : '#7A6355',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Last Week
                </button>
                <button
                  onClick={() => setSelectedWeekOffset(2)}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: selectedWeekOffset === 2 ? '#7C4D2E' : 'transparent',
                    color: selectedWeekOffset === 2 ? '#FFF' : '#7A6355',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  2 Weeks Ago
                </button>
              </div>

              <button
                onClick={handleGenerateWeekly}
                disabled={isGeneratingWeekly}
                className="btn-primary"
                style={{ padding: '0.55rem 1.25rem' }}
              >
                {isGeneratingWeekly ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : weeklySummary ? (
                  <RotateCcw size={15} />
                ) : (
                  <Sparkles size={15} />
                )}
                <span>
                  {isGeneratingWeekly
                    ? 'Synthesizing...'
                    : weeklySummary
                    ? 'Regenerate Weekly Snippet'
                    : 'Generate Weekly Snippet ✨'}
                </span>
              </button>
            </div>
          </div>

          {/* Render Actual Intermediate Weekly Summary */}
          {weeklySummary ? (
            <div
              className="printable-report"
              style={{
                marginBottom: '2rem',
                padding: '1.75rem',
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                border: '1px solid rgba(139, 90, 43, 0.15)',
                boxShadow: '0 8px 24px rgba(124, 77, 46, 0.06)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem',
              }}
            >
              {/* Top Banner with Confidence */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                  backgroundColor: 'rgba(124, 77, 46, 0.05)',
                  padding: '0.75rem 1rem',
                  borderRadius: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShieldCheck size={16} color="#15803D" />
                  <span style={{ fontSize: '0.825rem', fontWeight: 600, color: '#2C1810' }}>
                    Confidence Score: {Math.round((weeklySummary.confidenceScore || 0.95) * 100)}%
                  </span>
                  <span style={{ fontSize: '0.8rem', color: '#7A6355' }}>• Grounded in {weeklySummary.summary?.entryCount || filteredActivities.length} activities</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Clock size={14} color="#7C4D2E" />
                  <span style={{ fontSize: '0.775rem', fontWeight: 600, color: '#7C4D2E' }}>
                    Status: {weeklySummary.status?.toUpperCase() || 'GENERATED'}
                  </span>
                </div>
              </div>

              {/* Weekly AI Insight Card */}
              <div className="report-section-card">
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#2C1810', marginBottom: '0.6rem' }}>
                  AI Executive Insight
                </h3>
                <div
                  style={{
                    backgroundColor: '#FEFCF8',
                    border: '1px solid rgba(139, 90, 43, 0.12)',
                    padding: '1.25rem',
                    borderRadius: '12px',
                    fontSize: '0.925rem',
                    lineHeight: '1.65',
                    color: '#3D2518',
                  }}
                >
                  {weeklySummary.summary?.aiInsight || 'No weekly insight available.'}
                </div>
              </div>

              {/* Major Accomplishments / Key Work */}
              {weeklySummary.summary?.majorWork && weeklySummary.summary.majorWork.length > 0 && (
                <div className="report-section-card">
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#2C1810', marginBottom: '0.6rem' }}>
                    Key Accomplishments & Grouped Work
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {weeklySummary.summary.majorWork.map((item: string, idx: number) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '0.65rem',
                          backgroundColor: '#FFF',
                          border: '1px solid rgba(139, 90, 43, 0.1)',
                          padding: '0.75rem 1rem',
                          borderRadius: '10px',
                        }}
                      >
                        <CheckSquare size={16} color="#7C4D2E" style={{ marginTop: '2px', flexShrink: 0 }} />
                        <span style={{ fontSize: '0.875rem', color: '#2C1810', lineHeight: '1.5' }}>
                          {item}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Technical Areas */}
              {weeklySummary.summary?.technicalAreas && weeklySummary.summary.technicalAreas.length > 0 && (
                <div className="report-section-card">
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#2C1810', marginBottom: '0.6rem' }}>
                    Technical Areas & Technologies
                  </h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {weeklySummary.summary.technicalAreas.map((area: string, idx: number) => (
                      <span
                        key={idx}
                        className="tag-chip tag-chip-skill"
                        style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div
              style={{
                textAlign: 'center',
                padding: '3.5rem 2rem',
                marginBottom: '2rem',
                backgroundColor: 'rgba(124, 77, 46, 0.04)',
                borderRadius: '16px',
                border: '1px dashed rgba(124, 77, 46, 0.25)',
              }}
            >
              <Clock size={36} color="#C8874A" style={{ marginBottom: '1rem' }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#2C1810', marginBottom: '0.5rem' }}>
                No Weekly Intermediate Snippet Found
              </h3>
              <p style={{ color: '#7A6355', marginBottom: '1.5rem', fontSize: '0.925rem', maxWidth: '500px', margin: '0 auto 1.5rem' }}>
                Synthesize your daily activities into a grounded Level 1 RAG intermediate snippet with technical highlights and accomplishments.
              </p>
              <button
                onClick={handleGenerateWeekly}
                disabled={isGeneratingWeekly}
                className="btn-primary no-print"
                style={{ padding: '0.75rem 1.85rem' }}
              >
                {isGeneratingWeekly ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                <span>{isGeneratingWeekly ? 'Synthesizing with RAG...' : 'Generate Weekly Snippet ✨'}</span>
              </button>
            </div>
          )}

          {/* Supporting Weekly Activities */}
          <div className="report-section-card" style={{ marginTop: '2rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#2C1810', marginBottom: '1rem' }}>
              Supporting Daily Work Entries for this Week ({filteredActivities.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }} className="print-container">
              {filteredActivities.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#A89080' }}>
                  <p>No work records logged for this week.</p>
                </div>
              ) : (
                filteredActivities.map((act) => (
                  <div
                    key={act.id}
                    className="glass-card-interactive report-print-item"
                    style={{ padding: '1rem 1.25rem', borderRadius: '14px' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
                      <FileText size={15} color="#7C4D2E" />
                      <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#4A2E1A' }}>
                        {act.title || act.project || 'Work Entry'} — {act.displayDate}
                      </span>
                      {act.category && (
                        <span className="tag-chip tag-chip-category" style={{ fontSize: '0.7rem' }}>
                          {act.category}
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '0.85rem', lineHeight: '1.55', color: '#4A2E1A', margin: 0 }}>
                      {act.aiRefinedText || act.text}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Executive Document Footer for Print */}
          <div className="print-only print-document-footer">
            <span>ActivityTracker AI Performance Engine • Weekly Digest</span>
            <span>Cycle: {reviewYear}</span>
          </div>
        </div>
      )}

      {/* =========================================================================
          MERGE REPORTS MODAL
          ========================================================================= */}
      {showMergeModal && (
        <div
          className="no-print"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(44, 24, 16, 0.65)',
            backdropFilter: 'blur(8px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
          }}
        >
          <div
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '1000px',
              maxHeight: '90vh',
              overflowY: 'auto',
              backgroundColor: '#FEFCF8',
              padding: '2rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(139, 90, 43, 0.15)', paddingBottom: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <GitMerge size={20} color="#7C4D2E" />
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#2C1810', margin: 0 }}>
                    Merge Performance Reports
                  </h2>
                </div>
                <p style={{ fontSize: '0.875rem', color: '#7A6355', marginTop: '0.25rem', margin: 0 }}>
                  Compare sections from two draft versions and consolidate them into a new merged final report version.
                </p>
              </div>

              <button
                onClick={() => setShowMergeModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#7A6355' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Version Selectors */}
            <div
              className="responsive-two-col"
              style={{
                backgroundColor: 'rgba(124, 77, 46, 0.04)',
                padding: '1rem',
                borderRadius: '12px',
              }}
            >
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#7C4D2E', display: 'block', marginBottom: '0.35rem' }}>
                  Source Report A:
                </label>
                <select
                  value={mergeBaseVer}
                  onChange={(e) => {
                    const newBase = parseInt(e.target.value, 10);
                    setMergeBaseVer(newBase);
                  }}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(139, 90, 43, 0.25)',
                    background: '#FFF',
                    fontWeight: 600,
                  }}
                >
                  {versions.map((v) => (
                    <option key={v.version} value={v.version}>
                      Version {v.version} ({v.status})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#7C4D2E', display: 'block', marginBottom: '0.35rem' }}>
                  Source Report B:
                </label>
                <select
                  value={mergeCompareVer}
                  onChange={(e) => {
                    const newComp = parseInt(e.target.value, 10);
                    setMergeCompareVer(newComp);
                  }}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(139, 90, 43, 0.25)',
                    background: '#FFF',
                    fontWeight: 600,
                  }}
                >
                  {versions.map((v) => (
                    <option key={v.version} value={v.version}>
                      Version {v.version} ({v.status})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Section Comparison List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {REPORT_SECTIONS.map((sec) => {
                const docA = versions.find((v) => v.version === mergeBaseVer)?.report || {};
                const docB = versions.find((v) => v.version === mergeCompareVer)?.report || {};
                const textA = docA[sec.key] || 'Empty';
                const textB = docB[sec.key] || 'Empty';
                const currentChoice = mergeChoices[sec.key] || 'base';

                return (
                  <div
                    key={sec.key}
                    style={{
                      border: '1px solid rgba(139, 90, 43, 0.15)',
                      borderRadius: '12px',
                      padding: '1rem',
                      backgroundColor: '#FFFFFF',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#2C1810' }}>
                        {sec.title}
                      </span>

                      {/* Choice Buttons */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                        <button
                          onClick={() => handleMergeChoiceChange(sec.key, 'base')}
                          style={{
                            padding: '0.3rem 0.65rem',
                            borderRadius: '6px',
                            border: 'none',
                            background: currentChoice === 'base' ? '#7C4D2E' : 'rgba(124, 77, 46, 0.08)',
                            color: currentChoice === 'base' ? '#FFF' : '#7C4D2E',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Use Ver {mergeBaseVer}
                        </button>
                        <button
                          onClick={() => handleMergeChoiceChange(sec.key, 'compare')}
                          style={{
                            padding: '0.3rem 0.65rem',
                            borderRadius: '6px',
                            border: 'none',
                            background: currentChoice === 'compare' ? '#7C4D2E' : 'rgba(124, 77, 46, 0.08)',
                            color: currentChoice === 'compare' ? '#FFF' : '#7C4D2E',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Use Ver {mergeCompareVer}
                        </button>
                        <button
                          onClick={() => handleMergeChoiceChange(sec.key, 'combined')}
                          style={{
                            padding: '0.3rem 0.65rem',
                            borderRadius: '6px',
                            border: 'none',
                            background: currentChoice === 'combined' ? '#7C4D2E' : 'rgba(124, 77, 46, 0.08)',
                            color: currentChoice === 'combined' ? '#FFF' : '#7C4D2E',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Combine Both
                        </button>
                      </div>
                    </div>

                    {/* Side-by-Side Comparison */}
                    <div className="responsive-two-col" style={{ gap: '0.75rem', marginBottom: '0.75rem' }}>
                      <div
                        style={{
                          backgroundColor: currentChoice === 'base' ? 'rgba(124, 77, 46, 0.05)' : '#FAF8F5',
                          border: `1px solid ${currentChoice === 'base' ? '#7C4D2E' : 'rgba(139, 90, 43, 0.1)'}`,
                          padding: '0.75rem',
                          borderRadius: '8px',
                          fontSize: '0.8rem',
                          color: '#4A2E1A',
                          lineHeight: '1.5',
                          maxHeight: '150px',
                          overflowY: 'auto',
                        }}
                      >
                        <strong style={{ display: 'block', fontSize: '0.75rem', color: '#7C4D2E', marginBottom: '0.3rem' }}>
                          Version {mergeBaseVer}:
                        </strong>
                        {textA}
                      </div>

                      <div
                        style={{
                          backgroundColor: currentChoice === 'compare' ? 'rgba(124, 77, 46, 0.05)' : '#FAF8F5',
                          border: `1px solid ${currentChoice === 'compare' ? '#7C4D2E' : 'rgba(139, 90, 43, 0.1)'}`,
                          padding: '0.75rem',
                          borderRadius: '8px',
                          fontSize: '0.8rem',
                          color: '#4A2E1A',
                          lineHeight: '1.5',
                          maxHeight: '150px',
                          overflowY: 'auto',
                        }}
                      >
                        <strong style={{ display: 'block', fontSize: '0.75rem', color: '#7C4D2E', marginBottom: '0.3rem' }}>
                          Version {mergeCompareVer}:
                        </strong>
                        {textB}
                      </div>
                    </div>

                    {/* Merged Editable Output */}
                    <div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#7A6355', display: 'block', marginBottom: '0.25rem' }}>
                        Merged Final Text for this section:
                      </span>
                      <textarea
                        value={mergedSections[sec.key] || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setMergedSections((prev) => ({ ...prev, [sec.key]: val }));
                          setMergeChoices((prev) => ({ ...prev, [sec.key]: 'custom' }));
                        }}
                        rows={3}
                        className="input-capsule"
                        style={{ width: '100%', borderRadius: '8px', fontSize: '0.85rem' }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Actions */}
            <div className="mobile-action-bar" style={{ display: 'flex', justifyContent: 'flex-end', flexWrap: 'wrap', gap: '0.75rem', borderTop: '1px solid rgba(139, 90, 43, 0.15)', paddingTop: '1rem' }}>
              <button
                onClick={() => setShowMergeModal(false)}
                className="btn-secondary"
                style={{ padding: '0.55rem 1.25rem' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveMergedReport}
                disabled={isMerging}
                className="btn-primary"
                style={{ padding: '0.55rem 1.5rem' }}
              >
                {isMerging ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
                <span>{isMerging ? 'Merging Reports...' : 'Create Merged Final Version ✨'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
