import { useState, useEffect } from "react";
import axios from "axios";
import { API } from "@/App";
import { toast } from "sonner";
import {
  Calendar, Save, ChevronLeft, ChevronRight, Check, Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const rashiList = [
  { num: 1, name: "Aries", hindi: "मेष", symbol: "♈" },
  { num: 2, name: "Taurus", hindi: "वृषभ", symbol: "♉" },
  { num: 3, name: "Gemini", hindi: "मिथुन", symbol: "♊" },
  { num: 4, name: "Cancer", hindi: "कर्क", symbol: "♋" },
  { num: 5, name: "Leo", hindi: "सिंह", symbol: "♌" },
  { num: 6, name: "Virgo", hindi: "कन्या", symbol: "♍" },
  { num: 7, name: "Libra", hindi: "तुला", symbol: "♎" },
  { num: 8, name: "Scorpio", hindi: "वृश्चिक", symbol: "♏" },
  { num: 9, name: "Sagittarius", hindi: "धनु", symbol: "♐" },
  { num: 10, name: "Capricorn", hindi: "मकर", symbol: "♑" },
  { num: 11, name: "Aquarius", hindi: "कुंभ", symbol: "♒" },
  { num: 12, name: "Pisces", hindi: "मीन", symbol: "♓" },
];

const colors = ["Red", "Blue", "Green", "Yellow", "Orange", "White", "Pink", "Purple", "Gold", "Silver", "Maroon", "Turquoise"];
const gemstones = ["Ruby", "Pearl", "Coral", "Emerald", "Yellow Sapphire", "Diamond", "Blue Sapphire", "Hessonite", "Cat's Eye"];
const directions = ["North", "South", "East", "West", "Northeast", "Northwest", "Southeast", "Southwest"];

const AdminHoroscope = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedRashi, setSelectedRashi] = useState(1);
  const [horoscopes, setHoroscopes] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    content_english: "",
    content_hindi: "",
    career_score: 75,
    love_score: 75,
    health_score: 75,
    financial_score: 75,
    mood_score: 75,
    lucky_color: "Gold",
    lucky_number: 7,
    lucky_gemstone: "Ruby",
    lucky_direction: "East",
    lucky_time: "10:00 AM - 12:00 PM",
    compatibility_rashi: "Leo"
  });

  useEffect(() => {
    fetchHoroscopes();
  }, [selectedDate]);

  useEffect(() => {
    // Load data for selected rashi
    const rashiData = horoscopes[selectedRashi];
    if (rashiData) {
      setFormData({
        content_english: rashiData.content_english || "",
        content_hindi: rashiData.content_hindi || "",
        career_score: rashiData.career_score || 75,
        love_score: rashiData.love_score || 75,
        health_score: rashiData.health_score || 75,
        financial_score: rashiData.financial_score || 75,
        mood_score: rashiData.mood_score || 75,
        lucky_color: rashiData.lucky_color || "Gold",
        lucky_number: rashiData.lucky_number || 7,
        lucky_gemstone: rashiData.lucky_gemstone || "Ruby",
        lucky_direction: rashiData.lucky_direction || "East",
        lucky_time: rashiData.lucky_time || "10:00 AM - 12:00 PM",
        compatibility_rashi: rashiData.compatibility_rashi || "Leo"
      });
    } else {
      // Reset to defaults
      setFormData({
        content_english: "",
        content_hindi: "",
        career_score: 75,
        love_score: 75,
        health_score: 75,
        financial_score: 75,
        mood_score: 75,
        lucky_color: "Gold",
        lucky_number: 7,
        lucky_gemstone: "Ruby",
        lucky_direction: "East",
        lucky_time: "10:00 AM - 12:00 PM",
        compatibility_rashi: "Leo"
      });
    }
  }, [selectedRashi, horoscopes]);

  const fetchHoroscopes = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/admin/horoscopes?date=${selectedDate}`);
      const dataMap = {};
      (res.data || []).forEach(h => {
        dataMap[h.rashi] = h;
      });
      setHoroscopes(dataMap);
    } catch (e) {
      console.error("Error fetching horoscopes:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const rashi = rashiList.find(r => r.num === selectedRashi);
      const payload = {
        ...formData,
        rashi: selectedRashi,
        rashi_name: rashi.name,
        rashi_name_hindi: rashi.hindi,
        date: selectedDate
      };
      
      await axios.post(`${API}/admin/horoscopes`, payload);
      toast.success(`${rashi.name} horoscope saved!`);
      fetchHoroscopes();
    } catch (e) {
      toast.error("Failed to save horoscope");
    } finally {
      setSaving(false);
    }
  };

  const handlePublishAll = async () => {
    try {
      await axios.post(`${API}/admin/horoscopes/publish-all`, { date: selectedDate });
      toast.success("All horoscopes published!");
    } catch (e) {
      toast.error("Failed to publish horoscopes");
    }
  };

  const currentRashi = rashiList.find(r => r.num === selectedRashi);

  return (
    <div data-testid="admin-horoscope-page">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Daily Horoscope Management</h1>
          <p className="text-slate-400">Publish daily predictions for all 12 rashis</p>
        </div>
        <Button 
          className="bg-green-600 hover:bg-green-700"
          onClick={handlePublishAll}
          data-testid="publish-all-btn"
        >
          <Globe className="w-4 h-4 mr-2" /> Publish All for {selectedDate}
        </Button>
      </div>

      {/* Date Selector */}
      <Card className="bg-slate-800/50 border-slate-700 mb-6">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Calendar className="w-5 h-5 text-purple-400" />
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-slate-900 border-slate-700 w-48"
            />
            <span className="text-slate-400">
              {new Date(selectedDate).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Rashi Tabs */}
        <Card className="bg-slate-800/50 border-slate-700 lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-white">Select Rashi</CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <div className="space-y-1">
              {rashiList.map((rashi) => {
                const hasData = !!horoscopes[rashi.num];
                return (
                  <button
                    key={rashi.num}
                    onClick={() => setSelectedRashi(rashi.num)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      selectedRashi === rashi.num
                        ? 'bg-purple-600 text-white'
                        : 'text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <span className="text-xl">{rashi.symbol}</span>
                    <span className="flex-1 text-left text-sm">{rashi.name}</span>
                    {hasData && <Check className="w-4 h-4 text-green-400" />}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Editor */}
        <Card className="bg-slate-800/50 border-slate-700 lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{currentRashi?.symbol}</span>
              <div>
                <CardTitle className="text-lg text-white">{currentRashi?.name}</CardTitle>
                <p className="text-slate-400 font-hindi">{currentRashi?.hindi}</p>
              </div>
            </div>
            <Button 
              onClick={handleSave} 
              disabled={saving}
              className="bg-purple-600 hover:bg-purple-700"
              data-testid="save-horoscope-btn"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Saving..." : "Save"}
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Content */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">English Content</label>
                <Textarea
                  value={formData.content_english}
                  onChange={(e) => setFormData(p => ({ ...p, content_english: e.target.value }))}
                  className="bg-slate-900 border-slate-700"
                  rows={5}
                  placeholder="Today brings positive energy..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Hindi Content</label>
                <Textarea
                  value={formData.content_hindi}
                  onChange={(e) => setFormData(p => ({ ...p, content_hindi: e.target.value }))}
                  className="bg-slate-900 border-slate-700 font-hindi"
                  rows={5}
                  placeholder="आज का दिन शुभ है..."
                />
              </div>
            </div>

            {/* Scores */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-4">Scores (0-100)</label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                  { key: "career_score", label: "Career" },
                  { key: "love_score", label: "Love" },
                  { key: "health_score", label: "Health" },
                  { key: "financial_score", label: "Finance" },
                  { key: "mood_score", label: "Mood" },
                ].map((score) => (
                  <div key={score.key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">{score.label}</span>
                      <span className="text-xs text-white font-medium">{formData[score.key]}</span>
                    </div>
                    <Slider
                      value={[formData[score.key]]}
                      onValueChange={(v) => setFormData(p => ({ ...p, [score.key]: v[0] }))}
                      max={100}
                      step={5}
                      className="w-full"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Lucky Elements */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-4">Lucky Elements</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Lucky Color</label>
                  <Select
                    value={formData.lucky_color}
                    onValueChange={(v) => setFormData(p => ({ ...p, lucky_color: v }))}
                  >
                    <SelectTrigger className="bg-slate-900 border-slate-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700">
                      {colors.map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Lucky Number</label>
                  <Input
                    type="number"
                    value={formData.lucky_number}
                    onChange={(e) => setFormData(p => ({ ...p, lucky_number: parseInt(e.target.value) || 1 }))}
                    className="bg-slate-900 border-slate-700"
                    min="1"
                    max="9"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Lucky Gemstone</label>
                  <Select
                    value={formData.lucky_gemstone}
                    onValueChange={(v) => setFormData(p => ({ ...p, lucky_gemstone: v }))}
                  >
                    <SelectTrigger className="bg-slate-900 border-slate-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700">
                      {gemstones.map(g => (
                        <SelectItem key={g} value={g}>{g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Lucky Direction</label>
                  <Select
                    value={formData.lucky_direction}
                    onValueChange={(v) => setFormData(p => ({ ...p, lucky_direction: v }))}
                  >
                    <SelectTrigger className="bg-slate-900 border-slate-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700">
                      {directions.map(d => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Lucky Time</label>
                  <Input
                    value={formData.lucky_time}
                    onChange={(e) => setFormData(p => ({ ...p, lucky_time: e.target.value }))}
                    className="bg-slate-900 border-slate-700"
                    placeholder="10:00 AM - 12:00 PM"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Compatible Rashi</label>
                  <Select
                    value={formData.compatibility_rashi}
                    onValueChange={(v) => setFormData(p => ({ ...p, compatibility_rashi: v }))}
                  >
                    <SelectTrigger className="bg-slate-900 border-slate-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700">
                      {rashiList.map(r => (
                        <SelectItem key={r.num} value={r.name}>{r.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminHoroscope;
