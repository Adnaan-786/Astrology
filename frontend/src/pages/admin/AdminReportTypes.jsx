import { useState, useEffect } from "react";
import apiClient from "@/lib/apiClient";
import { API } from "@/App";
import { toast } from "sonner";
import {
  Sparkles, Plus, Edit, Trash2, ToggleLeft, ToggleRight,
  Scroll, Gem, FileDown, Heart, Briefcase, HeartPulse, Wallet,
  Home as HomeIcon, Calendar, Orbit, Baby,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const ICONS = {
  Scroll, Gem, FileDown, Heart, Briefcase, HeartPulse,
  Wallet, Home: HomeIcon, Calendar, Orbit, Baby, Sparkles,
};

const ICON_NAMES = Object.keys(ICONS);

const EMPTY = {
  name: "", slug: "", desc: "", price: 0, icon: "Scroll",
  color: "#8B5CF6", free: false, needs_partner: false,
  position: 99, is_active: true,
};

const AdminReportTypes = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...EMPTY });

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`${API}/admin/report-types`);
      setItems(res.data || []);
    } catch (e) { console.error(e); toast.error("Failed to load report types"); }
    finally { setLoading(false); }
  };

  const reset = () => { setForm({ ...EMPTY }); setEditing(null); };

  const handleEdit = (rt) => {
    setForm({
      name: rt.name || "", slug: rt.slug || "", desc: rt.desc || "",
      price: rt.price || 0, icon: rt.icon || "Scroll", color: rt.color || "#8B5CF6",
      free: !!rt.free, needs_partner: !!rt.needs_partner,
      position: rt.position || 99, is_active: !!rt.is_active,
    });
    setEditing(rt);
    setShowForm(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    try {
      const payload = { ...form, price: Number(form.price) || 0, position: Number(form.position) || 99 };
      if (editing) {
        await apiClient.put(`${API}/admin/report-types/${editing.id}`, payload);
        toast.success("Report type updated");
      } else {
        await apiClient.post(`${API}/admin/report-types`, payload);
        toast.success("Report type created");
      }
      setShowForm(false); reset(); load();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Save failed");
    }
  };

  const toggle = async (rt) => {
    try {
      await apiClient.patch(`${API}/admin/report-types/${rt.id}/toggle`, { is_active: !rt.is_active });
      toast.success(rt.is_active ? "Hidden" : "Visible");
      load();
    } catch (e) { toast.error("Failed"); }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this report type? Users won't be able to buy it anymore.")) return;
    try {
      await apiClient.delete(`${API}/admin/report-types/${id}`);
      toast.success("Deleted");
      load();
    } catch (e) { toast.error("Failed to delete"); }
  };

  return (
    <div data-testid="admin-report-types-page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">AI Report Plans</h1>
          <p className="text-slate-400">Manage the AI-generated report packages that appear on NakshatraAI page.</p>
        </div>
        <Button className="bg-purple-600 hover:bg-purple-700"
          onClick={() => { reset(); setShowForm(true); }}
          data-testid="add-report-type-btn">
          <Plus className="w-4 h-4 mr-2" /> New Report Plan
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading ? (
          <p className="text-slate-400 col-span-3 text-center py-10">Loading...</p>
        ) : items.length === 0 ? (
          <p className="text-slate-400 col-span-3 text-center py-10">No report plans yet.</p>
        ) : items.map((rt) => {
          const Icon = ICONS[rt.icon] || Sparkles;
          return (
            <Card key={rt.id}
              className={`border ${rt.is_active ? "bg-slate-800/50 border-slate-700" : "bg-slate-800/30 border-slate-800 opacity-60"}`}
              data-testid={`report-type-card-${rt.slug}`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: (rt.color || "#8B5CF6") + "26", border: `1px solid ${rt.color}55` }}>
                    <Icon className="w-6 h-6" style={{ color: rt.color }} />
                  </div>
                  <div className="flex gap-1 flex-wrap justify-end">
                    {rt.free && <Badge className="bg-emerald-500/20 text-emerald-400">Free</Badge>}
                    {rt.needs_partner && <Badge className="bg-pink-500/20 text-pink-400">Partner</Badge>}
                    <Badge className={rt.is_active ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}>
                      {rt.is_active ? "Active" : "Hidden"}
                    </Badge>
                  </div>
                </div>
                <h3 className="text-base font-semibold text-white">{rt.name}</h3>
                <p className="text-xs text-slate-400 mb-3 line-clamp-2 min-h-[2rem]">{rt.desc}</p>
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-2xl font-bold text-white">
                    {rt.price === 0 ? "Free" : `₹${rt.price}`}
                  </span>
                  <span className="text-[11px] text-slate-500">slug: {rt.slug}</span>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" className="flex-1 text-slate-300" onClick={() => handleEdit(rt)}
                    data-testid={`edit-${rt.slug}`}>
                    <Edit className="w-4 h-4 mr-1" /> Edit
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => toggle(rt)} data-testid={`toggle-${rt.slug}`}>
                    {rt.is_active
                      ? <ToggleRight className="w-4 h-4 text-green-400" />
                      : <ToggleLeft className="w-4 h-4 text-slate-400" />}
                  </Button>
                  <Button size="sm" variant="ghost" className="text-red-400" onClick={() => remove(rt.id)}
                    data-testid={`delete-${rt.slug}`}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={showForm} onOpenChange={(o) => { if (!o) { setShowForm(false); reset(); } }}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">{editing ? "Edit Report Plan" : "New Report Plan"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-slate-300 mb-1">Name *</label>
                <Input value={form.name}
                  onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
                  className="bg-slate-800 border-slate-700" required data-testid="rt-name" />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">Slug</label>
                <Input value={form.slug}
                  onChange={(e) => setForm(p => ({ ...p, slug: e.target.value }))}
                  placeholder="auto-from-name"
                  className="bg-slate-800 border-slate-700" />
              </div>
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Description</label>
              <Textarea value={form.desc}
                onChange={(e) => setForm(p => ({ ...p, desc: e.target.value }))}
                className="bg-slate-800 border-slate-700 min-h-[60px]" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm text-slate-300 mb-1">Price (₹)</label>
                <Input type="number" min="0" value={form.price}
                  onChange={(e) => setForm(p => ({ ...p, price: e.target.value }))}
                  className="bg-slate-800 border-slate-700" data-testid="rt-price" />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">Position</label>
                <Input type="number" min="1" value={form.position}
                  onChange={(e) => setForm(p => ({ ...p, position: e.target.value }))}
                  className="bg-slate-800 border-slate-700" />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">Icon</label>
                <Select value={form.icon} onValueChange={(v) => setForm(p => ({ ...p, icon: v }))}>
                  <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700 max-h-60">
                    {ICON_NAMES.map((n) => (
                      <SelectItem key={n} value={n}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-slate-300 mb-1">Color</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={form.color}
                    onChange={(e) => setForm(p => ({ ...p, color: e.target.value }))}
                    className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent" />
                  <Input value={form.color}
                    onChange={(e) => setForm(p => ({ ...p, color: e.target.value }))}
                    className="bg-slate-800 border-slate-700" />
                </div>
              </div>
              <div className="space-y-2 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300">
                  <Switch checked={form.is_active}
                    onCheckedChange={(c) => setForm(p => ({ ...p, is_active: c }))} />
                  Active (visible to users)
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300">
                  <Switch checked={form.free}
                    onCheckedChange={(c) => setForm(p => ({ ...p, free: c }))} />
                  Free (no payment required)
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300">
                  <Switch checked={form.needs_partner}
                    onCheckedChange={(c) => setForm(p => ({ ...p, needs_partner: c }))} />
                  Needs partner details
                </label>
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <Button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700" data-testid="rt-save">
                {editing ? "Update Plan" : "Create Plan"}
              </Button>
              <Button type="button" variant="outline" className="border-slate-700"
                onClick={() => { setShowForm(false); reset(); }}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminReportTypes;
