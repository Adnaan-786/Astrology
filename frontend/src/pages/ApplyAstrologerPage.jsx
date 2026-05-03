import { useState, useRef } from "react";
import axios from "axios";
import { API } from "@/App";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  Sparkles, IndianRupee, Smartphone, Star, CheckCircle2,
  Upload, FileText, Image as ImageIcon, Shield, Award, User as UserIcon,
  Mail, Phone, MapPin, CalendarDays, Briefcase, Languages,
  GraduationCap, Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa",
  "Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala",
  "Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland",
  "Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura",
  "Uttar Pradesh","Uttarakhand","West Bengal",
  "Delhi","Jammu & Kashmir","Ladakh","Chandigarh","Puducherry",
  "Andaman & Nicobar Islands","Dadra & Nagar Haveli and Daman & Diu","Lakshadweep",
];

const SPECIALISATIONS = [
  "Kundli Reading / Birth Chart Analysis",
  "Marriage & Compatibility (Kundli Milan)",
  "Career & Profession Guidance",
  "Love & Relationships",
  "Vastu Shastra",
  "Numerology",
  "Tarot Card Reading",
  "Palmistry (Hast Rekha)",
  "Face Reading (Samudrik Shastra)",
  "Prashna Kundli",
  "Medical Astrology",
  "Financial Astrology",
  "Nadi Astrology",
  "Lal Kitab",
];

const LANGUAGES = [
  "Hindi","English","Tamil","Telugu","Bengali","Marathi","Gujarati",
  "Kannada","Malayalam","Punjabi","Rajasthani","Sanskrit",
];

const MAX_DOC_BYTES = 5 * 1024 * 1024;   // 5 MB
const MAX_PHOTO_BYTES = 2 * 1024 * 1024; // 2 MB
const ACCEPT_DOCS = "image/jpeg,image/png,application/pdf";
const ACCEPT_IMG = "image/jpeg,image/png";

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
}

function maskAadhaar(v) {
  const d = (v || "").replace(/\D/g, "").slice(0, 12);
  return d.replace(/(.{4})(?=.)/g, "$1 ");
}

function FileUploader({ label, accept, maxBytes, value, onChange, testId, hint }) {
  const inputRef = useRef(null);
  const handle = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > maxBytes) {
      toast.error(`${label}: file too large (max ${Math.round(maxBytes / 1024 / 1024)}MB)`);
      return;
    }
    const b64 = await fileToBase64(f);
    onChange({ name: f.name, type: f.type, size: f.size, dataUrl: b64 });
  };
  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-[#2D1B69] bg-[#231F3A] hover:border-[#D4A017] transition-colors text-left"
        data-testid={testId}
      >
        <span className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-lg bg-[#D4A017]/15 border border-[#D4A017]/30 flex items-center justify-center">
            {accept.includes("pdf") ? (
              <FileText className="w-4 h-4 text-[#F5C842]" />
            ) : (
              <ImageIcon className="w-4 h-4 text-[#F5C842]" />
            )}
          </span>
          <span className="text-sm">
            <span className="block text-white font-medium">
              {value ? value.name : `Upload ${label}`}
            </span>
            <span className="text-[11px] text-zinc-400">
              {hint || `Max ${Math.round(maxBytes / 1024 / 1024)}MB · ${accept.split(",").map((t) => t.split("/").pop()).join(", ")}`}
            </span>
          </span>
        </span>
        <Upload className="w-4 h-4 text-zinc-400" />
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handle}
        className="hidden"
      />
      {value && value.type?.startsWith("image/") && (
        <img
          src={value.dataUrl}
          alt={value.name}
          className="mt-2 max-h-32 rounded-lg border border-[#2D1B69]"
        />
      )}
    </div>
  );
}

export default function ApplyAstrologerPage() {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(null); // { id }
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    date_of_birth: "",
    gender: "",
    city: "",
    state: "",
    years_of_experience: "",
    rate_per_minute: "",
    available_hours: "",
    specializations: [],
    languages: [],
    education_qualification: "",
    astrology_certifications: "",
    about_yourself: "",
    aadhaar_number: "",
    pan_number: "",
    profile_photo: null,
    aadhaar_front: null,
    aadhaar_back: null,
    pan_card: null,
    certificate: null,
    youtube: "",
    instagram: "",
    website: "",
    agreement_accepted: false,
  });
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const toggleArr = (k, val) =>
    setForm((p) => {
      const arr = p[k] || [];
      return {
        ...p,
        [k]: arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val],
      };
    });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.agreement_accepted) {
      toast.error("Please accept the agreement to continue");
      return;
    }
    if (!form.profile_photo || !form.aadhaar_front || !form.aadhaar_back || !form.pan_card) {
      toast.error("All required documents must be uploaded");
      return;
    }
    if ((form.about_yourself || "").trim().length < 100) {
      toast.error("'About yourself' must be at least 100 characters");
      return;
    }
    if (!form.specializations.length) {
      toast.error("Please pick at least one specialisation");
      return;
    }
    if (!form.languages.length) {
      toast.error("Please pick at least one language");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        full_name: form.full_name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        date_of_birth: form.date_of_birth || null,
        gender: form.gender || null,
        city: form.city.trim(),
        state: form.state,
        years_of_experience: parseInt(form.years_of_experience || "0", 10),
        specializations: form.specializations,
        languages: form.languages,
        education_qualification: form.education_qualification.trim(),
        astrology_certifications: form.astrology_certifications || "",
        about_yourself: form.about_yourself.trim(),
        rate_per_minute: parseInt(form.rate_per_minute || "0", 10),
        available_hours: form.available_hours.trim(),
        documents: {
          aadhaar_number: form.aadhaar_number.replace(/\s/g, ""),
          aadhaar_front_url: form.aadhaar_front?.dataUrl,
          aadhaar_back_url: form.aadhaar_back?.dataUrl,
          pan_number: form.pan_number.toUpperCase(),
          pan_card_url: form.pan_card?.dataUrl,
          certificate_url: form.certificate?.dataUrl || null,
          profile_photo_url: form.profile_photo?.dataUrl,
        },
        social_links: {
          youtube: form.youtube || "",
          instagram: form.instagram || "",
          website: form.website || "",
        },
        agreement_accepted: true,
      };
      const res = await axios.post(`${API}/apply-astrologer`, payload);
      setSubmitted({ id: res.data?.id || "—", email: payload.email });
      toast.success("Application submitted ✓");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      const detail = err?.response?.data?.detail || "Failed to submit application. Try again.";
      toast.error(typeof detail === "string" ? detail : "Failed to submit application.");
    } finally {
      setSubmitting(false);
    }
  };

  // ---------- Success view ----------
  if (submitted) {
    return (
      <div className="min-h-screen pt-20 lg:pt-24 pb-24 lg:pb-12 av-bg" data-testid="apply-astrologer-success">
        <div className="max-w-xl mx-auto px-4">
          <div className="cosmic-card rounded-3xl p-10 text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/15 border border-emerald-400/40 flex items-center justify-center mb-6 animate-pulse">
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            </div>
            <h1 className="font-cinzel text-3xl font-bold text-white mb-2">
              Application Submitted Successfully!
            </h1>
            <p className="text-zinc-300 text-sm mb-6">
              Our team will review your application within 2-3 business days.
              We will contact you at <span className="text-[#F5C842]">{submitted.email}</span>.
            </p>
            <div className="rounded-2xl border border-[#D4A017]/40 bg-[#1A1730] p-4 mb-6">
              <p className="text-[11px] uppercase tracking-[0.3em] text-[#9B96C0] mb-1">Application Reference</p>
              <p className="font-mono text-xl text-[#F5C842]" data-testid="apply-success-ref">#{submitted.id}</p>
            </div>
            <Link to="/">
              <Button className="btn-gold rounded-full px-6 py-5">
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ---------- Form view ----------
  return (
    <div className="min-h-screen pt-20 lg:pt-24 pb-24 lg:pb-12 av-bg" data-testid="apply-astrologer-page">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10">
          <Badge className="bg-[#D4A017]/15 text-[#F5C842] border border-[#D4A017]/30 mb-4">
            <Sparkles className="w-3 h-3 mr-1" /> Now Hiring Expert Jyotishis
          </Badge>
          <h1 className="font-cinzel text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3">
            Join AstroVedic AI as an{" "}
            <span className="text-gradient-gold">Expert Jyotishi</span>
          </h1>
          <p className="text-zinc-300 text-base sm:text-lg">
            Share your wisdom with lakhs of seekers across India.
          </p>
        </div>

        {/* Benefit cards */}
        <div className="grid sm:grid-cols-3 gap-4 mb-12">
          {[
            { Icon: IndianRupee, title: "Earn ₹500–₹5,000/day", sub: "from consultations" },
            { Icon: Smartphone,  title: "Work flexibly",         sub: "from anywhere, any time" },
            { Icon: Star,        title: "Reach lakhs",           sub: "of users across India" },
          ].map((b, i) => (
            <div
              key={i}
              className="cosmic-card rounded-2xl p-5 text-center"
              data-testid={`apply-benefit-${i}`}
            >
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-[#D4A017]/15 border border-[#D4A017]/30 flex items-center justify-center">
                <b.Icon className="w-5 h-5 text-[#F5C842]" />
              </div>
              <h3 className="font-cinzel font-semibold text-white text-base mb-1">{b.title}</h3>
              <p className="text-xs text-zinc-400">{b.sub}</p>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-8" data-testid="apply-astrologer-form">
          {/* SECTION 1 */}
          <Section title="Personal Information" Icon={UserIcon}>
            <Field label="Full Name *" Icon={UserIcon}>
              <Input value={form.full_name} onChange={(e) => set("full_name", e.target.value)}
                required className="bg-[#231F3A] border-[#2D1B69] focus:border-[#D4A017] text-white" data-testid="apply-fullname" />
            </Field>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Email Address *" Icon={Mail}>
                <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)}
                  required className="bg-[#231F3A] border-[#2D1B69] focus:border-[#D4A017] text-white" data-testid="apply-email" />
              </Field>
              <Field label="Phone Number *" Icon={Phone}>
                <div className="flex">
                  <span className="px-3 inline-flex items-center bg-[#231F3A] border border-r-0 border-[#2D1B69] text-zinc-400 rounded-l-md text-sm">+91</span>
                  <Input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                    required
                    className="bg-[#231F3A] border-[#2D1B69] focus:border-[#D4A017] text-white rounded-l-none"
                    data-testid="apply-phone"
                  />
                </div>
              </Field>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Date of Birth *" Icon={CalendarDays}>
                <Input type="date" value={form.date_of_birth}
                  onChange={(e) => set("date_of_birth", e.target.value)}
                  required className="bg-[#231F3A] border-[#2D1B69] focus:border-[#D4A017] text-white" data-testid="apply-dob" />
              </Field>
              <Field label="Gender *">
                <Select value={form.gender} onValueChange={(v) => set("gender", v)}>
                  <SelectTrigger className="bg-[#231F3A] border-[#2D1B69] focus:border-[#D4A017] text-white" data-testid="apply-gender">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1A1730] border-[#2D1B69] text-white">
                    {["Male", "Female", "Other", "Prefer not to say"].map((g) => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="City *" Icon={MapPin}>
                <Input value={form.city} onChange={(e) => set("city", e.target.value)}
                  required className="bg-[#231F3A] border-[#2D1B69] focus:border-[#D4A017] text-white" data-testid="apply-city" />
              </Field>
              <Field label="State *">
                <Select value={form.state} onValueChange={(v) => set("state", v)}>
                  <SelectTrigger className="bg-[#231F3A] border-[#2D1B69] focus:border-[#D4A017] text-white" data-testid="apply-state">
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1A1730] border-[#2D1B69] text-white max-h-[260px]">
                    {INDIAN_STATES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </Section>

          {/* SECTION 2 */}
          <Section title="Professional Details" Icon={Briefcase}>
            <div className="grid sm:grid-cols-3 gap-4">
              <Field label="Years of Experience *">
                <Input type="number" min={1} value={form.years_of_experience}
                  onChange={(e) => set("years_of_experience", e.target.value)}
                  required className="bg-[#231F3A] border-[#2D1B69] focus:border-[#D4A017] text-white" data-testid="apply-experience" />
              </Field>
              <Field label="Rate per Minute (₹) *">
                <Input type="number" min={1} value={form.rate_per_minute}
                  onChange={(e) => set("rate_per_minute", e.target.value)}
                  placeholder="e.g. 25" required className="bg-[#231F3A] border-[#2D1B69] focus:border-[#D4A017] text-white" data-testid="apply-rate" />
              </Field>
              <Field label="Available Hours *">
                <Input value={form.available_hours} onChange={(e) => set("available_hours", e.target.value)}
                  placeholder="e.g. 9 AM to 10 PM daily" required className="bg-[#231F3A] border-[#2D1B69] focus:border-[#D4A017] text-white"
                  data-testid="apply-hours" />
              </Field>
            </div>

            <div>
              <Label className="text-sm text-zinc-200 mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Specialisations *
              </Label>
              <div className="grid sm:grid-cols-2 gap-2 p-4 rounded-xl border border-[#2D1B69] bg-[#1A1730]">
                {SPECIALISATIONS.map((s) => {
                  const checked = form.specializations.includes(s);
                  return (
                    <label key={s} className={`flex items-start gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${checked ? "bg-[#D4A017]/15 border border-[#D4A017]/30" : "hover:bg-[#231F3A]"}`}>
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggleArr("specializations", s)}
                        data-testid={`apply-spec-${s.split(" ")[0].toLowerCase()}`}
                      />
                      <span className="text-sm text-zinc-200">{s}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <Label className="text-sm text-zinc-200 mb-2 flex items-center gap-2">
                <Languages className="w-4 h-4" /> Languages for Consultation *
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-4 rounded-xl border border-[#2D1B69] bg-[#1A1730]">
                {LANGUAGES.map((l) => {
                  const checked = form.languages.includes(l);
                  return (
                    <label key={l} className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer ${checked ? "bg-[#D4A017]/15 border border-[#D4A017]/30" : "hover:bg-[#231F3A]"}`}>
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggleArr("languages", l)}
                        data-testid={`apply-lang-${l.toLowerCase()}`}
                      />
                      <span className="text-sm text-zinc-200">{l}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <Field label="Education Qualification *" Icon={GraduationCap}>
              <Input value={form.education_qualification}
                onChange={(e) => set("education_qualification", e.target.value)}
                placeholder='e.g. "Jyotish Acharya, BHU"'
                required className="bg-[#231F3A] border-[#2D1B69] focus:border-[#D4A017] text-white" data-testid="apply-education" />
            </Field>

            <Field label="Astrology Certifications (optional)">
              <Textarea
                value={form.astrology_certifications}
                onChange={(e) => set("astrology_certifications", e.target.value)}
                placeholder="List your certifications, courses, or notable training..."
                className="bg-[#231F3A] border-[#2D1B69] focus:border-[#D4A017] text-white min-h-[80px]"
                data-testid="apply-certifications"
              />
            </Field>

            <Field label="About Yourself *">
              <Textarea
                value={form.about_yourself}
                onChange={(e) => set("about_yourself", e.target.value)}
                placeholder="Tell us about your astrological journey, your guru, your experience, and how you help people..."
                className="bg-[#231F3A] border-[#2D1B69] focus:border-[#D4A017] text-white min-h-[140px]"
                data-testid="apply-about"
              />
              <p className="text-[11px] text-zinc-500 mt-1">
                {form.about_yourself.length}/100 characters minimum
              </p>
            </Field>
          </Section>

          {/* SECTION 3 */}
          <Section title="Document Upload" Icon={Shield}>
            <div className="rounded-xl border border-[#D4A017]/30 bg-[#D4A017]/5 p-4 flex gap-3 items-start">
              <Shield className="w-5 h-5 text-[#F5C842] flex-shrink-0 mt-0.5" />
              <p className="text-sm text-zinc-300">
                All documents are securely stored and used only for verification. We follow strict privacy guidelines.
              </p>
            </div>

            <Field label="Profile Photo *">
              <FileUploader
                label="Profile Photo"
                accept={ACCEPT_IMG}
                maxBytes={MAX_PHOTO_BYTES}
                value={form.profile_photo}
                onChange={(v) => set("profile_photo", v)}
                testId="apply-upload-photo"
                hint="JPG/PNG · Max 2MB"
              />
            </Field>

            <div className="rounded-2xl border border-[#2D1B69] bg-[#1A1730] p-4 sm:p-5 space-y-4">
              <h4 className="font-cinzel text-base text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-[#F5C842]" /> Aadhaar Card *
              </h4>
              <Field label="Aadhaar Number *">
                <Input
                  value={maskAadhaar(form.aadhaar_number)}
                  onChange={(e) => set("aadhaar_number", e.target.value.replace(/\D/g, "").slice(0, 12))}
                  placeholder="XXXX XXXX XXXX"
                  inputMode="numeric"
                  required
                  className="bg-[#231F3A] border-[#2D1B69] focus:border-[#D4A017] text-white"
                  data-testid="apply-aadhaar-number"
                />
              </Field>
              <div className="grid sm:grid-cols-2 gap-4">
                <FileUploader
                  label="Aadhaar Front" accept={ACCEPT_DOCS} maxBytes={MAX_DOC_BYTES}
                  value={form.aadhaar_front} onChange={(v) => set("aadhaar_front", v)}
                  testId="apply-upload-aadhaar-front"
                />
                <FileUploader
                  label="Aadhaar Back" accept={ACCEPT_DOCS} maxBytes={MAX_DOC_BYTES}
                  value={form.aadhaar_back} onChange={(v) => set("aadhaar_back", v)}
                  testId="apply-upload-aadhaar-back"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-[#2D1B69] bg-[#1A1730] p-4 sm:p-5 space-y-4">
              <h4 className="font-cinzel text-base text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-[#F5C842]" /> PAN Card *
              </h4>
              <Field label="PAN Number *">
                <Input
                  value={form.pan_number}
                  onChange={(e) => set("pan_number", e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10))}
                  placeholder="ABCDE1234F"
                  required
                  className="bg-[#231F3A] border-[#2D1B69] focus:border-[#D4A017] text-white uppercase"
                  data-testid="apply-pan-number"
                />
              </Field>
              <FileUploader
                label="PAN Card" accept={ACCEPT_DOCS} maxBytes={MAX_DOC_BYTES}
                value={form.pan_card} onChange={(v) => set("pan_card", v)}
                testId="apply-upload-pan"
              />
            </div>

            <div className="rounded-2xl border border-[#2D1B69] bg-[#1A1730] p-4 sm:p-5 space-y-2">
              <h4 className="font-cinzel text-base text-white flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-[#F5C842]" /> Astrology Certificate (optional)
              </h4>
              <p className="text-xs text-zinc-400">
                Upload your astrology degree, course certificate, or any relevant qualification.
              </p>
              <FileUploader
                label="Certificate" accept={ACCEPT_DOCS} maxBytes={MAX_DOC_BYTES}
                value={form.certificate} onChange={(v) => set("certificate", v)}
                testId="apply-upload-cert"
              />
            </div>
          </Section>

          {/* SECTION 4 */}
          <Section title="Social Presence (optional)" Icon={Heart}>
            <div className="grid sm:grid-cols-3 gap-4">
              <Field label="YouTube Channel URL">
                <Input value={form.youtube} onChange={(e) => set("youtube", e.target.value)}
                  placeholder="https://youtube.com/..." className="bg-[#231F3A] border-[#2D1B69] focus:border-[#D4A017] text-white"
                  data-testid="apply-youtube" />
              </Field>
              <Field label="Instagram Profile URL">
                <Input value={form.instagram} onChange={(e) => set("instagram", e.target.value)}
                  placeholder="https://instagram.com/..." className="bg-[#231F3A] border-[#2D1B69] focus:border-[#D4A017] text-white"
                  data-testid="apply-instagram" />
              </Field>
              <Field label="Personal Website URL">
                <Input value={form.website} onChange={(e) => set("website", e.target.value)}
                  placeholder="https://..." className="bg-[#231F3A] border-[#2D1B69] focus:border-[#D4A017] text-white"
                  data-testid="apply-website" />
              </Field>
            </div>
          </Section>

          {/* SECTION 5 — Agreement */}
          <Section title="Agreement" Icon={CheckCircle2}>
            <label
              className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                form.agreement_accepted
                  ? "border-[#D4A017] bg-[#D4A017]/10"
                  : "border-[#2D1B69] bg-[#1A1730] hover:bg-[#231F3A]"
              }`}
              data-testid="apply-agreement-label"
            >
              <Checkbox
                checked={form.agreement_accepted}
                onCheckedChange={(v) => set("agreement_accepted", !!v)}
                data-testid="apply-agreement-checkbox"
                className="mt-1"
              />
              <span className="text-sm text-zinc-200 leading-relaxed">
                I confirm that all information provided above is accurate and truthful.
                I agree to AstroVedic AI's Terms of Service and Astrologer Code of Conduct.
                I understand that providing false information will result in permanent ban.
              </span>
            </label>
          </Section>

          <Button
            type="submit"
            disabled={!form.agreement_accepted || submitting}
            className="btn-gold w-full rounded-full py-7 text-base font-semibold"
            data-testid="apply-submit-btn"
          >
            {submitting ? "Submitting..." : "Submit Application ✦"}
          </Button>
        </form>
      </div>
    </div>
  );
}

// ----------------------- Helpers -----------------------
function Section({ title, Icon, children }) {
  return (
    <div className="cosmic-card rounded-3xl p-5 sm:p-7">
      <h3 className="font-cinzel text-xl sm:text-2xl font-bold text-white mb-5 pb-3 border-b border-[#2D1B69] flex items-center gap-3">
        {Icon && <Icon className="w-5 h-5 text-[#F5C842]" />}
        {title}
      </h3>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, Icon, children }) {
  return (
    <div>
      <Label className="text-sm text-zinc-200 mb-1.5 flex items-center gap-2">
        {Icon && <Icon className="w-3.5 h-3.5" />} {label}
      </Label>
      {children}
    </div>
  );
}
