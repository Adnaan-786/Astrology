import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Star, User, Phone, Calendar, MapPin, Clock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import apiClient from "@/lib/apiClient";

const RASHIS = [
  { name: "मेष (Aries)", value: "aries" },
  { name: "वृषभ (Taurus)", value: "taurus" },
  { name: "मिथुन (Gemini)", value: "gemini" },
  { name: "कर्क (Cancer)", value: "cancer" },
  { name: "सिंह (Leo)", value: "leo" },
  { name: "कन्या (Virgo)", value: "virgo" },
  { name: "तुला (Libra)", value: "libra" },
  { name: "वृश्चिक (Scorpio)", value: "scorpio" },
  { name: "धनु (Sagittarius)", value: "sagittarius" },
  { name: "मकर (Capricorn)", value: "capricorn" },
  { name: "कुम्भ (Aquarius)", value: "aquarius" },
  { name: "मीन (Pisces)", value: "pisces" },
];

const OnboardingPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    dob: "",
    tob: "",
    pob: "",
    gender: "",
    rashi: "",
    preferred_language: "hindi",
  });

  const updateField = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await apiClient.post("/auth/profile", form);
      // Update local storage user
      try {
        const stored = JSON.parse(localStorage.getItem("astrovedic_user") || "{}");
        const updated = { ...stored, ...form, is_onboarded: true };
        localStorage.setItem("astrovedic_user", JSON.stringify(updated));
      } catch (_) {}
      toast.success("Profile saved! Welcome to AstroVedic AI ✨");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to save profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const canNext = () => {
    if (step === 1) return form.name && form.phone;
    if (step === 2) return form.dob;
    return true;
  };

  return (
    <div className="min-h-screen av-bg flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="size-10 rounded-lg bg-[#D4A017]/15 flex items-center justify-center">
            <Star className="size-6 text-[#F5C842]" />
          </div>
          <span className="font-cinzel text-2xl av-text font-bold">AstroVedic AI</span>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-8 px-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex-1">
              <div className={`h-1.5 rounded-full transition-all duration-500 ${
                s <= step ? "bg-gradient-to-r from-[#D4A017] to-[#F5C842]" : "bg-white/10"
              }`} />
              <p className={`text-xs mt-1 text-center ${s <= step ? "av-text" : "av-text-3"}`}>
                {s === 1 ? "Basic Info" : s === 2 ? "Birth Details" : "Preferences"}
              </p>
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="av-surface av-card-border rounded-2xl p-6 sm:p-8">
          <h2 className="font-cinzel text-xl font-bold av-text mb-1">
            {step === 1 ? "Tell us about yourself" : step === 2 ? "Birth Details" : "Your Preferences"}
          </h2>
          <p className="text-sm av-text-2 mb-6">
            {step === 1
              ? "We need a few details to personalize your experience"
              : step === 2
              ? "Accurate birth details help create precise astrological readings"
              : "Almost done! Choose your preferences"}
          </p>

          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium av-text">Full Name *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 av-text-3" />
                  <Input placeholder="Your full name" value={form.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    className="h-12 pl-10 av-surface av-card-border focus:border-[#D4A017]" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium av-text">Phone Number *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 av-text-3" />
                  <Input placeholder="+91 98765 43210" value={form.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    className="h-12 pl-10 av-surface av-card-border focus:border-[#D4A017]" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium av-text">Gender</Label>
                <div className="grid grid-cols-3 gap-2">
                  {["male", "female", "other"].map((g) => (
                    <button key={g} type="button"
                      onClick={() => updateField("gender", g)}
                      className={`h-10 rounded-lg text-sm font-medium capitalize transition-all
                        ${form.gender === g
                          ? "bg-gradient-to-r from-[#D4A017] to-[#F5C842] text-[#0D0B1E]"
                          : "av-surface av-card-border av-text-2 hover:border-[#D4A017]/50"
                        }`}
                    >{g}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Birth Details */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium av-text">Date of Birth *</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 av-text-3" />
                  <Input type="date" value={form.dob}
                    onChange={(e) => updateField("dob", e.target.value)}
                    className="h-12 pl-10 av-surface av-card-border focus:border-[#D4A017]" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium av-text">Time of Birth</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 av-text-3" />
                  <Input type="time" value={form.tob}
                    onChange={(e) => updateField("tob", e.target.value)}
                    className="h-12 pl-10 av-surface av-card-border focus:border-[#D4A017]" />
                </div>
                <p className="text-xs av-text-3">Accurate time helps in precise Kundli creation</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium av-text">Place of Birth</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 av-text-3" />
                  <Input placeholder="e.g. Delhi, India" value={form.pob}
                    onChange={(e) => updateField("pob", e.target.value)}
                    className="h-12 pl-10 av-surface av-card-border focus:border-[#D4A017]" />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Preferences */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium av-text">Your Rashi (Zodiac Sign)</Label>
                <div className="grid grid-cols-3 gap-2">
                  {RASHIS.map((r) => (
                    <button key={r.value} type="button"
                      onClick={() => updateField("rashi", r.value)}
                      className={`h-10 rounded-lg text-xs font-medium transition-all
                        ${form.rashi === r.value
                          ? "bg-gradient-to-r from-[#D4A017] to-[#F5C842] text-[#0D0B1E]"
                          : "av-surface av-card-border av-text-2 hover:border-[#D4A017]/50"
                        }`}
                    >{r.name}</button>
                  ))}
                </div>
                <p className="text-xs av-text-3 mt-1">Don't know? We'll calculate it from your birth details ✨</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium av-text">Preferred Language</Label>
                <div className="grid grid-cols-2 gap-2">
                  {[{ label: "हिंदी", value: "hindi" }, { label: "English", value: "english" }].map((l) => (
                    <button key={l.value} type="button"
                      onClick={() => updateField("preferred_language", l.value)}
                      className={`h-10 rounded-lg text-sm font-medium transition-all
                        ${form.preferred_language === l.value
                          ? "bg-gradient-to-r from-[#D4A017] to-[#F5C842] text-[#0D0B1E]"
                          : "av-surface av-card-border av-text-2 hover:border-[#D4A017]/50"
                        }`}
                    >{l.label}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center gap-3 mt-8">
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep(step - 1)}
                className="flex-1 h-12 av-surface av-card-border">
                Back
              </Button>
            )}
            {step < 3 ? (
              <Button onClick={() => setStep(step + 1)} disabled={!canNext()}
                className="flex-1 h-12 bg-gradient-to-r from-[#D4A017] to-[#F5C842] text-[#0D0B1E] font-semibold rounded-full hover:shadow-lg transition-all">
                Continue
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading}
                className="flex-1 h-12 bg-gradient-to-r from-[#D4A017] to-[#F5C842] text-[#0D0B1E] font-semibold rounded-full hover:shadow-lg transition-all">
                <Sparkles className="w-4 h-4 mr-2" />
                {loading ? "Saving..." : "Start My Journey"}
              </Button>
            )}
          </div>

          {/* Skip */}
          <button onClick={() => navigate("/dashboard")}
            className="w-full text-center text-sm av-text-3 hover:av-text mt-4 py-2">
            Skip for now →
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
