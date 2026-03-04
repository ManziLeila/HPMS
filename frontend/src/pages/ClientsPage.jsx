import { useState, useEffect } from 'react';
import { ChevronRight, Building2, Plus, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import useAuth from '../hooks/useAuth';
import { useLanguage } from '../context/LanguageContext';
import './ClientsPage.css';

const ClientsPage = () => {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [modalMode, setModalMode] = useState(null); // 'add' | 'edit' | null
    const [editingClient, setEditingClient] = useState(null);
    const [clientName, setClientName] = useState('');
    const [submitError, setSubmitError] = useState(null);
    const [saving, setSaving] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const { token } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('/clients', { token });
            setClients(response.data || []);
            setError(null);
        } catch (err) {
            setError(err.message || 'Failed to load clients');
        } finally {
            setLoading(false);
        }
    };

    const openAddModal = () => {
        setModalMode('add');
        setEditingClient(null);
        setClientName('');
        setSubmitError(null);
    };

    const openEditModal = (client, e) => {
        e?.preventDefault?.();
        e?.stopPropagation?.();
        setModalMode('edit');
        setEditingClient(client);
        setClientName(client.name);
        setSubmitError(null);
    };

    const closeModal = () => {
        setModalMode(null);
        setEditingClient(null);
        setClientName('');
        setSubmitError(null);
    };

    const handleSaveClient = async () => {
        const name = clientName.trim();
        if (!name) {
            setSubmitError(t('clientNameRequired') || 'Client name is required.');
            return;
        }
        setSaving(true);
        setSubmitError(null);
        try {
            if (modalMode === 'add') {
                await apiClient.post('/clients', { name }, { token });
            } else {
                await apiClient.put(`/clients/${editingClient.client_id}`, { name }, { token });
            }
            closeModal();
            fetchClients();
        } catch (err) {
            setSubmitError(err.message || 'Failed to save client');
        } finally {
            setSaving(false);
        }
    };

    const openDeleteConfirm = (client, e) => {
        e?.preventDefault?.();
        e?.stopPropagation?.();
        setDeleteConfirm(client);
    };

    const handleDeleteClient = async () => {
        if (!deleteConfirm) return;
        setSaving(true);
        try {
            await apiClient.delete(`/clients/${deleteConfirm.client_id}`, { token });
            setDeleteConfirm(null);
            fetchClients();
        } catch (err) {
            setSubmitError(err.message || 'Failed to delete client');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="clients-page">
                <div className="loading">{t('loading') || 'Loading…'}</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="clients-page">
                <div className="error">{t('error')}: {error}</div>
                <button onClick={fetchClients}>{t('retry')}</button>
            </div>
        );
    }

    return (
        <div className="clients-page">
            <header className="page-header page-header--row">
                <div>
                    <h1>{t('clientManagement') || 'Client Management'}</h1>
                    <p>{t('manageClientsSubtext') || 'Select a client to view and manage their employees.'}</p>
                </div>
                <button type="button" className="btn-add-client" onClick={openAddModal}>
                    <Plus size={20} aria-hidden /> {t('addClient') || 'Add client'}
                </button>
            </header>

            <div className="clients-list">
                {clients.length === 0 ? (
                    <div className="empty-state">
                        <Building2 size={48} className="empty-icon" aria-hidden />
                        <p>{t('noClientsFound') || 'No clients found.'}</p>
                        <button type="button" className="btn-add-client btn-add-client--secondary" onClick={openAddModal}>
                            <Plus size={18} /> {t('addClient') || 'Add client'}
                        </button>
                    </div>
                ) : (
                    clients.map((client) => (
                        <div
                            key={client.client_id}
                            className="client-card"
                            role="button"
                            tabIndex={0}
                            onClick={() => navigate(`/clients/${client.client_id}`)}
                            onKeyDown={(e) => e.key === 'Enter' && navigate(`/clients/${client.client_id}`)}
                        >
                            <div className="client-card__icon">
                                <Building2 size={24} aria-hidden />
                            </div>
                            <div className="client-card__body">
                                <span className="client-card__name">{client.name}</span>
                                <span className="client-card__meta">
                                    Client ID: {client.client_id}
                                </span>
                            </div>
                            <div className="client-card__actions" onClick={(e) => e.stopPropagation()}>
                                <button
                                    type="button"
                                    className="client-card__btn client-card__btn--edit"
                                    onClick={(e) => openEditModal(client, e)}
                                    title={t('edit') || 'Edit'}
                                    aria-label={t('edit') || 'Edit'}
                                >
                                    <Pencil size={18} aria-hidden />
                                </button>
                                <button
                                    type="button"
                                    className="client-card__btn client-card__btn--delete"
                                    onClick={(e) => openDeleteConfirm(client, e)}
                                    title={t('delete') || 'Delete'}
                                    aria-label={t('delete') || 'Delete'}
                                >
                                    <Trash2 size={18} aria-hidden />
                                </button>
                            </div>
                            <ChevronRight size={20} className="client-card__arrow" aria-hidden />
                        </div>
                    ))
                )}
            </div>

            {/* Add / Edit client modal */}
            {(modalMode === 'add' || modalMode === 'edit') && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content modal-content--client" onClick={(e) => e.stopPropagation()}>
                        <h2>{modalMode === 'add' ? (t('addClient') || 'Add client') : (t('editClient') || 'Edit client')}</h2>
                        <div className="form-group">
                            <label>{t('clientName') || 'Client name'}</label>
                            <input
                                type="text"
                                value={clientName}
                                onChange={(e) => setClientName(e.target.value)}
                                placeholder={t('clientNamePlaceholder') || 'e.g. Acme Corp'}
                                autoFocus
                            />
                        </div>
                        {submitError && <p className="modal-error">{submitError}</p>}
                        <div className="modal-actions">
                            <button type="button" className="btn-cancel" onClick={closeModal} disabled={saving}>{t('cancel')}</button>
                            <button type="button" className="btn-save" onClick={handleSaveClient} disabled={saving}>
                                {saving ? (t('saving') || 'Saving…') : t('save') || 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete confirm modal */}
            {deleteConfirm && (
                <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
                    <div className="modal-content modal-confirm" onClick={(e) => e.stopPropagation()}>
                        <h2><AlertTriangle size={20} aria-hidden /> {t('confirmDelete') || 'Confirm delete'}</h2>
                        <p>{t('deleteClientConfirmation') || 'Delete client'} <strong>{deleteConfirm.name}</strong>? {t('deleteClientWarning') || 'Employees under this client will be unassigned (not deleted).'}</p>
                        <div className="modal-actions">
                            <button type="button" className="btn-cancel" onClick={() => setDeleteConfirm(null)} disabled={saving}>{t('cancel')}</button>
                            <button type="button" className="btn-delete-confirm" onClick={handleDeleteClient} disabled={saving}>
                                {saving ? (t('deleting') || 'Deleting…') : t('delete')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientsPage;
