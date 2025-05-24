import { Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './pages/Dashboard';
import Search from './pages/Search';
import Topics from './pages/Topics';
import TopicDetail from './pages/TopicDetail';
import SentimentAnalysis from './pages/SentimentAnalysis';
import LatestThreats from './pages/threats/LatestThreats';
import Alerts from './pages/threats/Alerts';
import IOCs from './pages/threats/IOCs';
import Geolocation from './pages/analytics/Geolocation';
import Timeline from './pages/analytics/Timeline';
import Reports from './pages/analytics/Reports';
import GlobalMapping from './pages/GlobalMapping';
import DataManagement from './pages/DataManagement';
import Footer from './components/layout/Footer';

function App() {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/search" element={<Search />} />
            <Route path="/topics" element={<Topics />} />
            <Route path="/topics/:id" element={<TopicDetail />} />
            <Route path="/threats/latest" element={<LatestThreats />} />
            <Route path="/threats/alerts" element={<Alerts />} />
            <Route path="/threats/iocs" element={<IOCs />} />
            <Route path="/analytics/sentiment" element={<SentimentAnalysis />} />
            <Route path="/analytics/geo" element={<Geolocation />} />
            <Route path="/analytics/timeline" element={<Timeline />} />
            <Route path="/analytics/reports" element={<Reports />} />
            <Route path="/mapping" element={<GlobalMapping />} />
            <Route path="/settings" element={<DataManagement />} />
          </Routes>
        </main>
      </div>
      <Footer />
    </div>
  );
}

export default App;