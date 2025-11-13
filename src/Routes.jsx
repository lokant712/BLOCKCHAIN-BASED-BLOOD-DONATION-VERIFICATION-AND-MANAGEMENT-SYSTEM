import React from "react";
import { BrowserRouter, Routes as RouterRoutes, Route } from "react-router-dom";
import ScrollToTop from "components/ScrollToTop";
import ErrorBoundary from "components/ErrorBoundary";
import NotFound from "pages/NotFound";
import UserLogin from './pages/user-login';
import HospitalDashboard from './pages/hospital-dashboard';
import DonorDashboard from './pages/donor-dashboard';
import BloodRequestCreation from './pages/blood-request-creation';
import UserRegistration from './pages/user-registration';
import ProfileDashboard from './pages/profile-dashboard';
import MyDonations from './pages/my-donations';
import ChatBotPage from './pages/chatbot';
import ChatbotTest from './pages/chatbot/ChatbotTest';
import BloodLinkChatbot from './pages/bloodlink-chatbot';
import BloodLinkRuleBot from './pages/bloodlink-chatbot';  // Rule-based chatbot

const Routes = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
      <ScrollToTop />
      <RouterRoutes>
        {/* Define your route here */}
        <Route path="/" element={<UserLogin />} />
        <Route path="/user-login" element={<UserLogin />} />
        <Route path="/hospital-dashboard" element={<HospitalDashboard />} />
        <Route path="/donor-dashboard" element={<DonorDashboard />} />
        <Route path="/blood-request-creation" element={<BloodRequestCreation />} />
        <Route path="/user-registration" element={<UserRegistration />} />
        <Route path="/profile" element={<ProfileDashboard />} />
        <Route path="/my-donations" element={<MyDonations />} />
        <Route path="/chatbot" element={<BloodLinkChatbot />} />  {/* AI Chatbot (Gemini 2.0) */}
        <Route path="/chatbot-test" element={<ChatbotTest />} />
        <Route path="/chatbot-ai" element={<BloodLinkChatbot />} />  {/* AI Chatbot alternative route */}
        <Route path="/chatbot-old" element={<ChatBotPage />} />  {/* Old Gemini chatbot */}
        <Route path="*" element={<NotFound />} />
      </RouterRoutes>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default Routes;
