import React, { useEffect } from 'react';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const LegalPageLayout = ({ title, lastUpdated, children }) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8 cosmic-bg">
      <div className="max-w-4xl mx-auto cosmic-card rounded-2xl p-8 sm:p-12 border border-[#2D1B69] bg-[#1A1730]/80">
        <div className="flex items-center text-sm text-zinc-400 mb-6">
          <Link to="/" className="hover:text-[#F5C842] transition-colors">Home</Link>
          <ChevronRight className="w-4 h-4 mx-2" />
          <span className="text-[#F5C842]">{title}</span>
        </div>
        <h1 className="font-cinzel text-3xl sm:text-4xl font-bold text-white mb-4 leading-tight">
          {title}
        </h1>
        {lastUpdated && (
          <p className="text-sm text-zinc-400 mb-8 pb-8 border-b border-[#2D1B69]">
            Last Updated: {lastUpdated}
          </p>
        )}
        <div className="text-zinc-300 space-y-6 leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  );
};

export default LegalPageLayout;
