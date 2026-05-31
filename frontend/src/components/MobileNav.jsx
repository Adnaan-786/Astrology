import { Link, useLocation } from "react-router-dom";
import { Home, Sparkles, ShoppingBag, User, Sun } from "lucide-react";

const MobileNav = () => {
  const location = useLocation();
  
  const navItems = [
    { name: "Home", path: "/", icon: Home },
    { name: "Rashifal", path: "/rashifal", icon: Sun },
    { name: "AI", path: "/nakshatra-ai", icon: Sparkles },
    { name: "Store", path: "/cosmic-store", icon: ShoppingBag },
    { name: "Profile", path: "/dashboard", icon: User },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 mobile-nav" data-testid="mobile-bottom-nav">
      <div className="flex items-center justify-around py-2 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              data-testid={`mobile-nav-${item.name.toLowerCase()}`}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${
                isActive(item.path)
                  ? "text-cosmic-gold"
                  : "text-zinc-500"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive(item.path) ? 'scale-110' : ''} transition-transform`} />
              <span className="text-[10px] font-medium">{item.name}</span>
              {isActive(item.path) && (
                <span className="absolute bottom-1 w-1 h-1 bg-cosmic-gold rounded-full"></span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNav;
