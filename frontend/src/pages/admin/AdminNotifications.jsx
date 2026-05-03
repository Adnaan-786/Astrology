import { useState, useEffect } from "react";
import axios from "axios";
import { API } from "@/App";
import { toast } from "sonner";
import { Bell, Plus, Send, Trash2, Users, Megaphone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const AdminNotifications = () => {
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", message: "", type: "all", target: "all_users" });

  useEffect(() => { fetchNotifications(); }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/admin/notifications`);
      setNotifs(res.data || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/admin/notifications`, form);
      toast.success("Notification created");
      setShowForm(false);
      setForm({ title: "", message: "", type: "all", target: "all_users" });
      fetchNotifications();
    } catch (e) { toast.error("Failed"); }
  };

  const sendNotification = async (id) => {
    try {
      const res = await axios.post(`${API}/admin/notifications/${id}/send`);
      toast.success(`Notification sent to ${res.data.sent_count} users`);
      fetchNotifications();
    } catch (e) { toast.error("Failed to send"); }
  };

  const deleteNotification = async (id) => {
    if (!confirm("Delete notification?")) return;
    try {
      await axios.delete(`${API}/admin/notifications/${id}`);
      toast.success("Deleted"); fetchNotifications();
    } catch (e) { toast.error("Failed"); }
  };

  return (
    <div data-testid="admin-notifications-page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          <p className="text-slate-400">Send notifications to users</p>
        </div>
        <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => setShowForm(true)} data-testid="create-notification-btn">
          <Plus className="w-4 h-4 mr-2" /> New Notification
        </Button>
      </div>

      <div className="space-y-3">
        {loading ? <p className="text-slate-400 text-center py-8">Loading...</p> : notifs.map((n) => (
          <Card key={n.id} className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${n.is_sent ? "bg-green-500/20" : "bg-amber-500/20"}`}>
                  {n.is_sent ? <Bell className="w-5 h-5 text-green-400" /> : <Megaphone className="w-5 h-5 text-amber-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-white">{n.title}</h3>
                    <Badge className={n.type === "promotional" ? "bg-purple-500/20 text-purple-400" : "bg-blue-500/20 text-blue-400"}>
                      {n.type}
                    </Badge>
                    <Badge className={n.is_sent ? "bg-green-500/20 text-green-400" : "bg-amber-500/20 text-amber-400"}>
                      {n.is_sent ? "Sent" : "Draft"}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-400">{n.message}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{n.sent_count || 0} recipients</span>
                    <span>{new Date(n.created_at).toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {!n.is_sent && (
                    <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => sendNotification(n.id)}>
                      <Send className="w-4 h-4 mr-1" /> Send
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" className="text-red-400" onClick={() => deleteNotification(n.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showForm} onOpenChange={(o) => { if (!o) setShowForm(false); }}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-lg">
          <DialogHeader><DialogTitle className="text-white">New Notification</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Title *</label>
              <Input value={form.title} onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))} className="bg-slate-800 border-slate-700" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Message *</label>
              <Textarea value={form.message} onChange={(e) => setForm(p => ({ ...p, message: e.target.value }))} className="bg-slate-800 border-slate-700" rows={3} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Type</label>
                <Select value={form.type} onValueChange={(v) => setForm(p => ({ ...p, type: v }))}>
                  <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    <SelectItem value="all">General</SelectItem>
                    <SelectItem value="promotional">Promotional</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                    <SelectItem value="reminder">Reminder</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Target</label>
                <Select value={form.target} onValueChange={(v) => setForm(p => ({ ...p, target: v }))}>
                  <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    <SelectItem value="all_users">All Users</SelectItem>
                    <SelectItem value="premium">Premium Users</SelectItem>
                    <SelectItem value="free">Free Users</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700">Create Notification</Button>
              <Button type="button" variant="outline" className="border-slate-700" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminNotifications;
