import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle, Users, FileText, Shield } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import LanguageSelector from '../components/LanguageSelector';
import './LandingPage.css';

const LandingPage = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();

    const features = [
        {
            icon: Users,
            titleKey: 'feature1Title',
            descKey: 'feature1Desc'
        },
        {
            icon: FileText,
            titleKey: 'feature2Title',
            descKey: 'feature2Desc'
        },
        {
            icon: Shield,
            titleKey: 'feature3Title',
            descKey: 'feature3Desc'
        }
    ];

    const benefits = ['benefit1', 'benefit2', 'benefit3'];

    return (
        <div className="landing">
            {/* Navigation */}
            <nav className="landing__nav">
                <div className="landing__nav-content">
                    <div className="landing__logo">
                        <img
                            src="/assets/hc-logo.png"
                            alt="HC Solutions"
                            className="landing__logo-image"
                        />
                    </div>
                    <div className="landing__nav-actions">
                        <LanguageSelector />
                        <button
                            className="landing__signin-btn"
                            onClick={() => navigate('/login')}
                        >
                            {t('signIn')}
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="landing__hero">
                <div className="landing__hero-content">
                    <div className="landing__hero-left">
                        <h1 className="landing__title">
                            {t('heroTitle')}
                            <br />
                            <span className="landing__title-highlight">{t('heroHighlight1')}</span>
                            <br />
                            <span className="landing__title-highlight">{t('heroHighlight2')}</span>
                        </h1>
                        <p className="landing__subtitle">
                            {t('heroSubtitle')}
                        </p>
                        <div className="landing__cta">
                            <button
                                className="landing__cta-primary"
                                onClick={() => navigate('/login')}
                            >
                                {t('getStartedFree')}
                                <ArrowRight size={20} />
                            </button>
                            <button className="landing__cta-secondary">
                                {t('contactSales')}
                            </button>
                        </div>
                        <div className="landing__benefits">
                            {benefits.map((benefitKey, index) => (
                                <div key={index} className="landing__benefit">
                                    <CheckCircle size={16} />
                                    <span>{t(benefitKey)}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="landing__hero-right">
                        <div className="landing__hero-card landing__hero-card--main">
                            <img
                                src="/payroll-hero-1.jpg"
                                alt="Professional payroll management"
                                className="landing__hero-image"
                            />
                            <div className="landing__stat-overlay">
                                <div className="landing__stat-item">
                                    <span className="landing__stat-value">24/7</span>
                                    <span className="landing__stat-label">{t('access')}</span>
                                </div>
                                <div className="landing__stat-item">
                                    <span className="landing__stat-value">100%</span>
                                    <span className="landing__stat-label">{t('accuracy')}</span>
                                </div>
                            </div>
                        </div>
                        <div className="landing__hero-card landing__hero-card--secondary">
                            <img
                                src="/payroll-hero-2.jpg"
                                alt="Secure payroll processing"
                                className="landing__hero-image"
                            />
                            <div className="landing__card-badge">
                                <CheckCircle size={16} />
                                <span>{t('rssbCompliant')}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="landing__features">
                <div className="landing__features-grid">
                    {features.map((feature, index) => {
                        const Icon = feature.icon;
                        return (
                            <div key={index} className="landing__feature-card">
                                <div className="landing__feature-icon">
                                    <Icon size={24} />
                                </div>
                                <h3 className="landing__feature-title">{t(feature.titleKey)}</h3>
                                <p className="landing__feature-description">{t(feature.descKey)}</p>
                            </div>
                        );
                    })}
                </div>
            </section>
        </div>
    );
};

export default LandingPage;
