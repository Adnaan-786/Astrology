import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Star, User, Phone, Calendar, MapPin, Clock, Edit2, LogOut, ArrowLeft, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import apiClient from "@/lib/apiClient";
import { logout, getStoredUser } from "@/lib/authService";

const ProfilePage = () => {
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({
    name: "", phone: "", dob: "", tob: "", pob: "", gender: "",
    rashi: "", preferred_language: "hindi",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await apiClient.get("/auth/profile");
        const u = res.data.user;
        setUser(u);
        setForm({
          name: u.name || "",
          phone: u.phone || "",
          dob: u.dob || "",
          tob: u.tob || "",
          pob: u.pob || "",
          gender: u.gender || "",
          rashi: u.rashi || "",
          preferred_language: u.preferred_language || "hindi",
        });
      } catch {
        // Fallback to local storage
        const stored = getStoredUser();
        if (stored) setUser(stored);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const updateField = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await apiClient.put("/auth/profile", form);
      setUser(res.data.user);
      localStorage.setItem("astrovedic_user", JSON.stringify(res.data.user));
      setEditing(false);
      toast.success("Profile updated successfully!");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen av-bg flex items-center justify-center">
        <div className="animate-spin size-8 border-2 border-[#D4A017] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!loading && !user) {
    return (
      <div className="min-h-screen av-bg flex flex-col items-center justify-center p-4">
        <div className="av-surface av-card-border rounded-2xl p-8 text-center max-w-md w-full">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-[#D4A017] to-[#F5C842] rounded-full flex items-center justify-center mb-6">
            <User className="w-8 h-8 text-[#0D0B1E]" />
          </div>
          <h2 className="font-cinzel text-2xl text-white mb-3">Please Login</h2>
          <p className="text-zinc-400 mb-6 text-sm">You need to be logged in to view and edit your profile details.</p>
          <Button onClick={() => navigate("/login")} className="bg-gradient-to-r from-[#D4A017] to-[#F5C842] text-[#0D0B1E] font-semibold rounded-full px-8 w-full">
            Login Now
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen av-bg pt-20 lg:pt-24 pb-24">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#2D1B69]/50 to-transparent" />
        <div className="relative z-10 px-4 sm:px-6 pt-6 pb-20">
          <div className="max-w-2xl mx-auto">
            <button onClick={() => navigate(-1)}
              className="flex items-center gap-1 text-sm av-text-2 hover:av-text mb-6">
              <ArrowLeft className="size-4" /> Back
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 -mt-14 relative z-20">
        {/* Profile Card */}
        <div className="av-surface av-card-border rounded-2xl p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="relative">
              <div className="size-20 rounded-full bg-gradient-to-r from-[#D4A017] to-[#F5C842] flex items-center justify-center text-2xl font-bold text-[#0D0B1E]">
                {(user?.name || "U")[0].toUpperCase()}
              </div>
              {user?.photo_url && (
                <img src={user.photo_url} alt="" className="absolute inset-0 size-20 rounded-full object-cover" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-cinzel text-xl font-bold av-text truncate">{user?.name || "User"}</h1>
              <p className="text-sm av-text-2">{user?.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#D4A017]/15 text-[#F5C842] font-medium capitalize">
                  {user?.plan || "free"} plan
                </span>
                {user?.rashi && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-400 font-medium capitalize">
                    {user.rashi}
                  </span>
                )}
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => setEditing(!editing)}
              className="av-surface av-card-border">
              <Edit2 className="size-4 mr-1" /> {editing ? "Cancel" : "Edit"}
            </Button>
          </div>
        </div>

        {/* Details */}
        <div className="av-surface av-card-border rounded-2xl p-6 mb-6">
          <h2 className="font-cinzel text-lg font-bold av-text mb-4">Personal Details</h2>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium av-text-2">Full Name</Label>
              {editing ? (
                <Input value={form.name} onChange={(e) => updateField("name", e.target.value)}
                  className="h-11 av-surface av-card-border focus:border-[#D4A017]" />
              ) : (
                <p className="av-text text-sm">{user?.name || "—"}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium av-text-2">Phone</Label>
              {editing ? (
                <Input value={form.phone} onChange={(e) => updateField("phone", e.target.value)}
                  className="h-11 av-surface av-card-border focus:border-[#D4A017]" />
              ) : (
                <p className="av-text text-sm">{user?.phone || "—"}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium av-text-2">Date of Birth</Label>
                {editing ? (
                  <Input type="date" value={form.dob} onChange={(e) => updateField("dob", e.target.value)}
                    className="h-11 av-surface av-card-border focus:border-[#D4A017]" />
                ) : (
                  <p className="av-text text-sm">{user?.dob || "—"}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium av-text-2">Time of Birth</Label>
                {editing ? (
                  <Input type="time" value={form.tob} onChange={(e) => updateField("tob", e.target.value)}
                    className="h-11 av-surface av-card-border focus:border-[#D4A017]" />
                ) : (
                  <p className="av-text text-sm">{user?.tob || "—"}</p>
                )}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium av-text-2">Place of Birth</Label>
              {editing ? (
                <Input value={form.pob} onChange={(e) => updateField("pob", e.target.value)}
                  placeholder="e.g. Delhi, India"
                  className="h-11 av-surface av-card-border focus:border-[#D4A017]" />
              ) : (
                <p className="av-text text-sm">{user?.pob || "—"}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium av-text-2">Gender</Label>
              {editing ? (
                <div className="grid grid-cols-3 gap-2">
                  {["male", "female", "other"].map((g) => (
                    <button key={g} type="button" onClick={() => updateField("gender", g)}
                      className={`h-9 rounded-lg text-sm font-medium capitalize transition-all
                        ${form.gender === g
                          ? "bg-gradient-to-r from-[#D4A017] to-[#F5C842] text-[#0D0B1E]"
                          : "av-surface av-card-border av-text-2 hover:border-[#D4A017]/50"
                        }`}
                    >{g}</button>
                  ))}
                </div>
              ) : (
                <p className="av-text text-sm capitalize">{user?.gender || "—"}</p>
              )}
            </div>
          </div>

          {editing && (
            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={() => setEditing(false)}
                className="flex-1 h-11 av-surface av-card-border">Cancel</Button>
              <Button onClick={handleSave} disabled={saving}
                className="flex-1 h-11 bg-gradient-to-r from-[#D4A017] to-[#F5C842] text-[#0D0B1E] font-semibold">
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          )}
        </div>

        {/* Account */}
        <div className="av-surface av-card-border rounded-2xl p-6">
          <h2 className="font-cinzel text-lg font-bold av-text mb-4">Account</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <span className="text-sm av-text-2">Email</span>
              <span className="text-sm av-text">{user?.email}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm av-text-2">Auth Provider</span>
              <span className="text-sm av-text capitalize">{user?.auth_provider || "email"}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm av-text-2">Member Since</span>
              <span className="text-sm av-text">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}
              </span>
            </div>
            <hr className="border-white/10" />
            <Button variant="outline" onClick={handleLogout}
              className="w-full h-11 border-red-500/30 text-red-400 hover:bg-red-500/10">
              <LogOut className="size-4 mr-2" /> Logout
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
