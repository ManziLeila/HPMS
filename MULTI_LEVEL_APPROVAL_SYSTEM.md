# Multi-Level Payroll Approval System

## Overview

Implement a **3-tier approval workflow** for payroll processing with distinct roles, dashboards, and responsibilities.

## Role Hierarchy

### 1. **Finance Officer** (Existing: Currently "Admin" or "Employee")
**Primary Responsibility**: Create and submit payroll for approval

**Permissions**:
- Create employee records
- Upload bulk salaries
- Create individual salary records
- View all employees
- View payroll reports
- **CANNOT**: Approve payroll or send to bank

**Dashboard Features**:
- Pending submissions count
- Rejected submissions (with reasons)
- Approved submissions awaiting final approval
- Quick salary entry
- Bulk upload status
- Notifications when HR reviews/rejects

---

### 2. **HR Manager** (New Role)
**Primary Responsibility**: First-level review and validation of payroll accuracy

**Permissions**:
- View all payroll submissions from Finance Officer
- Approve or reject payroll submissions
- Add comments/notes to submissions
- View employee records (read-only)
- View detailed salary breakdowns
- **CANNOT**: Create salaries or send to bank

**Dashboard Features**:
- Pending approvals queue
- Approved submissions (awaiting MD approval)
- Rejected submissions history
- Salary validation tools
- Employee verification
- Notifications for new submissions
- Approval/rejection actions

**Validation Checks**:
- Verify salary calculations (RSSB, PAYE, RAMA)
- Check for duplicate payments
- Validate employee bank details
- Ensure all required fields are complete
- Compare with previous month (anomaly detection)

---

### 3. **Managing Director** (New Role)
**Primary Responsibility**: Final approval and authorization to send to bank

**Permissions**:
- View HR-approved payroll submissions
- Give final approval
- Reject with feedback
- View all financial summaries
- Authorize bank transfer
- **CANNOT**: Create or edit salaries

**Dashboard Features**:
- Pending final approvals
- Total payroll cost summary
- Month-over-month comparison
- Department-wise breakdown
- Final approval/rejection actions
- Bank transfer authorization button
- Notifications for HR-approved submissions
- Audit trail view

**Final Checks**:
- Review total payroll cost
- Verify budget compliance
- Check cash flow availability
- Final authorization

---

## Approval Workflow

```
┌─────────────────────┐
│  Finance Officer    │
│  Creates Payroll    │
└──────────┬──────────┘
           │
           ▼
    ┌──────────────┐
    │   Status:    │
    │   PENDING    │
    └──────┬───────┘
           │
           ▼
┌─────────────────────┐
│    HR Manager       │
│  Reviews & Checks   │
└──────────┬──────────┘
           │
      ┌────┴────┐
      │         │
      ▼         ▼
   APPROVE   REJECT ──┐
      │              │
      │              ▼
      │      ┌──────────────┐
      │      │ Back to      │
      │      │ Finance      │
      │      │ Officer      │
      │      └──────────────┘
      │
      ▼
┌─────────────────────┐
│ Managing Director   │
│  Final Approval     │
└──────────┬──────────┘
           │
      ┌────┴────┐
      │         │
      ▼         ▼
   APPROVE   REJECT ──┐
      │              │
      │              ▼
      │      ┌──────────────┐
      │      │ Back to      │
      │      │ Finance      │
      │      │ Officer      │
      │      └──────────────┘
      │
      ▼
┌─────────────────────┐
│  Send to Bank       │
│  (Automated Email)  │
└─────────────────────┘
```

## Database Schema Changes

### 1. Update Roles Enum

```sql
-- Add new roles to the system
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'FinanceOfficer';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'HR';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'ManagingDirector';

-- Or if using CHECK constraint, update it:
ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_role_check;
ALTER TABLE employees ADD CONSTRAINT employees_role_check 
  CHECK (role IN ('Employee', 'Admin', 'FinanceOfficer', 'HR', 'ManagingDirector'));
```

### 2. Create Approval Workflow Tables

```sql
-- Payroll Batches (groups of salary records for approval)
CREATE TABLE payroll_batches (
    batch_id SERIAL PRIMARY KEY,
    batch_name VARCHAR(255) NOT NULL,
    period_month INTEGER NOT NULL,
    period_year INTEGER NOT NULL,
    created_by INTEGER NOT NULL REFERENCES employees(employee_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Approval workflow
    status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'HR_APPROVED', 'MD_APPROVED', 'REJECTED', 'SENT_TO_BANK')),
    
    -- HR Approval
    hr_reviewed_by INTEGER REFERENCES employees(employee_id),
    hr_reviewed_at TIMESTAMP,
    hr_comments TEXT,
    hr_status VARCHAR(50) CHECK (hr_status IN ('PENDING', 'APPROVED', 'REJECTED')),
    
    -- MD Approval
    md_reviewed_by INTEGER REFERENCES employees(employee_id),
    md_reviewed_at TIMESTAMP,
    md_comments TEXT,
    md_status VARCHAR(50) CHECK (md_status IN ('PENDING', 'APPROVED', 'REJECTED')),
    
    -- Bank Transfer
    sent_to_bank_at TIMESTAMP,
    sent_to_bank_by INTEGER REFERENCES employees(employee_id),
    
    -- Summary
    total_employees INTEGER DEFAULT 0,
    total_gross_salary DECIMAL(15, 2) DEFAULT 0,
    total_net_salary DECIMAL(15, 2) DEFAULT 0,
    total_deductions DECIMAL(15, 2) DEFAULT 0,
    
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Link salaries to batches
ALTER TABLE salaries ADD COLUMN batch_id INTEGER REFERENCES payroll_batches(batch_id);
CREATE INDEX idx_salaries_batch ON salaries(batch_id);

-- Approval History (audit trail)
CREATE TABLE approval_history (
    history_id SERIAL PRIMARY KEY,
    batch_id INTEGER NOT NULL REFERENCES payroll_batches(batch_id),
    action_by INTEGER NOT NULL REFERENCES employees(employee_id),
    action_type VARCHAR(50) NOT NULL CHECK (action_type IN ('SUBMIT', 'HR_APPROVE', 'HR_REJECT', 'MD_APPROVE', 'MD_REJECT', 'SEND_TO_BANK')),
    comments TEXT,
    previous_status VARCHAR(50),
    new_status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT
);

-- Notifications
CREATE TABLE notifications (
    notification_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES employees(employee_id),
    type VARCHAR(50) NOT NULL CHECK (type IN ('PAYROLL_SUBMITTED', 'PAYROLL_APPROVED', 'PAYROLL_REJECTED', 'FINAL_APPROVAL_NEEDED', 'SENT_TO_BANK')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    batch_id INTEGER REFERENCES payroll_batches(batch_id),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- Indexes for performance
CREATE INDEX idx_payroll_batches_status ON payroll_batches(status);
CREATE INDEX idx_payroll_batches_created_by ON payroll_batches(created_by);
CREATE INDEX idx_approval_history_batch ON approval_history(batch_id);
```

## Backend Implementation

### 1. New Role Constants

```javascript
// backend/src/constants/roles.js
export const ROLES = {
  EMPLOYEE: 'Employee',
  ADMIN: 'Admin',
  FINANCE_OFFICER: 'FinanceOfficer',
  HR: 'HR',
  MANAGING_DIRECTOR: 'ManagingDirector',
};

export const ROLE_PERMISSIONS = {
  [ROLES.FINANCE_OFFICER]: [
    'create_employee',
    'view_employees',
    'create_salary',
    'bulk_upload',
    'view_reports',
    'submit_payroll',
  ],
  [ROLES.HR]: [
    'view_employees',
    'view_salaries',
    'approve_payroll',
    'reject_payroll',
    'view_reports',
  ],
  [ROLES.MANAGING_DIRECTOR]: [
    'view_all',
    'final_approve',
    'final_reject',
    'send_to_bank',
    'view_financial_summary',
  ],
  [ROLES.EMPLOYEE]: [
    'view_own_payslip',
  ],
};
```

### 2. Payroll Batch Controller

```javascript
// backend/src/controllers/payrollBatchController.js
import { z } from 'zod';
import payrollBatchService from '../services/payrollBatchService.js';
import notificationService from '../services/notificationService.js';
import { badRequest, forbidden } from '../utils/httpError.js';

// Create a new payroll batch (Finance Officer)
export const createBatch = async (req, res, next) => {
  try {
    const schema = z.object({
      batchName: z.string().min(3),
      periodMonth: z.number().min(1).max(12),
      periodYear: z.number().min(2020),
      salaryIds: z.array(z.number()).min(1),
    });

    const payload = schema.parse(req.body);

    const batch = await payrollBatchService.createBatch({
      ...payload,
      createdBy: req.user.id,
    });

    // Notify HR managers
    await notificationService.notifyHRManagers({
      type: 'PAYROLL_SUBMITTED',
      batchId: batch.batch_id,
      message: `New payroll batch "${batch.batch_name}" submitted for review`,
    });

    res.status(201).json(batch);
  } catch (error) {
    next(error);
  }
};

// Get pending batches for HR approval
export const getPendingForHR = async (req, res, next) => {
  try {
    if (req.user.role !== 'HR') {
      throw forbidden('Only HR can access this endpoint');
    }

    const batches = await payrollBatchService.getPendingBatches('PENDING');
    res.json(batches);
  } catch (error) {
    next(error);
  }
};

// HR Approve/Reject
export const hrReview = async (req, res, next) => {
  try {
    if (req.user.role !== 'HR') {
      throw forbidden('Only HR can approve payroll');
    }

    const schema = z.object({
      batchId: z.number(),
      action: z.enum(['APPROVE', 'REJECT']),
      comments: z.string().optional(),
    });

    const payload = schema.parse(req.body);

    const batch = await payrollBatchService.hrReview({
      batchId: payload.batchId,
      reviewedBy: req.user.id,
      action: payload.action,
      comments: payload.comments,
    });

    // Notify based on action
    if (payload.action === 'APPROVE') {
      // Notify MD
      await notificationService.notifyManagingDirector({
        type: 'FINAL_APPROVAL_NEEDED',
        batchId: batch.batch_id,
        message: `Payroll batch "${batch.batch_name}" approved by HR, awaiting final approval`,
      });
    } else {
      // Notify Finance Officer
      await notificationService.notifyUser({
        userId: batch.created_by,
        type: 'PAYROLL_REJECTED',
        batchId: batch.batch_id,
        message: `Payroll batch "${batch.batch_name}" rejected by HR: ${payload.comments}`,
      });
    }

    res.json(batch);
  } catch (error) {
    next(error);
  }
};

// Get pending batches for MD approval
export const getPendingForMD = async (req, res, next) => {
  try {
    if (req.user.role !== 'ManagingDirector') {
      throw forbidden('Only Managing Director can access this endpoint');
    }

    const batches = await payrollBatchService.getPendingBatches('HR_APPROVED');
    res.json(batches);
  } catch (error) {
    next(error);
  }
};

// MD Final Approve/Reject
export const mdReview = async (req, res, next) => {
  try {
    if (req.user.role !== 'ManagingDirector') {
      throw forbidden('Only Managing Director can give final approval');
    }

    const schema = z.object({
      batchId: z.number(),
      action: z.enum(['APPROVE', 'REJECT']),
      comments: z.string().optional(),
    });

    const payload = schema.parse(req.body);

    const batch = await payrollBatchService.mdReview({
      batchId: payload.batchId,
      reviewedBy: req.user.id,
      action: payload.action,
      comments: payload.comments,
    });

    // Notify based on action
    if (payload.action === 'APPROVE') {
      // Notify Finance Officer - ready to send
      await notificationService.notifyUser({
        userId: batch.created_by,
        type: 'PAYROLL_APPROVED',
        batchId: batch.batch_id,
        message: `Payroll batch "${batch.batch_name}" fully approved! Ready to send to bank.`,
      });
    } else {
      // Notify Finance Officer - rejected
      await notificationService.notifyUser({
        userId: batch.created_by,
        type: 'PAYROLL_REJECTED',
        batchId: batch.batch_id,
        message: `Payroll batch "${batch.batch_name}" rejected by MD: ${payload.comments}`,
      });
    }

    res.json(batch);
  } catch (error) {
    next(error);
  }
};

// Send to Bank (Finance Officer or MD)
export const sendToBank = async (req, res, next) => {
  try {
    const allowedRoles = ['FinanceOfficer', 'ManagingDirector'];
    if (!allowedRoles.includes(req.user.role)) {
      throw forbidden('Insufficient permissions to send to bank');
    }

    const schema = z.object({
      batchId: z.number(),
    });

    const { batchId } = schema.parse(req.body);

    const batch = await payrollBatchService.sendToBank({
      batchId,
      sentBy: req.user.id,
    });

    // Send emails to all employees in batch
    await payrollBatchService.sendPayslipEmails(batchId);

    // Notify all stakeholders
    await notificationService.notifyBatchSent(batch);

    res.json({ message: 'Payroll sent to bank successfully', batch });
  } catch (error) {
    next(error);
  }
};
```

## Frontend Implementation

### 1. Role-Based Dashboards

#### Finance Officer Dashboard
```jsx
// frontend/src/pages/FinanceOfficerDashboard.jsx
import { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import useAuth from '../hooks/useAuth';

const FinanceOfficerDashboard = () => {
  const { token } = useAuth();
  const [stats, setStats] = useState({
    pendingSubmissions: 0,
    hrApproved: 0,
    rejected: 0,
    readyToSend: 0,
  });
  const [batches, setBatches] = useState([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    const data = await apiClient.get('/payroll-batches/my-batches', { token });
    setBatches(data.batches);
    setStats(data.stats);
  };

  return (
    <div className="finance-dashboard">
      <h1>Finance Officer Dashboard</h1>
      
      {/* Stats Cards */}
      <div className="stats-grid">
        <StatCard 
          title="Pending HR Review" 
          value={stats.pendingSubmissions}
          color="orange"
        />
        <StatCard 
          title="HR Approved" 
          value={stats.hrApproved}
          color="blue"
        />
        <StatCard 
          title="Rejected" 
          value={stats.rejected}
          color="red"
        />
        <StatCard 
          title="Ready to Send" 
          value={stats.readyToSend}
          color="green"
        />
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <button onClick={() => navigate('/salary/create')}>
          Create New Salary
        </button>
        <button onClick={() => navigate('/bulk-upload')}>
          Bulk Upload
        </button>
        <button onClick={() => navigate('/batches/create')}>
          Create Batch for Approval
        </button>
      </div>

      {/* Recent Batches */}
      <BatchList batches={batches} role="FinanceOfficer" />
    </div>
  );
};
```

#### HR Manager Dashboard
```jsx
// frontend/src/pages/HRDashboard.jsx
const HRDashboard = () => {
  const [pendingBatches, setPendingBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);

  const handleApprove = async (batchId, comments) => {
    await apiClient.post('/payroll-batches/hr-review', {
      batchId,
      action: 'APPROVE',
      comments,
    }, { token });
    loadPendingBatches();
  };

  const handleReject = async (batchId, comments) => {
    await apiClient.post('/payroll-batches/hr-review', {
      batchId,
      action: 'REJECT',
      comments,
    }, { token });
    loadPendingBatches();
  };

  return (
    <div className="hr-dashboard">
      <h1>HR Manager Dashboard</h1>
      
      <div className="pending-approvals">
        <h2>Pending Approvals ({pendingBatches.length})</h2>
        
        {pendingBatches.map(batch => (
          <BatchReviewCard
            key={batch.batch_id}
            batch={batch}
            onApprove={handleApprove}
            onReject={handleReject}
            onViewDetails={setSelectedBatch}
          />
        ))}
      </div>

      {selectedBatch && (
        <BatchDetailsModal
          batch={selectedBatch}
          onClose={() => setSelectedBatch(null)}
        />
      )}
    </div>
  );
};
```

#### Managing Director Dashboard
```jsx
// frontend/src/pages/MDDashboard.jsx
const MDDashboard = () => {
  const [pendingBatches, setPendingBatches] = useState([]);
  const [financialSummary, setFinancialSummary] = useState(null);

  return (
    <div className="md-dashboard">
      <h1>Managing Director Dashboard</h1>
      
      {/* Financial Summary */}
      <div className="financial-summary">
        <h2>This Month's Payroll</h2>
        <div className="summary-cards">
          <SummaryCard 
            title="Total Payroll Cost"
            value={formatCurrency(financialSummary?.totalCost)}
          />
          <SummaryCard 
            title="Total Employees"
            value={financialSummary?.totalEmployees}
          />
          <SummaryCard 
            title="vs Last Month"
            value={financialSummary?.percentageChange + '%'}
          />
        </div>
      </div>

      {/* Pending Final Approvals */}
      <div className="final-approvals">
        <h2>Awaiting Final Approval ({pendingBatches.length})</h2>
        
        {pendingBatches.map(batch => (
          <MDApprovalCard
            key={batch.batch_id}
            batch={batch}
            onApprove={handleFinalApprove}
            onReject={handleFinalReject}
          />
        ))}
      </div>
    </div>
  );
};
```

### 2. Notification System

```jsx
// frontend/src/components/NotificationBell.jsx
const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadNotifications();
    // Poll every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="notification-bell">
      <button onClick={toggleDropdown}>
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="badge">{unreadCount}</span>
        )}
      </button>
      
      {isOpen && (
        <NotificationDropdown 
          notifications={notifications}
          onMarkAsRead={markAsRead}
        />
      )}
    </div>
  );
};
```

## Implementation Timeline

### Week 1: Database & Backend Foundation
- [ ] Create database migration for new roles
- [ ] Create payroll_batches table
- [ ] Create approval_history table
- [ ] Create notifications table
- [ ] Update role enums and constraints

### Week 2: Backend API Development
- [ ] Create payrollBatchService
- [ ] Create notificationService
- [ ] Implement batch creation endpoint
- [ ] Implement HR review endpoints
- [ ] Implement MD review endpoints
- [ ] Implement send-to-bank endpoint

### Week 3: Frontend - Dashboards
- [ ] Create FinanceOfficerDashboard
- [ ] Create HRDashboard
- [ ] Create MDDashboard
- [ ] Implement role-based routing
- [ ] Create notification bell component

### Week 4: Frontend - Batch Management
- [ ] Create batch creation flow
- [ ] Create batch review components
- [ ] Create approval/rejection modals
- [ ] Implement notification system
- [ ] Add email notifications

### Week 5: Testing & Polish
- [ ] End-to-end testing
- [ ] User acceptance testing
- [ ] Bug fixes
- [ ] Documentation
- [ ] Deployment

## Security Considerations

1. **Role Verification**: Always verify roles on backend, never trust frontend
2. **Audit Trail**: Log every approval/rejection action
3. **Email Notifications**: Send confirmation emails for all approvals
4. **Two-Factor**: Require MFA for MD final approval
5. **IP Logging**: Track IP addresses for all approval actions

## Next Steps

Would you like me to:
1. **Start with database migration** - Create all necessary tables
2. **Build backend APIs** - Implement the approval workflow
3. **Create dashboards** - Build role-specific UI
4. **All of the above** - Complete end-to-end implementation

Let me know and I'll begin implementation!
