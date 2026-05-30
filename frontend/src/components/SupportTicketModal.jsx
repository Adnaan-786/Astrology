import { useState, useRef } from "react";
import axios from "axios";
import { API } from "@/App";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Headset, Paperclip, X, Loader2, CheckCircle2 } from "lucide-react";

const CATEGORIES = [
  { value: "payment",    label: "💳 Payment & Wallet" },
  { value: "technical",  label: "🛠️ Technical Issue" },
  { value: "astrologer", label: "🔮 Astrologer / Consultation" },
  { value: "refund",     label: "↩️ Refund Request" },
  { value: "general",    label: "💬 General Question" },
  { value: "other",      label: "📝 Other" },
];

const PRIORITIES = [
  { value: "low",    label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high",   label: "High" },
];

const SupportTicketModal = ({ open, onClose, user }) => {
  const [form, setForm] = useState({
    category: "general",
    subject: "",
    description: "",
    priority: "medium",
  });
  const [screenshot, setScreenshot] = useState(null); // {dataUrl, name, size}
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);
  const fileRef = useRef(null);

  const reset = () => {
    setForm({ category: "general", subject: "", description: "", priority: "medium" });
    setScreenshot(null);
    setSuccess(null);
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Screenshot must be under 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setScreenshot({ dataUrl: reader.result, name: file.name, size: file.size });
    reader.readAsDataURL(file);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.description.trim()) {
      toast.error("Subject and description are required");
      return;
    }
    setSubmitting(true);
    try {
      const res = await axios.post(`${API}/support/tickets`, {
        user_id: user.id,
        user_name: user.name || "User",
        user_email: user.email || "",
        category: form.category,
        subject: form.subject.trim(),
        description: form.description.trim(),
        priority: form.priority,
        screenshot_url: screenshot?.dataUrl || null,
      });
      setSuccess(res.data.ticket_id);
      toast.success("Ticket raised ✓");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to raise ticket");
    } finally {
      setSubmitting(false);
    }
  };

  const closeAndReset = () => { onClose(); setTimeout(reset, 300); };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && closeAndReset()}>
      <DialogContent className="bg-[#0D0B1E] border-[#2D1B69] max-w-lg" data-testid="support-ticket-modal">
        {success ? (
          <div className="text-center py-6" data-testid="ticket-success-state">
            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-9 h-9 text-emerald-400" />
            </div>
            <h3 className="font-cinzel text-2xl text-white mb-2">Ticket Raised Successfully</h3>
            <p className="text-zinc-300 text-sm mb-2">Ticket ID: <span className="text-[#F5C842] font-mono">#{success}</span></p>
            <p className="text-zinc-400 text-xs mb-6">Our team will get back to you within 24 hours via email.</p>
            <Button onClick={closeAndReset} className="btn-gold rounded-full px-8" data-testid="ticket-success-close-btn">
              Done
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="font-cinzel text-xl text-white flex items-center gap-2">
                <Headset className="w-5 h-5 text-[#F5C842]" /> Raise a Support Ticket
              </DialogTitle>
              <DialogDescription className="text-zinc-400 text-sm">
                Tell us what's wrong. You can attach a screenshot as proof. We'll reply within 24 hrs.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={submit} className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-zinc-300 mb-1 block">Category</label>
                  <Select value={form.category} onValueChange={(v) => setForm((p) => ({ ...p, category: v }))}>
                    <SelectTrigger className="bg-[#231F3A] border-[#2D1B69] text-white" data-testid="ticket-category-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1A1730] border-[#2D1B69] text-white">
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c.value} value={c.value} className="focus:bg-[#2D1B69] focus:text-white">{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-zinc-300 mb-1 block">Priority</label>
                  <Select value={form.priority} onValueChange={(v) => setForm((p) => ({ ...p, priority: v }))}>
                    <SelectTrigger className="bg-[#231F3A] border-[#2D1B69] text-white" data-testid="ticket-priority-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1A1730] border-[#2D1B69] text-white">
                      {PRIORITIES.map((p) => (
                        <SelectItem key={p.value} value={p.value} className="focus:bg-[#2D1B69] focus:text-white">{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-300 mb-1 block">Subject *</label>
                <Input
                  data-testid="ticket-subject-input"
                  value={form.subject}
                  onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
                  placeholder="Brief summary of the issue"
                  className="bg-[#231F3A] border-[#2D1B69] text-white"
                  maxLength={120}
                  required
                />
              </div>

              <div>
                <label className="text-xs text-zinc-300 mb-1 block">Describe the problem *</label>
                <textarea
                  data-testid="ticket-description-input"
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="What happened? When? Any error message? The more detail, the faster we help."
                  rows={5}
                  maxLength={2000}
                  className="w-full rounded-md bg-[#231F3A] border border-[#2D1B69] text-white text-sm p-3 focus:outline-none focus:border-[#D4A017] resize-none"
                  required
                />
                <p className="text-[10px] text-zinc-500 mt-1">{form.description.length}/2000</p>
              </div>

              <div>
                <label className="text-xs text-zinc-300 mb-1 block">Screenshot (optional, max 2MB)</label>
                {screenshot ? (
                  <div className="flex items-center gap-3 rounded-md bg-[#231F3A] border border-[#2D1B69] p-2">
                    <img src={screenshot.dataUrl} alt="preview" className="w-14 h-14 rounded object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{screenshot.name}</p>
                      <p className="text-[10px] text-zinc-400">{(screenshot.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button type="button" onClick={() => setScreenshot(null)} className="p-1.5 rounded hover:bg-red-500/20 text-red-400" data-testid="ticket-screenshot-remove">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 rounded-md border border-dashed border-[#2D1B69] bg-[#231F3A]/50 hover:border-[#8B5CF6]/50 hover:bg-[#231F3A] text-sm text-zinc-300 py-3 transition-colors"
                    data-testid="ticket-screenshot-btn"
                  >
                    <Paperclip className="w-4 h-4" /> Attach screenshot
                  </button>
                )}
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleFile} />
              </div>

              <div className="flex gap-3 pt-1">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 btn-gold rounded-full py-5"
                  data-testid="ticket-submit-btn"
                >
                  {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting…</> : "Raise Ticket"}
                </Button>
                <Button type="button" variant="outline" onClick={closeAndReset}
                  className="border-[#2D1B69] text-zinc-300 hover:bg-[#231F3A] rounded-full py-5" data-testid="ticket-cancel-btn">
                  Cancel
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SupportTicketModal;
