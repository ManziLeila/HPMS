import { Navigate, Route, Routes } from 'react-router-dom';
import ShellLayout from './components/ShellLayout';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import EmployeeFormPage from './pages/EmployeeFormPage';
import EmployeesPage from './pages/EmployeesPage';
import LoginPage from './pages/LoginPage';
import ReportsPage from './pages/ReportsPage.jsx';
import BulkUploadPage from './pages/BulkUploadPage.jsx';
import HrReviewPage from './pages/HrReviewPage.jsx';
import MdApprovalPage from './pages/MdApprovalPage.jsx';
import ApprovalDashboardPage from './pages/ApprovalDashboardPage.jsx';
import ContractsPage from './pages/ContractsPage.jsx';
import ContractTemplatesPage from './pages/ContractTemplatesPage.jsx';
import EmailSettingsPage from './pages/EmailSettingsPage.jsx';
import EmailTemplatesPage from './pages/EmailTemplatesPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import NotificationSettingsPage from './pages/NotificationSettingsPage.jsx';
import PayrollPeriodsPage from './pages/PayrollPeriodsPage.jsx';
import PayrollManagementPage from './pages/PayrollManagementPage.jsx';
import ClientsPage from './pages/ClientsPage.jsx';
import ClientEmployeesPage from './pages/ClientEmployeesPage.jsx';
import UserManagementPage from './pages/UserManagementPage.jsx';
import ManagementConsolePage from './pages/ManagementConsolePage.jsx';
import useAuth from './hooks/useAuth.js';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';
import './App.css';

/** Dashboard is for finance/HR/MD/Admin only; Tech Admin goes to Management Console only. */
function DashboardOrRedirect() {
  const { user } = useAuth();
  if (user?.role === 'TechAdmin') {
    return <Navigate to="/management-console" replace />;
  }
  return <DashboardPage />;
}

/** Management Console is for Tech Admin and Admin; others are redirected. */
function ManagementConsoleOrRedirect() {
  const { user } = useAuth();
  const canAccess = user?.role === 'TechAdmin' || user?.role === 'Admin';
  if (!canAccess) {
    return <Navigate to="/dashboard" replace />;
  }
  return (
    <ErrorBoundary>
      <ManagementConsolePage />
    </ErrorBoundary>
  );
}

const App = () => (
  <Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route
      element={
        <ProtectedRoute>
          <ShellLayout />
        </ProtectedRoute>
      }
    >
      <Route path="/home" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<DashboardOrRedirect />} />
      <Route path="/approval-dashboard" element={<ApprovalDashboardPage />} />
      <Route path="/users" element={<UserManagementPage />} />
      <Route path="/clients" element={<ClientsPage />} />
      <Route path="/clients/:clientId" element={<ClientEmployeesPage />} />
      <Route path="/employees" element={<EmployeesPage />} />
      <Route path="/employees/new" element={<EmployeeFormPage />} />
      <Route path="/payroll-run" element={<PayrollManagementPage />} />
      <Route path="/reports" element={<ReportsPage />} />
      <Route path="/bulk-upload" element={<BulkUploadPage />} />
      <Route path="/clients/:clientId/bulk-upload" element={<BulkUploadPage />} />
      <Route path="/hr-review" element={<HrReviewPage />} />
      <Route path="/md-approval" element={<MdApprovalPage />} />
      <Route path="/contracts" element={<ContractsPage />} />
      <Route path="/contract-templates" element={<ContractTemplatesPage />} />
      <Route path="/email-settings" element={<EmailSettingsPage />} />
      <Route path="/email-templates" element={<EmailTemplatesPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/notification-settings" element={<NotificationSettingsPage />} />
      <Route path="/payroll-periods" element={<PayrollPeriodsPage />} />
      <Route path="/management-console" element={<ManagementConsoleOrRedirect />} />
    </Route>
    <Route path="*" element={<Navigate to="/" />} />
  </Routes>
);

export default App;
