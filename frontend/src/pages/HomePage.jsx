import { useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "@/App";
import { useSupport } from "@/components/SupportContext";
import {
  Sparkles, ShoppingBag, Sun, Star, ArrowRight,
  ChevronDown, Headset, Mail, Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import BannerCarousel from "@/components/BannerCarousel";

// ---- Data ----
const OFFERINGS = [
  { icon: Sparkles,     title: "AI Reports (Paid)",  desc: "Detailed kundli reports & predictions powered by AI.", link: "/nakshatra-ai?tab=reports",  cta: "View Reports",  color: "from-[#3B82F6] to-[#1E40AF]", ring: "#3B82F6" },
  { icon: ShoppingBag,  title: "Cosmic Store",       desc: "Shop authentic gemstones, rudraksha, yantras & more.", link: "/cosmic-store",  cta: "Shop Now",      color: "from-[#10B981] to-[#047857]", ring: "#10B981" },
  { icon: Sun,          title: "Daily Rashifal",     desc: "Read your daily horoscope free in Hindi & English.", link: "/rashifal",      cta: "Read Now",      color: "from-[#F59E0B] to-[#B45309]", ring: "#F59E0B" },
];

const REPORT_TIERS = [
  {
    name: "Basic Report",   price: 0,   id: "kundli-basic",
    features: ["Kundli Overview", "Basic Predictions", "Online View"],
    tone: "text-[#8B5CF6]", btn: "bg-[#8B5CF6] hover:bg-[#7C3AED] text-white",
    bg: "from-[#231F3A] to-[#1A1730]", border: "border-[#8B5CF6]/30",
  },
  {
    name: "Detailed Report", price: 99, id: "kundli-detailed", popular: true,
    features: ["Life Predictions", "Career & Finance", "Love & Relationships", "Remedies", "PDF Download"],
    tone: "text-[#F5C842]", btn: "btn-gold",
    bg: "from-[#2D1B69] to-[#1A1730]", border: "border-[#D4A017]",
  },
  {
    name: "Premium Report",  price: 299, id: "kundli-premium",
    features: ["Full Life Analysis", "10+ Year Predictions", "Remedies & Guidance", "PDF Download"],
    tone: "text-emerald-400", btn: "bg-emerald-600 hover:bg-emerald-700 text-white",
    bg: "from-[#1F3A2E] to-[#1A1730]", border: "border-emerald-500/30",
  },
];

const FAQS = [
  { q: "How can I get my kundli?",               a: "Simply click on 'Get Free Kundli' on the homepage, enter your birth details (name, date, time, place) and our NakshatraAI engine will instantly generate your Vedic birth chart with key insights — completely free, once per account." },
  { q: "Are AI reports accurate?",               a: "Our AI engine is trained on classical Vedic astrology texts and uses your exact planetary positions. The accuracy is on-par with a seasoned human astrologer for standard predictions. For nuanced life guidance, we recommend pairing it with a live astrologer consultation." },
  { q: "How do I use NakshatraAI?",        a: "Visit the NakshatraAI page, choose from AI Chat or AI Reports. Enter your birth details and get personalized Vedic astrology insights instantly. Free Kundli chart is included for all users." },
  { q: "Is my information safe with AstroVedic AI?", a: "Absolutely. Your birth data is encrypted, never shared, and used only to generate your personal readings. Payments are secured via PCI-DSS certified gateways. You can delete your data any time from the dashboard." },
  { q: "Can I get a refund?",                    a: "Yes. If you are unsatisfied with any consultation, raise a support ticket within 48 hours and we will refund your wallet in full. Digital reports are non-refundable once downloaded." },
];

// ---- Page ----
const HomePage = () => {
  const { stats } = useApp();
  const { openSupport } = useSupport();
  const [openFaq, setOpenFaq] = useState(0);

  return (
    <div className="min-h-screen pb-20 lg:pb-0 av-bg" data-testid="homepage">

      {/* ============ HERO ============ */}
      <section className="relative min-h-[92vh] flex items-center overflow-hidden pt-20 lg:pt-24" data-testid="hero-section">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-50 dark:opacity-50"
          style={{ backgroundImage: `url('/images/leo_sign.png')` }}
        />
        <div className="absolute inset-0 dark:bg-gradient-to-r dark:from-[#0D0B1E] dark:via-[#0D0B1E]/85 dark:to-transparent bg-gradient-to-r from-white/95 via-white/80 to-white/30" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-2xl">
            <Badge className="bg-[#D4A017]/15 dark:text-[#F5C842] text-[#8a6810] border-[#D4A017]/30 mb-6 px-4 py-1.5 font-inter">
              <Sparkles className="w-3 h-3 mr-2" /> India's #1 AI-Powered Vedic Astrology Platform
            </Badge>
            <h1 className="font-cinzel font-bold dark:text-white text-[#1a103f] mb-5 tracking-tight leading-[1.05]" style={{ fontSize: "clamp(2.25rem, 5vw, 4.5rem)" }}>
              Know Your Destiny.<br />
              <span className="text-gradient-gold">Transform Your Life.</span>
            </h1>
            <p className="dark:text-zinc-300 text-zinc-700 mb-2 text-base sm:text-lg max-w-xl">
              AI-powered astrology. Trusted guidance. Ancient wisdom. Modern technology.
            </p>
            <p className="dark:text-zinc-400 text-zinc-600 mb-8 text-sm font-hindi">प्राचीन ज्योतिष + आधुनिक AI</p>

            <div className="flex flex-col sm:flex-row gap-3 mb-10">
              <Link to="/nakshatra-ai?tab=chart">
                <Button className="btn-gold rounded-full px-7 py-6 text-base w-full sm:w-auto" data-testid="hero-cta-kundli">
                  <Sparkles className="w-5 h-5 mr-2" /> Get Free Kundli
                </Button>
              </Link>
              <Link to="/rashifal">
                <Button variant="outline" className="rounded-full px-7 py-6 text-base border-[#8B5CF6] text-[#8B5CF6] hover:bg-[#8B5CF6]/10 w-full sm:w-auto" data-testid="hero-cta-rashifal">
                  <Sun className="w-5 h-5 mr-2" /> Daily Rashifal
                </Button>
              </Link>
            </div>

            {/* Hero stats removed per request — keep hero clean. */}
          </div>
        </div>
      </section>

      {/* ============ BANNER CAROUSEL ============ */}
      <BannerCarousel />

      {/* ============ WHAT WE OFFER ============ */}
      <section className="py-16 lg:py-24" data-testid="what-we-offer-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-[11px] uppercase tracking-[0.35em] text-[#F5C842] mb-3">What We Offer</p>
            <h2 className="font-cinzel text-3xl sm:text-4xl font-bold text-white">
              Everything you need for a <span className="text-gradient-gold">better tomorrow</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {OFFERINGS.map((o, idx) => (
              <Link key={idx} to={o.link} data-testid={`offer-card-${idx}`}>
                <div className="cosmic-card rounded-2xl p-6 h-full flex flex-col items-center text-center hover:-translate-y-1 transition-transform group">
                  <div className={`w-16 h-16 mb-5 rounded-2xl bg-gradient-to-br ${o.color} flex items-center justify-center shadow-[0_10px_30px_rgba(0,0,0,0.35)]`}>
                    <o.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-cinzel text-xl font-semibold text-white mb-2">{o.title}</h3>
                  <p className="text-sm text-zinc-400 mb-5 flex-1">{o.desc}</p>
                  <span className="text-sm font-medium text-[#F5C842] flex items-center gap-1 group-hover:gap-2 transition-all">
                    {o.cta} <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>



      {/* ============ AI KUNDLI REPORTS (PAID FOCUS) ============ */}
      <section className="py-16 lg:py-24" data-testid="ai-reports-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-[1fr_2fr] gap-10 items-center">
            {/* Intro */}
            <div>
              <p className="text-[11px] uppercase tracking-[0.35em] text-[#F5C842] mb-3">Powered by NakshatraAI</p>
              <h2 className="font-cinzel text-3xl sm:text-4xl font-bold text-white mb-5 leading-tight">
                AI Kundli <span className="text-gradient-gold">Reports</span>
              </h2>
              <p className="text-zinc-300 text-base mb-6">
                Get accurate insights about your life, career, relationships, and future — crafted by our AI trained on classical Vedic texts.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  "Advanced AI calculations",
                  "Vedic astrology insights",
                  "PDF report download",
                  "100% secure & confidential",
                ].map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-zinc-200 text-sm">
                    <span className="w-5 h-5 rounded-full bg-[#D4A017]/20 flex items-center justify-center">
                      <Check className="w-3 h-3 text-[#F5C842]" />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link to="/nakshatra-ai?tab=reports">
                <Button className="btn-gold rounded-full px-6 py-5" data-testid="view-all-reports-btn">
                  View All Reports <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>

            {/* Pricing cards */}
            <div className="grid sm:grid-cols-3 gap-4">
              {REPORT_TIERS.map((t, idx) => (
                <div
                  key={t.id}
                  className={`relative rounded-2xl p-6 flex flex-col bg-gradient-to-br ${t.bg} border ${t.border} ${
                    t.popular ? "scale-[1.03] shadow-[0_20px_60px_rgba(212,160,23,0.18)]" : ""
                  }`}
                  data-testid={`report-tier-${t.id}`}
                >
                  {t.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#D4A017] to-[#F5C842] text-[#0D0B1E] text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  )}
                  <div className={`w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 ${t.tone}`}>
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h3 className="font-cinzel text-xl font-semibold text-white mb-2">{t.name}</h3>
                  <p className={`font-cinzel font-bold ${t.tone} text-3xl mb-4`}>₹{t.price}</p>
                  <ul className="space-y-2 mb-6 flex-1">
                    {t.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-zinc-300">
                        <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" /> {f}
                      </li>
                    ))}
                  </ul>
                  <Link to="/nakshatra-ai?tab=reports">
                    <Button className={`w-full rounded-full ${t.btn}`} data-testid={`generate-${t.id}-btn`}>
                      Generate Now
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ NEED HELP + FAQ ============ */}
      <section className="py-16 lg:py-24 bg-[#1A1730]/40" data-testid="support-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-[1fr_1.6fr] gap-10">

            {/* Need Help */}
            <div>
              <p className="text-[11px] uppercase tracking-[0.35em] text-[#F5C842] mb-3">Need Help?</p>
              <h3 className="font-cinzel text-3xl font-bold text-white mb-3">We're here for you</h3>
              <p className="text-zinc-400 text-sm mb-8">Raise a ticket or drop us an email. Our team replies within 24 hours.</p>

              <button
                onClick={openSupport}
                className="w-full flex items-center gap-3 px-5 py-4 rounded-xl bg-gradient-to-r from-[#D4A017] to-[#F5C842] text-[#0D0B1E] font-semibold hover:scale-[1.02] transition-transform mb-3"
                data-testid="homepage-raise-ticket-btn"
              >
                <Headset className="w-5 h-5" />
                <div className="text-left">
                  <p className="text-sm font-bold">Raise a Support Ticket</p>
                  <p className="text-[11px] opacity-80">Attach screenshot, get 24hr response</p>
                </div>
              </button>

              <a
                href="mailto:support@astrovedic.ai"
                className="w-full flex items-center gap-3 px-5 py-4 rounded-xl bg-[#231F3A] border border-[#2D1B69] hover:border-[#8B5CF6] text-white transition-colors"
                data-testid="homepage-email-link"
              >
                <div className="w-9 h-9 rounded-lg bg-[#8B5CF6]/15 flex items-center justify-center">
                  <Mail className="w-4 h-4 text-[#8B5CF6]" />
                </div>
                <div>
                  <p className="text-sm font-medium">Email Support</p>
                  <p className="text-[11px] text-zinc-400">support@astrovedic.ai</p>
                </div>
              </a>
            </div>

            {/* FAQ */}
            <div data-testid="faq-section">
              <p className="text-[11px] uppercase tracking-[0.35em] text-[#F5C842] mb-3">Frequently Asked Questions</p>
              <h3 className="font-cinzel text-3xl font-bold text-white mb-8">Got questions?</h3>
              <div className="space-y-3">
                {FAQS.map((item, idx) => {
                  const isOpen = openFaq === idx;
                  return (
                    <div
                      key={idx}
                      className={`rounded-xl border overflow-hidden transition-all ${
                        isOpen
                          ? "border-[#D4A017]/50 bg-[#1A1730]"
                          : "border-[#2D1B69] bg-[#1A1730]/70 hover:border-[#8B5CF6]/50"
                      }`}
                      data-testid={`faq-item-${idx}`}
                    >
                      <button
                        onClick={() => setOpenFaq(isOpen ? -1 : idx)}
                        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                        aria-expanded={isOpen}
                        data-testid={`faq-toggle-${idx}`}
                      >
                        <span className={`font-medium text-sm sm:text-base ${isOpen ? "text-[#F5C842]" : "text-white"}`}>
                          {item.q}
                        </span>
                        <ChevronDown className={`w-5 h-5 flex-shrink-0 transition-transform ${isOpen ? "rotate-180 text-[#F5C842]" : "text-[#9B96C0]"}`} />
                      </button>
                      <div className={`grid transition-all duration-300 ease-out ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                        <div className="overflow-hidden">
                          <p className="px-5 pb-5 text-zinc-300 text-sm leading-relaxed">{item.a}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="bg-[#0B0917] border-t border-[#2D1B69] pt-12 pb-8" data-testid="footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-10">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <Star className="w-5 h-5 text-[#F5C842]" />
                <h4 className="font-cinzel text-xl font-bold text-white">AstroVedic AI</h4>
              </div>
              <p className="text-sm text-zinc-400 max-w-xs">Where Ancient Stars Meet Artificial Intelligence — AI-powered astrology trusted by thousands.</p>
            </div>
            <div>
              <h5 className="font-semibold text-white text-sm mb-3">Quick Links</h5>
              <ul className="space-y-2 text-sm text-zinc-400">
                <li><Link to="/nakshatra-ai" className="hover:text-[#F5C842]">AI Reports</Link></li>
                <li><Link to="/rashifal" className="hover:text-[#F5C842]">Daily Rashifal</Link></li>
                <li><Link to="/cosmic-store" className="hover:text-[#F5C842]">Store</Link></li>
                <li><Link to="/blog" className="hover:text-[#F5C842]">Blog</Link></li>
              </ul>
            </div>

            <div>
              <h5 className="font-semibold text-white text-sm mb-3">Support</h5>
              <ul className="space-y-2 text-sm text-zinc-400">
                <li><button onClick={openSupport} className="hover:text-[#F5C842]" data-testid="footer-support-btn">Raise a Ticket</button></li>
                <li><a href="mailto:support@astrovedic.ai" className="hover:text-[#F5C842]">Email Support</a></li>
                <li><Link to="/plans" className="hover:text-[#F5C842]">Plans</Link></li>
                <li><Link to="/blog" className="hover:text-[#F5C842]">Blog</Link></li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold text-white text-sm mb-3">Legal</h5>
              <ul className="space-y-2 text-sm text-zinc-400">
                <li><a href="#" className="hover:text-[#F5C842]">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-[#F5C842]">Terms of Service</a></li>
                <li><a href="#" className="hover:text-[#F5C842]">Refund Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-6 border-t border-[#2D1B69] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500">
            <p>© 2026 AstroVedic AI. All rights reserved.</p>
            <p className="text-center">Astrology is for guidance purposes. Consult a professional for critical decisions.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
