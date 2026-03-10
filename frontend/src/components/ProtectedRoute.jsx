import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth.js';

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const { isAuthenticated, initializing } = useAuth();

  if (initializing) {
    return (
      <div className="screen-center">
        <p>Validating secure session…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;


