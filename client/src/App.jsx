import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import PostProject from './pages/PostProject';
import LiveAuction from './pages/LiveAuction';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/post-project" element={<PostProject />} />
        <Route path="/auction/:projectId" element={<LiveAuction />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
