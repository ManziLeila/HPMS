# 📋 Multi-Level Payroll Approval Workflow Guide

## Overview

The HPMS system now implements a complete 3-tier payroll approval workflow designed to ensure accuracy, compliance, and proper checks at each organizational level.

```
Finance Officer Creates Batch
         ↓
    HR Manager Reviews ✓
         ↓
    MD Approves ✓
         ↓
Finance Officer Sends to Bank + Dispatches Payslips
```

---

## 📊 Workflow Stages Summary

| Stage | Actor | Action | Status |
|-------|-------|--------|--------|
| 1 | Finance Officer | Create & submit payroll batch | `PENDING` |
| 2 | HR Manager | Review & approve/reject | `HR_APPROVED` or `HR_REJECTED` |
| 3 | Managing Director | Final approval/reject | `MD_APPROVED` or `MD_REJECTED` |
| 4 | Finance Officer | Send to bank & dispatch payslips | `SENT_TO_BANK` |

---

## 🔄 Step-by-Step Process

### Step 1: Finance Officer Creates Payroll Batch

**Where:** `/my-batches` or `/bulk-upload`

**What happens:**
1. Finance Officer creates a new payroll batch with:
   - Batch name (e.g., "January 2024 Payroll")
   - Pay period (Month/Year)
   - Selected salary records
2. System validates all salary data
3. Batch is created with status: **PENDING**
4. **Email sent to HR Managers** with batch details and action required

**Email Template:** "Payroll Batch Submitted for Review"
- Contains batch summary
- Shows approval workflow timeline
- Includes direct action button to HR Review page

---

### Step 2: HR Manager Reviews Batch

**Where:** `/hr-review`

**What happens:**
1. HR Manager reviews submitted batches:
   - Verifies all salary records
   - Checks for calculation errors
   - Reviews deductions and allowances
   - Can view individual salary details
2. HR Manager can:
   - **APPROVE** → Batch moves to MD for final approval
   - **REJECT** → Finance Officer must resubmit with corrections

**If APPROVED:**
- Batch status changes to: `HR_APPROVED`
- **Emails sent:**
  - To Finance Officer: "Payroll Approved by HR - Awaiting MD Final Review"
  - To Managing Director: "Payroll Ready for Final Approval"
- MD can now access for final approval

**If REJECTED:**
- Batch status: `HR_REJECTED`
- **Email sent to Finance Officer:** "Payroll Rejected by HR"
  - Includes HR's rejection reason
  - Requires Finance Officer to create new batch

---

### Step 3: Managing Director (MD) Final Approval

**Where:** `/md-approval`

**What happens:**
1. MD reviews HR-approved batches
2. MD performs final business-level review:
   - Validates total payroll amount
   - Reviews payroll summary
   - Can request additional information
3. MD can:
   - **APPROVE** → Batch is fully approved and ready to send to bank
   - **REJECT** → Batch returns to Finance Officer with MD's feedback

**If APPROVED:**
- Batch status changes to: `MD_APPROVED`
- **Emails sent:**
  - To Finance Officer: **"Payroll Fully Approved - Ready to Send to Bank"**
    - Includes action button: "Send to Bank & Dispatch Payslips"
  - To HR Manager: Confirmation of full approval
- Finance Officer can now proceed with bank submission

**If REJECTED:**
- Batch status: `MD_REJECTED`
- **Email sent to Finance Officer:** "Payroll Rejected by Managing Director"
  - Includes MD's rejection reason
  - Instructions to revise and resubmit

---

### Step 4: Finance Officer - Send to Bank & Dispatch Payslips

**Where:** `/my-batches` → "Send to Bank" button

**What happens:**
1. Finance Officer sends MD-approved batch to bank:
   - Bank transfer initiated with salary amounts
   - System marks batch as `SENT_TO_BANK`
2. **Automatic Payslip Generation & Distribution:**
   - PDF payslips generated for each employee
   - Payslips sent to employees' email addresses
   - Payslips stored in organized file system
3. Batch process marked as **COMPLETE**

**Emails sent:**
- To Finance Officer: "Payroll Sent to Bank & Payslips Dispatched"
  - Shows completion summary
  - Lists payment breakdown
- To HR Manager: "Payroll Batch Complete - Sent to Bank"
- To MD: Completion confirmation

---

## 📈 Approval Dashboard

**New Feature:** `/approval-dashboard`

The Approval Dashboard provides a centralized view of all batches and their approval status:

### Dashboard Features:

1. **Statistics Cards:**
   - Awaiting HR Review count
   - HR Approved count
   - Awaiting MD Approval count
   - Completed (Sent to Bank) count

2. **Status Filters:**
   - All Batches
   - Awaiting HR
   - HR Approved
   - Awaiting MD
   - Completed

3. **Batch Cards** showing:
   - Batch name & ID
   - Period (Month/Year)
   - Number of employees
   - Total net salary
   - Mini timeline showing approval progress
   - View Details button

4. **Batch Details Modal** including:
   - Full batch information
   - Financial summary (Gross, Deductions, RSSB, PAYE, Net)
   - Complete approval timeline with dates and reviewers
   - Reviewer comments at each stage

---

## 📧 Email Notifications at Each Stage

### 1. Batch Submission
**Recipients:** HR Managers
**Status:** PENDING → HR Review

Subject: "📋 Payroll Batch Submitted for Review - [Batch Name]"

Contains:
- Batch summary with period and employee count
- Total payroll amount
- Approval workflow visualization
- Direct action link to HR Review page
- 24-hour action required notice

---

### 2. HR Approval
**Recipients:** Finance Officer, Managing Director

Subject: "✅ Payroll Approved by HR - [Batch Name]"

Contains:
- Confirmation of HR approval
- Batch details and period
- Status: "Awaiting MD Final Approval"
- Next step instructions

---

### 3. HR Rejection
**Recipients:** Finance Officer

Subject: "❌ Payroll Rejected by HR - [Batch Name]"

Contains:
- Rejection notice
- HR's reason for rejection
- Instructions to review and resubmit
- Contact information for clarification

---

### 4. MD Approval
**Recipients:** Finance Officer, HR Manager

Subject: "🎉 Payroll Fully Approved! - Ready to Send to Bank - [Batch Name]"

Contains:
- Full approval confirmation
- Batch details
- **ACTION REQUIRED:** Send to Bank & Dispatch Payslips
- Direct action button to complete process

---

### 5. MD Rejection
**Recipients:** Finance Officer, HR Manager

Subject: "❌ Payroll Rejected by Managing Director - [Batch Name]"

Contains:
- Rejection notice
- MD's reason
- Instructions for revision and resubmission

---

### 6. Sent to Bank
**Recipients:** Finance Officer, HR Manager, Managing Director

Subject: "💰 Payroll Sent to Bank & Payslips Dispatched - [Batch Name]"

Contains:
- Completion confirmation
- Process summary (all stages completed)
- Payment breakdown
- Number of employees paid
- Total amount transferred

---

## 👥 User Roles & Permissions

### Role: Finance Officer
- ✅ Create payroll batches
- ✅ View own batches
- ✅ Submit batches for approval
- ✅ View approval status
- ✅ Send approved batches to bank
- ✅ Dispatch payslips to employees
- ❌ Cannot approve batches

### Role: HR Manager
- ✅ View pending batches (PENDING status)
- ✅ Review salary records in batches
- ✅ Approve batches (move to MD)
- ✅ Reject batches with feedback
- ✅ View approval history
- ❌ Cannot modify batches
- ❌ Cannot send to bank

### Role: Managing Director
- ✅ View HR-approved batches (HR_APPROVED status)
- ✅ Perform final approval
- ✅ Reject batches with MD-level feedback
- ✅ View approval dashboard
- ✅ Bulk approve all pending batches
- ❌ Cannot modify batches
- ❌ Cannot send to bank

### Role: Admin
- ✅ All permissions of all roles
- ✅ View all batches regardless of status
- ✅ Override approvals if needed
- ✅ Access audit trail

---

## 🔐 Data Integrity & Audit Trail

### Approval History Tracking:
Every action in the workflow is logged:
- Action type (SUBMIT, HR_APPROVE, HR_REJECT, MD_APPROVE, MD_REJECT, SEND_TO_BANK)
- User who performed action
- Timestamp of action
- Comments/feedback provided
- IP address (for security)
- User agent (browser info)

### Data you can track:
```sql
SELECT * FROM approval_history WHERE batch_id = 123;
```

Returns:
- Who submitted the batch
- Who reviewed at HR level and when
- Who reviewed at MD level and when
- Who sent to bank and when
- All comments and feedback at each stage

---

## 📊 Real-time Approvals Email Workflow

```
┌─────────────────────────────────────────┐
│ FINANCE OFFICER                         │
│ • Create Batch                          │
│ • Status: PENDING                       │
│ • Email → HR Managers                   │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ HR MANAGER                              │
│ • Review Batch Details                  │
│ • Click: Approve or Reject              │
│ ┌─────────────────────────────────┐    │
│ │ IF APPROVE:                      │    │
│ │ • Status: HR_APPROVED            │    │
│ │ • Email → Finance Officer        │    │
│ │ • Email → MD                     │    │
│ │ • Notification → Finance Officer │    │
│ │ • Notification → MD              │    │
│ └─────────────────────────────────┘    │
│ ┌─────────────────────────────────┐    │
│ │ IF REJECT:                       │    │
│ │ • Status: HR_REJECTED            │    │
│ │ • Email → Finance Officer        │    │
│ │ • Notification → Finance Officer │    │
│ └─────────────────────────────────┘    │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ MANAGING DIRECTOR                       │
│ • Review HR-Approved Batch              │
│ • Click: Approve or Reject              │
│ ┌─────────────────────────────────┐    │
│ │ IF APPROVE:                      │    │
│ │ • Status: MD_APPROVED            │    │
│ │ • Email → Finance Officer        │    │
│ │ • Email → HR Manager             │    │
│ │ • Notifications to all           │    │
│ │ • READY FOR BANK SUBMISSION      │    │
│ └─────────────────────────────────┘    │
│ ┌─────────────────────────────────┐    │
│ │ IF REJECT:                       │    │
│ │ • Status: MD_REJECTED            │    │
│ │ • Email → Finance Officer        │    │
│ │ • Email → HR Manager             │    │
│ │ • Notifications to all           │    │
│ └─────────────────────────────────┘    │
└────────────┬────────────────────────────┘
             │
    ┌────────▼────────┐
    │ APPROVED?       │
    └─┬──────────┬────┘
      │ YES      │ NO (goes back to FO)
      │          │
      ▼          ▼
   BANK      RE-SUBMIT
   SUBMIT    ───────►
      │
      ▼
┌─────────────────────────────────────────┐
│ FINANCE OFFICER                         │
│ • View: "Payroll Fully Approved"        │
│ • Click: "Send to Bank"                 │
│ • Status: SENT_TO_BANK                  │
│ • Emails sent to ALL EMPLOYEES          │
│ • Payslips dispatched                   │
│ • Email → All Stakeholders              │
│ • Batch COMPLETE                        │
└─────────────────────────────────────────┘
```

---

## ✅ Quality Checks at Each Stage

### HR Manager Checks:
- ✓ All salary records present
- ✓ No calculation errors
- ✓ Deductions correctly applied
- ✓ Allowances accurate
- ✓ Employee details complete
- ✓ Bank account information valid

### Managing Director Checks:
- ✓ Total payroll amount reasonable
- ✓ Budget alignment
- ✓ Business logic validation
- ✓ Organizational policy compliance

### System Checks:
- ✓ Encryption of sensitive data
- ✓ Audit trail recording
- ✓ Email delivery confirmation
- ✓ Bank submission logs
- ✓ Payslip generation success

---

## 🚀 Quick Access Links

After authentication, users can access:

| Role | Primary Link | Secondary Link | Dashboard |
|------|-------------|----------------|-----------|
| Finance Officer | `/my-batches` | `/bulk-upload` | `/dashboard` |
| HR Manager | `/hr-review` | `/approval-dashboard` | `/dashboard` |
| MD | `/md-approval` | `/approval-dashboard` | `/dashboard` |

**New for All Roles:** `/approval-dashboard` - Centralized approval tracking

---

## 📞 Troubleshooting

### Email Not Received?
1. Check SMTP settings at `/email-settings`
2. Verify email address in employee/user profile
3. Check spam/junk folder
4. Contact IT administrator

### Batch Can't Be Approved?
1. Check batch status matches expected stage
2. Verify you have correct role
3. Ensure no validation errors
4. Refresh page and try again

### Batch Rejected?
1. Review rejection reason in email
2. Contact reviewer for clarification
3. Correct the issues
4. Create new batch and resubmit

---

## 📝 Summary

The multi-level approval workflow ensures:
- ✅ **Accuracy:** Multiple review checkpoints
- ✅ **Compliance:** Proper authorization at each level
- ✅ **Transparency:** Email notifications keep all stakeholders informed
- ✅ **Traceability:** Complete audit trail of all actions
- ✅ **Efficiency:** Clear status at each stage
- ✅ **Communication:** Real-time email updates

All stages are documented, tracked, and reported on the Approval Dashboard.
