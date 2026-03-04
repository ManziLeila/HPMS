import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Bell,
    ClipboardList,
    CheckCircle,
    XCircle,
    Building2,
    Ban,
    DollarSign,
    Clock,
    Trash2,
    User,
    PartyPopper,
    Pencil,
} from 'lucide-react';
import { apiClient } from '../api/client';
import useAuth from '../hooks/useAuth';
import './NotificationBell.css';

const POLL_INTERVAL = 30_000; // 30 s

const TYPE_ICON = {
    PAYROLL_SUBMITTED: ClipboardList,
    PAYROLL_HR_APPROVED: CheckCircle,
    PAYROLL_HR_REJECTED: XCircle,
    PAYROLL_MD_APPROVED: Building2,
    PAYROLL_MD_REJECTED: Ban,
    PAYROLL_SENT_TO_BANK: DollarSign,
    APPROVAL_REMINDER: Clock,
    BATCH_CANCELLED: Trash2,
    EMPLOYEE_ADDED: User,
    EMPLOYEE_WELCOME: PartyPopper,
    EMPLOYEE_UPDATED: Pencil,
};

const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
};

const NotificationBell = () => {
    const { token } = useAuth();
    const navigate = useNavigate();

    const [open, setOpen] = useState(false);
    const [items, setItems] = useState([]);
    const [unread, setUnread] = useState(0);
    const [loading, setLoading] = useState(false);
    const panelRef = useRef(null);
    const timerRef = useRef(null);

    /* ── fetch unread count (lightweight poll) ───────────────── */
    const fetchCount = useCallback(async () => {
        try {
            const data = await apiClient.get('/notifications/unread-count', { token });
            setUnread(data?.data?.unreadCount ?? 0);
        } catch { /* silent */ }
    }, [token]);

    /* ── fetch full list when panel opens ───────────────────── */
    const fetchAll = useCallback(async () => {
        try {
            setLoading(true);
            const data = await apiClient.get('/notifications?limit=30', { token });
            setItems(data?.data ?? []);
            setUnread(0); // optimistically clear the badge
        } catch { /* silent */ }
        finally { setLoading(false); }
    }, [token]);

    /* ── poll for count ──────────────────────────────────────── */
    useEffect(() => {
        fetchCount();
        timerRef.current = setInterval(fetchCount, POLL_INTERVAL);
        return () => clearInterval(timerRef.current);
    }, [fetchCount]);

    /* ── open/close ──────────────────────────────────────────── */
    const toggle = () => {
        if (!open) fetchAll();
        setOpen((p) => !p);
    };

    /* ── close on outside click ──────────────────────────────── */
    useEffect(() => {
        const handle = (e) => { if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handle);
        return () => document.removeEventListener('mousedown', handle);
    }, []);

    /* ── mark one as read ────────────────────────────────────── */
    const markRead = async (n) => {
        if (!n.is_read) {
            apiClient.put(`/notifications/${n.notification_id}/read`, {}, { token }).catch(() => { });
            setItems((prev) => prev.map((x) => x.notification_id === n.notification_id ? { ...x, is_read: true } : x));
        }
        if (n.action_url) { navigate(n.action_url); setOpen(false); }
    };

    /* ── mark all as read ────────────────────────────────────── */
    const markAllRead = async () => {
        await apiClient.put('/notifications/read-all', {}, { token }).catch(() => { });
        setItems((prev) => prev.map((x) => ({ ...x, is_read: true })));
        setUnread(0);
    };

    const unreadItems = items.filter((n) => !n.is_read);
    const readItems = items.filter((n) => n.is_read);

    return (
        <div className="nbell" ref={panelRef}>
            {/* ── bell button ──────────────────────────────────────── */}
            <button
                className={`nbell__btn ${open ? 'nbell__btn--active' : ''}`}
                onClick={toggle}
                aria-label={`Notifications${unread ? ` (${unread} unread)` : ''}`}
                title="Notifications"
            >
                <svg className="nbell__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {unread > 0 && (
                    <span className="nbell__badge">{unread > 99 ? '99+' : unread}</span>
                )}
            </button>

            {/* ── dropdown panel ───────────────────────────────────── */}
            {open && (
                <div className="nbell__panel">
                    <div className="nbell__panel-head">
                        <span className="nbell__panel-title">Notifications</span>
                        {unreadItems.length > 0 && (
                            <button className="nbell__mark-all" onClick={markAllRead}>Mark all read</button>
                        )}
                    </div>

                    <div className="nbell__list">
                        {loading && <div className="nbell__empty">Loading…</div>}

                        {!loading && items.length === 0 && (
                            <div className="nbell__empty">
                                <Bell size={32} className="nbell__empty-icon" aria-hidden />
                                <p>You're all caught up!</p>
                            </div>
                        )}

                        {/* unread first */}
                        {!loading && unreadItems.length > 0 && (
                            <>
                                <p className="nbell__section-label">New</p>
                                {unreadItems.map((n) => (
                                    <NotifItem key={n.notification_id} n={n} onClick={() => markRead(n)} />
                                ))}
                            </>
                        )}

                        {/* read items */}
                        {!loading && readItems.length > 0 && (
                            <>
                                {unreadItems.length > 0 && <p className="nbell__section-label">Earlier</p>}
                                {readItems.map((n) => (
                                    <NotifItem key={n.notification_id} n={n} onClick={() => markRead(n)} />
                                ))}
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

/* ── single notification row ────────────────────────────────── */
const NotifItem = ({ n, onClick }) => {
    const Icon = TYPE_ICON[n.type] ?? Bell;
    return (
        <button
            className={`nbell__item ${!n.is_read ? 'nbell__item--unread' : ''} ${n.priority === 'HIGH' || n.priority === 'URGENT' ? 'nbell__item--high' : ''}`}
            onClick={onClick}
        >
            <span className="nbell__item-icon"><Icon size={18} aria-hidden /></span>
            <div className="nbell__item-body">
                <p className="nbell__item-title">{n.title}</p>
                <p className="nbell__item-msg">{n.message}</p>
                <p className="nbell__item-time">{timeAgo(n.created_at)}</p>
            </div>
            {!n.is_read && <span className="nbell__dot" />}
        </button>
    );
};

export default NotificationBell;
