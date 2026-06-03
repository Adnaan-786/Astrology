import React from "react";
import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import { useSupport } from "@/components/SupportContext";

const Footer = () => {
  const { openSupport } = useSupport();

  return (
    <footer className="bg-[#0B0917] border-t border-[#2D1B69] pt-12 pb-8" data-testid="footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-10">
          <div className="col-span-2">
            <Link to="/" className="flex items-center mb-4">
              <img src="/images/logo.png" alt="AstroVedic AI Logo" className="h-12 w-auto" />
            </Link>
            <p className="text-sm text-zinc-400 max-w-xs">Where Ancient Stars Meet Artificial Intelligence — AI-powered astrology trusted by thousands.</p>
          </div>
          <div>
            <h5 className="font-semibold text-white text-sm mb-3">Quick Links</h5>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li><Link to="/about-us" className="hover:text-[#F5C842]">About Us</Link></li>
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
              <li><Link to="/privacy-policy" className="hover:text-[#F5C842]">Privacy Policy</Link></li>
              <li><Link to="/terms-and-conditions" className="hover:text-[#F5C842]">Terms & Conditions</Link></li>
              <li><Link to="/disclaimer" className="hover:text-[#F5C842]">Disclaimer</Link></li>
              <li><Link to="/pricing-policy" className="hover:text-[#F5C842]">Pricing Policy</Link></li>
            </ul>
          </div>
        </div>
        <div className="pt-6 border-t border-[#2D1B69] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500">
          <p>© 2026 AstroVedic AI. All rights reserved.</p>
          <p className="text-center">Astrology is for guidance purposes. Consult a professional for critical decisions.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
