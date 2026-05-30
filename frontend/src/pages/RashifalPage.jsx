import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import { API } from "@/App";
import { 
  Moon, Sun, Star, Heart, Briefcase, Activity, 
  Wallet, Compass, Clock, Gem, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RashiIcon } from "@/components/ZodiacIcons";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const rashiData = [
  { num: 1, name: "Aries", hindi: "मेष", symbol: "♈", element: "Fire", ruler: "Mars", dates: "Mar 21 - Apr 19" },
  { num: 2, name: "Taurus", hindi: "वृषभ", symbol: "♉", element: "Earth", ruler: "Venus", dates: "Apr 20 - May 20" },
  { num: 3, name: "Gemini", hindi: "मिथुन", symbol: "♊", element: "Air", ruler: "Mercury", dates: "May 21 - Jun 20" },
  { num: 4, name: "Cancer", hindi: "कर्क", symbol: "♋", element: "Water", ruler: "Moon", dates: "Jun 21 - Jul 22" },
  { num: 5, name: "Leo", hindi: "सिंह", symbol: "♌", element: "Fire", ruler: "Sun", dates: "Jul 23 - Aug 22" },
  { num: 6, name: "Virgo", hindi: "कन्या", symbol: "♍", element: "Earth", ruler: "Mercury", dates: "Aug 23 - Sep 22" },
  { num: 7, name: "Libra", hindi: "तुला", symbol: "♎", element: "Air", ruler: "Venus", dates: "Sep 23 - Oct 22" },
  { num: 8, name: "Scorpio", hindi: "वृश्चिक", symbol: "♏", element: "Water", ruler: "Mars", dates: "Oct 23 - Nov 21" },
  { num: 9, name: "Sagittarius", hindi: "धनु", symbol: "♐", element: "Fire", ruler: "Jupiter", dates: "Nov 22 - Dec 21" },
  { num: 10, name: "Capricorn", hindi: "मकर", symbol: "♑", element: "Earth", ruler: "Saturn", dates: "Dec 22 - Jan 19" },
  { num: 11, name: "Aquarius", hindi: "कुंभ", symbol: "♒", element: "Air", ruler: "Saturn", dates: "Jan 20 - Feb 18" },
  { num: 12, name: "Pisces", hindi: "मीन", symbol: "♓", element: "Water", ruler: "Jupiter", dates: "Feb 19 - Mar 20" },
];

const RashifalPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [horoscopes, setHoroscopes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRashi, setSelectedRashi] = useState(null);
  const [language, setLanguage] = useState("english");

  useEffect(() => {
    fetchHoroscopes();
  }, []);

  useEffect(() => {
    const rashiParam = searchParams.get("rashi");
    if (rashiParam) {
      const rashi = rashiData.find(r => r.num === parseInt(rashiParam));
      if (rashi) {
        const horoscope = horoscopes.find(h => h.rashi === rashi.num);
        setSelectedRashi({ ...rashi, horoscope });
      }
    }
  }, [searchParams, horoscopes]);

  const fetchHoroscopes = async () => {
    try {
      const res = await axios.get(`${API}/horoscopes/today`);
      setHoroscopes(res.data);
    } catch (e) {
      console.error("Error fetching horoscopes:", e);
    } finally {
      setLoading(false);
    }
  };

  const openRashiDetail = (rashi) => {
    const horoscope = horoscopes.find(h => h.rashi === rashi.num);
    setSelectedRashi({ ...rashi, horoscope });
    setSearchParams({ rashi: rashi.num });
  };

  const closeRashiDetail = () => {
    setSelectedRashi(null);
    setSearchParams({});
  };

  const getElementColor = (element) => {
    switch (element) {
      case "Fire": return "from-red-500 to-orange-500";
      case "Earth": return "from-green-500 to-emerald-500";
      case "Air": return "from-blue-400 to-cyan-400";
      case "Water": return "from-blue-600 to-indigo-500";
      default: return "from-cosmic-purple to-cosmic-gold";
    }
  };

  return (
    <div className="min-h-screen pt-20 lg:pt-24 pb-24 lg:pb-12" data-testid="rashifal-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-cinzel text-3xl sm:text-4xl font-bold text-white mb-2">
            Daily <span className="text-gradient-gold">Rashifal</span>
          </h1>
          <p className="text-zinc-400">दैनिक राशिफल - आज का भविष्यफल</p>
          <p className="text-sm text-zinc-500 mt-2">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Rashi Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6 mb-12">
          {rashiData.map((rashi) => {
            const horoscope = horoscopes.find(h => h.rashi === rashi.num);
            return (
              <Card 
                key={rashi.num}
                className="cosmic-card cursor-pointer hover:border-cosmic-gold/50 transition-all group"
                onClick={() => openRashiDetail(rashi)}
                data-testid={`rashi-card-${rashi.num}`}
              >
                <CardContent className="p-4 sm:p-6 text-center">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-3 rounded-2xl bg-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                    <RashiIcon rashi={rashi.num} size={64} />
                  </div>
                  <h3 className="font-cinzel font-semibold text-white mb-1">{rashi.name}</h3>
                  <p className="text-sm text-zinc-400 font-hindi">{rashi.hindi}</p>
                  {horoscope && (
                    <div className="mt-3 flex justify-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star}
                          className={`w-3 h-3 ${star <= Math.round(horoscope.mood_score / 20) ? 'text-cosmic-gold fill-cosmic-gold' : 'text-zinc-600'}`}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Info Section */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <Card className="cosmic-card">
            <CardContent className="p-6">
              <h3 className="font-cinzel font-semibold text-white mb-4 flex items-center gap-2">
                <Sun className="w-5 h-5 text-cosmic-gold" />
                What is Rashifal?
              </h3>
              <p className="text-zinc-300 text-sm leading-relaxed">
                Rashifal (राशिफल) is your daily horoscope based on Vedic astrology. It predicts how planetary 
                movements affect your zodiac sign (Rashi) each day, covering aspects like career, love, health, 
                and finance. Unlike Western astrology that uses Sun signs, Vedic astrology primarily uses Moon signs.
              </p>
            </CardContent>
          </Card>
          
          <Card className="cosmic-card">
            <CardContent className="p-6">
              <h3 className="font-cinzel font-semibold text-white mb-4 flex items-center gap-2">
                <Moon className="w-5 h-5 text-cosmic-gold" />
                How to Find Your Rashi?
              </h3>
              <p className="text-zinc-300 text-sm leading-relaxed">
                Your Rashi (Moon Sign) is determined by the position of the Moon at your birth time. 
                It's different from your Sun sign used in Western astrology. For accurate Rashi determination, 
                you need your exact birth date, time, and place. Try our free Kundli generator in NakshatraAI!
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Rashi Detail Dialog */}
        <Dialog open={!!selectedRashi} onOpenChange={closeRashiDetail}>
          <DialogContent className="bg-cosmic-dark border-cosmic-purple/30 max-w-2xl max-h-[90vh] overflow-y-auto">
            {selectedRashi && (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-2xl bg-white flex items-center justify-center shadow-md flex-shrink-0">
                      <RashiIcon rashi={selectedRashi.num} size={64} />
                    </div>
                    <div>
                      <DialogTitle className="font-cinzel text-2xl text-white">
                        {selectedRashi.name}
                        <span className="text-cosmic-gold ml-2 font-hindi">{selectedRashi.hindi}</span>
                      </DialogTitle>
                      <p className="text-sm text-zinc-400">{selectedRashi.dates} • {selectedRashi.element} Sign</p>
                    </div>
                  </div>
                </DialogHeader>

                {selectedRashi.horoscope ? (
                  <div className="mt-6 space-y-6">
                    {/* Language Toggle */}
                    <div className="flex justify-center">
                      <Tabs value={language} onValueChange={setLanguage}>
                        <TabsList className="bg-cosmic-surface">
                          <TabsTrigger value="english" className="data-[state=active]:bg-cosmic-indigo">English</TabsTrigger>
                          <TabsTrigger value="hindi" className="data-[state=active]:bg-cosmic-indigo font-hindi">हिंदी</TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </div>

                    {/* Horoscope Content */}
                    <Card className="glass border-cosmic-purple/30">
                      <CardContent className="p-6">
                        <h4 className="font-cinzel font-semibold text-white mb-3">
                          {language === "hindi" ? "आज का राशिफल" : "Today's Prediction"}
                        </h4>
                        <p className={`text-zinc-300 leading-relaxed ${language === "hindi" ? "font-hindi" : ""}`}>
                          {language === "hindi" 
                            ? selectedRashi.horoscope.content_hindi 
                            : selectedRashi.horoscope.content_english}
                        </p>
                      </CardContent>
                    </Card>

                    {/* Scores */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                      {[
                        { label: "Mood", icon: Heart, score: selectedRashi.horoscope.mood_score, color: "bg-pink-500" },
                        { label: "Career", icon: Briefcase, score: selectedRashi.horoscope.career_score, color: "bg-blue-500" },
                        { label: "Love", icon: Heart, score: selectedRashi.horoscope.love_score, color: "bg-red-500" },
                        { label: "Health", icon: Activity, score: selectedRashi.horoscope.health_score, color: "bg-green-500" },
                        { label: "Finance", icon: Wallet, score: selectedRashi.horoscope.financial_score, color: "bg-yellow-500" },
                      ].map((item, idx) => (
                        <div key={idx} className="text-center p-3 glass rounded-lg" data-testid={`score-${item.label.toLowerCase()}`}>
                          <item.icon className="w-5 h-5 mx-auto mb-2 text-zinc-400" />
                          <p className="text-xs text-zinc-400 mb-1">{item.label}</p>
                          <div className="score-bar">
                            <div 
                              className="score-bar-fill"
                              style={{ width: `${item.score}%` }}
                            />
                          </div>
                          <p className="text-sm font-bold text-white mt-1">{item.score}%</p>
                        </div>
                      ))}
                    </div>

                    {/* Lucky Elements */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <div className="p-4 glass rounded-lg text-center">
                        <div 
                          className="w-8 h-8 mx-auto mb-2 rounded-full"
                          style={{ backgroundColor: selectedRashi.horoscope.lucky_color.toLowerCase() }}
                        />
                        <p className="text-xs text-zinc-400">Lucky Color</p>
                        <p className="text-sm font-medium text-white">{selectedRashi.horoscope.lucky_color}</p>
                      </div>
                      <div className="p-4 glass rounded-lg text-center">
                        <p className="text-2xl font-bold text-cosmic-gold mb-2">{selectedRashi.horoscope.lucky_number}</p>
                        <p className="text-xs text-zinc-400">Lucky Number</p>
                      </div>
                      <div className="p-4 glass rounded-lg text-center">
                        <Gem className="w-6 h-6 mx-auto mb-2 text-cosmic-purple" />
                        <p className="text-xs text-zinc-400">Lucky Gemstone</p>
                        <p className="text-sm font-medium text-white">{selectedRashi.horoscope.lucky_gemstone}</p>
                      </div>
                      <div className="p-4 glass rounded-lg text-center">
                        <Compass className="w-6 h-6 mx-auto mb-2 text-cosmic-gold" />
                        <p className="text-xs text-zinc-400">Lucky Direction</p>
                        <p className="text-sm font-medium text-white">{selectedRashi.horoscope.lucky_direction}</p>
                      </div>
                      <div className="p-4 glass rounded-lg text-center">
                        <Clock className="w-6 h-6 mx-auto mb-2 text-green-400" />
                        <p className="text-xs text-zinc-400">Lucky Time</p>
                        <p className="text-sm font-medium text-white">{selectedRashi.horoscope.lucky_time}</p>
                      </div>
                      <div className="p-4 glass rounded-lg text-center">
                        <Star className="w-6 h-6 mx-auto mb-2 text-pink-400" />
                        <p className="text-xs text-zinc-400">Compatible Sign</p>
                        <p className="text-sm font-medium text-white">{selectedRashi.horoscope.compatibility_rashi}</p>
                      </div>
                    </div>

                    {/* Rashi Info */}
                    <Card className="glass border-cosmic-purple/30">
                      <CardContent className="p-4">
                        <h4 className="font-semibold text-white mb-2">About {selectedRashi.name}</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-zinc-400">Element</p>
                            <p className="text-white">{selectedRashi.element}</p>
                          </div>
                          <div>
                            <p className="text-zinc-400">Ruling Planet</p>
                            <p className="text-white">{selectedRashi.ruler}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-zinc-400">Horoscope data not available</p>
                  </div>
                )}
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default RashifalPage;
