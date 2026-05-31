import { useEffect, useState, createContext, useContext } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

// Pages
import HomePage from "@/pages/HomePage";

import NakshatraAIPage from "@/pages/NakshatraAIPage";
import CosmicStorePage from "@/pages/CosmicStorePage";
import RashifalPage from "@/pages/RashifalPage";
import PlansPage from "@/pages/PlansPage";
import DashboardPage from "@/pages/DashboardPage";
import BlogPage from "@/pages/BlogPage";
import AuthPage from "@/pages/AuthPage";

import OnboardingPage from "@/pages/OnboardingPage";
import ProfilePage from "@/pages/ProfilePage";

// Admin Pages
import { AdminLayout, AdminLoginPage } from "@/pages/admin/AdminLayout";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminAstrologers from "@/pages/admin/AdminAstrologers";
import AdminAstrologerApplications from "@/pages/admin/AdminAstrologerApplications";
import AdminHoroscope from "@/pages/admin/AdminHoroscope";
import AdminStore from "@/pages/admin/AdminStore";
import AdminSettings from "@/pages/admin/AdminSettings";
import AdminSessions from "@/pages/admin/AdminSessions";
import AdminAIReports from "@/pages/admin/AdminAIReports";
import AdminReportTypes from "@/pages/admin/AdminReportTypes";
import AdminBlog from "@/pages/admin/AdminBlog";
import AdminPlans from "@/pages/admin/AdminPlans";
import AdminCoupons from "@/pages/admin/AdminCoupons";
import AdminFinance from "@/pages/admin/AdminFinance";
import AdminBanners from "@/pages/admin/AdminBanners";
import AdminNotifications from "@/pages/admin/AdminNotifications";
import AdminReviews from "@/pages/admin/AdminReviews";
import AdminSupport from "@/pages/admin/AdminSupport";
import AdminAudit from "@/pages/admin/AdminAudit";
import AdminOrders from "@/pages/admin/AdminOrders";

// Components
import Navbar from "@/components/Navbar";
import MobileNav from "@/components/MobileNav";
import SupportProvider, { SupportFloatingButton } from "@/components/SupportContext";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

// Context for global state
export const AppContext = createContext(null);

export const useApp = () => useContext(AppContext);

// Layout wrapper for public pages
const PublicLayout = ({ children }) => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isAuthRoute = location.pathname === '/login' || location.pathname === '/signup' || location.pathname === '/onboarding';
  
  if (isAdminRoute) return children;
  if (isAuthRoute) return children;
  
  return (
    <>
      <Navbar />
      <main className="relative z-10">
        {children}
      </main>
      <MobileNav />
      <SupportFloatingButton />
    </>
  );
};

function App() {
  const [stats, setStats] = useState({ total_users: 12847, online_astrologers: 24, total_sessions: 50000, rating: 4.9 });
  const [isLoading, setIsLoading] = useState(true);

  // Bootstrap theme on app load
  useEffect(() => {
    try {
      const saved = localStorage.getItem("theme");
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const isDark = saved ? saved === "dark" : prefersDark || true; // default dark for the cosmic theme
      document.documentElement.classList.toggle("dark", isDark);
    } catch (e) {
      document.documentElement.classList.add("dark");
    }
  }, []);

  useEffect(() => {
    const initApp = async () => {
      try {
        // Fetch stats
        const statsRes = await axios.get(`${API}/stats`);
        setStats(statsRes.data);
      } catch (e) {
        console.error("Init error:", e);
      } finally {
        setIsLoading(false);
      }
    };
    initApp();
  }, []);

  return (
    <AppContext.Provider value={{ stats, API }}>
      <SupportProvider>
        <BrowserRouter>
        <Routes>
          {/* Admin Routes - No login required */}
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="astrologers" element={<AdminAstrologers />} />
            <Route path="astrologer-applications" element={<AdminAstrologerApplications />} />
            <Route path="sessions" element={<AdminSessions />} />
            <Route path="ai-reports" element={<AdminAIReports />} />
            <Route path="report-types" element={<AdminReportTypes />} />
            <Route path="horoscope" element={<AdminHoroscope />} />
            <Route path="store" element={<AdminStore />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="blog" element={<AdminBlog />} />
            <Route path="plans" element={<AdminPlans />} />
            <Route path="coupons" element={<AdminCoupons />} />
            <Route path="finance" element={<AdminFinance />} />
            <Route path="banners" element={<AdminBanners />} />
            <Route path="notifications" element={<AdminNotifications />} />
            <Route path="reviews" element={<AdminReviews />} />
            <Route path="support" element={<AdminSupport />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="audit" element={<AdminAudit />} />
          </Route>

          {/* Public Routes */}
          <Route path="/*" element={
            <div className="App min-h-screen cosmic-bg">
              <PublicLayout>
                <Routes>
                  <Route path="/" element={<HomePage />} />

                  <Route path="/nakshatra-ai" element={<NakshatraAIPage />} />
                  <Route path="/cosmic-store" element={<CosmicStorePage />} />
                  <Route path="/rashifal" element={<RashifalPage />} />

                  <Route path="/plans" element={<PlansPage />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/blog" element={<BlogPage />} />
                  <Route path="/login" element={<AuthPage mode="login" />} />
                  <Route path="/signup" element={<AuthPage mode="signup" />} />
                  <Route path="/onboarding" element={<OnboardingPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                </Routes>
              </PublicLayout>
            </div>
          } />
        </Routes>
        <Toaster position="top-center" richColors />
        </BrowserRouter>
      </SupportProvider>
    </AppContext.Provider>
  );
}

export default App;
