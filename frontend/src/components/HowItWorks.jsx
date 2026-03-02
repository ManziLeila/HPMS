import { useRef } from 'react';
import Lottie from "lottie-react";
import { motion, useInView } from 'framer-motion';
import { Check } from 'lucide-react';
import animationData from '../assets/animations/howItWorkschanged.json';
import './HowItWorks.css';

const BULLETS = [
  'Upload employee data',
  'Automatic tax & deduction calculation',
  'Multi-level approval workflow',
  'Instant payslip generation',
];

export default function HowItWorks() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.2 });

  return (
    <section
      ref={sectionRef}
      className="howItWorks"
      aria-labelledby="how-it-works-heading"
    >
      <div className="howItWorks__container">
        <motion.div
          className="howItWorks__content"
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
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
          <ul className="howItWorks__list">
            {BULLETS.map((item, index) => (
              <motion.li
                key={item}
                className="howItWorks__list-item"
                initial={{ opacity: 0, x: -12 }}
                animate={
                  isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -12 }
                }
                transition={{
                  duration: 0.4,
                  delay: 0.15 + index * 0.08,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <span className="howItWorks__bullet" aria-hidden>
                  <Check size={18} strokeWidth={2.5} />
                </span>
                <span>{item}</span>
              </motion.li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          className="howItWorks__animation how-animation"
          initial={{ opacity: 0, y: 20 }}
          animate={
            isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
          }
          transition={{
            duration: 0.6,
            delay: 0.15,
            ease: [0.22, 1, 0.36, 1],
          }}
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
      </div>
    </section>
  );
}
