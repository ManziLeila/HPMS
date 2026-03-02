import { useNavigate } from 'react-router-dom';
import { CheckCircle, Users, FileText, Shield } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import LanguageSelector from '../components/LanguageSelector';
import HeroSection from '../components/HeroSection';
import HowItWorks from '../components/HowItWorks';
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
            <HeroSection />

            {/* How It Works */}
            <HowItWorks />

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
