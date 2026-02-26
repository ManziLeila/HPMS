import { useCallback, useEffect, useState } from 'react';
import KpiCard from '../components/KpiCard';
import PayrollTrendChart from '../components/PayrollTrendChart';
import { apiClient } from '../api/client';
import useAuth from '../hooks/useAuth.js';
import { formatCurrency } from '../utils/payroll';
import { useLanguage } from '../context/LanguageContext';
import './DashboardPage.css';

/* ── Role-specific quick-action panels ────────────────────── */
const RolePanel = ({ role, token }) => {
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!token) return;
    const fetchRole = async () => {
      try {
        if (role === 'FinanceOfficer' || role === 'Admin') {
          const res = await apiClient.get('/payroll-batches/my-batches', { token });
          setData({ batches: res.data || [], stats: res.stats });
        } else if (role === 'HR') {
          const res = await apiClient.get('/payroll-batches/pending-hr', { token });
          setData({ pending: res.data || [] });
        } else if (role === 'ManagingDirector') {
          const res = await apiClient.get('/payroll-batches/pending-md', { token });
          setData({ pending: res.data || [] });
        }
      } catch {
        // silently degrade
      }
    };
    fetchRole();
  }, [role, token]);

  if (role === 'FinanceOfficer' || role === 'Admin') {
    const batches = data?.batches || [];
    const pendingCount = batches.filter(b => b.status === 'PENDING').length;
    const readyCount = batches.filter(b => b.status === 'APPROVED').length;
    const totalValue = batches.reduce((s, b) => s + Number(b.total_amount || 0), 0);

    return (
      <section className="dashboard__role-panel dashboard__role-panel--fo">
        <div className="dashboard__role-header">
          <p className="dashboard__eyebrow">My Activity</p>
          <h3>Finance Officer Overview</h3>
        </div>
        <div className="dashboard__role-grid">
          <div className="dashboard__role-stat">
            <span className="dashboard__role-num">{batches.length}</span>
            <span>Total Batches</span>
          </div>
          <div className="dashboard__role-stat dashboard__role-stat--warn">
            <span className="dashboard__role-num">{pendingCount}</span>
            <span>Awaiting HR</span>
          </div>
          <div className="dashboard__role-stat dashboard__role-stat--ok">
            <span className="dashboard__role-num">{readyCount}</span>
            <span>Ready to Send to Bank</span>
          </div>
          <div className="dashboard__role-stat">
            <span className="dashboard__role-num" style={{ fontSize: '1rem' }}>{formatCurrency(totalValue)}</span>
            <span>Total Batch Value</span>
          </div>
        </div>
        {readyCount > 0 && (
          <div className="dashboard__role-alert dashboard__role-alert--ok">
            🏦 You have <strong>{readyCount}</strong> fully approved batch{readyCount > 1 ? 'es' : ''} ready to send to bank. Go to <strong>My Batches</strong>.
          </div>
        )}
      </section>
    );
  }

  if (role === 'HR') {
    const pending = data?.pending || [];
    return (
      <section className="dashboard__role-panel dashboard__role-panel--hr">
        <div className="dashboard__role-header">
          <p className="dashboard__eyebrow">HR Queue</p>
          <h3>Pending Payroll Reviews</h3>
        </div>
        {pending.length === 0 ? (
          <div className="dashboard__role-clear">🎉 All clear — no batches awaiting your review!</div>
        ) : (
          <div className="dashboard__role-list">
            {pending.slice(0, 5).map(b => (
              <div key={b.batch_id} className="dashboard__role-row">
                <span className="dashboard__role-name">{b.batch_name}</span>
                <span className="dashboard__role-period">{b.period_month}/{b.period_year}</span>
                <span className="dashboard__role-amount">{formatCurrency(b.total_amount || 0)}</span>
                <span className="dashboard__role-tag dashboard__role-tag--pending">⏳ Pending</span>
              </div>
            ))}
            {pending.length > 5 && (
              <p className="dashboard__role-more">+{pending.length - 5} more — go to Review Queue</p>
            )}
          </div>
        )}
      </section>
    );
  }

  if (role === 'ManagingDirector') {
    const pending = data?.pending || [];
    const totalValue = pending.reduce((s, b) => s + Number(b.total_amount || 0), 0);
    return (
      <section className="dashboard__role-panel dashboard__role-panel--md">
        <div className="dashboard__role-header">
          <p className="dashboard__eyebrow">Final Authority</p>
          <h3>Awaiting Your Approval</h3>
        </div>
        <div className="dashboard__role-grid">
          <div className="dashboard__role-stat dashboard__role-stat--warn">
            <span className="dashboard__role-num">{pending.length}</span>
            <span>Batches Pending</span>
          </div>
          <div className="dashboard__role-stat">
            <span className="dashboard__role-num" style={{ fontSize: '1rem' }}>{formatCurrency(totalValue)}</span>
            <span>Total Pending Value</span>
          </div>
        </div>
        {pending.length > 0 && (
          <div className="dashboard__role-alert dashboard__role-alert--warn">
            🔐 <strong>{pending.length}</strong> payroll batch{pending.length > 1 ? 'es' : ''} require your final approval. Go to <strong>Final Auth.</strong>
          </div>
        )}
        {pending.length === 0 && (
          <div className="dashboard__role-clear">✅ No batches awaiting your final approval.</div>
        )}
      </section>
    );
  }

  return null;
};

const DashboardPage = () => {
  const { token, user } = useAuth();
  const { t } = useLanguage();
  const [stats, setStats] = useState({
    totalEmployees: 0,
    monthlyPayrollCost: 0,
    monthlyGross: 0,
    monthlyPaye: 0,
    payrollRuns: 0,
    chartData: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      if (!token) return;
      try {
        const data = await apiClient.get('/dashboard/stats', { token });
        setStats(data);
      } catch (error) {
        console.error('Failed to load dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, [token]);

  if (loading) {
    return (
      <div className="dashboard">
        <p>{t('loadingDashboard')}</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* ── Global KPI row ──────────────────────────────────── */}
      <section className="dashboard__grid">
        <KpiCard
          title={t('totalEmployees')}
          value={stats.totalEmployees.toString()}
          subtitle={t('activeHeadcount')}
        />
        <KpiCard
          title={t('monthlyPayrollCost')}
          value={formatCurrency(stats.monthlyPayrollCost)}
          subtitle={t('allDeductionsApplied')}
        />
        <KpiCard
          title={t('payrollRuns')}
          value={stats.payrollRuns.toString()}
          subtitle={`${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`}
        />
      </section>

      {/* ── Role-specific live panel ─────────────────────── */}
      {user?.role && <RolePanel role={user.role} token={token} />}

      {/* ── Chart ────────────────────────────────────────── */}
      <PayrollTrendChart data={stats.chartData} />

      {/* ── Compliance card ──────────────────────────────── */}
      <section className="dashboard__compliance">
        <div>
          <p className="dashboard__eyebrow">{t('securityPosture')}</p>
          <h3>{t('cloudflareAes')}</h3>
          <p>
            {t('securityDescription')}
          </p>
        </div>
        <ul>
          <li>{t('monthlyGross')}: {formatCurrency(stats.monthlyGross)}</li>
          <li>{t('monthlyPaye')}: {formatCurrency(stats.monthlyPaye)}</li>
          <li>{t('payrollRuns')}: {stats.payrollRuns}</li>
        </ul>
      </section>
    </div>
  );
};

export default DashboardPage;
