import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import ClientDashboard from './pages/ClientDashboard';
import PostProject from './pages/PostProject';
import LiveAuction from './pages/LiveAuction';
import Signup from './pages/Signup';
import Signin from './pages/Signin';
import ProvidersList from './pages/ProvidersList';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/client/dashboard" element={<ClientDashboard />} />
        <Route path="/provider/dashboard" element={<Dashboard />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/providers" element={<ProvidersList />} />
        <Route path="/post-project" element={<PostProject />} />
        <Route path="/auction/:projectId" element={<LiveAuction />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/signin" element={<Signin />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
