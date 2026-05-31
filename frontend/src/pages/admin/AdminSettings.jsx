import { useState, useEffect } from "react";
import apiClient from "@/lib/apiClient";
import { API } from "@/App";
import { toast } from "sonner";
import { Settings, Save, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const AdminSettings = () => {
  const [settings, setSettings] = useState({
    siteName: "AstroVedic AI",
    tagline: "Where Ancient Stars Meet Artificial Intelligence",
    contactEmail: "support@astrovedic.ai",
    supportPhone: "+91 98765 43210",
    logoUrl: "",
    instagram: "https://instagram.com/astrovedic",
    youtube: "https://youtube.com/astrovedic",
    whatsapp: "+919876543210",
    twitter: "",
    facebook: "",
    commissionRate: 30,
    gstRate: 18,
    referralBonus: 50,
    freeMessagesPerDay: 5,
    maintenanceMode: false,
    dreamAnalyserEnabled: true,
    communityEnabled: true,
    panchangEnabled: true,
    numerologyEnabled: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    try {
      const res = await apiClient.get(`${API}/admin/settings`);
      if (res.data) setSettings(prev => ({ ...prev, ...res.data }));
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiClient.put(`${API}/admin/settings`, settings);
      toast.success("Settings saved successfully! Changes will reflect across the website.");
    } catch (e) {
      toast.error("Failed to save settings");
    } finally { setSaving(false); }
  };

  if (loading) return <p className="text-slate-400 text-center py-8">Loading settings...</p>;

  return (
    <div data-testid="admin-settings-page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Site Settings</h1>
          <p className="text-slate-400">Changes here apply across the entire website</p>
        </div>
        <Button onClick={handleSave} className="bg-purple-600 hover:bg-purple-700" disabled={saving} data-testid="save-settings-btn">
          <Save className="w-4 h-4 mr-2" /> {saving ? "Saving..." : "Save All Settings"}
        </Button>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="bg-slate-800 mb-6">
          <TabsTrigger value="general" className="data-[state=active]:bg-purple-600">General</TabsTrigger>
          <TabsTrigger value="branding" className="data-[state=active]:bg-purple-600">Branding</TabsTrigger>
          <TabsTrigger value="payment" className="data-[state=active]:bg-purple-600">Payment</TabsTrigger>
          <TabsTrigger value="ai" className="data-[state=active]:bg-purple-600">AI Settings</TabsTrigger>
          <TabsTrigger value="features" className="data-[state=active]:bg-purple-600">Feature Flags</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader><CardTitle className="text-white">General Settings</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Site Name</label>
                  <Input value={settings.siteName} onChange={(e) => setSettings(p => ({ ...p, siteName: e.target.value }))} className="bg-slate-900 border-slate-700" data-testid="site-name-input" />
                  <p className="text-xs text-slate-500 mt-1">Appears in header, footer, and browser tab</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Tagline</label>
                  <Input value={settings.tagline} onChange={(e) => setSettings(p => ({ ...p, tagline: e.target.value }))} className="bg-slate-900 border-slate-700" data-testid="tagline-input" />
                  <p className="text-xs text-slate-500 mt-1">Shown on homepage hero section</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Contact Email</label>
                  <Input value={settings.contactEmail} onChange={(e) => setSettings(p => ({ ...p, contactEmail: e.target.value }))} className="bg-slate-900 border-slate-700" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Support Phone</label>
                  <Input value={settings.supportPhone} onChange={(e) => setSettings(p => ({ ...p, supportPhone: e.target.value }))} className="bg-slate-900 border-slate-700" />
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Instagram</label>
                  <Input value={settings.instagram} onChange={(e) => setSettings(p => ({ ...p, instagram: e.target.value }))} className="bg-slate-900 border-slate-700" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">YouTube</label>
                  <Input value={settings.youtube} onChange={(e) => setSettings(p => ({ ...p, youtube: e.target.value }))} className="bg-slate-900 border-slate-700" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">WhatsApp</label>
                  <Input value={settings.whatsapp} onChange={(e) => setSettings(p => ({ ...p, whatsapp: e.target.value }))} className="bg-slate-900 border-slate-700" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Twitter</label>
                  <Input value={settings.twitter || ""} onChange={(e) => setSettings(p => ({ ...p, twitter: e.target.value }))} className="bg-slate-900 border-slate-700" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Facebook</label>
                  <Input value={settings.facebook || ""} onChange={(e) => setSettings(p => ({ ...p, facebook: e.target.value }))} className="bg-slate-900 border-slate-700" />
                </div>
              </div>
              <div className="pt-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <Switch checked={settings.maintenanceMode} onCheckedChange={(checked) => setSettings(p => ({ ...p, maintenanceMode: checked }))} />
                  <div>
                    <span className="text-white font-medium">Maintenance Mode</span>
                    <p className="text-xs text-slate-400">When enabled, users will see a maintenance page</p>
                  </div>
                </label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branding">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader><CardTitle className="text-white">Branding & Logo</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Logo URL</label>
                <Input value={settings.logoUrl || ""} onChange={(e) => setSettings(p => ({ ...p, logoUrl: e.target.value }))} className="bg-slate-900 border-slate-700" placeholder="https://your-logo.png" data-testid="logo-url-input" />
                <p className="text-xs text-slate-500 mt-1">Paste a URL to your logo image. It will appear in the navbar and footer.</p>
              </div>
              {settings.logoUrl && (
                <div className="p-4 bg-slate-900 rounded-lg">
                  <p className="text-sm text-slate-400 mb-2">Preview:</p>
                  <img src={settings.logoUrl} alt="Logo Preview" className="h-12 object-contain" />
                </div>
              )}
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <p className="text-sm text-amber-400">All branding changes (site name, tagline, logo) will reflect across the entire website including navbar, footer, and homepage after saving.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader><CardTitle className="text-white">Payment Settings</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Platform Commission (%)</label>
                  <Input type="number" value={settings.commissionRate} onChange={(e) => setSettings(p => ({ ...p, commissionRate: parseInt(e.target.value) || 0 }))} className="bg-slate-900 border-slate-700" min="0" max="100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">GST Rate (%)</label>
                  <Input type="number" value={settings.gstRate} onChange={(e) => setSettings(p => ({ ...p, gstRate: parseInt(e.target.value) || 0 }))} className="bg-slate-900 border-slate-700" min="0" max="100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Referral Bonus (₹)</label>
                  <Input type="number" value={settings.referralBonus} onChange={(e) => setSettings(p => ({ ...p, referralBonus: parseInt(e.target.value) || 0 }))} className="bg-slate-900 border-slate-700" min="0" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader><CardTitle className="text-white">AI Settings</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Free Messages/Day (Free Plan)</label>
                  <Input type="number" value={settings.freeMessagesPerDay} onChange={(e) => setSettings(p => ({ ...p, freeMessagesPerDay: parseInt(e.target.value) || 0 }))} className="bg-slate-900 border-slate-700" min="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">AI Model</label>
                  <Input value="Claude Sonnet 4" disabled className="bg-slate-900 border-slate-700 opacity-50" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader><CardTitle className="text-white">Feature Flags</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: "dreamAnalyserEnabled", label: "Dream Analyser", desc: "AI-powered Vedic dream interpretation" },
                { key: "communityEnabled", label: "Community Forum", desc: "Q&A forum for users and astrologers" },
                { key: "panchangEnabled", label: "Panchang", desc: "Daily Panchang with tithi, nakshatra, etc." },
                { key: "numerologyEnabled", label: "Name Numerology", desc: "Numerological name analysis" },
              ].map((feature) => (
                <label key={feature.key} className="flex items-center justify-between p-4 bg-slate-900 rounded-lg cursor-pointer">
                  <div>
                    <span className="text-white font-medium">{feature.label}</span>
                    <p className="text-xs text-slate-400">{feature.desc}</p>
                  </div>
                  <Switch checked={settings[feature.key]} onCheckedChange={(checked) => setSettings(p => ({ ...p, [feature.key]: checked }))} />
                </label>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSettings;
