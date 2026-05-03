import { useState, useEffect } from "react";
import axios from "axios";
import { API } from "@/App";
import { toast } from "sonner";
import {
  Star, Plus, Search, MoreVertical, Eye, Edit, Ban,
  Trash2, Check, X, Upload
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const specializations = ["Kundli", "Vastu", "Tarot", "Numerology", "Face Reading", "Marriage", "Career", "Love", "Finance", "Palmistry"];
const languages = ["Hindi", "English", "Tamil", "Telugu", "Bengali", "Marathi", "Gujarati", "Sanskrit"];

const AdminAstrologers = () => {
  const [astrologers, setAstrologers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAstrologer, setEditingAstrologer] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    photo_url: "",
    specializations: [],
    languages: [],
    experience_years: 0,
    rate_per_minute: 15,
    is_verified: true,
    is_featured: false,
    commission_percent: 30
  });

  useEffect(() => {
    fetchAstrologers();
  }, []);

  const fetchAstrologers = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/astrologers`);
      setAstrologers(res.data);
    } catch (e) {
      console.error("Error fetching astrologers:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAstrologer) {
        await axios.put(`${API}/admin/astrologers/${editingAstrologer.id}`, formData);
        toast.success("Astrologer updated successfully");
      } else {
        await axios.post(`${API}/admin/astrologers`, formData);
        toast.success("Astrologer added successfully");
      }
      setShowForm(false);
      setEditingAstrologer(null);
      resetForm();
      fetchAstrologers();
    } catch (e) {
      toast.error("Failed to save astrologer");
    }
  };

  const handleEdit = (astrologer) => {
    setFormData({
      name: astrologer.name,
      bio: astrologer.bio,
      photo_url: astrologer.photo_url,
      specializations: astrologer.specializations || [],
      languages: astrologer.languages || [],
      experience_years: astrologer.experience_years,
      rate_per_minute: astrologer.rate_per_minute,
      is_verified: astrologer.is_verified,
      is_featured: astrologer.is_featured,
      commission_percent: astrologer.commission_percent || 30
    });
    setEditingAstrologer(astrologer);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this astrologer?")) return;
    try {
      await axios.delete(`${API}/admin/astrologers/${id}`);
      toast.success("Astrologer deleted");
      fetchAstrologers();
    } catch (e) {
      toast.error("Failed to delete astrologer");
    }
  };

  const toggleOnlineStatus = async (id, currentStatus) => {
    try {
      await axios.patch(`${API}/admin/astrologers/${id}/status`, { is_online: !currentStatus });
      toast.success("Status updated");
      fetchAstrologers();
    } catch (e) {
      toast.error("Failed to update status");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      bio: "",
      photo_url: "",
      specializations: [],
      languages: [],
      experience_years: 0,
      rate_per_minute: 15,
      is_verified: true,
      is_featured: false,
      commission_percent: 30
    });
  };

  const toggleSpec = (spec) => {
    setFormData(prev => ({
      ...prev,
      specializations: prev.specializations.includes(spec)
        ? prev.specializations.filter(s => s !== spec)
        : [...prev.specializations, spec]
    }));
  };

  const toggleLang = (lang) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.includes(lang)
        ? prev.languages.filter(l => l !== lang)
        : [...prev.languages, lang]
    }));
  };

  const filteredAstrologers = astrologers.filter(a =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div data-testid="admin-astrologers-page">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Astrologer Management</h1>
          <p className="text-slate-400">{astrologers.length} astrologers registered</p>
        </div>
        <Button 
          className="bg-purple-600 hover:bg-purple-700"
          onClick={() => { resetForm(); setEditingAstrologer(null); setShowForm(true); }}
          data-testid="add-astrologer-btn"
        >
          <Plus className="w-4 h-4 mr-2" /> Add New Astrologer
        </Button>
      </div>

      {/* Search */}
      <Card className="bg-slate-800/50 border-slate-700 mb-6">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search astrologers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-900 border-slate-700"
            />
          </div>
        </CardContent>
      </Card>

      {/* Astrologers Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          Array(6).fill(0).map((_, i) => (
            <Card key={i} className="bg-slate-800/50 border-slate-700 h-[280px] animate-pulse" />
          ))
        ) : filteredAstrologers.map((astro) => (
          <Card key={astro.id} className="bg-slate-800/50 border-slate-700" data-testid={`astrologer-card-${astro.id}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <img 
                    src={astro.photo_url} 
                    alt={astro.name}
                    className="w-14 h-14 rounded-full object-cover border-2 border-purple-500/30"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-white">{astro.name}</h3>
                      {astro.is_verified && (
                        <Badge className="bg-blue-500/20 text-blue-400 text-xs">Verified</Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-400">{astro.experience_years} years exp</p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-slate-900 border-slate-700">
                    <DropdownMenuItem onClick={() => handleEdit(astro)} className="cursor-pointer">
                      <Edit className="w-4 h-4 mr-2" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toggleOnlineStatus(astro.id, astro.is_online)} className="cursor-pointer">
                      {astro.is_online ? <X className="w-4 h-4 mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                      {astro.is_online ? "Set Offline" : "Set Online"}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDelete(astro.id)} className="cursor-pointer text-red-400">
                      <Trash2 className="w-4 h-4 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <div className={`w-2 h-2 rounded-full ${astro.is_online ? 'bg-green-500' : 'bg-slate-500'}`} />
                <span className="text-sm text-slate-400">{astro.is_online ? "Online" : "Offline"}</span>
                {astro.is_featured && (
                  <Badge className="bg-amber-500/20 text-amber-400 text-xs ml-auto">Featured</Badge>
                )}
              </div>

              <div className="flex flex-wrap gap-1 mb-3">
                {astro.specializations?.slice(0, 3).map((spec, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs border-slate-600 text-slate-300">
                    {spec}
                  </Badge>
                ))}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-700">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="text-white font-medium">{astro.rating}</span>
                  <span className="text-slate-400 text-sm">({astro.total_reviews})</span>
                </div>
                <span className="text-amber-400 font-bold">₹{astro.rate_per_minute}/min</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => { if (!open) { setShowForm(false); setEditingAstrologer(null); } }}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingAstrologer ? "Edit Astrologer" : "Add New Astrologer"}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                  className="bg-slate-800 border-slate-700"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Photo URL *</label>
                <Input
                  value={formData.photo_url}
                  onChange={(e) => setFormData(p => ({ ...p, photo_url: e.target.value }))}
                  className="bg-slate-800 border-slate-700"
                  placeholder="https://..."
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Bio *</label>
              <Textarea
                value={formData.bio}
                onChange={(e) => setFormData(p => ({ ...p, bio: e.target.value }))}
                className="bg-slate-800 border-slate-700"
                rows={3}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Specializations</label>
              <div className="flex flex-wrap gap-2">
                {specializations.map(spec => (
                  <button
                    type="button"
                    key={spec}
                    onClick={() => toggleSpec(spec)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      formData.specializations.includes(spec)
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {spec}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Languages</label>
              <div className="flex flex-wrap gap-2">
                {languages.map(lang => (
                  <button
                    type="button"
                    key={lang}
                    onClick={() => toggleLang(lang)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      formData.languages.includes(lang)
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Experience (years)</label>
                <Input
                  type="number"
                  value={formData.experience_years}
                  onChange={(e) => setFormData(p => ({ ...p, experience_years: parseInt(e.target.value) || 0 }))}
                  className="bg-slate-800 border-slate-700"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Rate/min (₹)</label>
                <Input
                  type="number"
                  value={formData.rate_per_minute}
                  onChange={(e) => setFormData(p => ({ ...p, rate_per_minute: parseInt(e.target.value) || 0 }))}
                  className="bg-slate-800 border-slate-700"
                  min="5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Commission %</label>
                <Input
                  type="number"
                  value={formData.commission_percent}
                  onChange={(e) => setFormData(p => ({ ...p, commission_percent: parseInt(e.target.value) || 0 }))}
                  className="bg-slate-800 border-slate-700"
                  min="0"
                  max="100"
                />
              </div>
            </div>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <Switch
                  checked={formData.is_verified}
                  onCheckedChange={(checked) => setFormData(p => ({ ...p, is_verified: checked }))}
                />
                <span className="text-sm text-slate-300">Verified</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Switch
                  checked={formData.is_featured}
                  onCheckedChange={(checked) => setFormData(p => ({ ...p, is_featured: checked }))}
                />
                <span className="text-sm text-slate-300">Featured</span>
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700">
                {editingAstrologer ? "Update Astrologer" : "Add Astrologer"}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                className="border-slate-700"
                onClick={() => { setShowForm(false); setEditingAstrologer(null); }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminAstrologers;
