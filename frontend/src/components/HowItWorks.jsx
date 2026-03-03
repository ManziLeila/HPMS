import { useRef } from 'react';
import Lottie from "lottie-react";
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import animationData from '../assets/animations/howItWorkschanged.json';
import './HowItWorks.css';

const BULLETS = [
  'Upload employee data',
  'Automatic tax & deduction calculation',
  'Multi-level approval workflow',
  'Instant payslip generation',
];

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
};

const staggerContainer = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.15 },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function HowItWorks() {
  const sectionRef = useRef(null);

  return (
    <motion.section
      id="how-it-works"
      ref={sectionRef}
      className="howItWorks"
      aria-labelledby="how-it-works-heading"
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
      variants={fadeUp}
    >
      <div className="howItWorks__container">
        <motion.div className="howItWorks__content" variants={fadeUp}>
          <h2 id="how-it-works-heading" className="howItWorks__heading">
            How It Works
          </h2>
          <p className="howItWorks__subheading">
            HPMS works as a seamless payroll engine
          </p>
          <p className="howItWorks__paragraph">
            Our Human Payroll Management System automates employee salary
            calculations, applies RSSB, PAYE and RAMA deductions instantly, and
            generates compliant payslips in seconds.
          </p>
          <motion.ul
            className="howItWorks__list"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {BULLETS.map((item) => (
              <motion.li
                key={item}
                className="howItWorks__list-item"
                variants={staggerItem}
              >
                <span className="howItWorks__bullet" aria-hidden>
                  <Check size={18} strokeWidth={2.5} />
                </span>
                <span>{item}</span>
              </motion.li>
            ))}
          </motion.ul>
        </motion.div>

        <motion.div
          className="howItWorks__animation how-animation"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{ display: 'block' }}
          >
            {animationData && (
              <Lottie
                animationData={animationData}
                loop
                autoplay
                style={{ width: '100%', maxWidth: 640, height: 520 }}
              />
            )}
          </motion.div>
        </motion.div>
      </div>
    </motion.section>
  );
}
