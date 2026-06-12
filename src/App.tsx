import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import Demands from '@/pages/Demands';
import Products from '@/pages/Products';
import Matching from '@/pages/Matching';
import Communications from '@/pages/Communications';
import Report from '@/pages/Report';

export default function App() {
  return (
    <Router>
      <div className="flex min-h-screen bg-navy-200">
        <Sidebar />
        <main className="flex-1 ml-60 p-6 print:ml-0 print:p-0">
          <Routes>
            <Route path="/" element={<Navigate to="/demands" replace />} />
            <Route path="/demands" element={<Demands />} />
            <Route path="/products" element={<Products />} />
            <Route path="/matching" element={<Matching />} />
            <Route path="/communications" element={<Communications />} />
            <Route path="/report" element={<Report />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
