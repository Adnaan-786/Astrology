import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { API } from "@/App";
import { 
  Search, Filter, Star, Phone, MessageCircle, Video,
  ChevronDown, X, Clock, Users, ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const specializations = ["Kundli", "Vastu", "Tarot", "Numerology", "Face Reading", "Marriage", "Career", "Love", "Finance"];
const languages = ["Hindi", "English", "Tamil", "Telugu", "Bengali", "Marathi", "Sanskrit"];

const AstrologersPage = () => {
  const [astrologers, setAstrologers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("rating");
  const [filters, setFilters] = useState({
    specializations: [],
    languages: [],
    onlineOnly: false,
    minRating: 0,
    maxRate: 100
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchAstrologers();
  }, [sortBy]);

  const fetchAstrologers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (sortBy) params.append("sort_by", sortBy);
      if (filters.onlineOnly) params.append("is_online", "true");
      if (filters.minRating > 0) params.append("min_rating", filters.minRating);
      if (filters.maxRate < 100) params.append("max_rate", filters.maxRate);
      
      const res = await axios.get(`${API}/astrologers?${params.toString()}`);
      setAstrologers(res.data);
    } catch (e) {
      console.error("Error fetching astrologers:", e);
    } finally {
      setLoading(false);
    }
  };

  const filteredAstrologers = astrologers.filter(astro => {
    if (searchQuery && !astro.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filters.specializations.length > 0 && !filters.specializations.some(s => astro.specializations.includes(s))) return false;
    if (filters.languages.length > 0 && !filters.languages.some(l => astro.languages.includes(l))) return false;
    if (filters.onlineOnly && !astro.is_online) return false;
    if (astro.rating < filters.minRating) return false;
    if (astro.rate_per_minute > filters.maxRate) return false;
    return true;
  });

  const toggleFilter = (type, value) => {
    setFilters(prev => ({
      ...prev,
      [type]: prev[type].includes(value) 
        ? prev[type].filter(v => v !== value)
        : [...prev[type], value]
    }));
  };

  const clearFilters = () => {
    setFilters({
      specializations: [],
      languages: [],
      onlineOnly: false,
      minRating: 0,
      maxRate: 100
    });
    setSearchQuery("");
  };

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Specializations */}
      <div>
        <h4 className="font-semibold text-white mb-3">Specialization</h4>
        <div className="space-y-2">
          {specializations.map(spec => (
            <label key={spec} className="flex items-center gap-2 cursor-pointer">
              <Checkbox 
                checked={filters.specializations.includes(spec)}
                onCheckedChange={() => toggleFilter("specializations", spec)}
                className="border-cosmic-purple/50 data-[state=checked]:bg-cosmic-gold data-[state=checked]:border-cosmic-gold"
              />
              <span className="text-sm text-zinc-300">{spec}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Languages */}
      <div>
        <h4 className="font-semibold text-white mb-3">Language</h4>
        <div className="space-y-2">
          {languages.map(lang => (
            <label key={lang} className="flex items-center gap-2 cursor-pointer">
              <Checkbox 
                checked={filters.languages.includes(lang)}
                onCheckedChange={() => toggleFilter("languages", lang)}
                className="border-cosmic-purple/50 data-[state=checked]:bg-cosmic-gold data-[state=checked]:border-cosmic-gold"
              />
              <span className="text-sm text-zinc-300">{lang}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Online Only */}
      <div>
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox 
            checked={filters.onlineOnly}
            onCheckedChange={(checked) => setFilters(prev => ({ ...prev, onlineOnly: checked }))}
            className="border-cosmic-purple/50 data-[state=checked]:bg-cosmic-gold data-[state=checked]:border-cosmic-gold"
          />
          <span className="text-sm text-zinc-300">Online Now Only</span>
        </label>
      </div>

      {/* Rating */}
      <div>
        <h4 className="font-semibold text-white mb-3">Minimum Rating: {filters.minRating}+</h4>
        <Slider
          value={[filters.minRating]}
          onValueChange={(value) => setFilters(prev => ({ ...prev, minRating: value[0] }))}
          max={5}
          step={0.5}
          className="w-full"
        />
      </div>

      {/* Price Range */}
      <div>
        <h4 className="font-semibold text-white mb-3">Max Rate: ₹{filters.maxRate}/min</h4>
        <Slider
          value={[filters.maxRate]}
          onValueChange={(value) => setFilters(prev => ({ ...prev, maxRate: value[0] }))}
          max={100}
          step={5}
          className="w-full"
        />
      </div>

      {/* Clear Filters */}
      <Button 
        variant="outline" 
        className="w-full border-cosmic-purple/50"
        onClick={clearFilters}
      >
        Clear All Filters
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen pt-20 lg:pt-24 pb-24 lg:pb-12" data-testid="astrologers-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-cinzel text-3xl sm:text-4xl font-bold text-white mb-2">
            Talk to <span className="text-gradient-gold">Expert Astrologers</span>
          </h1>
          <p className="text-zinc-400">Connect with verified Vedic astrologers instantly</p>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <Input
              placeholder="Search astrologers by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-cosmic-surface border-cosmic-purple/30 focus:border-cosmic-gold"
              data-testid="search-input"
            />
          </div>
          
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-48 bg-cosmic-surface border-cosmic-purple/30" data-testid="sort-select">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className="bg-cosmic-surface border-cosmic-purple/30">
              <SelectItem value="rating">Highest Rated</SelectItem>
              <SelectItem value="price">Lowest Price</SelectItem>
              <SelectItem value="popular">Most Popular</SelectItem>
            </SelectContent>
          </Select>

          {/* Mobile Filter Button */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="lg:hidden border-cosmic-purple/50" data-testid="mobile-filter-btn">
                <Filter className="w-4 h-4 mr-2" />
                Filters
                {(filters.specializations.length > 0 || filters.languages.length > 0) && (
                  <Badge className="ml-2 bg-cosmic-gold text-cosmic-dark">
                    {filters.specializations.length + filters.languages.length}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="bg-cosmic-dark border-cosmic-purple/30 w-80">
              <SheetHeader>
                <SheetTitle className="text-white font-cinzel">Filters</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <FilterContent />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Active Filters */}
        {(filters.specializations.length > 0 || filters.languages.length > 0) && (
          <div className="flex flex-wrap gap-2 mb-6">
            {filters.specializations.map(spec => (
              <Badge 
                key={spec} 
                className="bg-cosmic-indigo/50 text-white cursor-pointer hover:bg-cosmic-indigo"
                onClick={() => toggleFilter("specializations", spec)}
              >
                {spec} <X className="w-3 h-3 ml-1" />
              </Badge>
            ))}
            {filters.languages.map(lang => (
              <Badge 
                key={lang} 
                className="bg-cosmic-purple/50 text-white cursor-pointer hover:bg-cosmic-purple"
                onClick={() => toggleFilter("languages", lang)}
              >
                {lang} <X className="w-3 h-3 ml-1" />
              </Badge>
            ))}
          </div>
        )}

        <div className="flex gap-8">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="glass rounded-xl p-6 sticky top-28">
              <h3 className="font-cinzel font-semibold text-white mb-6">Filters</h3>
              <FilterContent />
            </div>
          </aside>

          {/* Astrologer Grid */}
          <div className="flex-1">
            <p className="text-sm text-zinc-400 mb-4">
              Showing {filteredAstrologers.length} astrologers
            </p>

            {loading ? (
              <div className="grid sm:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="cosmic-card rounded-xl h-64 shimmer" />
                ))}
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-6">
                {filteredAstrologers.map(astro => (
                  <Card key={astro.id} className="cosmic-card overflow-hidden" data-testid={`astrologer-card-${astro.id}`}>
                    <CardContent className="p-0">
                      <div className="flex">
                        <div className="w-2/5 relative">
                          <img 
                            src={astro.photo_url} 
                            alt={astro.name}
                            className="w-full h-full object-cover min-h-[220px]"
                          />
                          <div className={`absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-full ${astro.is_online ? 'bg-green-500/80' : 'bg-gray-500/80'}`}>
                            <span className={`w-2 h-2 rounded-full ${astro.is_online ? 'bg-white animate-pulse' : 'bg-gray-300'}`}></span>
                            <span className="text-xs text-white font-medium">{astro.is_online ? 'Online' : 'Offline'}</span>
                          </div>
                          {astro.is_verified && (
                            <Badge className="absolute top-3 right-3 bg-blue-500/90 text-xs">Verified</Badge>
                          )}
                        </div>
                        <div className="w-3/5 p-4 flex flex-col">
                          <div className="flex-1">
                            <h3 className="font-cinzel font-semibold text-white text-lg mb-1">{astro.name}</h3>
                            <div className="flex flex-wrap gap-1 mb-2">
                              {astro.specializations.slice(0, 3).map((spec, idx) => (
                                <Badge key={idx} variant="outline" className="text-[10px] border-cosmic-purple/30 text-zinc-400">
                                  {spec}
                                </Badge>
                              ))}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-zinc-400 mb-1">
                              <span className="flex items-center gap-1">
                                {astro.languages.slice(0, 2).join(", ")}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-zinc-400 mb-3">
                              <span className="flex items-center gap-1">
                                <Star className="w-3 h-3 text-cosmic-gold fill-cosmic-gold" />
                                {astro.rating} ({astro.total_reviews})
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {astro.experience_years} yrs
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mb-3">
                              <Users className="w-3 h-3 text-zinc-400" />
                              <span className="text-xs text-zinc-400">{astro.total_sessions.toLocaleString()} sessions</span>
                            </div>
                          </div>
                          
                          <div>
                            <p className="text-cosmic-gold font-bold text-lg mb-3">₹{astro.rate_per_minute}/min</p>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                className={`flex-1 text-xs ${astro.is_online ? 'btn-gold' : 'bg-zinc-700 cursor-not-allowed'}`}
                                disabled={!astro.is_online}
                                data-testid={`chat-btn-${astro.id}`}
                              >
                                <MessageCircle className="w-3 h-3 mr-1" /> Chat
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className={`flex-1 text-xs ${astro.is_online ? 'border-cosmic-purple/50 hover:bg-cosmic-purple/20' : 'border-zinc-700 cursor-not-allowed'}`}
                                disabled={!astro.is_online}
                                data-testid={`call-btn-${astro.id}`}
                              >
                                <Phone className="w-3 h-3 mr-1" /> Call
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {!loading && filteredAstrologers.length === 0 && (
              <div className="text-center py-16">
                <p className="text-zinc-400 mb-4">No astrologers found matching your criteria</p>
                <Button variant="outline" onClick={clearFilters} className="border-cosmic-purple/50">
                  Clear Filters
                </Button>
              </div>
            )}

            {/* Apply as Astrologer banner */}
            <div
              className="mt-12 rounded-2xl border border-[#D4A017]/40 bg-gradient-to-r from-[#1A1730] to-[#231F3A] p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-4 justify-between"
              data-testid="astrologers-apply-banner"
            >
              <div className="flex-1 text-center sm:text-left">
                <p className="text-[11px] uppercase tracking-[0.3em] text-[#F5C842] mb-1">For Professionals</p>
                <h3 className="font-cinzel text-lg sm:text-xl font-bold text-white mb-1">
                  Are you an astrologer?
                </h3>
                <p className="text-sm text-zinc-400">
                  Join AstroVedic AI and reach lakhs of seekers across India.
                </p>
              </div>
              <Link to="/apply-astrologer" data-testid="astrologers-apply-cta">
                <Button className="bg-gradient-to-r from-[#D4A017] to-[#F5C842] text-[#0D0B1E] rounded-full px-6 py-5 font-semibold hover:scale-[1.03] transition-transform">
                  Apply Now <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AstrologersPage;
