import './KpiCard.css';

const KpiCard = ({ title, value, trend, subtitle }) => (
  <article className="kpi-card">
    <div>
      <p className="kpi-card__title">{title}</p>
      <h3 className="kpi-card__value">{value}</h3>
      {subtitle && <p className="kpi-card__subtitle">{subtitle}</p>}
    </div>
    {trend && (
      <span
        className={`kpi-card__trend ${
          trend.direction === 'up' ? 'kpi-card__trend--up' : 'kpi-card__trend--down'
        }`}
      >
        {trend.direction === 'up' ? '▲' : '▼'} {trend.value}
      </span>
    )}
  </article>
);

export default KpiCard;

