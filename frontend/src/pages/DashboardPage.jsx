import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  FileText,
  Plus,
  Upload,
  BarChart3,
  Calendar,
  AlertCircle,
  ChevronRight,
  Clock,
  CheckCircle2,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import {
  LineChart,
  Line,
  Area,
  AreaChart,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { apiClient } from '../api/client';
import useAuth from '../hooks/useAuth.js';
import { formatCurrency } from '../utils/payroll';
import { useLanguage } from '../context/LanguageContext';
import './DashboardPage.css';

const QUICK_ACTIONS = [
  { label: 'Run Payroll', path: '/payroll-run', icon: Plus, primary: true },
  { label: 'Add Employee', path: '/employees/new', icon: Users, primary: false },
  { label: 'Upload Bulk', path: '/bulk-upload', icon: Upload, primary: false },
  { label: 'Generate Report', path: '/reports', icon: BarChart3, primary: false },
];

/** Format relative time (e.g. "5 mins ago") */
const formatRelativeTime = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const sec = Math.floor((now - d) / 1000);
  if (sec < 60) return 'Just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min${min !== 1 ? 's' : ''} ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hr${hr !== 1 ? 's' : ''} ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day} day${day !== 1 ? 's' : ''} ago`;
  return d.toLocaleDateString();
};

const DashboardPage = () => {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    monthlyGross: 0,
    monthlyPaye: 0,
    payrollRuns: 0,
    pipeline: { pending: 0, hrApproved: 0, mdApproved: 0, hrRejected: 0, mdRejected: 0 },
    chartData: [],
  });
  const [expiringContracts, setExpiringContracts] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    const load = async () => {
      if (!token) return;
      try {
        const data = await apiClient.get('/dashboard/stats', { token });
        setStats(data);
        try {
          // Client contracts only (for deadline tracking — employee contracts are separate)
          const exp = await apiClient.get('/client-contracts/expiring?days=30', { token });
          const list = Array.isArray(exp) ? exp : exp?.data || [];
          setExpiringContracts(list);
        } catch {
          setExpiringContracts([]);
        }
        try {
          const notifRes = await apiClient.get('/notifications?limit=10', { token });
          const list = notifRes?.data ?? [];
          setRecentActivity(list.map((n) => ({
            text: n.title || n.message || 'Notification',
            who: (n.title || n.message || 'N').charAt(0).toUpperCase(),
            time: formatRelativeTime(n.created_at),
            color: '#64748b',
          })));
        } catch {
          setRecentActivity([]);
        }
      } catch (err) {
        console.error('Failed to load dashboard', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token, user?.role]);

  const allTimeNet = (stats.chartData || []).reduce((s, row) => s + Number(row.net || 0), 0);
  const monthsWithData = (stats.chartData || []).length;
  const avgPerMonth = monthsWithData > 0 ? allTimeNet / monthsWithData : 0;
  const netPay = Math.max(0, Number(stats.monthlyGross || 0) - Number(stats.monthlyPaye || 0));
  const currentMonthLabel = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();
  const displayName = user?.fullName || 'System Administrator';

  const chartData = (stats.chartData || []).map((row) => ({
    month: row.month || '',
    gross: Number(row.payroll || 0),
    net: Number(row.net || 0),
    deductions: Math.max(0, Number(row.payroll || 0) - Number(row.net || 0)),
  }));

  const monthBreakdownData = [
    { name: 'Gross pay', value: Number(stats.monthlyGross || 0), fill: '#3b82f6' },
    { name: 'Deductions', value: Number(stats.monthlyPaye || 0), fill: '#94a3b8' },
    { name: 'Net pay', value: netPay, fill: '#22c55e' },
  ];

  const upcomingList = expiringContracts.slice(0, 6).map((c) => {
    const name = c.client_name || 'Client contract';
    const dateLabel = c.end_date
      ? new Date(c.end_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
      : 'No end date';
    const days = typeof c.days_remaining === 'number' ? c.days_remaining : null;
    const daysText = days != null ? `${days} day${days === 1 ? '' : 's'}` : 'soon';
    const urgency = days == null ? 'normal' : days <= 7 ? 'critical' : days <= 14 ? 'warning' : 'ok';
    return {
      title: name,
      date: dateLabel,
      daysText,
      urgency,
      days,
      icon: Calendar,
    };
  });

  if (loading) {
    return (
      <div className="dash-v2">
        <p className="dash-v2__loading">{t('loadingDashboard')}</p>
      </div>
    );
  }

  return (
    <div className="dash-v2">
      {/* Page title area: Welcome + overview (Dashboard title is in ShellLayout header) */}
      <section className="dash-v2__welcome">
        <p className="dash-v2__welcome-text">Welcome back, <strong>{displayName}</strong></p>
        <p className="dash-v2__welcome-sub">Here&apos;s your overview</p>
      </section>

      {/* Upcoming Dates — prominently at top */}
      {upcomingList.length > 0 && (
        <div className="dash-v2__upcoming-banner">
          <h3 className="dash-v2__upcoming-banner-title"><Calendar size={22} /> Upcoming Dates</h3>
          <ul className="dash-v2__upcoming-banner-list">
            {upcomingList.slice(0, 4).map((item, i) => (
              <li key={i} className="dash-v2__upcoming-banner-item">
                <span className="dash-v2__upcoming-banner-name">{item.title}</span>
                <span className="dash-v2__upcoming-banner-date">{item.date}</span>
                {item.meta && <span className="dash-v2__upcoming-banner-meta">{item.meta}</span>}
              </li>
            ))}
          </ul>
          <button type="button" className="dash-v2__upcoming-banner-link" onClick={() => navigate('/clients')}>
            View all <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Top row: 4 cards */}
      <div className="dash-v2__row1">
        {/* A) Payroll at a glance */}
        <div className="dash-v2__glance">
          <h3 className="dash-v2__glance-title">Payroll at a glance</h3>
          <div className="dash-v2__glance-top">
            <span className="dash-v2__glance-amount">{formatCurrency(allTimeNet)}</span>
            <span className="dash-v2__glance-period">All time</span>
          </div>
          <hr className="dash-v2__glance-divider" />
          {/* Mini chart: All time trend */}
          <div className="dash-v2__glance-chart">
            <ResponsiveContainer width="100%" height={100}>
              <AreaChart
                data={chartData.length ? chartData : [{ month: '—', gross: 0, net: 0, deductions: 0 }]}
                margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="dashGlanceNet" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <YAxis hide tickFormatter={(v) => `${(v / 1e6).toFixed(0)}M`} />
                <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ fontSize: '12px' }} />
                <Area type="monotone" dataKey="net" fill="url(#dashGlanceNet)" stroke="#22c55e" strokeWidth={2} name="Net" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="dash-v2__glance-metrics">
            <div className="dash-v2__glance-metric">
              <span className="dash-v2__glance-value">{stats.totalEmployees}</span>
              <span className="dash-v2__glance-label">Active employees</span>
            </div>
            <div className="dash-v2__glance-metric">
              <span className="dash-v2__glance-value">{formatCurrency(allTimeNet)}</span>
              <span className="dash-v2__glance-label">Net (all time)</span>
            </div>
            <div className="dash-v2__glance-metric">
              <span className="dash-v2__glance-value">{monthsWithData}</span>
              <span className="dash-v2__glance-label">Months with data</span>
            </div>
            <div className="dash-v2__glance-metric">
              <span className="dash-v2__glance-value">{formatCurrency(avgPerMonth)}</span>
              <span className="dash-v2__glance-label">Avg per month</span>
            </div>
          </div>
        </div>

        {/* B) Right column: Upcoming Dates → Pipeline → Quick Actions */}
        <div className="dash-v2__right-col">

          {/* Upcoming Dates — sits above Quick Actions */}
          <div className="dash-v2__upcoming">
            <div className="dash-v2__upcoming-head">
              <div className="dash-v2__upcoming-head-left">
                <span className="dash-v2__upcoming-head-icon"><Calendar size={16} /></span>
                <h3 className="dash-v2__upcoming-title">Upcoming Dates</h3>
                {upcomingList.length > 0 && (
                  <span className="dash-v2__upcoming-count">{upcomingList.length}</span>
                )}
              </div>
              <button
                type="button"
                className="dash-v2__upcoming-arrow"
                onClick={() => navigate('/clients')}
                aria-label="View all"
              >
                <ChevronRight size={18} />
              </button>
            </div>
            <ul className="dash-v2__upcoming-list">
              {upcomingList.length === 0 ? (
                <li className="dash-v2__upcoming-item dash-v2__upcoming-item--empty">
                  <div className="dash-v2__upcoming-empty-icon"><Calendar size={20} /></div>
                  <div className="dash-v2__upcoming-text">
                    <span className="dash-v2__upcoming-name">No expiring contracts</span>
                    <span className="dash-v2__upcoming-date">Contracts expiring in 30 days will appear here</span>
                  </div>
                </li>
              ) : (
                upcomingList.map((item, i) => (
                  <li key={i} className={`dash-v2__upcoming-item dash-v2__upcoming-item--${item.urgency}`}>
                    <div className={`dash-v2__upcoming-urgency-bar dash-v2__upcoming-urgency-bar--${item.urgency}`} />
                    <div className={`dash-v2__upcoming-dot dash-v2__upcoming-dot--${item.urgency}`}>
                      <Calendar size={13} />
                    </div>
                    <div className="dash-v2__upcoming-text">
                      <span className="dash-v2__upcoming-name">{item.title}</span>
                      <span className="dash-v2__upcoming-date">{item.date}</span>
                    </div>
                    <span className={`dash-v2__upcoming-badge dash-v2__upcoming-badge--${item.urgency}`}>
                      {item.daysText}
                    </span>
                  </li>
                ))
              )}
            </ul>
          </div>

          {/* Payroll Pipeline — sits between Upcoming and Quick Actions */}
          <div className="dash-v2__pipeline">
            <div className="dash-v2__pipeline-header">
              <span className="dash-v2__pipeline-title">This Month's Pipeline</span>
              <button type="button" className="dash-v2__pipeline-link" onClick={() => navigate('/approval-dashboard')}>
                View <ChevronRight size={13} />
              </button>
            </div>
            <div className="dash-v2__pipeline-steps">
              <div className="dash-v2__pipeline-step">
                <span className="dash-v2__pipeline-step-icon dash-v2__pipeline-step-icon--pending">
                  <Clock size={14} />
                </span>
                <div className="dash-v2__pipeline-step-info">
                  <span className="dash-v2__pipeline-step-count">{stats.pipeline?.pending ?? 0}</span>
                  <span className="dash-v2__pipeline-step-label">Pending</span>
                </div>
              </div>
              <ChevronRight size={12} className="dash-v2__pipeline-sep" />
              <div className="dash-v2__pipeline-step">
                <span className="dash-v2__pipeline-step-icon dash-v2__pipeline-step-icon--hr">
                  <CheckCircle2 size={14} />
                </span>
                <div className="dash-v2__pipeline-step-info">
                  <span className="dash-v2__pipeline-step-count">{stats.pipeline?.hrApproved ?? 0}</span>
                  <span className="dash-v2__pipeline-step-label">HR Approved</span>
                </div>
              </div>
              <ChevronRight size={12} className="dash-v2__pipeline-sep" />
              <div className="dash-v2__pipeline-step">
                <span className="dash-v2__pipeline-step-icon dash-v2__pipeline-step-icon--md">
                  <ShieldCheck size={14} />
                </span>
                <div className="dash-v2__pipeline-step-info">
                  <span className="dash-v2__pipeline-step-count">{stats.pipeline?.mdApproved ?? 0}</span>
                  <span className="dash-v2__pipeline-step-label">MD Approved</span>
                </div>
              </div>
            </div>
            {(stats.pipeline?.hrRejected > 0 || stats.pipeline?.mdRejected > 0) && (
              <div className="dash-v2__pipeline-rejected">
                <XCircle size={13} />
                {stats.pipeline.hrRejected > 0 && <span>{stats.pipeline.hrRejected} HR rejected</span>}
                {stats.pipeline.mdRejected > 0 && <span>{stats.pipeline.mdRejected} MD rejected</span>}
              </div>
            )}
          </div>

          {/* Quick Actions — sits below Upcoming Dates */}
          <div className="dash-v2__quick">
            <div className="dash-v2__quick-head">
              <h3 className="dash-v2__quick-title">Quick Actions</h3>
              <button type="button" className="dash-v2__quick-viewall" onClick={() => navigate('/payroll-run')}>
                View All &gt;
              </button>
            </div>
            <div className="dash-v2__quick-grid">
              {QUICK_ACTIONS.map(({ label, path, icon: Icon, primary }) => (
                <button
                  key={path}
                  type="button"
                  className={`dash-v2__quick-btn ${primary ? 'dash-v2__quick-btn--primary' : ''}`}
                  onClick={() => navigate(path)}
                >
                  <Icon size={20} strokeWidth={2} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Second row: This month (full width) */}
      <div className="dash-v2__row2">
        <div className="dash-v2__month">
          <h3 className="dash-v2__month-title">This month</h3>
          <p className="dash-v2__month-subtitle">{currentMonthLabel}</p>
          <div className="dash-v2__month-grid">
            <div className="dash-v2__month-metric">
              <span className="dash-v2__month-value">{stats.payrollRuns}</span>
              <span className="dash-v2__month-label">Salary records</span>
            </div>
            <div className="dash-v2__month-metric">
              <span className="dash-v2__month-value">{formatCurrency(stats.monthlyGross)}</span>
              <span className="dash-v2__month-label">Gross pay</span>
            </div>
            <div className="dash-v2__month-metric">
              <span className="dash-v2__month-value">{formatCurrency(stats.monthlyPaye)}</span>
              <span className="dash-v2__month-label">Deductions</span>
            </div>
            <div className="dash-v2__month-metric dash-v2__month-metric--highlight">
              <span className="dash-v2__month-value">{formatCurrency(netPay)}</span>
              <span className="dash-v2__month-label">Net pay</span>
            </div>
          </div>
          {/* This month breakdown chart */}
          <div className="dash-v2__month-chart">
            <ResponsiveContainer width="100%" height={140}>
              <BarChart
                data={monthBreakdownData}
                layout="vertical"
                margin={{ top: 0, right: 24, left: 0, bottom: 0 }}
              >
                <XAxis type="number" tickFormatter={(v) => formatCurrency(v)} tick={{ fontSize: 10 }} stroke="#64748b" />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} stroke="#64748b" width={72} />
                <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ fontSize: '12px' }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {monthBreakdownData.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="dash-v2__month-note">Run payroll for this period to see totals.</p>
        </div>
      </div>

      {/* Row 3: Payroll Trend chart | Recent Activity */}
      <div className="dash-v2__row3">
        <div className="dash-v2__chart">
          <h3 className="dash-v2__chart-title">Payroll Trend (All Time)</h3>
          <div className="dash-v2__chart-wrap">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart
                data={chartData.length ? chartData : [{ month: 'Jan', gross: 0, net: 0, deductions: 0 }]}
                margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
              >
                <defs>
                  <linearGradient id="dashV2Deductions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#94a3b8" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#94a3b8" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `${(v / 1e6).toFixed(0)}M`} />
                <Tooltip formatter={(v) => formatCurrency(v)} labelFormatter={(l) => l} />
                <Area type="monotone" dataKey="deductions" fill="url(#dashV2Deductions)" stroke="#94a3b8" strokeWidth={1} name="Deductions" />
                <Line type="monotone" dataKey="gross" stroke="#3b82f6" strokeWidth={2} name="Gross Pay" dot={{ r: 4 }} />
                <Line type="monotone" dataKey="net" stroke="#22c55e" strokeWidth={2} name="Net Pay" dot={{ r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="dash-v2__chart-updated">Live data</p>
        </div>

        <div className="dash-v2__activity">
          <div className="dash-v2__activity-head">
            <h3 className="dash-v2__activity-title">Recent Activity</h3>
            <button type="button" className="dash-v2__activity-viewall">
              View All &gt;
            </button>
          </div>
          <ul className="dash-v2__activity-list">
            {recentActivity.length === 0 ? (
              <li className="dash-v2__activity-item dash-v2__activity-item--empty">
                <div className="dash-v2__activity-body">
                  <span className="dash-v2__activity-text">No recent activity</span>
                  <span className="dash-v2__activity-time">Notifications will appear here</span>
                </div>
              </li>
            ) : (
              recentActivity.map((item, i) => (
                <li key={i} className="dash-v2__activity-item">
                  <div
                    className="dash-v2__activity-avatar"
                    style={{ background: item.color }}
                  >
                    {item.who}
                  </div>
                  <div className="dash-v2__activity-body">
                    <span className="dash-v2__activity-text">{item.text}</span>
                    <span className="dash-v2__activity-time">{item.time}</span>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
