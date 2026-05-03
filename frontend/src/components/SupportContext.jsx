import { createContext, useContext, useState, useCallback } from "react";
import { toast } from "sonner";
import SupportTicketModal from "@/components/SupportTicketModal";
import { Headset } from "lucide-react";

const SupportContext = createContext(null);

const getUser = () => {
  try {
    const raw = localStorage.getItem("astrovedic_user");
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};

export const SupportProvider = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null);

  const openSupport = useCallback(() => {
    const u = getUser();
    if (!u?.id) {
      toast.error("Please login to raise a support ticket", {
        description: "Your account details help us resolve your issue faster.",
        duration: 4000,
      });
      return;
    }
    setUser(u);
    setOpen(true);
  }, []);

  return (
    <SupportContext.Provider value={{ openSupport }}>
      {children}
      <SupportTicketModal open={open} onClose={() => setOpen(false)} user={user || {}} />
    </SupportContext.Provider>
  );
};

export const useSupport = () => {
  const ctx = useContext(SupportContext);
  if (!ctx) return { openSupport: () => {} };
  return ctx;
};

/* Floating support button — replaces the old WhatsApp float */
export const SupportFloatingButton = () => {
  const { openSupport } = useSupport();
  return (
    <button
      onClick={openSupport}
      aria-label="Raise support ticket"
      data-testid="support-float-btn"
      className="fixed right-4 bottom-24 lg:bottom-16 z-[70] group"
    >
      <span className="absolute right-16 top-1/2 -translate-y-1/2 whitespace-nowrap px-3 py-1.5 rounded-lg bg-[#0D0B1E] border border-[#D4A017]/40 text-white text-xs shadow-lg opacity-0 translate-x-2 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all">
        Need help? Raise a ticket
      </span>
      <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#D4A017] to-[#F5C842] text-[#0D0B1E] shadow-[0_8px_24px_rgba(212,160,23,0.45)] transition-transform group-hover:scale-110">
        <span className="absolute inset-0 rounded-full bg-[#D4A017] animate-ping opacity-25" />
        <Headset className="w-6 h-6 relative z-10" />
      </span>
    </button>
  );
};

export default SupportProvider;
