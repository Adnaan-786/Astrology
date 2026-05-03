import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import { Menu, X, Bell, Wallet, User, Star, Moon, Headset, LogOut, BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSupport } from "@/components/SupportContext";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { API } from "@/App";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const getUser = () => {
  try {
    const raw = localStorage.getItem("astrovedic_user");
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
};

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState(getUser);
  const [notifications, setNotifications] = useState([]);
  const [unreadIds, setUnreadIds] = useState(new Set());
  const location = useLocation();
  const navigate = useNavigate();
  const { openSupport } = useSupport();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Refresh user state on route change (in case localStorage was updated)
  useEffect(() => { setUser(getUser()); }, [location.pathname]);

  // Load notifications
  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`${API}/notifications`);
        const list = res.data || [];
        setNotifications(list);
        const seenRaw = localStorage.getItem("astrovedic_seen_notifs");
        const seen = seenRaw ? new Set(JSON.parse(seenRaw)) : new Set();
        setUnreadIds(new Set(list.map((n) => n.id).filter((id) => !seen.has(id))));
      } catch (e) { /* noop */ }
    })();
  }, []);

  const markAllRead = () => {
    const ids = notifications.map((n) => n.id);
    try { localStorage.setItem("astrovedic_seen_notifs", JSON.stringify(ids)); } catch (e) {}
    setUnreadIds(new Set());
    toast.success("All caught up ✓");
  };

  const logout = () => {
    try { localStorage.removeItem("astrovedic_user"); } catch (e) {}
    setUser(null);
    toast.success("Logged out");
    navigate("/");
  };

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Astrologers", path: "/astrologers" },
    { name: "NakshatraAI", path: "/nakshatra-ai" },
    { name: "Cosmic Store", path: "/cosmic-store" },
    { name: "Daily Rashifal", path: "/rashifal" },
    { name: "Plans", path: "/plans" },
    { name: "Blog", path: "/blog" },
  ];
  const isActive = (path) => location.pathname === path;

  const formatTime = (iso) => {
    if (!iso) return "";
    const t = new Date(iso);
    const diff = Math.max(0, Date.now() - t.getTime());
    const m = Math.floor(diff / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all ${
        scrolled
          ? "backdrop-blur-xl border-b shadow-md"
          : "border-b border-transparent"
      }`}
      style={{
        background: scrolled ? "hsl(var(--av-bg) / 0.85)" : "hsl(var(--av-bg) / 0.6)",
        borderBottomColor: scrolled ? "hsl(var(--av-border))" : "transparent",
      }}
      data-testid="navbar"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2" data-testid="logo-link">
            <div className="relative">
              <Moon className="w-8 h-8" style={{ color: "hsl(var(--av-gold))" }} />
              <Star className="w-4 h-4 absolute -top-1 -right-1" style={{ color: "hsl(var(--av-purple))" }} />
            </div>
            <div className="hidden sm:block">
              <h1 className="font-cinzel text-xl lg:text-2xl font-bold av-text">
                Astro<span style={{ color: "hsl(var(--av-gold))" }}>Vedic</span> AI
              </h1>
              <p className="text-[10px] av-text-3 -mt-1 tracking-wider">WHERE STARS MEET AI</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                data-testid={`nav-link-${link.name.toLowerCase().replace(/\s+/g, "-")}`}
                className={`px-3 py-2 rounded-full text-sm font-medium transition-all`}
                style={{
                  background: isActive(link.path) ? "hsl(var(--av-purple) / 0.15)" : "transparent",
                  color: isActive(link.path) ? "hsl(var(--av-gold))" : "hsl(var(--av-text-2))",
                }}
                onMouseEnter={(e) => { if (!isActive(link.path)) e.currentTarget.style.color = "hsl(var(--av-text))"; }}
                onMouseLeave={(e) => { if (!isActive(link.path)) e.currentTarget.style.color = "hsl(var(--av-text-2))"; }}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <AnimatedThemeToggler className="hover:bg-black/5 dark:hover:bg-white/5" />

            {/* Wallet (logged in) */}
            {user && (
              <Link
                to="/dashboard"
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors"
                style={{ background: "hsl(var(--av-surface))", borderColor: "hsl(var(--av-card-border))", color: "hsl(var(--av-gold))" }}
                data-testid="wallet-button"
              >
                <Wallet className="w-4 h-4" />
                ₹{user.wallet_balance ?? 0}
              </Link>
            )}

            {/* Support */}
            <button
              onClick={openSupport}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border hover:scale-105 transition-all"
              style={{ background: "hsl(var(--av-surface))", borderColor: "hsl(var(--av-gold) / 0.4)", color: "hsl(var(--av-gold))" }}
              data-testid="navbar-support-btn"
              title="Raise a support ticket"
            >
              <Headset className="w-4 h-4" /> Support
            </button>

            {/* Notifications - DropdownMenu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="relative p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors" data-testid="notifications-button" aria-label="Notifications">
                  <Bell className="w-5 h-5" style={{ color: "hsl(var(--av-text-2))" }} />
                  {unreadIds.size > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center bg-red-500 text-white">
                      {unreadIds.size > 9 ? "9+" : unreadIds.size}
                    </span>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-80 max-h-[480px] overflow-y-auto p-0 border"
                style={{ background: "hsl(var(--av-surface))", borderColor: "hsl(var(--av-card-border))" }}
                data-testid="notifications-panel"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "hsl(var(--av-card-border))" }}>
                  <div className="flex items-center gap-2">
                    <BellRing className="w-4 h-4" style={{ color: "hsl(var(--av-gold))" }} />
                    <span className="font-cinzel font-semibold av-text">Notifications</span>
                  </div>
                  {unreadIds.size > 0 && (
                    <button onClick={markAllRead} className="text-xs hover:underline" style={{ color: "hsl(var(--av-gold))" }} data-testid="notifications-mark-read">
                      Mark all as read
                    </button>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <div className="px-4 py-10 text-center av-text-3 text-sm">No notifications yet</div>
                ) : (
                  <ul className="divide-y" style={{ borderColor: "hsl(var(--av-card-border))" }}>
                    {notifications.map((n) => {
                      const isUnread = unreadIds.has(n.id);
                      return (
                        <li key={n.id} data-testid={`notification-item-${n.id}`}
                          className="px-4 py-3 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                          <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center"
                              style={{ background: "hsl(var(--av-gold) / 0.15)" }}>
                              <Star className="w-4 h-4" style={{ color: "hsl(var(--av-gold))" }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-sm font-semibold av-text truncate">{n.title}</p>
                                {isUnread && <span className="w-2 h-2 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />}
                              </div>
                              <p className="text-xs av-text-2 mt-0.5 line-clamp-2">{n.message}</p>
                              <p className="text-[10px] av-text-3 mt-1">{formatTime(n.created_at)}</p>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Profile / Login */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5" data-testid="profile-button">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#D4A017] to-[#8B5CF6] flex items-center justify-center text-white text-sm font-semibold">
                      {(user.name || "U").charAt(0).toUpperCase()}
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 border"
                  style={{ background: "hsl(var(--av-surface))", borderColor: "hsl(var(--av-card-border))" }}
                >
                  <div className="px-3 py-2 border-b" style={{ borderColor: "hsl(var(--av-card-border))" }}>
                    <p className="text-sm font-semibold av-text truncate">{user.name}</p>
                    <p className="text-xs av-text-3 truncate">{user.email}</p>
                  </div>
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard" className="cursor-pointer av-text">Dashboard</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard" className="cursor-pointer av-text">My Wallet</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/plans" className="cursor-pointer av-text">My Plan ({user.plan || "free"})</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-red-500 cursor-pointer" data-testid="logout-btn">
                    <LogOut className="w-4 h-4 mr-2" /> Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link to="/login" data-testid="navbar-login-btn">
                  <Button variant="outline" size="sm" className="rounded-full"
                    style={{ background: "transparent", borderColor: "hsl(var(--av-purple))", color: "hsl(var(--av-purple))" }}>
                    Sign In
                  </Button>
                </Link>
                <Link to="/signup" data-testid="navbar-signup-btn">
                  <Button size="sm" className="rounded-full font-semibold bg-gradient-to-r from-[#D4A017] to-[#F5C842] text-[#0D0B1E] hover:scale-[1.03] transition-transform">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile Menu */}
            <button
              className="lg:hidden p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              onClick={() => setIsOpen(!isOpen)}
              data-testid="mobile-menu-toggle"
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="w-6 h-6 av-text" /> : <Menu className="w-6 h-6 av-text" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="lg:hidden border-t" style={{ borderColor: "hsl(var(--av-card-border))", background: "hsl(var(--av-surface))" }} data-testid="mobile-menu">
          <div className="px-4 py-4 space-y-1.5">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className="block px-4 py-3 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: isActive(link.path) ? "hsl(var(--av-purple) / 0.18)" : "transparent",
                  color: isActive(link.path) ? "hsl(var(--av-gold))" : "hsl(var(--av-text))",
                }}
              >
                {link.name}
              </Link>
            ))}
            {!user && (
              <div className="grid grid-cols-2 gap-2 pt-3">
                <Link to="/login" onClick={() => setIsOpen(false)}>
                  <Button variant="outline" className="w-full rounded-full"
                    style={{ borderColor: "hsl(var(--av-purple))", color: "hsl(var(--av-purple))" }}>Sign In</Button>
                </Link>
                <Link to="/signup" onClick={() => setIsOpen(false)}>
                  <Button className="w-full rounded-full bg-gradient-to-r from-[#D4A017] to-[#F5C842] text-[#0D0B1E]">Get Started</Button>
                </Link>
              </div>
            )}
            <button onClick={() => { openSupport(); setIsOpen(false); }} className="w-full mt-2 flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium" style={{ color: "hsl(var(--av-gold))" }}>
              <Headset className="w-4 h-4" /> Support
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
