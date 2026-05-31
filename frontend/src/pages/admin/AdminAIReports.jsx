import { useState, useEffect } from "react";
import apiClient from "@/lib/apiClient";
import { API } from "@/App";
import { toast } from "sonner";
import { Bot, Trash2, Download, FileText, AlertCircle, CheckCircle, Loader } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const AdminAIReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchReports(); }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`${API}/admin/ai-reports`);
      setReports(res.data || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const deleteReport = async (id) => {
    if (!confirm("Delete this report?")) return;
    try {
      await apiClient.delete(`${API}/admin/ai-reports/${id}`);
      toast.success("Report deleted");
      fetchReports();
    } catch (e) { toast.error("Failed to delete"); }
  };

  const completed = reports.filter(r => r.status === "completed").length;
  const totalTokens = reports.reduce((s, r) => s + (r.tokens_used || 0), 0);

  const statusIcon = (status) => {
    if (status === "completed") return <CheckCircle className="w-4 h-4 text-green-400" />;
    if (status === "processing") return <Loader className="w-4 h-4 text-blue-400 animate-spin" />;
    return <AlertCircle className="w-4 h-4 text-red-400" />;
  };

  return (
    <div data-testid="admin-ai-reports-page">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">AI Reports</h1>
        <p className="text-slate-400">View and manage AI-generated astrology reports</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center"><Bot className="w-5 h-5 text-white" /></div>
            <div><p className="text-2xl font-bold text-white">{reports.length}</p><p className="text-sm text-slate-400">Total Reports</p></div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center"><CheckCircle className="w-5 h-5 text-white" /></div>
            <div><p className="text-2xl font-bold text-white">{completed}</p><p className="text-sm text-slate-400">Completed</p></div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center"><FileText className="w-5 h-5 text-white" /></div>
            <div><p className="text-2xl font-bold text-white">{totalTokens.toLocaleString()}</p><p className="text-sm text-slate-400">Tokens Used</p></div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Report ID</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">User</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Type</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Tokens</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Date</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="py-8 text-center text-slate-400">Loading...</td></tr>
                ) : reports.map((r) => (
                  <tr key={r.id} className="border-b border-slate-700/50 hover:bg-slate-800/50">
                    <td className="py-3 px-4 text-white font-mono text-sm">#{r.id?.slice(0, 8)}</td>
                    <td className="py-3 px-4">
                      <p className="text-white">{r.user_name}</p>
                      <p className="text-xs text-slate-400">{r.user_email}</p>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className="border-slate-600 text-slate-300">{r.report_type}</Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {statusIcon(r.status)}
                        <span className="capitalize text-slate-300">{r.status}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-300">{r.tokens_used?.toLocaleString()}</td>
                    <td className="py-3 px-4 text-sm text-slate-400">{new Date(r.created_at).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-right">
                      <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300" onClick={() => deleteReport(r.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
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

export default AdminAIReports;
