import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import './PayrollTrendChart.css';

const defaultData = [
  { month: 'Jan', payroll: 0, net: 0 },
  { month: 'Feb', payroll: 0, net: 0 },
  { month: 'Mar', payroll: 0, net: 0 },
  { month: 'Apr', payroll: 0, net: 0 },
  { month: 'May', payroll: 0, net: 0 },
  { month: 'Jun', payroll: 0, net: 0 },
];

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-RW', {
    style: 'currency',
    currency: 'RWF',
    maximumFractionDigits: 0,
  }).format(value);

const PayrollTrendChart = ({ data = defaultData }) => (
  <article className="chart-card">
    <div className="chart-card__header">
      <div>
        <p className="chart-card__eyebrow">6 Month Trend</p>
        <h3>Payroll vs Net Pay</h3>
      </div>
      <span className="chart-card__badge">Live</span>
    </div>
    <div className="chart-card__chart">
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data.length > 0 ? data : defaultData} margin={{ top: 16, right: 24, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="grossGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="netGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#34d399" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#34d399" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <XAxis dataKey="month" stroke="rgba(248,250,252,0.5)" />
          <YAxis
            tickFormatter={(value) => `${value / 1000000}M`}
            stroke="rgba(248,250,252,0.5)"
          />
          <Tooltip formatter={(value) => formatCurrency(value)} />
          <Area
            type="monotone"
            dataKey="payroll"
            stroke="#38bdf8"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#grossGradient)"
          />
          <Area
            type="monotone"
            dataKey="net"
            stroke="#34d399"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#netGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </article>
);

export default PayrollTrendChart;

