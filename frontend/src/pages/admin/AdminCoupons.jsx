import { useState, useEffect } from "react";
import axios from "axios";
import { API } from "@/App";
import { toast } from "sonner";
import { Percent, Plus, Edit, Trash2, ToggleLeft, ToggleRight, Copy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    code: "", discount_type: "percentage", discount_value: 10,
    min_order: 0, max_discount: 0, usage_limit: 100,
    is_active: true, expires_at: ""
  });

  useEffect(() => { fetchCoupons(); }, []);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/admin/coupons`);
      setCoupons(res.data || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const resetForm = () => {
    setForm({ code: "", discount_type: "percentage", discount_value: 10, min_order: 0, max_discount: 0, usage_limit: 100, is_active: true, expires_at: "" });
    setEditing(null);
  };

  const handleEdit = (c) => {
    setForm({
      code: c.code, discount_type: c.discount_type, discount_value: c.discount_value,
      min_order: c.min_order || 0, max_discount: c.max_discount || 0,
      usage_limit: c.usage_limit || 100, is_active: c.is_active,
      expires_at: c.expires_at ? c.expires_at.split("T")[0] : ""
    });
    setEditing(c);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form, code: form.code.toUpperCase(), expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : "" };
    try {
      if (editing) {
        await axios.put(`${API}/admin/coupons/${editing.id}`, payload);
        toast.success("Coupon updated");
      } else {
        await axios.post(`${API}/admin/coupons`, payload);
        toast.success("Coupon created");
      }
      setShowForm(false); resetForm(); fetchCoupons();
    } catch (e) { toast.error("Failed to save"); }
  };

  const toggleCoupon = async (c) => {
    try {
      await axios.patch(`${API}/admin/coupons/${c.id}/toggle`, { is_active: !c.is_active });
      toast.success(c.is_active ? "Coupon deactivated" : "Coupon activated");
      fetchCoupons();
    } catch (e) { toast.error("Failed"); }
  };

  const deleteCoupon = async (id) => {
    if (!confirm("Delete coupon?")) return;
    try {
      await axios.delete(`${API}/admin/coupons/${id}`);
      toast.success("Coupon deleted"); fetchCoupons();
    } catch (e) { toast.error("Failed"); }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success("Code copied!");
  };

  return (
    <div data-testid="admin-coupons-page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Coupons & Offers</h1>
          <p className="text-slate-400">{coupons.length} coupons</p>
        </div>
        <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => { resetForm(); setShowForm(true); }} data-testid="add-coupon-btn">
          <Plus className="w-4 h-4 mr-2" /> New Coupon
        </Button>
      </div>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Code</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Discount</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Min Order</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Usage</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Expires</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Status</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="py-8 text-center text-slate-400">Loading...</td></tr>
                ) : coupons.map((c) => (
                  <tr key={c.id} className="border-b border-slate-700/50 hover:bg-slate-800/50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-purple-400">{c.code}</span>
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => copyCode(c.code)}>
                          <Copy className="w-3 h-3 text-slate-400" />
                        </Button>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-white font-medium">
                      {c.discount_type === "percentage" ? `${c.discount_value}%` : `₹${c.discount_value}`}
                      {c.max_discount > 0 && <span className="text-xs text-slate-400 ml-1">(max ₹{c.max_discount})</span>}
                    </td>
                    <td className="py-3 px-4 text-slate-300">₹{c.min_order}</td>
                    <td className="py-3 px-4">
                      <span className="text-slate-300">{c.usage_count || 0}</span>
                      <span className="text-slate-500">/{c.usage_limit}</span>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-400">
                      {c.expires_at ? new Date(c.expires_at).toLocaleDateString() : "Never"}
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={c.is_active ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}>
                        {c.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(c)}><Edit className="w-4 h-4 text-blue-400" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => toggleCoupon(c)}>
                          {c.is_active ? <ToggleRight className="w-4 h-4 text-green-400" /> : <ToggleLeft className="w-4 h-4 text-slate-400" />}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => deleteCoupon(c.id)}><Trash2 className="w-4 h-4 text-red-400" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showForm} onOpenChange={(o) => { if (!o) { setShowForm(false); resetForm(); } }}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-lg">
          <DialogHeader><DialogTitle className="text-white">{editing ? "Edit Coupon" : "New Coupon"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Coupon Code *</label>
              <Input value={form.code} onChange={(e) => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} className="bg-slate-800 border-slate-700 font-mono" placeholder="ASTRO50" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Discount Type</label>
                <Select value={form.discount_type} onValueChange={(v) => setForm(p => ({ ...p, discount_type: v }))}>
                  <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="flat">Flat Amount (₹)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Discount Value</label>
                <Input type="number" value={form.discount_value} onChange={(e) => setForm(p => ({ ...p, discount_value: parseFloat(e.target.value) || 0 }))} className="bg-slate-800 border-slate-700" min="0" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Min Order (₹)</label>
                <Input type="number" value={form.min_order} onChange={(e) => setForm(p => ({ ...p, min_order: parseFloat(e.target.value) || 0 }))} className="bg-slate-800 border-slate-700" min="0" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Max Discount (₹)</label>
                <Input type="number" value={form.max_discount} onChange={(e) => setForm(p => ({ ...p, max_discount: parseFloat(e.target.value) || 0 }))} className="bg-slate-800 border-slate-700" min="0" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Usage Limit</label>
                <Input type="number" value={form.usage_limit} onChange={(e) => setForm(p => ({ ...p, usage_limit: parseInt(e.target.value) || 0 }))} className="bg-slate-800 border-slate-700" min="0" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Expiry Date</label>
              <Input type="date" value={form.expires_at} onChange={(e) => setForm(p => ({ ...p, expires_at: e.target.value }))} className="bg-slate-800 border-slate-700" />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <Switch checked={form.is_active} onCheckedChange={(c) => setForm(p => ({ ...p, is_active: c }))} />
              <span className="text-sm text-slate-300">Active</span>
            </label>
            <div className="flex gap-3 pt-2">
              <Button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700">{editing ? "Update" : "Create"}</Button>
              <Button type="button" variant="outline" className="border-slate-700" onClick={() => { setShowForm(false); resetForm(); }}>Cancel</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCoupons;
