import { useState, useEffect, useRef } from "react";
import apiClient from "@/lib/apiClient";

import { Link, useLocation } from "react-router-dom";
import { toast } from "sonner";
import jsPDF from "jspdf";
import {
  Sparkles, Send, Loader2, Lock, Star, FileText, Trash2,
  Download, Share2, ArrowLeft, Wallet, CalendarDays, Clock,
  MapPin, User, Users, Crown, Scroll, Gem, FileDown, Heart,
  Briefcase, HeartPulse, Home as HomeIcon, Baby, Orbit, Calendar,
  PieChart, Mail
} from "lucide-react";
import { RashiIcon } from "@/components/ZodiacIcons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";

// ----- Helpers -----
const getUser = () => {
  try {
    const raw = localStorage.getItem("astrovedic_user");
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
};
const getUserPlan = () => (getUser()?.plan || "free").toLowerCase();
const isLoggedIn = () => !!getUser();
const isPaid = () => ["silver", "gold", "platinum"].includes(getUserPlan());

// ----- Report catalogue (fallback when API unavailable) -----
const ICON_MAP = {
  Scroll, Gem, FileDown, Heart, Briefcase, HeartPulse,
  Wallet, Home: HomeIcon, Calendar, Orbit, Baby, Sparkles,
};

const FALLBACK_REPORT_TYPES = [
  { id: "kundli-basic",     name: "Janam Kundli Basic",   desc: "Quick overview of your chart",        price: 0,   Icon: Scroll,      color: "#F5C842", free: true },
  { id: "kundli-detailed",  name: "Janam Kundli Detailed",desc: "Full 10-section deep analysis",       price: 99,  Icon: Gem,         color: "#3FB0FF" },
  { id: "kundli-premium",   name: "Premium PDF Report",   desc: "14-section extensive forecast",       price: 299, Icon: FileDown,    color: "#E879F9" },
  { id: "compatibility",    name: "Love Compatibility",   desc: "Marriage compatibility (36 gunas)",   price: 149, Icon: Heart,       color: "#EF4444", needsPartner: true },
  { id: "career",           name: "Career & Wealth",      desc: "Professional guidance & timing",      price: 199, Icon: Briefcase,   color: "#D4A017" },
  { id: "health",           name: "Health Outlook",       desc: "Wellness predictions & remedies",     price: 149, Icon: HeartPulse,  color: "#22C55E" },
  { id: "finance",          name: "Finance Report",       desc: "Wealth yogas & investment periods",   price: 199, Icon: Wallet,      color: "#10B981" },
  { id: "vastu",            name: "Vastu Report",         desc: "Home & office energy guidance",       price: 249, Icon: HomeIcon,    color: "#F59E0B" },
  { id: "annual",           name: "Annual Forecast",      desc: "Month-by-month for next 12 months",   price: 299, Icon: Calendar,    color: "#8B5CF6" },
  { id: "sade-sati",        name: "Sade Sati Analysis",   desc: "7.5 yr Shani period deep dive",       price: 149, Icon: Orbit,       color: "#6366F1" },
  { id: "child-birth",      name: "Child Birth Report",   desc: "Progeny & parenting guidance",        price: 199, Icon: Baby,        color: "#F472B6" },
];

// Hook: returns report types from backend (admin-managed). Falls back to
// the static list above if the API is unreachable. Keeps the rest of the
// page working without any prop drilling.
const useReportTypes = () => {
  const [types, setTypes] = useState(FALLBACK_REPORT_TYPES);
  useEffect(() => {
    let mounted = true;
    apiClient.get(`/report-types`)
      .then((res) => {
        if (!mounted || !Array.isArray(res.data) || res.data.length === 0) return;
        const mapped = res.data.map((rt) => ({
          id: rt.slug,
          name: rt.name,
          desc: rt.desc || "",
          price: Number(rt.price) || 0,
          Icon: ICON_MAP[rt.icon] || Scroll,
          color: rt.color || "#8B5CF6",
          free: !!rt.free || Number(rt.price) === 0,
          needsPartner: !!rt.needs_partner,
        }));
        setTypes(mapped);
      })
      .catch(() => { /* keep fallback */ });
    return () => { mounted = false; };
  }, []);
  return types;
};

// Hook: returns the user's AI report usage this month (limit, used, remaining, allowed types)
const useReportUsage = () => {
  const [usage, setUsage] = useState(null);
  const refresh = () => {
    if (!isLoggedIn()) return;
    apiClient.get("/ai/report-usage")
      .then((res) => setUsage(res.data))
      .catch(() => {});
  };
  useEffect(() => { refresh(); }, []);
  return { usage, refresh };
};

// Static alias kept for any legacy references; new code MUST use useReportTypes().
const REPORT_TYPES = FALLBACK_REPORT_TYPES;

// ----- Sample conversation (for lock preview) -----
const SAMPLE_CONVO = [
  { role: "user",      content: "What does my birth chart say about my career?" },
  { role: "assistant", content: "Pranam Ji 🙏 Based on your Lagna and the 10th house placement, your career graph shows strong leadership potential. Saturn's current dasha favours structured growth..." },
  { role: "user",      content: "Which gemstone should I wear?" },
  { role: "assistant", content: "Wearing Yellow Sapphire (Pukhraj) during Guru's mahadasha will amplify wisdom and wealth. Prefer Thursday mornings for first-wearing, after a Laxmi puja..." },
];

// ==================== LOCKED CHAT OVERLAY ====================
const LockedChatState = ({ onOpenPlans }) => {
  const logged = isLoggedIn();

  return (
    <div className="relative rounded-2xl overflow-hidden border border-[#2D1B69] bg-[#1A1730]" data-testid="chat-locked-state">
      {/* Blurred sample conversation behind */}
      <div className="p-4 sm:p-6 space-y-3 blur-[5px] select-none pointer-events-none">
        {SAMPLE_CONVO.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-2xl p-3 ${
              m.role === "user"
                ? "bg-gradient-to-br from-[#2D1B69] to-[#8B5CF6] text-white"
                : "bg-[#231F3A] text-white/90 border border-[#8B5CF6]/30"
            }`}>
              <p className="text-sm">{m.content}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 bg-[#0D0B1E]/80 backdrop-blur-sm flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-[#D4A017] to-[#F5C842] flex items-center justify-center mb-5 shadow-[0_0_40px_rgba(212,160,23,0.35)]">
            <Lock className="w-9 h-9 text-[#0D0B1E]" />
          </div>
          {!logged ? (
            <>
              <h3 className="font-cinzel text-2xl font-bold text-white mb-2">Login to access NakshatraAI</h3>
              <p className="text-zinc-300 text-sm mb-6">Sign in to unlock your AI-powered Vedic astrology guide.</p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Button className="btn-gold px-6 py-5 rounded-full" data-testid="locked-login-btn">Login</Button>
                <Button variant="outline" className="px-6 py-5 rounded-full border-[#8B5CF6] text-[#8B5CF6] hover:bg-[#8B5CF6]/10" data-testid="locked-signup-btn">Sign Up</Button>
              </div>
            </>
          ) : (
            <>
              <h3 className="font-cinzel text-2xl font-bold text-white mb-2">AI Chat is available on paid plans</h3>
              <p className="text-zinc-300 text-sm mb-6">
                Upgrade to <span className="text-[#F5C842] font-semibold">Tara Silver</span> (₹199/month) or higher to unlock unlimited AI astrology guidance.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Button className="btn-gold px-6 py-5 rounded-full" onClick={onOpenPlans} data-testid="locked-view-plans-btn">
                  View Plans
                </Button>
                <Link to="/dashboard">
                  <Button variant="outline" className="px-6 py-5 rounded-full border-[#8B5CF6] text-[#8B5CF6] hover:bg-[#8B5CF6]/10" data-testid="locked-recharge-btn">
                    <Wallet className="w-4 h-4 mr-2" /> Recharge Wallet
                  </Button>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ==================== UPSELL MODAL ====================
const UpsellModal = ({ open, onClose }) => {
  const PLANS = [
    { slug: "silver",   name: "Tara Silver",      price: 199, tag: "Starter",  color: "#9CA3AF" },
    { slug: "gold",     name: "Graha Gold",       price: 499, tag: "Popular",  color: "#D4A017", featured: true },
    { slug: "platinum", name: "Jyotish Platinum", price: 999, tag: "Ultimate", color: "#8B5CF6" },
  ];
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-[#0D0B1E] border-[#2D1B69] max-w-2xl" data-testid="upsell-modal">
        <DialogHeader>
          <DialogTitle className="font-cinzel text-2xl text-white text-center">
            Unlock <span className="text-gradient-gold">NakshatraAI</span> Chat
          </DialogTitle>
          <DialogDescription className="text-zinc-300 text-center">
            AI-powered Vedic astrology guidance is available exclusively for our members.
          </DialogDescription>
        </DialogHeader>
        <div className="grid sm:grid-cols-3 gap-4 mt-4">
          {PLANS.map((p) => (
            <div
              key={p.slug}
              className={`relative rounded-2xl p-5 border-2 text-center ${
                p.featured ? "border-[#D4A017] bg-[#1A1730]" : "border-[#2D1B69] bg-[#1A1730]/60"
              }`}
              data-testid={`upsell-plan-${p.slug}`}
            >
              {p.featured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#D4A017] text-[#0D0B1E] text-[10px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full">
                  Most Popular
                </span>
              )}
              <h4 className="font-cinzel text-lg text-white">{p.name}</h4>
              <p className="text-[#F5C842] font-bold text-2xl mt-2">₹{p.price}<span className="text-xs text-zinc-400">/mo</span></p>
              <Link to="/plans" onClick={onClose}>
                <Button className="w-full mt-4 btn-gold rounded-full" data-testid={`upsell-choose-${p.slug}`}>
                  Choose {p.name.split(" ")[1]}
                </Button>
              </Link>
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-zinc-400 mt-4">
          Already have a plan? <button className="text-[#F5C842] hover:underline" data-testid="upsell-login-link">Login to your account</button>
        </p>
      </DialogContent>
    </Dialog>
  );
};

// ==================== CHAT ====================
const AIChat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`);
  const [chatUsage, setChatUsage] = useState(null);
  const endRef = useRef(null);
  const user = getUser() || {};

  const fetchChatUsage = async () => {
    if (!isLoggedIn()) return;
    try {
      const res = await apiClient.get("/ai/chat-usage");
      setChatUsage(res.data);
    } catch {
      // silently fail
    }
  };

  useEffect(() => {
    setMessages([{
      role: "assistant",
      content: "Namaste! 🙏 I am NakshatraAI, your Vedic astrology guide.\n\nShare your Date of Birth, Time of Birth, and Place of Birth for personalised insights, or ask me anything about Kundli, Dasha, gemstones, muhurta & more.",
      ts: new Date().toISOString(),
    }]);
    fetchChatUsage();
  }, []);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setMessages((m) => [...m, { role: "user", content: text, ts: new Date().toISOString() }]);
    setInput("");
    setLoading(true);
    try {
      const res = await apiClient.post(`/ai/chat`, {
        session_id: sessionId,
        message: text,
      });
      setMessages((m) => [...m, { role: "assistant", content: res.data.response, ts: new Date().toISOString() }]);
      // Refresh usage after successful send
      fetchChatUsage();
    } catch (e) {
      const detail = e?.response?.data?.detail;
      const msg = detail?.message || "Something went wrong. Please try again.";
      toast.error(msg);
      // Refresh usage on limit error too
      if (e?.response?.status === 429) fetchChatUsage();
    } finally {
      setLoading(false);
    }
  };

  const suggested = [
    "What does my Sun sign say about me?",
    "How to find my lucky gemstone?",
    "What is Mangal Dosha?",
    "Best muhurta for marriage?",
  ];

  const usageLabel = (() => {
    if (!chatUsage) return null;
    if (chatUsage.unlimited) return "Unlimited messages";
    const periodMap = { day: "today", month: "this month", lifetime: "total" };
    return `${chatUsage.remaining} of ${chatUsage.limit} messages left ${periodMap[chatUsage.period] || "today"}`;
  })();

  return (
    <Card className="glass border-[#2D1B69] overflow-hidden" data-testid="paid-chat-container">
      <CardContent className="p-0">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D4A017] to-[#8B5CF6] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white">NakshatraAI</h3>
              <p className="text-xs text-emerald-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Online
              </p>
            </div>
          </div>
          <Badge className="bg-[#D4A017]/15 text-[#F5C842] border border-[#D4A017]/30 capitalize">
            <Crown className="w-3 h-3 mr-1" /> {user.plan || "silver"}
          </Badge>
        </div>

        <ScrollArea className="h-[420px] sm:h-[500px] p-4">
          <div className="space-y-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`} data-testid={`chat-msg-${i}`}>
                <div className={`max-w-[85%] p-3.5 rounded-2xl ${
                  m.role === "user"
                    ? "bg-gradient-to-br from-[#2D1B69] to-[#8B5CF6] rounded-br-sm text-white"
                    : "bg-[#231F3A] border border-[#8B5CF6]/25 rounded-bl-sm text-white"
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                  <p className="text-[10px] text-zinc-500 mt-1.5">
                    {new Date(m.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-[#231F3A] border border-[#8B5CF6]/25 rounded-2xl rounded-bl-sm p-3.5 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-[#F5C842] animate-spin" />
                  <span className="text-sm text-zinc-300">NakshatraAI is thinking…</span>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>
        </ScrollArea>

        {messages.length <= 1 && (
          <div className="px-4 py-3 border-t border-white/10">
            <p className="text-xs text-zinc-400 mb-2">Try asking:</p>
            <div className="flex flex-wrap gap-2">
              {suggested.map((q, i) => (
                <Button key={i} size="sm" variant="outline"
                  className="text-xs border-[#8B5CF6]/30 hover:bg-[#8B5CF6]/15 rounded-full"
                  onClick={() => setInput(q)} data-testid={`chat-suggest-${i}`}>
                  {q}
                </Button>
              ))}
            </div>
          </div>
        )}

        <div className="p-4 border-t border-white/10">
          {usageLabel && (
            <p className={`text-[11px] mb-2 text-center ${
              chatUsage && !chatUsage.unlimited && chatUsage.remaining <= 2
                ? "text-amber-400"
                : "text-zinc-500"
            }`}>
              {usageLabel}
            </p>
          )}
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Ask about your kundli, career, relationships..."
              disabled={loading}
              className="flex-1 bg-[#231F3A] border-[#2D1B69] focus:border-[#D4A017] text-white"
              data-testid="chat-input"
            />
            <Button onClick={send} disabled={!input.trim() || loading} className="btn-gold px-5 rounded-full" data-testid="chat-send-btn">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// ==================== REPORT FLOW ====================
const LOADING_MESSAGES = [
  "Calculating planetary positions...",
  "Analysing birth chart...",
  "Consulting ancient texts...",
  "Preparing your report...",
];

const ReportFlow = () => {
  const [step, setStep] = useState(1); // 1: select, 2: form, 3: loading, 4: display
  const [selectedType, setSelectedType] = useState(null);
  const reportTypes = useReportTypes();
  const { usage: reportUsage, refresh: refreshUsage } = useReportUsage();
  const [form, setForm] = useState({
    birthName: "", dob: "", tob: "", pob: "",
    partnerName: "", partnerDob: "",
    email: "", // Email for guest checkout receipt
  });
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [reportText, setReportText] = useState("");
  const [reportMeta, setReportMeta] = useState(null);
  const reportBoxRef = useRef(null);

  // Determine if a report will be free (covered by plan)
  const isReportFreeWithPlan = () => {
    if (!reportUsage || !isLoggedIn()) return false;
    if (reportUsage.unlimited) return true;
    return reportUsage.remaining > 0;
  };

  // Get effective price for display
  const getEffectivePrice = (basePrice) => {
    if (isReportFreeWithPlan() && basePrice > 0) return 0;
    return basePrice;
  };

  useEffect(() => {
    if (step !== 3) return;
    const t = setInterval(() => setLoadingMsgIdx((i) => (i + 1) % LOADING_MESSAGES.length), 1500);
    return () => clearInterval(t);
  }, [step]);

  const pickType = (t) => {
    setSelectedType(t);
    setStep(2);
  };

  const submitForm = async (e) => {
    e.preventDefault();
    if (!form.birthName || !form.dob || !form.pob) {
      toast.error("Please fill name, date & place of birth");
      return;
    }
    if (selectedType.needsPartner && (!form.partnerName || !form.partnerDob)) {
      toast.error("Please fill partner details");
      return;
    }

    const effectivePrice = getEffectivePrice(selectedType.price);
    const isGuestPaid = !isLoggedIn() && effectivePrice > 0;

    if (isGuestPaid && !form.email) {
      toast.error("Please enter your email for the receipt");
      return;
    }

    // Guest Paid Flow via Razorpay
    if (isGuestPaid) {
      try {
        setStep(3); // Show loading
        // 1. Create Guest Order
        const { data: orderData } = await apiClient.post(`/guest/report/create-order`, {
          reportType: selectedType.id,
          email: form.email,
        });

        // Open Razorpay
        const options = {
          key: "rzp_live_SxaIbfgFZqYfom", // Or inject via env
          amount: orderData.amount,
          currency: orderData.currency,
          name: "AstroVedic AI",
          description: `AI Report: ${selectedType.name}`,
          order_id: orderData.order_id,
          handler: async function (response) {
            try {
              setStep(3); // ensure loading is shown
              // 2. Verify and Generate
              const { data: reportData } = await apiClient.post(`/guest/report/verify-and-generate`, {
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                generation_token: orderData.generation_token,
                reportType: selectedType.id,
                birthName: form.birthName,
                dob: form.dob,
                tob: form.tob,
                pob: form.pob,
                partnerName: form.partnerName,
                partnerDob: form.partnerDob,
                email: form.email
              }, { timeout: 120000 });
              
              setReportText(reportData.report);
              setReportMeta({ type: selectedType.name, price: effectivePrice, isPlanFree: false, at: new Date().toISOString() });
              setStep(4);
              toast.success("Payment successful! Report generated ✓");
            } catch (err) {
              const detail = err?.response?.data?.detail;
              toast.error(typeof detail === "string" ? detail : "Report generation failed after payment. Please contact support.");
              setStep(2);
            }
          },
          prefill: {
            name: form.birthName,
            email: form.email,
          },
          theme: { color: "#8B5CF6" },
          modal: {
            ondismiss: function() {
              toast.error("Payment cancelled");
              setStep(2);
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (response){
          toast.error("Payment failed: " + response.error.description);
          setStep(2);
        });
        rzp.open();
      } catch (err) {
        toast.error(err?.response?.data?.detail || "Failed to initiate payment");
        setStep(2);
      }
      return;
    }

    // Existing Logged-in or Guest Free Flow
    setStep(3);
    try {
      const res = await apiClient.post(`/ai/report`, {
        reportType: selectedType.id,
        birthName: form.birthName,
        dob: form.dob,
        tob: form.tob,
        pob: form.pob,
        partnerName: form.partnerName,
        partnerDob: form.partnerDob,
      }, { timeout: 120000 });
      setReportText(res.data.report);
      setReportMeta({ type: selectedType.name, price: res.data.price, isPlanFree: res.data.isPlanFree, at: res.data.generatedAt });
      setStep(4);
      refreshUsage(); // Refresh usage counter after generating
      toast.success(res.data.isPlanFree ? "Report generated (free with your plan) ✓" : "Report generated ✓");
    } catch (err) {
      const detail = err?.response?.data?.detail;
      const msg = typeof detail === "string" ? detail : (detail?.message || "Failed to generate report. Try again.");
      toast.error(msg);
      setStep(2);
    }
  };

  const downloadPDF = () => {
    if (!reportText) return;
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 48;
    const maxW = pageW - margin * 2;
    let y = margin;

    // Header band
    doc.setFillColor(13, 11, 30);
    doc.rect(0, 0, pageW, 110, "F");
    doc.setTextColor(245, 200, 66);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("AstroVedic AI", margin, 50);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(230, 230, 240);
    doc.setFontSize(11);
    doc.text("Where Ancient Stars Meet Artificial Intelligence", margin, 72);
    doc.setFontSize(10);
    doc.setTextColor(200, 200, 220);
    doc.text(`${selectedType.name}  •  For: ${form.birthName}`, margin, 92);
    y = 140;

    // Body
    doc.setTextColor(25, 25, 35);
    doc.setFontSize(11);
    const lines = reportText.split("\n");
    lines.forEach((line) => {
      let text = line;
      let fontStyle = "normal";
      let fontSize = 11;
      let color = [40, 40, 55];

      if (/^###\s+/.test(line)) { text = line.replace(/^###\s+/, ""); fontStyle = "bold"; fontSize = 12; color = [80, 40, 130]; }
      else if (/^##\s+/.test(line)) { text = line.replace(/^##\s+/, ""); fontStyle = "bold"; fontSize = 14; color = [115, 75, 15]; }
      else if (/^#\s+/.test(line)) { text = line.replace(/^#\s+/, ""); fontStyle = "bold"; fontSize = 16; color = [115, 75, 15]; }
      text = text.replace(/\*\*(.*?)\*\*/g, "$1");

      doc.setFont("helvetica", fontStyle);
      doc.setFontSize(fontSize);
      doc.setTextColor(...color);

      const wrapped = doc.splitTextToSize(text || " ", maxW);
      wrapped.forEach((w) => {
        if (y > pageH - 60) { doc.addPage(); y = margin; }
        doc.text(w, margin, y);
        y += fontSize + 4;
      });
      if (line.trim() === "") y += 4;
    });

    // Footer
    const pages = doc.internal.getNumberOfPages();
    for (let p = 1; p <= pages; p++) {
      doc.setPage(p);
      doc.setDrawColor(212, 160, 23);
      doc.line(margin, pageH - 40, pageW - margin, pageH - 40);
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.setTextColor(120, 120, 140);
      doc.text(`Generated by AstroVedic AI  •  Page ${p} of ${pages}`, margin, pageH - 22);
      doc.text(new Date().toLocaleDateString(), pageW - margin, pageH - 22, { align: "right" });
    }

    const safe = form.birthName.replace(/\s+/g, "_");
    doc.save(`AstroVedic_${selectedType.id}_${safe}.pdf`);
    toast.success("Downloaded ✓");
  };

  const share = async () => {
    const shareText = `Check out my ${selectedType.name} from AstroVedic AI! 🔮\n\n${window.location.href}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "My Vedic Report - AstroVedic AI", text: shareText });
      } else {
        await navigator.clipboard.writeText(shareText);
        toast.success("Link copied to clipboard ✓");
      }
    } catch (e) { /* user cancelled */ }
  };

  // --- Renders ---
  if (step === 1) {
    const planFree = isReportFreeWithPlan();
    return (
      <div data-testid="report-step-select">
        <div className="text-center mb-8">
          <h2 className="font-cinzel text-2xl sm:text-3xl font-bold text-white mb-2">
            AI-Generated <span className="text-gradient-gold">Vedic Reports</span>
          </h2>
          <p className="text-zinc-400">Choose a report. Get a detailed, personalised analysis in seconds.</p>
        </div>

        {/* Report Usage Banner */}
        {isLoggedIn() && reportUsage && (
          <div className="mb-6 mx-auto max-w-xl">
            <div className="rounded-2xl border border-[#2D1B69] bg-[#1A1730]/80 p-4 text-center">
              <p className="text-sm text-zinc-300">
                {reportUsage.unlimited ? (
                  <><Crown className="w-4 h-4 inline mr-1 text-[#F5C842]" /> <span className="text-[#F5C842] font-semibold">Unlimited</span> tokens with your <span className="text-[#F5C842]">{reportUsage.plan_name}</span> plan</>
                ) : reportUsage.limit > 0 ? (
                  <><FileText className="w-4 h-4 inline mr-1 text-[#F5C842]" /> <span className="text-[#F5C842] font-semibold">{reportUsage.remaining}</span> of {reportUsage.limit} tokens remaining this month</>
                ) : (
                  <><Wallet className="w-4 h-4 inline mr-1 text-zinc-400" /> Out of tokens. Reports will be charged from your wallet. <Link to="/plans" className="text-[#F5C842] hover:underline">Upgrade for tokens →</Link></>
                )}
              </p>
            </div>
          </div>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {reportTypes.map((r) => {
            const effectivePrice = getEffectivePrice(r.price);
            return (
              <button
                key={r.id}
                onClick={() => pickType(r)}
                className="cosmic-card rounded-2xl p-5 text-left transition-all group hover:border-[#D4A017]/60"
                data-testid={`report-card-${r.id}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ background: `${r.color}1F`, border: `1px solid ${r.color}55` }}
                  >
                    <r.Icon className="w-6 h-6" style={{ color: r.color }} />
                  </div>
                  {r.free || effectivePrice === 0 ? (
                    <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      {r.free ? "FREE" : "1 Token"}
                    </Badge>
                  ) : (
                    <Badge className="bg-[#D4A017]/15 text-[#F5C842] border border-[#D4A017]/30">₹{r.price}</Badge>
                  )}
                </div>
                <h3 className="font-cinzel font-semibold text-white text-lg mb-1">{r.name}</h3>
                <p className="text-xs text-zinc-400 line-clamp-2">{r.desc}</p>
                <p className="mt-3 text-[#F5C842] text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                  Generate Report →
                </p>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="max-w-xl mx-auto" data-testid="report-step-form">
        <button onClick={() => setStep(1)} className="mb-4 text-sm text-[#9B96C0] hover:text-white flex items-center gap-2" data-testid="report-back-btn">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="cosmic-card rounded-2xl p-6 sm:p-8">
          <div className="flex items-start gap-3 mb-6">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${selectedType.color}1F`, border: `1px solid ${selectedType.color}55` }}
            >
              <selectedType.Icon className="w-6 h-6" style={{ color: selectedType.color }} />
            </div>
            <div>
              <h3 className="font-cinzel text-xl font-bold text-white">{selectedType.name}</h3>
              <p className="text-xs text-zinc-400">{selectedType.desc}</p>
              {(() => {
                const ep = getEffectivePrice(selectedType.price);
                if (selectedType.price === 0) return <Badge className="mt-2 bg-emerald-500/20 text-emerald-400">FREE</Badge>;
                if (ep === 0) return <Badge className="mt-2 bg-emerald-500/20 text-emerald-400">FREE ✦ Included in plan</Badge>;
                return <Badge className="mt-2 bg-[#D4A017]/15 text-[#F5C842]">₹{selectedType.price}</Badge>;
              })()}
            </div>
          </div>
          <form onSubmit={submitForm} className="space-y-4">
            <div>
              <label className="text-sm text-zinc-300 mb-1.5 flex items-center gap-2"><User className="w-4 h-4" /> Full Name *</label>
              <Input data-testid="report-form-name" value={form.birthName}
                onChange={(e) => setForm((p) => ({ ...p, birthName: e.target.value }))}
                className="bg-[#231F3A] border-[#2D1B69] text-white" required />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-zinc-300 mb-1.5 flex items-center gap-2"><CalendarDays className="w-4 h-4" /> Date of Birth *</label>
                <Input type="date" data-testid="report-form-dob" value={form.dob}
                  onChange={(e) => setForm((p) => ({ ...p, dob: e.target.value }))}
                  className="bg-[#231F3A] border-[#2D1B69] text-white" required />
              </div>
              <div>
                <label className="text-sm text-zinc-300 mb-1.5 flex items-center gap-2"><Clock className="w-4 h-4" /> Time of Birth</label>
                <Input type="time" data-testid="report-form-tob" value={form.tob}
                  onChange={(e) => setForm((p) => ({ ...p, tob: e.target.value }))}
                  className="bg-[#231F3A] border-[#2D1B69] text-white" />
                <p className="text-[11px] text-zinc-500 mt-1">Optional but increases accuracy</p>
              </div>
            </div>
            <div>
              <label className="text-sm text-zinc-300 mb-1.5 flex items-center gap-2"><MapPin className="w-4 h-4" /> Place of Birth *</label>
              <Input placeholder="City, State" data-testid="report-form-pob" value={form.pob}
                onChange={(e) => setForm((p) => ({ ...p, pob: e.target.value }))}
                className="bg-[#231F3A] border-[#2D1B69] text-white" required />
            </div>

            {selectedType.needsPartner && (
              <div className="pt-3 mt-3 border-t border-[#2D1B69] space-y-4">
                <p className="text-sm text-[#F5C842] font-medium flex items-center gap-2"><Users className="w-4 h-4" /> Partner's Details</p>
                <div>
                  <label className="text-sm text-zinc-300 mb-1.5 block">Partner's Full Name *</label>
                  <Input data-testid="report-form-partner-name" value={form.partnerName}
                    onChange={(e) => setForm((p) => ({ ...p, partnerName: e.target.value }))}
                    className="bg-[#231F3A] border-[#2D1B69] text-white" required={selectedType.needsPartner} />
                </div>
                <div>
                  <label className="text-sm text-zinc-300 mb-1.5 block">Partner's Date of Birth *</label>
                  <Input type="date" data-testid="report-form-partner-dob" value={form.partnerDob}
                    onChange={(e) => setForm((p) => ({ ...p, partnerDob: e.target.value }))}
                    className="bg-[#231F3A] border-[#2D1B69] text-white" required={selectedType.needsPartner} />
                </div>
              </div>
            )}

            {!isLoggedIn() && getEffectivePrice(selectedType.price) > 0 && (
              <div className="pt-3 mt-3 border-t border-[#2D1B69] space-y-4">
                <p className="text-sm text-[#F5C842] font-medium flex items-center gap-2"><Mail className="w-4 h-4" /> Contact Information</p>
                <div>
                  <label className="text-sm text-zinc-300 mb-1.5 block">Email Address (for receipt) *</label>
                  <Input type="email" placeholder="you@example.com" data-testid="report-form-email" value={form.email}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                    className="bg-[#231F3A] border-[#2D1B69] text-white" required />
                </div>
              </div>
            )}

            <Button type="submit" className="btn-gold w-full py-6 text-base rounded-full" data-testid="report-generate-btn">
              <Sparkles className="w-5 h-5 mr-2" /> {!isLoggedIn() && getEffectivePrice(selectedType.price) > 0 ? "Pay" : "Generate Report"} {getEffectivePrice(selectedType.price) > 0 && `• ₹${selectedType.price}`}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="max-w-md mx-auto text-center py-16" data-testid="report-step-loading">
        <div className="relative w-32 h-32 mx-auto mb-8">
          <div className="absolute inset-0 rounded-full border-2 border-[#8B5CF6]/30" />
          <div className="absolute inset-0 rounded-full border-t-2 border-[#D4A017] animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Star className="w-12 h-12 text-[#F5C842] animate-pulse" />
          </div>
        </div>
        <h3 className="font-cinzel text-2xl text-white mb-3">Generating your report</h3>
        <p className="text-[#F5C842] text-sm animate-pulse" data-testid="report-loading-msg">
          {LOADING_MESSAGES[loadingMsgIdx]}
        </p>
        <p className="text-xs text-zinc-500 mt-4">This usually takes 15-30 seconds</p>
      </div>
    );
  }

  // step 4: display
  return (
    <div className="max-w-3xl mx-auto" data-testid="report-step-display">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => { setStep(1); setReportText(""); }} className="text-sm text-[#9B96C0] hover:text-white flex items-center gap-2" data-testid="report-new-btn">
          <ArrowLeft className="w-4 h-4" /> New Report
        </button>
        <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">✓ Generated</Badge>
      </div>
      <div ref={reportBoxRef} className="cosmic-card rounded-2xl p-6 sm:p-10 bg-[#1A1730]" data-testid="report-content">
        <div className="border-b border-[#2D1B69] pb-4 mb-6 text-center">
          <p className="text-[11px] uppercase tracking-[0.3em] text-[#F5C842] mb-2">AstroVedic AI</p>
          <h2 className="font-cinzel text-2xl sm:text-3xl font-bold text-white">{reportMeta?.type}</h2>
          <p className="text-xs text-zinc-400 mt-1">For {form.birthName}</p>
        </div>
        <article className="prose-custom text-zinc-200 leading-relaxed space-y-4">
          {reportText.split("\n").map((line, idx) => {
            if (/^###\s+/.test(line)) return <h4 key={idx} className="font-cinzel text-lg text-[#F5C842] mt-5 mb-2">{line.replace(/^###\s+/, "")}</h4>;
            if (/^##\s+/.test(line)) return <h3 key={idx} className="font-cinzel text-xl text-[#F5C842] mt-6 mb-3">{line.replace(/^##\s+/, "")}</h3>;
            if (/^#\s+/.test(line)) return <h2 key={idx} className="font-cinzel text-2xl text-white mt-6 mb-3">{line.replace(/^#\s+/, "")}</h2>;
            if (line.trim() === "") return <div key={idx} className="h-2" />;
            const withBold = line.split(/(\*\*[^*]+\*\*)/g).map((frag, i) => {
              if (/^\*\*.*\*\*$/.test(frag)) return <strong key={i} className="text-white">{frag.slice(2, -2)}</strong>;
              return <span key={i}>{frag}</span>;
            });
            return <p key={idx} className="text-sm sm:text-base">{withBold}</p>;
          })}
        </article>
      </div>

      <div className="flex flex-wrap gap-3 mt-6">
        <Button onClick={downloadPDF} className="btn-gold rounded-full px-6 py-5" data-testid="report-download-btn">
          <Download className="w-4 h-4 mr-2" /> Download as PDF
        </Button>
        <Button onClick={share} variant="outline" className="border-[#8B5CF6] text-[#8B5CF6] hover:bg-[#8B5CF6]/10 rounded-full px-6 py-5" data-testid="report-share-btn">
          <Share2 className="w-4 h-4 mr-2" /> Share
        </Button>
      </div>
    </div>
  );
};

// ==================== SIDE-LOCK CARD (left column for free users) ====================
const SideLockCard = ({ onUpgrade }) => {
  const logged = isLoggedIn();
  return (
    <div className="cosmic-card rounded-2xl p-6 sm:p-8 text-center sticky top-24" data-testid="chat-side-lock">
      <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-[#D4A017] to-[#F5C842] flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(212,160,23,0.35)]">
        <Lock className="w-9 h-9 text-[#0D0B1E]" />
      </div>
      <h2 className="font-cinzel text-xl sm:text-2xl font-bold text-white mb-3">
        AI Chat is available on <span className="text-[#F5C842]">paid plans</span>
      </h2>
      <p className="text-zinc-300 text-sm mb-6 leading-relaxed">
        Access unlimited personalized planetary insights and real-time transit analysis by upgrading your cosmic journey.
      </p>
      <div className="rounded-2xl border border-[#D4A017]/40 bg-[#1A1730] p-5 mb-4">
        <p className="text-xs uppercase tracking-[0.25em] text-[#9B96C0] mb-2">Upgrade to</p>
        <h3 className="font-cinzel text-lg font-bold text-white">Tara Silver</h3>
        <p className="font-cinzel text-3xl font-bold text-[#F5C842] my-3">
          ₹199<span className="text-xs text-zinc-400">/mo</span>
        </p>
        <Link to="/plans" className="block">
          <Button className="w-full btn-gold rounded-full py-5 font-semibold" data-testid="side-lock-view-plans">
            View Plans
          </Button>
        </Link>
      </div>
      {!logged && (
        <Link to="/login" className="text-sm text-[#F5C842] hover:underline inline-flex items-center gap-1" data-testid="side-lock-login-link">
          Already a member? Login <ArrowLeft className="w-3 h-3 rotate-180" />
        </Link>
      )}
      {logged && (
        <button onClick={onUpgrade} className="text-sm text-[#F5C842] hover:underline" data-testid="side-lock-explore-plans">
          Explore all plans →
        </button>
      )}
    </div>
  );
};

// ==================== REPORT GRID (compact grid for side-lock layout) ====================
const ReportGrid = ({ onPick }) => {
  const reportTypes = useReportTypes();
  const items = reportTypes.slice(0, 6);
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" data-testid="report-grid">
      {items.map((r) => (
        <button
          key={r.id}
          onClick={onPick}
          className="cosmic-card rounded-2xl p-5 text-left hover:border-[#D4A017]/60 transition-all group relative"
          data-testid={`report-grid-card-${r.id}`}
        >
          <div className="flex items-start justify-between mb-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: `${r.color}1F`, border: `1px solid ${r.color}55` }}
            >
              <r.Icon className="w-6 h-6" style={{ color: r.color }} />
            </div>
            {r.free ? (
              <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px]">FREE</Badge>
            ) : null}
          </div>
          <h4 className="font-cinzel font-semibold text-white text-base mb-1 leading-snug">{r.name}</h4>
          <p className="font-cinzel text-[#F5C842] text-sm font-bold mb-4">₹{r.price}</p>
          <div className="rounded-full border border-[#D4A017]/40 bg-[#D4A017]/10 text-[#F5C842] text-xs font-semibold text-center py-2 group-hover:bg-[#D4A017]/20 transition-colors">
            Generate →
          </div>
        </button>
      ))}
    </div>
  );
};

// ==================== KUNDLI CHART (North-Indian diamond chart preview) ====================
const NorthIndianChart = ({ houses = [] }) => {
  /* A 400x400 North-Indian style kundli chart with 12 houses.
     `houses` is a 12-item array; each house cell shows its number and
     (optionally) planets placed in it. Pure SVG, no deps. */
  const planets = [
    "Su", "Mo", "Ma", "Me", "Ju", "Ve", "Sa", "Ra", "Ke",
  ];
  const sample = houses.length
    ? houses
    : [
        { rashi: 1,  planets: ["Su"] },
        { rashi: 2,  planets: [] },
        { rashi: 3,  planets: ["Me", "Ve"] },
        { rashi: 4,  planets: ["Mo"] },
        { rashi: 5,  planets: [] },
        { rashi: 6,  planets: ["Ke"] },
        { rashi: 7,  planets: ["Sa"] },
        { rashi: 8,  planets: [] },
        { rashi: 9,  planets: ["Ju"] },
        { rashi: 10, planets: ["Ma"] },
        { rashi: 11, planets: [] },
        { rashi: 12, planets: ["Ra"] },
      ];

  // House centres for label placement (12 houses in north-indian layout)
  const labelPos = [
    { x: 200, y: 90 },   // 1 (top diamond)
    { x: 100, y: 50 },   // 2 (top-left corner)
    { x: 55,  y: 100 },  // 3 (left top triangle)
    { x: 110, y: 200 },  // 4 (left diamond)
    { x: 55,  y: 300 },  // 5 (left bottom triangle)
    { x: 100, y: 350 },  // 6 (bottom-left corner)
    { x: 200, y: 310 },  // 7 (bottom diamond)
    { x: 300, y: 350 },  // 8 (bottom-right corner)
    { x: 345, y: 300 },  // 9 (right bottom triangle)
    { x: 290, y: 200 },  // 10 (right diamond)
    { x: 345, y: 100 },  // 11 (right top triangle)
    { x: 300, y: 50 },   // 12 (top-right corner)
  ];

  return (
    <svg viewBox="0 0 400 400" className="w-full max-w-md mx-auto" data-testid="kundli-chart-svg">
      <defs>
        <linearGradient id="kundliBg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#1A1730" />
          <stop offset="100%" stopColor="#0D0B1E" />
        </linearGradient>
      </defs>
      {/* Outer square */}
      <rect x="10" y="10" width="380" height="380" fill="url(#kundliBg)" stroke="#D4A017" strokeWidth="2" rx="10" />
      {/* The two crossing diagonals and the inner diamond (X + diamond) */}
      <line x1="10"  y1="10"  x2="390" y2="390" stroke="#8B5CF6" strokeWidth="1.5" />
      <line x1="390" y1="10"  x2="10"  y2="390" stroke="#8B5CF6" strokeWidth="1.5" />
      <polygon points="200,10 390,200 200,390 10,200" fill="none" stroke="#F5C842" strokeWidth="1.5" />

      {/* House numbers & planets */}
      {sample.map((h, i) => (
        <g key={i}>
          <text
            x={labelPos[i].x}
            y={labelPos[i].y}
            fill="#F5C842"
            fontSize="13"
            fontWeight="700"
            textAnchor="middle"
            fontFamily="serif"
          >
            {h.rashi}
          </text>
          {h.planets.map((p, pi) => (
            <text
              key={pi}
              x={labelPos[i].x + (pi - (h.planets.length - 1) / 2) * 22}
              y={labelPos[i].y + 18}
              fill="#E879F9"
              fontSize="11"
              fontWeight="600"
              textAnchor="middle"
            >
              {p}
            </text>
          ))}
        </g>
      ))}
    </svg>
  );
};

const KundliChartTab = () => {
  const [form, setForm] = useState({ name: "", dob: "", tob: "", pob: "" });
  const [generated, setGenerated] = useState(false);
  const [chartData, setChartData] = useState([]);
  const logged = isLoggedIn();

  const handleGenerate = (e) => {
    e.preventDefault();
    if (!form.name || !form.dob || !form.pob) {
      toast.error("Please fill name, date and place of birth");
      return;
    }

    // Deterministic pseudo-random generation based on birth data
    const seedStr = `${form.dob}-${form.tob}-${form.pob}`.toLowerCase();
    let hash = 0;
    for (let i = 0; i < seedStr.length; i++) {
      hash = Math.imul(31, hash) + seedStr.charCodeAt(i) | 0;
    }
    const random = () => {
      hash = Math.imul(hash ^ (hash >>> 15), 1597334677);
      return ((hash ^ (hash >>> 15)) >>> 0) / 4294967296;
    };

    const lagna = Math.floor(random() * 12) + 1;
    const planets = ["Su", "Mo", "Ma", "Me", "Ju", "Ve", "Sa", "Ra", "Ke"];
    const houses = Array.from({ length: 12 }, (_, i) => ({
      rashi: ((lagna + i - 1) % 12) + 1,
      planets: []
    }));

    planets.forEach(p => {
      const houseIndex = Math.floor(random() * 12);
      houses[houseIndex].planets.push(p);
    });

    setChartData(houses);
    setGenerated(true);
    toast.success("Kundli chart generated ✓");
  };

  return (
    <div className="grid lg:grid-cols-[minmax(0,380px)_1fr] gap-6 lg:gap-8" data-testid="kundli-chart-tab">
      {/* Form */}
      <div className="cosmic-card rounded-2xl p-6 h-fit">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/40 flex items-center justify-center">
            <PieChart className="w-5 h-5 text-[#8B5CF6]" />
          </div>
          <div>
            <h3 className="font-cinzel text-lg font-bold text-white">Free Kundli Chart</h3>
            <p className="text-xs text-zinc-400">Enter birth details to generate</p>
          </div>
        </div>
        <form onSubmit={handleGenerate} className="space-y-3.5">
          <div>
            <label className="text-xs text-zinc-300 mb-1.5 flex items-center gap-2"><User className="w-3.5 h-3.5" /> Full Name *</label>
            <Input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className="bg-[#231F3A] border-[#2D1B69] text-white"
              data-testid="kundli-form-name"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-300 mb-1.5 flex items-center gap-2"><CalendarDays className="w-3.5 h-3.5" /> Date *</label>
              <Input
                type="date"
                value={form.dob}
                onChange={(e) => setForm((p) => ({ ...p, dob: e.target.value }))}
                className="bg-[#231F3A] border-[#2D1B69] text-white"
                data-testid="kundli-form-dob"
                required
              />
            </div>
            <div>
              <label className="text-xs text-zinc-300 mb-1.5 flex items-center gap-2"><Clock className="w-3.5 h-3.5" /> Time</label>
              <Input
                type="time"
                value={form.tob}
                onChange={(e) => setForm((p) => ({ ...p, tob: e.target.value }))}
                className="bg-[#231F3A] border-[#2D1B69] text-white"
                data-testid="kundli-form-tob"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-zinc-300 mb-1.5 flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /> Place *</label>
            <Input
              placeholder="City, State"
              value={form.pob}
              onChange={(e) => setForm((p) => ({ ...p, pob: e.target.value }))}
              className="bg-[#231F3A] border-[#2D1B69] text-white"
              data-testid="kundli-form-pob"
              required
            />
          </div>
          <Button type="submit" className="w-full btn-gold rounded-full py-5" data-testid="kundli-generate-btn">
            <Sparkles className="w-4 h-4 mr-2" /> Generate Chart
          </Button>
          <p className="text-[11px] text-zinc-500 text-center">
            Basic chart is free. Want full analysis? <Link to="/plans" className="text-[#F5C842] hover:underline">Upgrade</Link>
          </p>
        </form>
      </div>

      {/* Chart display */}
      <div className="cosmic-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-[#F5C842] mb-1">North-Indian Style</p>
            <h3 className="font-cinzel text-xl font-semibold text-white">
              {generated ? `${form.name}'s Kundli` : "Sample Kundli Chart"}
            </h3>
          </div>
          {generated && (
            <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">✓ Generated</Badge>
          )}
        </div>
        <NorthIndianChart houses={generated ? chartData : []} />
        <div className="mt-5 grid grid-cols-3 sm:grid-cols-5 gap-2 text-[11px]">
          {[
            ["Su", "Sun"],  ["Mo", "Moon"],  ["Ma", "Mars"],  ["Me", "Mercury"], ["Ju", "Jupiter"],
            ["Ve", "Venus"], ["Sa", "Saturn"], ["Ra", "Rahu"],   ["Ke", "Ketu"],
          ].map(([abbr, full]) => (
            <div key={abbr} className="flex items-center gap-1.5 text-zinc-400">
              <span className="text-[#E879F9] font-semibold">{abbr}</span>
              <span>= {full}</span>
            </div>
          ))}
        </div>
        {generated && !logged && (
          <div className="mt-6 rounded-xl border border-[#D4A017]/40 bg-[#D4A017]/5 p-4 text-center">
            <p className="text-sm text-zinc-300 mb-2">
              <Lock className="w-3.5 h-3.5 inline mr-1 text-[#F5C842]" />
              Sign in to save this chart and unlock detailed analysis.
            </p>
            <Link to="/login">
              <Button size="sm" className="btn-gold rounded-full" data-testid="kundli-signin-cta">Sign in</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

// ==================== MAIN PAGE ====================
const NakshatraAIPage = () => {
  const [upsellOpen, setUpsellOpen] = useState(false);
  
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const defaultTab = queryParams.get("tab") || "chat";
  
  const [activeTab, setActiveTab] = useState(defaultTab);
  const paid = isPaid();
  const reportTypes = useReportTypes();

  return (
    <div className="min-h-screen pt-20 lg:pt-24 pb-24 lg:pb-12 av-bg" data-testid="nakshatra-ai-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#D4A017] to-[#8B5CF6] flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
          </div>
          <h1 className="font-cinzel text-3xl sm:text-4xl font-bold text-white mb-2">
            <span className="text-gradient-gold">NakshatraAI</span>
          </h1>
          <p className="text-zinc-400">Your AI-Powered Vedic Astrology Guide</p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-1 bg-[#1A1730] p-1 rounded-full border border-[#2D1B69]">
            {[
              { id: "chat",    icon: Sparkles, label: "AI Chat" },
              { id: "reports", icon: FileText, label: "AI Reports" },
              { id: "chart",   icon: PieChart, label: "Kundli Chart" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                data-testid={`tab-${t.id}`}
                className={`px-4 sm:px-5 py-2.5 rounded-full text-xs sm:text-sm font-medium flex items-center gap-2 transition-all ${
                  activeTab === t.id
                    ? "bg-gradient-to-r from-[#D4A017] to-[#F5C842] text-[#0D0B1E]"
                    : "text-zinc-300 hover:text-white"
                }`}
              >
                <t.icon className="w-4 h-4" /> {t.label}
              </button>
            ))}
          </div>
        </div>

        {activeTab === "chat" && (
          <div className="max-w-3xl mx-auto">
            <AIChat />
          </div>
        )}

        {activeTab === "reports" && (
          <div className="max-w-6xl mx-auto">
            <ReportFlow />
          </div>
        )}

        {activeTab === "chart" && (
          <div className="max-w-6xl mx-auto">
            <KundliChartTab />
          </div>
        )}
      </div>

      <UpsellModal open={upsellOpen} onClose={() => setUpsellOpen(false)} />
    </div>
  );
};

export default NakshatraAIPage;
