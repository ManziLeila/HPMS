# 🚀 QUICK START - Multi-Level Approval System

## ⚡ 3-Minute Setup

### 1. Run Migration (1 min)
```sql
-- Open: backend/migrations/001_multi_level_approval_system.sql
-- Execute in your SQL client
-- Wait for: ✅ Migration completed successfully!
```

### 2. Restart Server (30 sec)
```bash
cd backend
npm run dev
```

### 3. Create Users (1 min)
```bash
# Use your admin account to create 3 users:
# - FinanceOfficer
# - HR  
# - ManagingDirector
```

### 4. Test! (30 sec)
```bash
# Finance Officer: Create batch
# HR: Approve
# MD: Final approve
# Finance Officer: Send to bank
```

---

## 📋 The Workflow

```
┌─────────────────┐
│ Finance Officer │ Creates batch
└────────┬────────┘
         ↓
    [PENDING]
         ↓
┌─────────────────┐
│   HR Manager    │ Reviews
└────────┬────────┘
         ↓
  [HR_APPROVED]
         ↓
┌─────────────────┐
│Managing Director│ Final approval
└────────┬────────┘
         ↓
  [MD_APPROVED]
         ↓
┌─────────────────┐
│  Send to Bank   │ ✅
└─────────────────┘
```

---

## 🎯 Key Endpoints

```
POST   /api/payroll-batches              Create batch
GET    /api/payroll-batches/pending-hr   HR pending
GET    /api/payroll-batches/pending-md   MD pending
POST   /api/payroll-batches/hr-review    HR approve/reject
POST   /api/payroll-batches/md-review    MD approve/reject
POST   /api/payroll-batches/send-to-bank Send to bank
GET    /api/notifications                Get notifications
```

---

## 👥 Roles & Permissions

| Role | Can Do | Cannot Do |
|------|--------|-----------|
| **Finance Officer** | Create salaries, Create batches, Send to bank (after approval) | Approve batches |
| **HR Manager** | Review batches, Approve/Reject, Add comments | Create salaries, Send to bank |
| **Managing Director** | Final approve/reject, View financial summary | Create salaries, Edit batches |

---

## 🔔 Notifications

Everyone gets notified automatically:
- ✅ Finance Officer → When HR/MD reviews
- ✅ HR Manager → When batch submitted
- ✅ Managing Director → When HR approves

---

## 📊 What's New

**Database:**
- 3 new tables (payroll_batches, approval_history, notifications)
- 1 new role (ManagingDirector)
- 11 indexes
- 2 triggers
- 1 view

**Backend:**
- 15 new API endpoints
- Complete approval workflow
- Automatic notifications
- Full audit trail

---

## ✅ Success Checklist

- [ ] Migration ran successfully
- [ ] Server restarted
- [ ] 3 test users created
- [ ] Batch created
- [ ] HR approved
- [ ] MD approved
- [ ] Sent to bank
- [ ] Notifications received

---

## 🆘 Quick Fixes

**Migration error?**
→ Check you're using the correct database

**Server won't start?**
→ Run `npm install` in backend folder

**404 errors?**
→ Restart the server

**No notifications?**
→ Check users have correct roles

---

## 📖 Full Documentation

- `READY_TO_DEPLOY.md` - Complete deployment guide
- `MULTI_LEVEL_APPROVAL_SYSTEM.md` - Technical spec
- `SETUP_GUIDE.md` - Detailed instructions

---

**Ready to go! Run the migration and start testing!** 🎉
