/**
 * useSessionTimeout.js
 * Auto-logs out user after `timeoutMs` of inactivity.
 * Resets on any mouse move, key press, click or touch.
 */
import { useEffect, useCallback, useRef } from 'react';

const EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
const TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
const WARN_MS = 2 * 60 * 1000; // warn 2 min before

const useSessionTimeout = ({ onLogout, onWarn, timeoutMs = TIMEOUT_MS, warnMs = WARN_MS }) => {
    const logoutTimer = useRef(null);
    const warnTimer = useRef(null);

    const reset = useCallback(() => {
        clearTimeout(logoutTimer.current);
        clearTimeout(warnTimer.current);
        warnTimer.current = setTimeout(onWarn, timeoutMs - warnMs);
        logoutTimer.current = setTimeout(onLogout, timeoutMs);
    }, [onLogout, onWarn, timeoutMs, warnMs]);

    useEffect(() => {
        reset();
        EVENTS.forEach((e) => window.addEventListener(e, reset, { passive: true }));
        return () => {
            clearTimeout(logoutTimer.current);
            clearTimeout(warnTimer.current);
            EVENTS.forEach((e) => window.removeEventListener(e, reset));
        };
    }, [reset]);
};

export default useSessionTimeout;
