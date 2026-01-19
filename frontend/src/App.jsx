import { Navigate, Route, Routes } from 'react-router-dom';
import ShellLayout from './components/ShellLayout';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import DashboardPage from './pages/DashboardPage';
import EmployeeFormPage from './pages/EmployeeFormPage';
import EmployeesPage from './pages/EmployeesPage';
import LoginPage from './pages/LoginPage';
import ReportsPage from './pages/ReportsPage.jsx';
import './App.css';

const App = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route
      element={
        <ProtectedRoute>
          <ShellLayout />
        </ProtectedRoute>
      }
    >
      <Route path="/" element={<DashboardPage />} />
      <Route path="/employees" element={<EmployeesPage />} />
      <Route path="/employees/new" element={<EmployeeFormPage />} />
      <Route path="/reports" element={<ReportsPage />} />
    </Route>
    <Route path="*" element={<Navigate to="/" />} />
  </Routes>
);

export default App
