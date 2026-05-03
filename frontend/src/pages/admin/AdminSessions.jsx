import { useState, useEffect } from "react";
import axios from "axios";
import { API } from "@/App";
import { toast } from "sonner";
import { Zap, Phone, Video, MessageSquare, Clock, Star, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const AdminSessions = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => { fetchSessions(); }, [filter]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const params = filter !== "all" ? `?status=${filter}` : "";
      const res = await axios.get(`${API}/admin/sessions${params}`);
      setSessions(res.data || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const endSession = async (id) => {
    try {
      await axios.patch(`${API}/admin/sessions/${id}/end`);
      toast.success("Session ended");
      fetchSessions();
    } catch (e) { toast.error("Failed to end session"); }
  };

  const activeCount = sessions.filter(s => s.status === "active").length;
  const totalRevenue = sessions.reduce((sum, s) => sum + (s.amount || 0), 0);

  const typeIcon = (type) => {
    if (type === "call") return <Phone className="w-4 h-4" />;
    if (type === "video") return <Video className="w-4 h-4" />;
    return <MessageSquare className="w-4 h-4" />;
  };

  return (
    <div data-testid="admin-sessions-page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Live Sessions</h1>
          <p className="text-slate-400">Monitor active consultations in real-time</p>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[160px] bg-slate-800 border-slate-700">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-700">
            <SelectItem value="all">All Sessions</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center"><Zap className="w-5 h-5 text-white" /></div>
            <div><p className="text-2xl font-bold text-white">{activeCount}</p><p className="text-sm text-slate-400">Active Now</p></div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center"><Clock className="w-5 h-5 text-white" /></div>
            <div><p className="text-2xl font-bold text-white">{sessions.length}</p><p className="text-sm text-slate-400">Total Sessions</p></div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center"><Star className="w-5 h-5 text-white" /></div>
            <div><p className="text-2xl font-bold text-amber-400">₹{totalRevenue.toLocaleString()}</p><p className="text-sm text-slate-400">Total Revenue</p></div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Session</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">User</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Astrologer</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Type</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Duration</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Amount</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Rating</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} className="py-8 text-center text-slate-400">Loading...</td></tr>
                ) : sessions.length === 0 ? (
                  <tr><td colSpan={9} className="py-8 text-center text-slate-400">No sessions found</td></tr>
                ) : sessions.map((s) => (
                  <tr key={s.id} className="border-b border-slate-700/50 hover:bg-slate-800/50">
                    <td className="py-3 px-4 text-white font-mono text-sm">#{s.id?.slice(0, 8)}</td>
                    <td className="py-3 px-4 text-white">{s.user_name}</td>
                    <td className="py-3 px-4 text-slate-300">{s.astrologer_name}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2 text-slate-300">
                        {typeIcon(s.type)}<span className="capitalize">{s.type}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-300">{s.duration_minutes} min</td>
                    <td className="py-3 px-4 text-amber-400 font-medium">₹{s.amount}</td>
                    <td className="py-3 px-4">
                      <Badge className={s.status === "active" ? "bg-green-500/20 text-green-400" : s.status === "completed" ? "bg-blue-500/20 text-blue-400" : "bg-red-500/20 text-red-400"}>
                        {s.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      {s.rating ? <span className="text-amber-400">{"★".repeat(s.rating)}</span> : <span className="text-slate-500">-</span>}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {s.status === "active" && (
                        <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300" onClick={() => endSession(s.id)}>
                          <XCircle className="w-4 h-4 mr-1" /> End
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSessions;
