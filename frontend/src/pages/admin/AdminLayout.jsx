import { useState, useEffect, createContext, useContext } from "react";
import { useNavigate, useLocation, Outlet, Link } from "react-router-dom";
import apiClient from "@/lib/apiClient";
import { API } from "@/App";
import { logout as authLogout } from "@/lib/authService";
import { toast } from "sonner";
import {
  LayoutDashboard, Users, Star, Zap, Bot, Calendar, ShoppingBag,
  Package, FileText, Crown, Percent, Wallet, Image, Bell, MessageSquare,
  HeadphonesIcon, Settings, List, LogOut, Menu, X, ChevronDown,
  Moon, Sun, Shield, Lock, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Admin Context
const AdminContext = createContext(null);
export const useAdmin = () => useContext(AdminContext);

// Sidebar menu items
const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin/dashboard" },
  { icon: Users, label: "Users", path: "/admin/users" },
  { icon: Star, label: "Astrologers", path: "/admin/astrologers" },
  { icon: FileText, label: "Astrologer Applications", path: "/admin/astrologer-applications", badgeKey: "applications" },
  { icon: Zap, label: "Live Sessions", path: "/admin/sessions" },
  { icon: Bot, label: "AI Reports", path: "/admin/ai-reports" },
  { icon: Sparkles, label: "AI Report Plans", path: "/admin/report-types" },
  { icon: Calendar, label: "Daily Horoscope", path: "/admin/horoscope" },
  { icon: ShoppingBag, label: "Store & Products", path: "/admin/store" },
  { icon: Package, label: "Orders", path: "/admin/orders" },
  { icon: FileText, label: "Blog", path: "/admin/blog" },
  { icon: Crown, label: "Plans & Pricing", path: "/admin/plans" },
  { icon: Percent, label: "Coupons & Offers", path: "/admin/coupons" },
  { icon: Wallet, label: "Wallet & Finance", path: "/admin/finance" },
  { icon: Image, label: "Banners", path: "/admin/banners" },
  { icon: Bell, label: "Notifications", path: "/admin/notifications" },
  { icon: MessageSquare, label: "Reviews", path: "/admin/reviews" },
  { icon: HeadphonesIcon, label: "Support Tickets", path: "/admin/support" },
  { icon: Settings, label: "Site Settings", path: "/admin/settings" },
  { icon: List, label: "Audit Log", path: "/admin/audit" },
];

// Admin Layout Component
export const AdminLayout = () => {
  const [admin, setAdmin] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [pendingAppCount, setPendingAppCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  // Guard: check for valid JWT token + admin role
  useEffect(() => {
    let resolved = null;
    try {
      const token = localStorage.getItem("astrovedic_token");
      const adminAuth = JSON.parse(localStorage.getItem("admin_auth") || "null");
      const userAuth = JSON.parse(localStorage.getItem("astrovedic_user") || "null");
      const fixedEmail = "akshatsharma7730@gmail.com";
      
      if (!token) {
        navigate("/admin/login");
        return;
      }
      
      if (adminAuth) {
        resolved = adminAuth;
      } else if (userAuth && (userAuth.role === "admin" || userAuth.role === "SUPER_ADMIN" || (userAuth.email || "").toLowerCase() === fixedEmail)) {
        resolved = { ...userAuth, role: "admin" };
        try { localStorage.setItem("admin_auth", JSON.stringify(resolved)); } catch (_) {}
      }
    } catch (_) {}
    if (!resolved) {
      navigate("/admin/login");
      return;
    }
    setAdmin({
      id: resolved.id || "admin_001",
      name: resolved.name || "Admin",
      role: resolved.role || "admin",
      email: resolved.email || "admin@astrovedic.ai",
    });
  }, [navigate]);

  // Fetch pending applications count for sidebar badge
  useEffect(() => {
    if (!admin) return;
    let cancelled = false;
    const load = async () => {
      try {
        const res = await apiClient.get(`${API}/admin/astrologer-applications?status=pending`);
        if (!cancelled) setPendingAppCount(res.data?.counts?.pending || 0);
      } catch (_) {}
    };
    load();
    const t = setInterval(load, 30000);
    return () => { cancelled = true; clearInterval(t); };
  }, [admin, location.pathname]);

  const handleLogout = async () => {
    await authLogout();
    navigate("/admin/login");
    toast.success("Logged out successfully");
  };

  if (!admin) return null;

  return (
    <AdminContext.Provider value={{ admin, setAdmin }}>
      <div className={`min-h-screen flex ${darkMode ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'}`}>
        {/* Sidebar */}
        <aside 
          className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-slate-950 border-r border-slate-800 transition-all duration-300 ${
            sidebarOpen ? 'w-64' : 'w-20'
          }`}
        >
          {/* Logo */}
          <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-800">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
              <Shield className="w-6 h-6 text-white" />
            </div>
            {sidebarOpen && (
              <div>
                <h1 className="font-bold text-white">AstroVedic AI</h1>
                <p className="text-xs text-slate-400">Admin Panel</p>
              </div>
            )}
          </div>

          {/* Admin Info */}
          {sidebarOpen && (
            <div className="px-4 py-3 border-b border-slate-800">
              <p className="text-sm font-medium text-white">{admin.name}</p>
              <Badge className="mt-1 bg-purple-600/20 text-purple-400 text-xs">{admin.role}</Badge>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-2">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              const showBadge = item.badgeKey === "applications" && pendingAppCount > 0;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors ${
                    isActive 
                      ? 'bg-purple-600 text-white' 
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                  title={!sidebarOpen ? item.label : undefined}
                  data-testid={`admin-menu-${item.path.split('/').pop()}`}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {sidebarOpen && (
                    <span className="text-sm flex-1 flex items-center justify-between">
                      <span>{item.label}</span>
                      {showBadge && (
                        <span className="bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                          {pendingAppCount}
                        </span>
                      )}
                    </span>
                  )}
                  {!sidebarOpen && showBadge && (
                    <span className="absolute left-10 -top-1 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                      {pendingAppCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-slate-800">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              {sidebarOpen && <span className="text-sm">Logout</span>}
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <div className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-20'} transition-all duration-300`}>
          {/* Top Bar */}
          <header className={`sticky top-0 z-40 flex items-center justify-between px-6 py-4 border-b ${
            darkMode ? 'bg-slate-900/95 border-slate-800' : 'bg-white/95 border-slate-200'
          } backdrop-blur-sm`}>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              
              <Link to="/" target="_blank" className="text-sm text-purple-400 hover:underline">
                View Site →
              </Link>
            </div>
          </header>

          {/* Page Content */}
          <main className="p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </AdminContext.Provider>
  );
};

// Admin Login Page
export const AdminLoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await apiClient.post('/admin/login', { email, password });
      // Store JWT token and admin data
      if (response.data.token) {
        localStorage.setItem('astrovedic_token', response.data.token);
      }
      localStorage.setItem('admin_auth', JSON.stringify(response.data.admin));
      localStorage.setItem('astrovedic_user', JSON.stringify({ ...response.data.admin, role: 'admin' }));
      toast.success("Login successful!");
      navigate("/admin/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-cinzel text-2xl font-bold text-white">AstroVedic AI</h1>
          <p className="text-slate-400">Admin Panel Login</p>
        </div>

        {/* Login Form */}
        <div className="bg-slate-900 rounded-2xl p-8 border border-slate-800">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin123@gmail.com"
                className="bg-slate-800 border-slate-700 text-white"
                required
                data-testid="admin-email-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="bg-slate-800 border-slate-700 text-white"
                required
                data-testid="admin-password-input"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-purple-600 hover:bg-purple-700"
              disabled={loading}
              data-testid="admin-login-btn"
            >
              {loading ? "Logging in..." : "Login to Admin Panel"}
            </Button>
          </form>

          {/* Admin Credentials Info */}
          <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-400">Admin Login</p>
                <p className="text-xs text-amber-400/80 mt-1">
                  Email: <code className="bg-slate-800 px-1 rounded">akshatsharma7730@gmail.com</code>
                </p>
                <p className="text-xs text-slate-500 mt-2">Contact the admin for password.</p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-500 mt-6">
          <Link to="/" className="text-purple-400 hover:underline">← Back to Website</Link>
        </p>
      </div>
    </div>
  );
};

export default AdminLayout;
