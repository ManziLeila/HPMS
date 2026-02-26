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
import ContractsPage from './pages/ContractsPage.jsx';
import ContractTemplatesPage from './pages/ContractTemplatesPage.jsx';
import EmailSettingsPage from './pages/EmailSettingsPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import MyBatchesPage from './pages/MyBatchesPage.jsx';
import PayrollManagementPage from './pages/PayrollManagementPage.jsx';
import './App.css';

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
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/employees" element={<EmployeesPage />} />
      <Route path="/employees/new" element={<EmployeeFormPage />} />
      <Route path="/payroll-run" element={<PayrollManagementPage />} />
      <Route path="/reports" element={<ReportsPage />} />
      <Route path="/bulk-upload" element={<BulkUploadPage />} />
      <Route path="/hr-review" element={<HrReviewPage />} />
      <Route path="/md-approval" element={<MdApprovalPage />} />
      <Route path="/contracts" element={<ContractsPage />} />
      <Route path="/contract-templates" element={<ContractTemplatesPage />} />
      <Route path="/email-settings" element={<EmailSettingsPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/my-batches" element={<MyBatchesPage />} />
    </Route>
    <Route path="*" element={<Navigate to="/" />} />
  </Routes>
);

export default App;
