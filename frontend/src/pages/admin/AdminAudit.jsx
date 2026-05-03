import { useState, useEffect } from "react";
import axios from "axios";
import { API } from "@/App";
import { List, User, Settings, FileText, ShoppingBag, Crown, Percent, Bell, Star, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const entityIcons = {
  astrologer: Star,
  product: ShoppingBag,
  blog: FileText,
  horoscope: FileText,
  user: Users,
  plan: Crown,
  coupon: Percent,
  notification: Bell,
  settings: Settings,
  order: ShoppingBag,
  review: Star,
  support_ticket: Users,
  session: Users,
  ai_report: FileText,
  banner: FileText,
};

const actionColors = {
  create: "bg-green-500/20 text-green-400",
  update: "bg-blue-500/20 text-blue-400",
  delete: "bg-red-500/20 text-red-400",
  login: "bg-purple-500/20 text-purple-400",
  publish_all: "bg-amber-500/20 text-amber-400",
  publish_toggle: "bg-amber-500/20 text-amber-400",
  send: "bg-cyan-500/20 text-cyan-400",
  approve_review: "bg-green-500/20 text-green-400",
  reject_review: "bg-red-500/20 text-red-400",
  block_user: "bg-red-500/20 text-red-400",
  unblock_user: "bg-green-500/20 text-green-400",
  wallet_adjust: "bg-amber-500/20 text-amber-400",
  update_status: "bg-blue-500/20 text-blue-400",
  save: "bg-blue-500/20 text-blue-400",
  reply: "bg-cyan-500/20 text-cyan-400",
  end_session: "bg-red-500/20 text-red-400",
};

const AdminAudit = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchLogs(); }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/admin/audit`);
      setLogs(res.data || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const formatAction = (action) => action.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

  return (
    <div data-testid="admin-audit-page">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Audit Log</h1>
        <p className="text-slate-400">Track all admin actions and system changes</p>
      </div>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Time</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Admin</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Action</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Entity</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Details</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="py-8 text-center text-slate-400">Loading...</td></tr>
                ) : logs.map((log) => {
                  const IconComp = entityIcons[log.entity_type] || FileText;
                  return (
                    <tr key={log.id} className="border-b border-slate-700/50 hover:bg-slate-800/50">
                      <td className="py-3 px-4 text-sm text-slate-400 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center">
                            <User className="w-3 h-3 text-purple-400" />
                          </div>
                          <span className="text-white text-sm">{log.admin_name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={actionColors[log.action] || "bg-slate-500/20 text-slate-400"}>
                          {formatAction(log.action)}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <IconComp className="w-4 h-4 text-slate-400" />
                          <span className="text-slate-300 capitalize">{log.entity_type?.replace(/_/g, " ")}</span>
                          <span className="text-xs text-slate-500 font-mono">{log.entity_id?.slice(0, 8)}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-400 max-w-xs truncate">{log.details}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAudit;
