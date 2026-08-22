import { Navigate } from 'react-router-dom';

/**
 * ProtectedRoute — wraps any route element with auth/role checks.
 *
 * Props:
 *   children      – the page component to render if checks pass
 *   allowedRoles  – optional array of roles e.g. ['client'], ['admin']
 *                   if omitted, any authenticated user is allowed
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');

  // 1. No token → redirect to sign-in
  if (!token) {
    return <Navigate to="/signin" replace />;
  }

  // 2. If role restriction is specified, decode JWT and verify
  if (allowedRoles && allowedRoles.length > 0) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (!allowedRoles.includes(payload.role)) {
        // Redirect to the user's correct dashboard instead of a blank 403
        if (payload.role === 'admin')    return <Navigate to="/admin/dashboard" replace />;
        if (payload.role === 'client')   return <Navigate to="/client/dashboard" replace />;
        if (payload.role === 'provider') return <Navigate to="/provider/dashboard" replace />;
        return <Navigate to="/" replace />;
      }
    } catch {
      // Malformed token — treat as unauthenticated
      localStorage.removeItem('token');
      return <Navigate to="/signin" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
