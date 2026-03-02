import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Lock, CheckCircle, FileText, Users, ChevronRight, Check, ShieldCheck, Calendar, DollarSign, CalendarClock, XCircle, MessageSquare } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import './HeroSection.css';

const HERO_CONTAINER = { maxWidth: 1180 };
const CAROUSEL_INTERVAL_MS = 2800;
const TOTAL_SLIDES = 5;

const trustChips = [
  { key: 'trustBankSecurity', icon: Lock },
  { key: 'trustRssbCompliant', icon: CheckCircle },
  { key: 'trustPayslipsSeconds', icon: FileText },
  { key: 'trustHrMdApprovals', icon: Users },
];

const workflowSteps = [
  { id: 'draft', label: 'Draft', active: false },
  { id: 'hr', label: 'HR Review', active: true },
  { id: 'md', label: 'MD Approval', active: false },
  { id: 'bank', label: 'Sent to Bank', active: false, done: true },
];

function HeroCardsCarousel() {
  const [active, setActive] = useState(0);
  const prevIndex = (active - 1 + TOTAL_SLIDES) % TOTAL_SLIDES;
  const nextIndex = (active + 1) % TOTAL_SLIDES;

  useEffect(() => {
    const t = setInterval(() => {
      setActive((a) => (a + 1) % TOTAL_SLIDES);
    }, CAROUSEL_INTERVAL_MS);
    return () => clearInterval(t);
  }, []);

  const getCardClass = (index) => {
    if (index === active) return 'heroCarousel__card isActive';
    if (index === prevIndex) return 'heroCarousel__card isPrev';
    if (index === nextIndex) return 'heroCarousel__card isNext';
    return 'heroCarousel__card isHidden';
  };

  return (
    <div className="heroCarousel" aria-label="Feature cards carousel">
      {/* Card 0: This Month */}
      <div className={getCardClass(0)}>
        <div className="heroCard">
          <h3 className="hero-card__title">This Month</h3>
          <div className="hero-card__divider" />
          <div className="hero-card__summary">
            <div className="hero-card__summary-row">
              <span className="hero-card__label">Gross Payroll</span>
              <span className="hero-card__value-wrap">
                <span className="hero-card__value">RF 16,502,200</span>
                <span className="hero-card__badge hero-card__badge--positive">+2.5%</span>
              </span>
            </div>
            <div className="hero-card__summary-row">
              <span className="hero-card__label">Net Pay</span>
              <span className="hero-card__value hero-card__value--muted">RF 12,830,400</span>
            </div>
            <div className="hero-card__summary-row">
              <span className="hero-card__label">Deductions</span>
              <span className="hero-card__value hero-card__value--muted">RF 3,671,800</span>
            </div>
          </div>
          <div className="hero-card__chips-row">
            <span className="hero-card__tag hero-card__tag--paye">PAYE</span>
            <span className="hero-card__tag hero-card__tag--rssb">RSSB</span>
            <span className="hero-card__tag hero-card__tag--rama">RAMA</span>
          </div>
        </div>
      </div>

      {/* Card 1: Payroll Workflow */}
      <div className={getCardClass(1)}>
        <div className="heroCard">
          <h3 className="hero-card__title">Payroll Workflow</h3>
          <div className="hero-workflow">
            {workflowSteps.map((step, i) => (
              <span key={step.id} className="hero-workflow__segment">
                {i > 0 && <ChevronRight size={14} className="hero-workflow__arrow" aria-hidden />}
                <span
                  className={`hero-workflow__pill ${step.active ? 'hero-workflow__pill--active' : ''} ${step.done ? 'hero-workflow__pill--done' : ''}`}
                >
                  {step.label}
                  {step.done && <Check size={14} strokeWidth={2.5} />}
                </span>
              </span>
            ))}
          </div>
          <p className="hero-card__sub">Real-time status & audit trail</p>
          <div className="hero-card__badges">
            <span className="hero-card__chip">
              <ShieldCheck size={14} strokeWidth={2} />
              Role-based access
            </span>
            <span className="hero-card__chip">
              <FileText size={14} strokeWidth={2} />
              Comments & rejections
            </span>
          </div>
        </div>
      </div>

      {/* Card 2: Payslips */}
      <div className={getCardClass(2)}>
        <div className="heroCard">
          <h3 className="hero-card__title">Payslips</h3>
          <p className="hero-card__desc">Generate & email payslips instantly</p>
          <button type="button" className="hero-card__btn">
            Preview PDF
          </button>
          <p className="hero-card__encrypt">
            <ShieldCheck size={14} strokeWidth={2} aria-hidden />
            Encrypted at rest
          </p>
        </div>
      </div>

      {/* Card 3: Rwanda Compliance */}
      <div className={getCardClass(3)}>
        <div className="heroCard">
          <h3 className="hero-card__title">Rwanda Compliance</h3>
          <div className="hero-card__divider" />
          <ul className="hero-card__list" aria-label="Compliance features">
            <li className="hero-card__list-item">
              <span className="hero-card__check-wrap" aria-hidden>
                <Check size={14} strokeWidth={2.5} />
              </span>
              PAYE calculation engine
            </li>
            <li className="hero-card__list-item">
              <span className="hero-card__check-wrap" aria-hidden>
                <Check size={14} strokeWidth={2.5} />
              </span>
              RSSB (pension & maternity)
            </li>
            <li className="hero-card__list-item">
              <span className="hero-card__check-wrap" aria-hidden>
                <Check size={14} strokeWidth={2.5} />
              </span>
              RAMA deductions
            </li>
            <li className="hero-card__list-item">
              <span className="hero-card__check-wrap" aria-hidden>
                <Check size={14} strokeWidth={2.5} />
              </span>
              Audit trail export
            </li>
          </ul>
          <div className="hero-card__update-pill">
            <Calendar size={16} strokeWidth={2} aria-hidden />
            <span>Updated for 2026 tax rules</span>
          </div>
        </div>
      </div>

      {/* Card 4: Payroll at a glance */}
      <div className={getCardClass(4)}>
        <div className="heroCard">
          <h3 className="hero-card__title">Payroll at a glance</h3>
          <p className="hero-card__subtitle">Last 8 months</p>
          <div className="hero-card__divider" />
          <div className="hero-card__stats">
            <div className="hero-card__stat">
              <Users size={20} strokeWidth={2} className="hero-card__stat-icon" aria-hidden />
              <span className="hero-card__stat-value">24</span>
              <span className="hero-card__stat-label">Active employees</span>
            </div>
            <div className="hero-card__stat">
              <DollarSign size={20} strokeWidth={2} className="hero-card__stat-icon" aria-hidden />
              <span className="hero-card__stat-value">RF5,650,000</span>
              <span className="hero-card__stat-label">Net payroll</span>
            </div>
            <div className="hero-card__stat">
              <CalendarClock size={20} strokeWidth={2} className="hero-card__stat-icon" aria-hidden />
              <span className="hero-card__stat-value">RF 942,000</span>
              <span className="hero-card__stat-label">Avg per month</span>
            </div>
            <div className="hero-card__stat">
              <XCircle size={20} strokeWidth={2} className="hero-card__stat-icon hero-card__stat-icon--warn" aria-hidden />
              <span className="hero-card__stat-value">5</span>
              <span className="hero-card__stat-label">Failed runs</span>
            </div>
          </div>
          <div className="hero-card__badges">
            <span className="hero-card__chip">
              <ShieldCheck size={14} strokeWidth={2} />
              Role-based access
            </span>
            <span className="hero-card__chip">
              <MessageSquare size={14} strokeWidth={2} />
              Comments & rejections
            </span>
          </div>
        </div>
      </div>

      <div className="heroCarousel__dots" role="tablist" aria-label="Carousel slides">
        {[0, 1, 2, 3, 4].map((index) => (
          <button
            key={index}
            type="button"
            role="tab"
            aria-selected={index === active}
            aria-label={`Go to slide ${index + 1}`}
            className={`heroCarousel__dot ${index === active ? 'isOn' : ''}`}
            onClick={() => setActive(index)}
          />
        ))}
      </div>
    </div>
  );
}

export default function HeroSection() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const sectionRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });
  const bgY = useTransform(scrollYProgress, [0, 0.5], [0, 80]);
  const glowOpacity = useTransform(scrollYProgress, [0, 0.4], [0.6, 0.2]);

  return (
    <section ref={sectionRef} className="hero" aria-label="Hero">
      <motion.div className="hero__bg" style={{ y: bgY }}>
        <div className="hero__bg-image" aria-hidden="true" />
        <div className="hero__bg-gradient" />
        <motion.div className="hero__bg-glow" style={{ opacity: glowOpacity }} aria-hidden="true" />
        <div className="hero__bg-noise" aria-hidden="true" />
      </motion.div>

      <div className="hero__container" style={{ maxWidth: HERO_CONTAINER.maxWidth }}>
        <motion.div
          className="hero__left"
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="hero__pill">HC SOLUTIONS</span>
          <h1 className="hero__headline">
            Streamlined Payroll
            <br />
            <span className="hero__headline-accent">Anytime, Anywhere</span>
          </h1>
          <p className="hero__subtext">
            Rwanda-ready payroll with automated calculations, audit trails, and multi-level approvals — built for RSSB, RAMA & PAYE.
          </p>
          <div className="hero__cta">
            <button
              type="button"
              className="hero__btn hero__btn--primary"
              onClick={() => navigate('/login')}
            >
              {t('getStartedFree')}
              <ChevronRight size={20} strokeWidth={2.5} />
            </button>
            <button type="button" className="hero__btn hero__btn--secondary">
              {t('bookADemo')}
            </button>
          </div>
          <ul className="hero__trust" aria-label="Trust indicators">
            {trustChips.map(({ key, icon: Icon }) => (
              <li key={key} className="hero__trust-item">
                <Icon size={16} strokeWidth={2} aria-hidden />
                <span>{t(key)}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        <div className="hero__right">
          <div className="hero__cards-wrap">
            <div className="hero__cards-glow" aria-hidden="true" />
            <HeroCardsCarousel />
          </div>
        </div>
      </div>
    </section>
  );
}
