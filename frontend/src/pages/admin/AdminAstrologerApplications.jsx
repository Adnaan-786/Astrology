import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { API } from "@/App";
import { toast } from "sonner";
import {
  Search, Eye, CheckCircle2, XCircle, Clock, FileText, Filter, ArrowLeft,
  Mail, Phone, MapPin, Briefcase, Languages, GraduationCap, Sparkles,
  ExternalLink, Award, Calendar, User as UserIcon,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

// ===================== LIST PAGE =====================
export const AdminAstrologerApplications = () => {
  const [data, setData] = useState({ applications: [], counts: { total: 0, pending: 0, approved: 0, rejected: 0 } });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null); // application for detail modal
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter !== "all") params.status = statusFilter;
      if (search.trim()) params.search = search.trim();
      const res = await axios.get(`${API}/admin/astrologer-applications`, { params });
      setData(res.data);
    } catch (e) {
      toast.error("Failed to load applications");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [statusFilter]);

  const quickAction = async (id, action) => {
    try {
      await axios.patch(`${API}/admin/astrologer-applications/${id}`, {
        status: action,
        admin_notes: action === "approved" ? "Approved via quick action" : "Rejected via quick action",
      });
      toast.success(action === "approved" ? "Application approved ✓" : "Application rejected");
      load();
    } catch (e) {
      toast.error("Action failed");
    }
  };

  const StatusBadge = ({ s }) => {
    if (s === "approved")
      return <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"><CheckCircle2 className="w-3 h-3 mr-1" /> Approved</Badge>;
    if (s === "rejected")
      return <Badge className="bg-red-500/15 text-red-400 border border-red-500/30"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
    return <Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/30"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
  };

  return (
    <div data-testid="admin-applications-list">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Astrologer Applications</h1>
          <p className="text-sm text-slate-400">Review &amp; approve professional applications.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total"     value={data.counts.total}     Icon={FileText}     color="purple" />
        <StatCard label="Pending"   value={data.counts.pending}   Icon={Clock}        color="amber" />
        <StatCard label="Approved"  value={data.counts.approved}  Icon={CheckCircle2} color="emerald" />
        <StatCard label="Rejected"  value={data.counts.rejected}  Icon={XCircle}      color="red" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex-1 min-w-[220px] max-w-md relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
            className="pl-9 bg-slate-800 border-slate-700 text-white"
            data-testid="apps-search"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px] bg-slate-800 border-slate-700 text-white" data-testid="apps-status-filter">
            <Filter className="w-4 h-4 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-700 text-white">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={load} variant="outline" className="border-slate-700 text-slate-200 hover:bg-slate-800" data-testid="apps-refresh">
          Refresh
        </Button>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-800 text-slate-300">
              <tr>
                <th className="text-left px-4 py-3">Photo</th>
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-left px-4 py-3">Email</th>
                <th className="text-left px-4 py-3">Phone</th>
                <th className="text-left px-4 py-3">City</th>
                <th className="text-left px-4 py-3">Exp.</th>
                <th className="text-left px-4 py-3">Specialisations</th>
                <th className="text-left px-4 py-3">Applied</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={10} className="text-center py-10 text-slate-500">Loading...</td></tr>
              )}
              {!loading && data.applications.length === 0 && (
                <tr>
                  <td colSpan={10} className="text-center py-10 text-slate-500" data-testid="apps-empty">
                    No applications yet.
                  </td>
                </tr>
              )}
              {!loading && data.applications.map((a) => (
                <tr key={a.id} className="border-t border-slate-800 hover:bg-slate-800/50" data-testid={`app-row-${a.id}`}>
                  <td className="px-4 py-3">
                    {a.documents?.profile_photo_url ? (
                      <img src={a.documents.profile_photo_url} alt={a.full_name}
                        className="w-10 h-10 rounded-full object-cover border border-slate-700" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500">
                        <UserIcon className="w-5 h-5" />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-white font-medium">{a.full_name}</td>
                  <td className="px-4 py-3 text-slate-300">{a.email}</td>
                  <td className="px-4 py-3 text-slate-300">+91 {a.phone}</td>
                  <td className="px-4 py-3 text-slate-300">{a.city}</td>
                  <td className="px-4 py-3 text-slate-300">{a.years_of_experience} yr</td>
                  <td className="px-4 py-3 text-slate-300 max-w-[220px] truncate" title={(a.specializations || []).join(", ")}>
                    {(a.specializations || []).slice(0, 2).join(", ")}
                    {a.specializations?.length > 2 ? `, +${a.specializations.length - 2}` : ""}
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {new Date(a.applied_at).toLocaleDateString("en-IN")}
                  </td>
                  <td className="px-4 py-3"><StatusBadge s={a.status} /></td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-1">
                      <Button size="sm" variant="outline"
                        onClick={() => setSelected(a)}
                        className="border-slate-700 text-slate-200 hover:bg-slate-800 h-8 px-2"
                        data-testid={`app-view-${a.id}`}
                        title="View full application"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {a.status === "pending" && (
                        <>
                          <Button size="sm" onClick={() => quickAction(a.id, "approved")}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 px-2"
                            data-testid={`app-approve-${a.id}`} title="Quick approve">
                            <CheckCircle2 className="w-4 h-4" />
                          </Button>
                          <Button size="sm" onClick={() => quickAction(a.id, "rejected")}
                            className="bg-red-600 hover:bg-red-700 text-white h-8 px-2"
                            data-testid={`app-reject-${a.id}`} title="Quick reject">
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Dialog */}
      <ApplicationDetailDialog
        application={selected}
        onClose={() => setSelected(null)}
        onUpdated={() => { setSelected(null); load(); }}
      />
    </div>
  );
};

// ===================== STAT CARD =====================
const StatCard = ({ label, value, Icon, color }) => {
  const palette = {
    purple:  "bg-purple-500/15 text-purple-300 border-purple-500/30",
    amber:   "bg-amber-500/15 text-amber-300 border-amber-500/30",
    emerald: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    red:     "bg-red-500/15 text-red-300 border-red-500/30",
  }[color];
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 border ${palette}`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-slate-400 text-xs">{label}</p>
      <p className="text-2xl font-bold text-white">{value || 0}</p>
    </div>
  );
};

// ===================== DETAIL DIALOG =====================
const REJECT_REASONS = [
  "Insufficient Experience",
  "Document Issues",
  "Incomplete Information",
  "Does Not Meet Standards",
  "Other",
];

function ApplicationDetailDialog({ application, onClose, onUpdated }) {
  const [notes, setNotes] = useState("");
  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState(REJECT_REASONS[0]);
  const [rejectNotes, setRejectNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (application) {
      setNotes(application.admin_notes || "");
      setShowReject(false);
      setRejectReason(REJECT_REASONS[0]);
      setRejectNotes("");
    }
  }, [application]);

  if (!application) return null;
  const docs = application.documents || {};
  const masked = (n) => {
    const d = (n || "").replace(/\D/g, "");
    if (d.length < 4) return d;
    return `XXXX XXXX ${d.slice(-4)}`;
  };

  const submit = async (status, extra = {}) => {
    setSaving(true);
    try {
      await axios.patch(`${API}/admin/astrologer-applications/${application.id}`, {
        status,
        admin_notes: notes,
        ...extra,
      });
      toast.success(
        status === "approved" ? "Application approved ✓" : "Application rejected"
      );
      onUpdated && onUpdated();
    } catch (e) {
      toast.error("Failed to update application");
    } finally {
      setSaving(false);
    }
  };

  const onApproveClick = () => {
    if (window.confirm(`Approve ${application.full_name} as astrologer on AstroVedic AI?`)) {
      submit("approved");
    }
  };

  return (
    <Dialog open={!!application} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-4xl max-h-[92vh] overflow-y-auto" data-testid="app-detail-dialog">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-3">
            Application <span className="font-mono text-sm text-purple-300">#{application.id}</span>
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Submitted on {new Date(application.applied_at).toLocaleString("en-IN")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Personal info + photo */}
          <div className="flex gap-5 items-start">
            {docs.profile_photo_url ? (
              <img src={docs.profile_photo_url} alt={application.full_name}
                className="w-24 h-24 rounded-full object-cover border-2 border-purple-500" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center">
                <UserIcon className="w-10 h-10 text-slate-500" />
              </div>
            )}
            <div className="flex-1 grid sm:grid-cols-2 gap-3 text-sm">
              <Info Icon={UserIcon}    label="Name"   value={application.full_name} />
              <Info Icon={Mail}        label="Email"  value={application.email} />
              <Info Icon={Phone}       label="Phone"  value={`+91 ${application.phone}`} />
              <Info Icon={Calendar}    label="DOB / Gender" value={`${application.date_of_birth || "-"} · ${application.gender || "-"}`} />
              <Info Icon={MapPin}      label="City / State" value={`${application.city}, ${application.state}`} />
              <Info Icon={Briefcase}   label="Experience"   value={`${application.years_of_experience} years`} />
            </div>
          </div>

          {/* Professional */}
          <div className="bg-slate-800/40 rounded-xl p-5 border border-slate-800">
            <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-300" /> Professional Details
            </h4>
            <div className="grid sm:grid-cols-3 gap-3 text-sm mb-4">
              <Info Icon={Briefcase}   label="Rate / min" value={`₹${application.rate_per_minute}`} />
              <Info Icon={Clock}       label="Hours"      value={application.available_hours} />
              <Info Icon={GraduationCap} label="Education"  value={application.education_qualification} />
            </div>
            <div className="mb-3">
              <p className="text-xs text-slate-400 mb-1">Specialisations</p>
              <div className="flex flex-wrap gap-2">
                {(application.specializations || []).map((s) => (
                  <Badge key={s} className="bg-purple-500/15 text-purple-300 border border-purple-500/30">{s}</Badge>
                ))}
              </div>
            </div>
            <div className="mb-3">
              <p className="text-xs text-slate-400 mb-1 flex items-center gap-1"><Languages className="w-3 h-3" /> Languages</p>
              <div className="flex flex-wrap gap-2">
                {(application.languages || []).map((l) => (
                  <Badge key={l} className="bg-amber-500/15 text-amber-300 border border-amber-500/30">{l}</Badge>
                ))}
              </div>
            </div>
            {application.astrology_certifications && (
              <div>
                <p className="text-xs text-slate-400 mb-1">Certifications</p>
                <p className="text-sm text-slate-200 whitespace-pre-wrap">{application.astrology_certifications}</p>
              </div>
            )}
          </div>

          {/* About */}
          <div className="bg-slate-800/40 rounded-xl p-5 border border-slate-800">
            <h4 className="font-semibold text-white mb-3">About</h4>
            <p className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
              {application.about_yourself}
            </p>
          </div>

          {/* Documents */}
          <div className="bg-slate-800/40 rounded-xl p-5 border border-slate-800">
            <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Award className="w-4 h-4 text-purple-300" /> Documents
            </h4>
            <div className="grid sm:grid-cols-2 gap-3 text-sm mb-4">
              <DocLine label="Aadhaar Number" value={masked(docs.aadhaar_number)} />
              <DocLine label="PAN Number" value={docs.pan_number || "-"} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <DocPreview label="Profile Photo" url={docs.profile_photo_url} testId="doc-photo" />
              <DocPreview label="Aadhaar Front" url={docs.aadhaar_front_url} testId="doc-aadhaar-front" />
              <DocPreview label="Aadhaar Back" url={docs.aadhaar_back_url} testId="doc-aadhaar-back" />
              <DocPreview label="PAN Card" url={docs.pan_card_url} testId="doc-pan" />
              {docs.certificate_url && (
                <DocPreview label="Astrology Certificate" url={docs.certificate_url} testId="doc-cert" />
              )}
            </div>
          </div>

          {/* Social */}
          {(application.social_links?.youtube || application.social_links?.instagram || application.social_links?.website) && (
            <div className="bg-slate-800/40 rounded-xl p-5 border border-slate-800">
              <h4 className="font-semibold text-white mb-3">Social Links</h4>
              <div className="flex flex-col gap-2 text-sm">
                {application.social_links?.youtube && (
                  <a href={application.social_links.youtube} target="_blank" rel="noreferrer"
                    className="text-purple-300 hover:underline inline-flex items-center gap-1">
                    YouTube <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {application.social_links?.instagram && (
                  <a href={application.social_links.instagram} target="_blank" rel="noreferrer"
                    className="text-purple-300 hover:underline inline-flex items-center gap-1">
                    Instagram <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {application.social_links?.website && (
                  <a href={application.social_links.website} target="_blank" rel="noreferrer"
                    className="text-purple-300 hover:underline inline-flex items-center gap-1">
                    Website <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Admin action */}
          <div className="bg-slate-900 border-2 border-purple-500/40 rounded-xl p-5 sticky bottom-0">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-white">Admin Action</h4>
              <Badge className={
                application.status === "approved" ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" :
                application.status === "rejected" ? "bg-red-500/15 text-red-400 border border-red-500/30" :
                "bg-amber-500/15 text-amber-400 border border-amber-500/30"
              }>
                {application.status?.toUpperCase()}
              </Badge>
            </div>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this application (visible only to admin)"
              className="bg-slate-800 border-slate-700 text-white mb-3 min-h-[80px]"
              data-testid="admin-notes-input"
            />
            {application.status === "pending" && !showReject && (
              <div className="grid sm:grid-cols-2 gap-3">
                <Button onClick={onApproveClick} disabled={saving}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white py-6 text-base"
                  data-testid="admin-approve-btn">
                  <CheckCircle2 className="w-5 h-5 mr-2" /> Approve Application
                </Button>
                <Button onClick={() => setShowReject(true)} disabled={saving}
                  className="bg-red-600 hover:bg-red-700 text-white py-6 text-base"
                  data-testid="admin-reject-btn">
                  <XCircle className="w-5 h-5 mr-2" /> Reject Application
                </Button>
              </div>
            )}
            {showReject && (
              <div className="space-y-3" data-testid="reject-form">
                <p className="text-sm text-slate-300">Please provide a reason — it will be visible to the applicant if email is configured.</p>
                <Select value={rejectReason} onValueChange={setRejectReason}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white" data-testid="reject-reason">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700 text-white">
                    {REJECT_REASONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Textarea
                  value={rejectNotes}
                  onChange={(e) => setRejectNotes(e.target.value)}
                  placeholder="Explain reason..."
                  className="bg-slate-800 border-slate-700 text-white min-h-[80px]"
                  data-testid="reject-notes"
                />
                <div className="grid grid-cols-2 gap-3">
                  <Button onClick={() => setShowReject(false)} variant="outline"
                    className="border-slate-700 text-slate-200 hover:bg-slate-800">
                    Cancel
                  </Button>
                  <Button onClick={() => submit("rejected", { rejection_reason: rejectReason, admin_notes: rejectNotes || notes })}
                    disabled={saving || !rejectNotes.trim()}
                    className="bg-red-600 hover:bg-red-700 text-white"
                    data-testid="reject-confirm">
                    Confirm Reject
                  </Button>
                </div>
              </div>
            )}
            {application.admin_notes && application.status !== "pending" && (
              <div className="mt-3 text-sm text-slate-400 italic">
                Existing notes: {application.admin_notes}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const Info = ({ Icon, label, value }) => (
  <div>
    <p className="text-xs text-slate-400 flex items-center gap-1 mb-0.5">
      {Icon && <Icon className="w-3 h-3" />} {label}
    </p>
    <p className="text-white font-medium">{value || "-"}</p>
  </div>
);

const DocLine = ({ label, value }) => (
  <div className="flex items-center justify-between bg-slate-900 rounded-lg px-3 py-2 border border-slate-800">
    <span className="text-slate-400 text-xs">{label}</span>
    <span className="text-white font-mono text-sm">{value}</span>
  </div>
);

const DocLink = ({ label, url, testId }) => {
  if (!url) return (
    <div className="flex items-center justify-between bg-slate-900 rounded-lg px-3 py-2 border border-slate-800">
      <span className="text-slate-400 text-xs">{label}</span>
      <span className="text-slate-500 text-xs italic">Not provided</span>
    </div>
  );
  return (
    <div className="flex items-center justify-between bg-slate-900 rounded-lg px-3 py-2 border border-slate-800">
      <span className="text-slate-400 text-xs">{label}</span>
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="text-purple-300 hover:underline text-sm inline-flex items-center gap-1"
        data-testid={testId}
      >
        View <ExternalLink className="w-3 h-3" />
      </a>
    </div>
  );
};

// Inline preview card: shows the actual image / PDF preview to the admin.
// Handles PNG / JPEG / PDF base64 payloads as well as plain http(s) URLs.
const DocPreview = ({ label, url, testId }) => {
  if (!url) {
    return (
      <div className="bg-slate-900 rounded-lg border border-slate-800 p-3">
        <p className="text-xs text-slate-400 mb-2">{label}</p>
        <div className="h-40 flex items-center justify-center text-slate-600 text-xs italic border border-dashed border-slate-700 rounded">
          Not provided
        </div>
      </div>
    );
  }
  const isPdf = (url || "").startsWith("data:application/pdf") || (url || "").toLowerCase().endsWith(".pdf");
  const openInNewTab = () => {
    try {
      const win = window.open();
      if (!win) return;
      if (isPdf) {
        win.document.write(`<iframe src="${url}" style="border:0;width:100%;height:100vh"></iframe>`);
      } else {
        win.document.write(
          `<body style="margin:0;background:#0f172a;display:flex;align-items:center;justify-content:center;min-height:100vh"><img src="${url}" style="max-width:100%;max-height:100vh"/></body>`
        );
      }
    } catch (e) {
      window.open(url, "_blank");
    }
  };
  return (
    <div className="bg-slate-900 rounded-lg border border-slate-800 p-3" data-testid={testId}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-slate-300 font-medium">{label}</p>
        <button
          onClick={openInNewTab}
          className="text-purple-300 hover:underline text-xs inline-flex items-center gap-1"
          data-testid={`${testId}-open`}
        >
          Open <ExternalLink className="w-3 h-3" />
        </button>
      </div>
      <button
        type="button"
        onClick={openInNewTab}
        className="block w-full h-44 rounded overflow-hidden bg-slate-950 border border-slate-800 hover:border-purple-500 transition-colors"
        title={`Click to open ${label} full size`}
      >
        {isPdf ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-2">
            <FileText className="w-10 h-10 text-purple-300" />
            <span className="text-xs">PDF document — click to open</span>
          </div>
        ) : (
          <img
            src={url}
            alt={label}
            className="w-full h-full object-contain bg-slate-950"
            onError={(e) => {
              e.currentTarget.style.display = "none";
              e.currentTarget.parentElement.innerHTML =
                '<div class="w-full h-full flex items-center justify-center text-slate-500 text-xs">Preview not available — click Open</div>';
            }}
          />
        )}
      </button>
    </div>
  );
};

export default AdminAstrologerApplications;
