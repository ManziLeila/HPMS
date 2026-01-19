import { useEffect, useState } from 'react';
import KpiCard from '../components/KpiCard';
import PayrollTrendChart from '../components/PayrollTrendChart';
import { apiClient } from '../api/client';
import useAuth from '../hooks/useAuth.js';
import { formatCurrency } from '../utils/payroll';
import './DashboardPage.css';

const DashboardPage = () => {
  const { token } = useAuth();
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
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <section className="dashboard__grid">
        <KpiCard
          title="Total Employees"
          value={stats.totalEmployees.toString()}
          subtitle="Active headcount"
        />
        <KpiCard
          title="Monthly Payroll Cost"
          value={formatCurrency(stats.monthlyPayrollCost)}
          subtitle="All deductions applied"
        />
        <KpiCard
          title="Payroll Runs"
          value={stats.payrollRuns.toString()}
          subtitle={`${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`}
        />
      </section>
      <PayrollTrendChart data={stats.chartData} />
      <section className="dashboard__compliance">
        <div>
          <p className="dashboard__eyebrow">Security Posture</p>
          <h3>Cloudflare + AES-256</h3>
          <p>
            Frontend traffic is enforced over SSL with Cloudflare shielding. Payroll data remains
            encrypted end-to-end before touching PostgreSQL storage.
          </p>
        </div>
        <ul>
          <li>Monthly Gross: {formatCurrency(stats.monthlyGross)}</li>
          <li>Monthly PAYE: {formatCurrency(stats.monthlyPaye)}</li>
          <li>Payroll Runs: {stats.payrollRuns}</li>
        </ul>
      </section>
    </div>
  );
};

export default DashboardPage;

