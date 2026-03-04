import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Users, FileText, Shield, Phone, Mail, MapPin, Globe, ExternalLink } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import LanguageSelector from '../components/LanguageSelector';
import HeroSection from '../components/HeroSection';
import HowItWorks from '../components/HowItWorks';
import './LandingPage.css';

const FOOTER_LINKS = [
  { label: 'Website', href: 'https://hcsolutions-rw.com/', icon: Globe },
  { label: 'LinkedIn', href: 'https://rw.linkedin.com/company/hc-solutions-ltd', icon: ExternalLink },
  { label: 'Instagram', href: 'https://www.instagram.com/hcsolutions.rw/', icon: ExternalLink },
  { label: 'X (Twitter)', href: 'https://x.com/HcsolutionsRWA', icon: ExternalLink },
  { label: 'TikTok', href: 'https://www.tiktok.com/@hc.solutions1', icon: ExternalLink },
];

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
};

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
            <motion.section
                className="landing__features"
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.2 }}
                variants={fadeUp}
            >
                <div className="landing__features-grid">
                    {features.map((feature, index) => {
                        const Icon = feature.icon;
                        return (
                            <motion.div
                                key={index}
                                className="landing__feature-card"
                                whileHover={{ scale: 1.04, y: -8 }}
                                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                            >
                                <div className="landing__feature-icon">
                                    <Icon size={24} />
                                </div>
                                <h3 className="landing__feature-title">{t(feature.titleKey)}</h3>
                                <p className="landing__feature-description">{t(feature.descKey)}</p>
                            </motion.div>
                        );
                    })}
                </div>
            </motion.section>

            {/* Footer */}
            <motion.footer
                className="landing__footer"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
            >
                <div className="landing__footer-inner">
                    <div className="landing__footer-brand">
                        <img
                            src="/assets/hc-logo.png"
                            alt="HC Solutions"
                            className="landing__footer-logo"
                            loading="lazy"
                        />
                        <p className="landing__footer-tagline">Human Capital Solutions — Payroll, done right.</p>
                    </div>
                    <div className="landing__footer-contact">
                        <h4 className="landing__footer-heading">Contact</h4>
                        <a href="tel:+250784264452" className="landing__footer-item">
                            <Phone size={18} aria-hidden />
                            <span>+250 784 264 452</span>
                        </a>
                        <a href="mailto:info@hcsolutionsrw.rw" className="landing__footer-item">
                            <Mail size={18} aria-hidden />
                            <span>info@hcsolutionsrw.rw</span>
                        </a>
                        <p className="landing__footer-item">
                            <MapPin size={18} aria-hidden />
                            <span>KG 7 Ave, Kigali, Rwanda</span>
                        </p>
                    </div>
                    <div className="landing__footer-social">
                        <h4 className="landing__footer-heading">Follow us</h4>
                        <div className="landing__footer-links">
                            {FOOTER_LINKS.map(({ label, href, icon: Icon }) => (
                                <a
                                    key={label}
                                    href={href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="landing__footer-link"
                                    aria-label={label}
                                >
                                    <Icon size={18} aria-hidden />
                                    <span>{label}</span>
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="landing__footer-bottom">
                    <p className="landing__footer-copy">© {new Date().getFullYear()} HC Solutions. All rights reserved.</p>
                </div>
            </motion.footer>
        </div>
    );
};

export default LandingPage;
