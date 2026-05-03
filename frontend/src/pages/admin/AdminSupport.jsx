import { useState, useEffect } from "react";
import axios from "axios";
import { API } from "@/App";
import { toast } from "sonner";
import { HeadphonesIcon, Send, Clock, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const AdminSupport = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [reply, setReply] = useState("");

  useEffect(() => { fetchTickets(); }, [filter]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const params = filter !== "all" ? `?status=${filter}` : "";
      const res = await axios.get(`${API}/admin/support${params}`);
      setTickets(res.data || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const updateStatus = async (id, status) => {
    try {
      await axios.patch(`${API}/admin/support/${id}/status`, { status });
      toast.success(`Ticket marked as ${status}`);
      fetchTickets();
      if (selected?.id === id) setSelected(prev => ({ ...prev, status }));
    } catch (e) { toast.error("Failed"); }
  };

  const sendReply = async () => {
    if (!reply.trim() || !selected) return;
    try {
      await axios.post(`${API}/admin/support/${selected.id}/reply`, { message: reply });
      toast.success("Reply sent");
      setReply("");
      fetchTickets();
      const msgs = [...(selected.messages || []), { sender: "admin", content: reply, timestamp: new Date().toISOString() }];
      setSelected(prev => ({ ...prev, messages: msgs, status: "in_progress" }));
    } catch (e) { toast.error("Failed to send reply"); }
  };

  const statusIcon = (status) => {
    if (status === "open") return <AlertTriangle className="w-4 h-4 text-amber-400" />;
    if (status === "in_progress") return <Clock className="w-4 h-4 text-blue-400" />;
    if (status === "resolved") return <CheckCircle className="w-4 h-4 text-green-400" />;
    return <XCircle className="w-4 h-4 text-slate-400" />;
  };

  const priorityColor = (p) => {
    if (p === "high") return "bg-red-500/20 text-red-400";
    if (p === "medium") return "bg-amber-500/20 text-amber-400";
    return "bg-green-500/20 text-green-400";
  };

  const openCount = tickets.filter(t => t.status === "open").length;
  const inProgressCount = tickets.filter(t => t.status === "in_progress").length;

  return (
    <div data-testid="admin-support-page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Support Tickets</h1>
          <p className="text-slate-400">{openCount} open, {inProgressCount} in progress</p>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[160px] bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-700">
            <SelectItem value="all">All Tickets</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {loading ? <p className="text-slate-400 text-center py-8">Loading...</p> : tickets.map((t) => (
          <Card key={t.id} className="bg-slate-800/50 border-slate-700 cursor-pointer hover:border-purple-500/30 transition-colors" onClick={() => setSelected(t)}>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="flex items-center gap-2 flex-shrink-0">
                  {statusIcon(t.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-medium text-white">{t.subject}</h3>
                    <Badge className={priorityColor(t.priority)}>{t.priority}</Badge>
                    <Badge variant="outline" className="border-slate-600 text-xs capitalize">{t.category}</Badge>
                  </div>
                  <p className="text-sm text-slate-400">{t.user_name} - {t.user_email}</p>
                  <p className="text-xs text-slate-500 mt-1">{new Date(t.created_at).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge className={
                    t.status === "open" ? "bg-amber-500/20 text-amber-400" :
                    t.status === "in_progress" ? "bg-blue-500/20 text-blue-400" :
                    t.status === "resolved" ? "bg-green-500/20 text-green-400" :
                    "bg-slate-500/20 text-slate-400"
                  }>
                    {t.status?.replace("_", " ")}
                  </Badge>
                  <span className="text-xs text-slate-500">{t.messages?.length || 0} msgs</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => { if (!o) setSelected(null); }}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-2xl max-h-[90vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="text-white">{selected.subject}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={priorityColor(selected.priority)}>{selected.priority}</Badge>
                  <Badge variant="outline" className="border-slate-600 capitalize">{selected.category}</Badge>
                  <Badge className={
                    selected.status === "open" ? "bg-amber-500/20 text-amber-400" :
                    selected.status === "in_progress" ? "bg-blue-500/20 text-blue-400" :
                    selected.status === "resolved" ? "bg-green-500/20 text-green-400" :
                    "bg-slate-500/20 text-slate-400"
                  }>
                    {selected.status?.replace("_", " ")}
                  </Badge>
                </div>
                <div className="p-3 bg-slate-800 rounded-lg">
                  <p className="text-sm text-slate-400 mb-1">From: {selected.user_name} ({selected.user_email})</p>
                  <p className="text-white">{selected.description}</p>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-slate-300">Conversation</h4>
                  {selected.messages?.map((m, i) => (
                    <div key={i} className={`p-3 rounded-lg ${m.sender === "admin" ? "bg-purple-500/10 ml-8" : "bg-slate-800 mr-8"}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-slate-400 capitalize">{m.sender}</span>
                        <span className="text-xs text-slate-500">{new Date(m.timestamp).toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-white">{m.content}</p>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Textarea value={reply} onChange={(e) => setReply(e.target.value)} className="bg-slate-800 border-slate-700" placeholder="Type reply..." rows={2} />
                  <Button className="bg-purple-600 hover:bg-purple-700 self-end" onClick={sendReply} disabled={!reply.trim()}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex gap-2 pt-2 border-t border-slate-700">
                  <Button size="sm" variant="outline" className="border-slate-700" onClick={() => updateStatus(selected.id, "in_progress")}>Mark In Progress</Button>
                  <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => updateStatus(selected.id, "resolved")}>Resolve</Button>
                  <Button size="sm" variant="outline" className="border-slate-700 text-slate-400" onClick={() => updateStatus(selected.id, "closed")}>Close</Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSupport;
