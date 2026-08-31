import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import ClientDashboard from './pages/ClientDashboard';
import PostProject from './pages/PostProject';
import LiveAuction from './pages/LiveAuction';
import Signup from './pages/Signup';
import Signin from './pages/Signin';
import ProvidersList from './pages/ProvidersList';
import ProviderProfile from './pages/ProviderProfile';
import AdminDashboard from './pages/AdminDashboard';
import ProviderWorkspace from './pages/ProviderWorkspace';
import AdminMessages from './pages/AdminMessages';
import GlobalSocketNotifier from './components/GlobalSocketNotifier';



function App() {
  return (
    <BrowserRouter>
      <GlobalSocketNotifier />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/signin" element={<Signin />} />

        {/* Role-specific dashboards */}
        <Route path="/client/dashboard" element={
          <ProtectedRoute allowedRoles={['client']}><ClientDashboard /></ProtectedRoute>
        } />
        <Route path="/provider/dashboard" element={
          <ProtectedRoute allowedRoles={['provider']}><Dashboard /></ProtectedRoute>
        } />
        <Route path="/admin/dashboard" element={
          <ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>
        } />

        {/* Client-only actions */}
        <Route path="/post-project" element={
          <ProtectedRoute allowedRoles={['client']}><PostProject /></ProtectedRoute>
        } />

        {/* Any authenticated user */}
        <Route path="/providers" element={
          <ProtectedRoute><ProvidersList /></ProtectedRoute>
        } />
        <Route path="/provider/:id" element={
          <ProtectedRoute><ProviderProfile /></ProtectedRoute>
        } />
        <Route path="/project/:projectId/live" element={
          <ProtectedRoute><LiveAuction /></ProtectedRoute>
        } />

        {/* Provider workspace — post-award project management */}
        <Route path="/project/:projectId/workspace" element={
          <ProtectedRoute allowedRoles={['provider']}><ProviderWorkspace /></ProtectedRoute>
        } />

        {/* Admin: message monitoring */}
        <Route path="/admin/messages" element={
          <ProtectedRoute allowedRoles={['admin']}><AdminMessages /></ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
