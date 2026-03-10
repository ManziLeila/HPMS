// Role constants for the approval system
export const ROLES = {
    ADMIN: 'Admin',
    EMPLOYEE: 'Employee',
    FINANCE_OFFICER: 'FinanceOfficer',
    HR: 'HR',
    MANAGING_DIRECTOR: 'ManagingDirector',
    TECH_ADMIN: 'TechAdmin',
};

// Batch status constants
export const BATCH_STATUS = {
    PENDING: 'PENDING',
    HR_APPROVED: 'HR_APPROVED',
    MD_APPROVED: 'MD_APPROVED',
    REJECTED: 'REJECTED',
    SENT_TO_BANK: 'SENT_TO_BANK',
};

// Approval action types
export const APPROVAL_ACTIONS = {
    SUBMIT: 'SUBMIT',
    HR_APPROVE: 'HR_APPROVE',
    HR_REJECT: 'HR_REJECT',
    MD_APPROVE: 'MD_APPROVE',
    MD_REJECT: 'MD_REJECT',
    SEND_TO_BANK: 'SEND_TO_BANK',
    CANCEL: 'CANCEL',
};

// Notification types
export const NOTIFICATION_TYPES = {
    PAYROLL_SUBMITTED: 'PAYROLL_SUBMITTED',
    PAYROLL_HR_APPROVED: 'PAYROLL_HR_APPROVED',
    PAYROLL_HR_REJECTED: 'PAYROLL_HR_REJECTED',
    PAYROLL_MD_APPROVED: 'PAYROLL_MD_APPROVED',
    PAYROLL_MD_REJECTED: 'PAYROLL_MD_REJECTED',
    PAYROLL_SENT_TO_BANK: 'PAYROLL_SENT_TO_BANK',
    APPROVAL_REMINDER: 'APPROVAL_REMINDER',
    BATCH_CANCELLED: 'BATCH_CANCELLED',
    EMPLOYEE_ADDED: 'EMPLOYEE_ADDED',
    EMPLOYEE_WELCOME: 'EMPLOYEE_WELCOME',
    EMPLOYEE_UPDATED: 'EMPLOYEE_UPDATED',
};

// Role permissions mapping (defaults; can be overridden by DB via role_permissions table)
export const ROLE_PERMISSIONS = {
    [ROLES.ADMIN]: ['all'], // Management Console: full access, monitor site, manage permissions
    // Tech admin: Management Console and audit features only (no payroll actions)
    [ROLES.TECH_ADMIN]: [
        'view_audit_trail',
    ],
    [ROLES.FINANCE_OFFICER]: [
        'create_employee',
        'view_employees',
        'create_salary',
        'bulk_upload',
        'view_reports',
        'create_batch',
        'submit_batch',
        'send_to_bank', // Only after full approval
    ],
    [ROLES.HR]: [
        'view_employees',
        'view_salaries',
        'view_batches',
        'approve_batch',
        'reject_batch',
        'view_reports',
        'add_comments',
    ],
    [ROLES.MANAGING_DIRECTOR]: [
        'view_all',
        'view_financial_summary',
        'final_approve',
        'final_reject',
        'authorize_bank_transfer',
        'view_audit_trail',
    ],
    [ROLES.EMPLOYEE]: [
        'view_own_payslip',
    ],
};

/** All permission keys that can be assigned to a role (for CRUD UI) */
export const ALL_PERMISSION_KEYS = [
    'all',
    'create_employee',
    'view_employees',
    'create_salary',
    'bulk_upload',
    'view_reports',
    'create_batch',
    'submit_batch',
    'send_to_bank',
    'view_salaries',
    'view_batches',
    'approve_batch',
    'reject_batch',
    'add_comments',
    'view_all',
    'view_financial_summary',
    'final_approve',
    'final_reject',
    'authorize_bank_transfer',
    'view_audit_trail',
    'view_own_payslip',
];

// Helper function to check if role has permission
export const hasPermission = (role, permission) => {
    const permissions = ROLE_PERMISSIONS[role] || [];
    return permissions.includes('all') || permissions.includes(permission);
};

// Helper function to get roles that can perform an action
export const getRolesForAction = (action) => {
    const roleMap = {
        create_batch: [ROLES.FINANCE_OFFICER],
        approve_hr: [ROLES.HR],
        approve_md: [ROLES.MANAGING_DIRECTOR],
        send_to_bank: [ROLES.FINANCE_OFFICER, ROLES.MANAGING_DIRECTOR],
    };
    return roleMap[action] || [];
};

export default {
    ROLES,
    BATCH_STATUS,
    APPROVAL_ACTIONS,
    NOTIFICATION_TYPES,
    ROLE_PERMISSIONS,
    ALL_PERMISSION_KEYS,
    hasPermission,
    getRolesForAction,
};
