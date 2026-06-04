import { useState, useEffect } from "react";
import apiClient from "@/lib/apiClient";
import { API } from "@/App";
import { toast } from "sonner";
import { Crown, Plus, Edit, Trash2, ToggleLeft, ToggleRight, CheckSquare, Square, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const AdminPlans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [reportTypes, setReportTypes] = useState([]);
  const [form, setForm] = useState({
    name: "", slug: "", description: "", price_monthly: 0, price_annual: 0,
    features: [""], ai_reports_per_month: 0, free_chat_minutes: 0,
    discount_on_products: 0, is_active: true, is_featured: false, color: "#8B5CF6",
    ai_chat_limit_period: "day",
  });

  useEffect(() => { fetchPlans(); fetchReportTypes(); }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`${API}/admin/plans`);
      setPlans(res.data || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const fetchReportTypes = async () => {
    try {
      const res = await apiClient.get(`${API}/report-types`);
      setReportTypes(res.data || []);
    } catch (e) { console.error(e); }
  };

  const resetForm = () => {
    setForm({ name: "", slug: "", description: "", price_monthly: 0, price_annual: 0, features: [""], ai_reports_per_month: 0, free_chat_minutes: 0, discount_on_products: 0, is_active: true, is_featured: false, color: "#8B5CF6" });
    setEditing(null);
  };

  const handleEdit = (plan) => {
    setForm({
      name: plan.name, slug: plan.slug, description: plan.description,
      price_monthly: plan.price_monthly, price_annual: plan.price_annual,
      features: plan.features?.length ? plan.features : [""],
      ai_reports_per_month: plan.ai_reports_per_month, free_chat_minutes: plan.free_chat_minutes,
      discount_on_products: plan.discount_on_products,
      is_active: plan.is_active !== undefined ? plan.is_active : true,
      is_featured: plan.is_featured,
      color: plan.color || "#8B5CF6"
    });
    setEditing(plan);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form, features: form.features.filter(f => f.trim()), slug: form.slug || form.name.toLowerCase().replace(/\s+/g, "-") };
    try {
      if (editing) {
        await apiClient.put(`${API}/admin/plans/${editing.id}`, payload);
        toast.success("Plan updated");
      } else {
        await apiClient.post(`${API}/admin/plans`, payload);
        toast.success("Plan created");
      }
      setShowForm(false); resetForm(); fetchPlans();
    } catch (e) { toast.error("Failed to save plan"); }
  };

  const togglePlan = async (plan) => {
    try {
      await apiClient.patch(`${API}/admin/plans/${plan.id}/toggle`, { is_active: !plan.is_active });
      toast.success(plan.is_active ? "Plan deactivated" : "Plan activated");
      fetchPlans();
    } catch (e) { toast.error("Failed"); }
  };

  const deletePlan = async (id) => {
    if (!confirm("Delete this plan?")) return;
    try {
      await apiClient.delete(`${API}/admin/plans/${id}`);
      toast.success("Plan deleted"); fetchPlans();
    } catch (e) { toast.error("Failed"); }
  };

  const addFeature = () => setForm(p => ({ ...p, features: [...p.features, ""] }));
  const updateFeature = (i, v) => { const f = [...form.features]; f[i] = v; setForm(p => ({ ...p, features: f })); };
  const removeFeature = (i) => setForm(p => ({ ...p, features: p.features.filter((_, idx) => idx !== i) }));

  return (
    <div data-testid="admin-plans-page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Plans & Pricing</h1>
          <p className="text-slate-400">Manage subscription plans</p>
        </div>
        <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => { resetForm(); setShowForm(true); }} data-testid="add-plan-btn">
          <Plus className="w-4 h-4 mr-2" /> New Plan
        </Button>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        {loading ? <p className="text-slate-400 col-span-4 text-center py-8">Loading...</p> : plans.map((plan) => (
          <Card key={plan.id} className={`border-2 ${plan.is_active ? "bg-slate-800/50 border-slate-700" : "bg-slate-800/30 border-slate-800 opacity-60"}`} data-testid={`plan-card-${plan.id}`}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: plan.color + "30" }}>
                  <Crown className="w-5 h-5" style={{ color: plan.color }} />
                </div>
                <div className="flex gap-1">
                  <Badge className={plan.is_active ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}>
                    {plan.is_active ? "Active" : "Inactive"}
                  </Badge>
                  {plan.is_featured && <Badge className="bg-amber-500/20 text-amber-400">Featured</Badge>}
                </div>
              </div>
              <h3 className="text-lg font-bold text-white">{plan.name}</h3>
              <p className="text-sm text-slate-400 mb-3">{plan.description}</p>
              <div className="mb-3">
                <span className="text-2xl font-bold text-white">₹{plan.price_monthly}</span>
                <span className="text-slate-400 text-sm">/mo</span>
                {plan.price_annual > 0 && <span className="text-xs text-slate-500 ml-2">₹{plan.price_annual}/yr</span>}
              </div>
              <ul className="space-y-1 mb-4">
                {plan.features?.slice(0, 4).map((f, i) => (
                  <li key={i} className="text-sm text-slate-300 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />{f}
                  </li>
                ))}
                {plan.features?.length > 4 && <li className="text-xs text-slate-500">+{plan.features.length - 4} more features</li>}
              </ul>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" className="flex-1 text-slate-300" onClick={() => handleEdit(plan)}>
                  <Edit className="w-4 h-4 mr-1" /> Edit
                </Button>
                <Button size="sm" variant="ghost" onClick={() => togglePlan(plan)}>
                  {plan.is_active ? <ToggleRight className="w-4 h-4 text-green-400" /> : <ToggleLeft className="w-4 h-4 text-slate-400" />}
                </Button>
                <Button size="sm" variant="ghost" className="text-red-400" onClick={() => deletePlan(plan.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showForm} onOpenChange={(o) => { if (!o) { setShowForm(false); resetForm(); } }}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-white">{editing ? "Edit Plan" : "New Plan"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Plan Name *</label>
                <Input value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} className="bg-slate-800 border-slate-700" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Slug</label>
                <Input value={form.slug} onChange={(e) => setForm(p => ({ ...p, slug: e.target.value }))} className="bg-slate-800 border-slate-700" placeholder="auto-generated" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
              <Input value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} className="bg-slate-800 border-slate-700" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Monthly Price (₹)</label>
                <Input type="number" value={form.price_monthly} onChange={(e) => setForm(p => ({ ...p, price_monthly: parseFloat(e.target.value) || 0 }))} className="bg-slate-800 border-slate-700" min="0" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Annual Price (₹)</label>
                <Input type="number" value={form.price_annual} onChange={(e) => setForm(p => ({ ...p, price_annual: parseFloat(e.target.value) || 0 }))} className="bg-slate-800 border-slate-700" min="0" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">AI Report Tokens (Monthly)</label>
                <Input type="number" value={form.ai_reports_per_month} onChange={(e) => setForm(p => ({ ...p, ai_reports_per_month: parseInt(e.target.value) || 0 }))} className="bg-slate-800 border-slate-700" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Free Chat Min</label>
                <Input type="number" value={form.free_chat_minutes} onChange={(e) => setForm(p => ({ ...p, free_chat_minutes: parseInt(e.target.value) || 0 }))} className="bg-slate-800 border-slate-700" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Store Discount %</label>
                <Input type="number" value={form.discount_on_products} onChange={(e) => setForm(p => ({ ...p, discount_on_products: parseInt(e.target.value) || 0 }))} className="bg-slate-800 border-slate-700" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Features</label>
              {form.features.map((f, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <Input value={f} onChange={(e) => updateFeature(i, e.target.value)} className="bg-slate-800 border-slate-700" placeholder="Feature description" />
                  {form.features.length > 1 && (
                    <Button type="button" size="sm" variant="ghost" className="text-red-400" onClick={() => removeFeature(i)}>×</Button>
                  )}
                </div>
              ))}
              <Button type="button" size="sm" variant="outline" className="border-slate-700" onClick={addFeature}><Plus className="w-3 h-3 mr-1" /> Add Feature</Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Color</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={form.color} onChange={(e) => setForm(p => ({ ...p, color: e.target.value }))} className="w-10 h-10 rounded border-0 cursor-pointer" />
                  <Input value={form.color} onChange={(e) => setForm(p => ({ ...p, color: e.target.value }))} className="bg-slate-800 border-slate-700" />
                </div>
              </div>
              <div className="space-y-3 pt-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Switch checked={form.is_active} onCheckedChange={(c) => setForm(p => ({ ...p, is_active: c }))} />
                  <span className="text-sm text-slate-300">Active</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Switch checked={form.is_featured} onCheckedChange={(c) => setForm(p => ({ ...p, is_featured: c }))} />
                  <span className="text-sm text-slate-300">Featured</span>
                </label>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700">{editing ? "Update Plan" : "Create Plan"}</Button>
              <Button type="button" variant="outline" className="border-slate-700" onClick={() => { setShowForm(false); resetForm(); }}>Cancel</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPlans;
