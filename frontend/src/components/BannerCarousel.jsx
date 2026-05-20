import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { API } from "@/App";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";

const DEFAULT_BANNER = {
  id: "default",
  title: "Get Your Free Kundli Today",
  subtitle: "Discover your cosmic blueprint with AI-powered Vedic astrology",
  image_url: "",
  link: "/nakshatra-ai",
  button_text: "Get Free Kundli",
  bg_color: "linear-gradient(135deg, #2D1B69 0%, #8B5CF6 50%, #D4A017 100%)",
};

const BannerCarousel = ({ page = "home", showDefault = true }) => {
  const [banners, setBanners] = useState([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const res = await axios.get(`${API}/banners`, { params: { page } });
        const list = Array.isArray(res.data) && res.data.length > 0
          ? res.data
          : (showDefault && page === "home" ? [DEFAULT_BANNER] : []);
        setBanners(list);
      } catch (e) {
        setBanners(showDefault && page === "home" ? [DEFAULT_BANNER] : []);
      } finally {
        setLoading(false);
      }
    };
    fetchBanners();
  }, [page, showDefault]);

  useEffect(() => {
    if (banners.length <= 1) return;
    const t = setInterval(() => {
      setActiveIdx((i) => (i + 1) % banners.length);
    }, 4000);
    return () => clearInterval(t);
  }, [banners.length]);

  if (loading) {
    return (
      <section className="py-6" data-testid="banner-section-loading">
        <div className="max-w-7xl mx-auto px-4">
          <div className="h-40 sm:h-52 rounded-2xl shimmer" />
        </div>
      </section>
    );
  }

  if (!banners.length) return null;

  const prev = () => setActiveIdx((i) => (i - 1 + banners.length) % banners.length);
  const next = () => setActiveIdx((i) => (i + 1) % banners.length);

  return (
    <section className="py-6 sm:py-8" data-testid="banner-carousel-section">
      <div className="max-w-7xl mx-auto px-4">
        <div className="relative overflow-hidden rounded-2xl">
          <div
            className="flex transition-transform duration-700 ease-out"
            style={{ transform: `translateX(-${activeIdx * 100}%)` }}
          >
            {banners.map((b, idx) => {
              const bg = b.bg_color || b.bgColor || "linear-gradient(135deg, #2D1B69 0%, #8B5CF6 100%)";
              const href = b.link || b.linkUrl || "/nakshatra-ai";
              const btnText = b.button_text || b.buttonText || "Explore Now";
              return (
                <Link
                  key={b.id || idx}
                  to={href.startsWith("http") ? "#" : href}
                  onClick={(e) => { if (href.startsWith("http")) { e.preventDefault(); window.open(href, "_blank"); } }}
                  className="relative min-w-full h-40 sm:h-52 md:h-60 flex items-center overflow-hidden"
                  style={{ background: bg }}
                  data-testid={`banner-slide-${idx}`}
                >
                  {b.image_url && (
                    <img
                      src={b.image_url}
                      alt={b.title}
                      className="absolute inset-0 w-full h-full object-cover opacity-30"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/20 to-transparent" />
                  <div className="relative z-10 px-6 sm:px-10 md:px-14 max-w-2xl">
                    <p className="text-[11px] sm:text-xs uppercase tracking-[0.3em] text-[#F5C842] mb-2 flex items-center gap-2">
                      <Sparkles className="w-3 h-3" /> Special Offer
                    </p>
                    <h3 className="font-cinzel text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2 leading-tight">
                      {b.title}
                    </h3>
                    {b.subtitle && (
                      <p className="text-sm sm:text-base text-white/85 mb-4 line-clamp-2">{b.subtitle}</p>
                    )}
                    <span className="inline-flex items-center gap-2 bg-gradient-to-r from-[#D4A017] to-[#F5C842] text-[#0D0B1E] px-5 py-2.5 rounded-full font-semibold text-sm hover:scale-105 transition-transform">
                      {btnText} →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>

          {banners.length > 1 && (
            <>
              <button
                onClick={prev}
                aria-label="Previous banner"
                className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-sm z-20"
                data-testid="banner-prev-btn"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={next}
                aria-label="Next banner"
                className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-sm z-20"
                data-testid="banner-next-btn"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-2 z-20">
                {banners.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveIdx(idx)}
                    aria-label={`Go to banner ${idx + 1}`}
                    className={`h-2 rounded-full transition-all ${
                      idx === activeIdx ? "w-8 bg-[#F5C842]" : "w-2 bg-white/40 hover:bg-white/70"
                    }`}
                    data-testid={`banner-dot-${idx}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default BannerCarousel;
