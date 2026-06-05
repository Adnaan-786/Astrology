import { useState, useEffect } from "react";
import apiClient from "@/lib/apiClient";
import { API } from "@/App";
import { toast } from "sonner";
import { Image, Plus, Edit, Trash2, ToggleLeft, ToggleRight, GripVertical, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { getImageUrl } from "@/lib/utils";

const AdminBanners = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    title: "", subtitle: "", image_url: "", link: "", position: 1, is_active: true, page: "home"
  });

  useEffect(() => { fetchBanners(); }, []);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`${API}/admin/banners`);
      setBanners(res.data || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const resetForm = () => {
    setForm({ title: "", subtitle: "", image_url: "", link: "", position: 1, is_active: true, page: "home" });
    setEditing(null);
  };

  const handleEdit = (b) => {
    setForm({
      title: b.title, subtitle: b.subtitle || "", image_url: b.image_url,
      link: b.link || "", position: b.position || 1, is_active: b.is_active, page: b.page || "home"
    });
    setEditing(b);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await apiClient.put(`${API}/admin/banners/${editing.id}`, form);
        toast.success("Banner updated");
      } else {
        await apiClient.post(`${API}/admin/banners`, form);
        toast.success("Banner created");
      }
      setShowForm(false); resetForm(); fetchBanners();
    } catch (e) { toast.error("Failed to save"); }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Only JPEG, PNG, WebP, GIF, or SVG images are allowed.");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const token = localStorage.getItem("astrovedic_token");
      const res = await fetch(`${API}/admin/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Upload failed");
      setForm(p => ({ ...p, image_url: data.url }));
      toast.success("Image uploaded successfully!");
    } catch (err) {
      toast.error(err.message || "Image upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const toggleBanner = async (b) => {
    try {
      await apiClient.patch(`${API}/admin/banners/${b.id}/toggle`, { is_active: !b.is_active });
      toast.success(b.is_active ? "Banner hidden" : "Banner shown");
      fetchBanners();
    } catch (e) { toast.error("Failed"); }
  };

  const deleteBanner = async (id) => {
    if (!confirm("Delete banner?")) return;
    try {
      await apiClient.delete(`${API}/admin/banners/${id}`);
      toast.success("Banner deleted"); fetchBanners();
    } catch (e) { toast.error("Failed"); }
  };

  return (
    <div data-testid="admin-banners-page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Banners</h1>
          <p className="text-slate-400">Manage promotional banners across the site</p>
        </div>
        <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => { resetForm(); setShowForm(true); }} data-testid="add-banner-btn">
          <Plus className="w-4 h-4 mr-2" /> New Banner
        </Button>
      </div>

      <div className="space-y-4">
        {loading ? <p className="text-slate-400 text-center py-8">Loading...</p> : banners.map((b) => (
          <Card key={b.id} className={`border ${b.is_active ? "bg-slate-800/50 border-slate-700" : "bg-slate-800/30 border-slate-800 opacity-60"}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-slate-500">
                  <GripVertical className="w-4 h-4" />
                  <span className="text-sm font-mono">#{b.position}</span>
                </div>
                {b.image_url && (
                  <img src={getImageUrl(b.image_url)} alt="" className="w-32 h-20 rounded-lg object-cover flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-white truncate">{b.title}</h3>
                    <Badge variant="outline" className="border-slate-600 text-xs">{b.page}</Badge>
                    <Badge className={b.is_active ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}>
                      {b.is_active ? "Active" : "Hidden"}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-400 truncate">{b.subtitle}</p>
                  {b.link && <p className="text-xs text-purple-400 flex items-center gap-1 mt-1"><ExternalLink className="w-3 h-3" />{b.link}</p>}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button size="sm" variant="ghost" onClick={() => handleEdit(b)}><Edit className="w-4 h-4 text-blue-400" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => toggleBanner(b)}>
                    {b.is_active ? <ToggleRight className="w-4 h-4 text-green-400" /> : <ToggleLeft className="w-4 h-4 text-slate-400" />}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => deleteBanner(b.id)}><Trash2 className="w-4 h-4 text-red-400" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showForm} onOpenChange={(o) => { if (!o) { setShowForm(false); resetForm(); } }}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-lg">
          <DialogHeader><DialogTitle className="text-white">{editing ? "Edit Banner" : "New Banner"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Title *</label>
              <Input value={form.title} onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))} className="bg-slate-800 border-slate-700" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Subtitle</label>
              <Input value={form.subtitle} onChange={(e) => setForm(p => ({ ...p, subtitle: e.target.value }))} className="bg-slate-800 border-slate-700" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Image URL *</label>
              <div className="flex gap-2">
                <Input value={form.image_url} onChange={(e) => setForm(p => ({ ...p, image_url: e.target.value }))} className="bg-slate-800 border-slate-700 flex-1" required placeholder="https://..." />
                <div className="relative">
                  <Button type="button" variant="outline" className="border-slate-700 w-[100px]" disabled={uploading}>
                    {uploading ? "Uploading..." : "Upload"}
                  </Button>
                  <input 
                    type="file" 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                  />
                </div>
              </div>
            </div>
            {form.image_url && <img src={getImageUrl(form.image_url)} alt="Preview" className="w-full h-32 object-cover rounded-lg" />}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Link</label>
                <Input value={form.link} onChange={(e) => setForm(p => ({ ...p, link: e.target.value }))} className="bg-slate-800 border-slate-700" placeholder="/page" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Position</label>
                <Input type="number" value={form.position} onChange={(e) => setForm(p => ({ ...p, position: parseInt(e.target.value) || 1 }))} className="bg-slate-800 border-slate-700" min="1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Page</label>
                <Select value={form.page} onValueChange={(v) => setForm(p => ({ ...p, page: v }))}>
                  <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    <SelectItem value="home">Home — top carousel</SelectItem>
                    <SelectItem value="store">Cosmic Store — page header</SelectItem>
                    <SelectItem value="astrologers">Astrologers — page header</SelectItem>
                    <SelectItem value="plans">Plans — page header</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Banner only shows on the selected public page.
                </p>
              </div>
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

export default AdminBanners;
