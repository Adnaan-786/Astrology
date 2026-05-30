import { useState, useEffect } from "react";
import axios from "axios";
import { API } from "@/App";
import { Wallet, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const AdminFinance = () => {
  const [data, setData] = useState({ transactions: [], summary: {} });
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchFinance(); }, []);

  const fetchFinance = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/admin/finance`);
      setData(res.data || { transactions: [], summary: {} });
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const s = data.summary;

  return (
    <div data-testid="admin-finance-page">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Wallet & Finance</h1>
        <p className="text-slate-400">Revenue reports and transaction management</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center"><TrendingUp className="w-5 h-5 text-white" /></div>
              <Badge className="bg-green-500/20 text-green-400">Revenue</Badge>
            </div>
            <p className="text-2xl font-bold text-white">₹{(s.total_revenue || 0).toLocaleString()}</p>
            <p className="text-sm text-slate-400">Total Revenue</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-lg bg-red-500 flex items-center justify-center"><TrendingDown className="w-5 h-5 text-white" /></div>
              <Badge className="bg-red-500/20 text-red-400">Payouts</Badge>
            </div>
            <p className="text-2xl font-bold text-white">₹{(s.total_payouts || 0).toLocaleString()}</p>
            <p className="text-sm text-slate-400">Total Payouts</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center"><DollarSign className="w-5 h-5 text-white" /></div>
              <Badge className="bg-purple-500/20 text-purple-400">Profit</Badge>
            </div>
            <p className="text-2xl font-bold text-white">₹{(s.net_profit || 0).toLocaleString()}</p>
            <p className="text-sm text-slate-400">Net Profit</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center"><Wallet className="w-5 h-5 text-white" /></div>
              <Badge className="bg-amber-500/20 text-amber-400">This Month</Badge>
            </div>
            <p className="text-2xl font-bold text-white">₹{(s.this_month || 0).toLocaleString()}</p>
            <p className="text-sm text-slate-400">
              vs ₹{(s.last_month || 0).toLocaleString()} last month
              {(s.this_month || 0) > (s.last_month || 0) ? (
                <span className="text-green-400 ml-1">+{Math.round((((s.this_month || 0) - (s.last_month || 0)) / (s.last_month || 1)) * 100)}%</span>
              ) : (
                <span className="text-red-400 ml-1">{Math.round((((s.this_month || 0) - (s.last_month || 0)) / (s.last_month || 1)) * 100)}%</span>
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg text-white">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Transaction</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">User</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Description</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Amount</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Date</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="py-8 text-center text-slate-400">Loading...</td></tr>
                ) : data.transactions.map((t) => (
                  <tr key={t.id} className="border-b border-slate-700/50 hover:bg-slate-800/50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {t.type === "credit" ? (
                          <ArrowUpRight className="w-4 h-4 text-green-400" />
                        ) : (
                          <ArrowDownRight className="w-4 h-4 text-red-400" />
                        )}
                        <Badge className={t.type === "credit" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}>
                          {t.type}
                        </Badge>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-white">{t.user_name || t.user_id}</td>
                    <td className="py-3 px-4 text-slate-300">{t.description}</td>
                    <td className="py-3 px-4 font-medium">
                      <span className={t.type === "credit" ? "text-green-400" : "text-red-400"}>
                        {t.type === "credit" ? "+" : "-"}₹{t.amount?.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-400">{new Date(t.created_at).toLocaleString()}</td>
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

export default AdminFinance;
