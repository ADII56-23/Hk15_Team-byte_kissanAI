import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import TaskPlannerPage from './pages/TaskPlannerPage';
import ChatPage from './pages/ChatPage';
import KisaanAIPage from './pages/KisaanAIPage';
import AnalyticsPage from './pages/AnalyticsPage';
import DashboardLayout from './layouts/DashboardLayout';
import WeeklyPlannerPage from './pages/WeeklyPlannerPage';
import WhyAiPage from './pages/WhyAiPage';
import ReferEarnPage from './pages/ReferEarnPage';
import CropAdvisorPage from './pages/CropAdvisorPage';
import SatelliteAnalysisPage from './pages/SatelliteAnalysisPage';
import StorePage from './pages/StorePage';

import GlobalChatbot from './components/GlobalChatbot';
import { LanguageProvider } from './contexts/LanguageContext';

function App() {
  return (
    <Router>
      <LanguageProvider>
        <Routes>
          {/* Landing Page Route */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/why-ai" element={<WhyAiPage />} />

          {/* Platform Protected Routes (Demo) */}
          <Route path="/dashboard" element={<DashboardLayout><DashboardPage /></DashboardLayout>} />
          <Route path="/tasks" element={<DashboardLayout><TaskPlannerPage /></DashboardLayout>} />
          <Route path="/chat" element={<DashboardLayout><ChatPage /></DashboardLayout>} />
          <Route path="/kisaan" element={<KisaanAIPage />} />
          <Route path="/weekly-planner" element={<DashboardLayout><WeeklyPlannerPage /></DashboardLayout>} />
          <Route path="/analytics" element={<DashboardLayout><AnalyticsPage /></DashboardLayout>} />
          <Route path="/refer-earn" element={<DashboardLayout><ReferEarnPage /></DashboardLayout>} />
          <Route path="/satellite-analysis" element={<DashboardLayout><SatelliteAnalysisPage /></DashboardLayout>} />
          <Route path="/store" element={<DashboardLayout><StorePage /></DashboardLayout>} />
          <Route path="/crop-advisor" element={<CropAdvisorPage />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <GlobalChatbot />
      </LanguageProvider>
    </Router>
  );
}

export default App;
