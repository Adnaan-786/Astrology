import { useState, useEffect } from "react";
import axios from "axios";
import { API } from "@/App";
import { toast } from "sonner";
import { Package, Search, Eye, Truck, CheckCircle, Clock, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  useEffect(() => { fetchOrders(); }, [filter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = filter !== "all" ? `?status=${filter}` : "";
      const res = await axios.get(`${API}/admin/orders${params}`);
      setOrders(res.data || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const updateStatus = async (id, status) => {
    try {
      await axios.patch(`${API}/admin/orders/${id}/status`, { status });
      toast.success(`Order marked as ${status}`);
      fetchOrders();
      if (selected?.id === id) setSelected(prev => ({ ...prev, status }));
    } catch (e) { toast.error("Failed to update"); }
  };

  const filtered = orders.filter(o =>
    o.user_name?.toLowerCase().includes(search.toLowerCase()) || o.id?.includes(search)
  );

  const statusIcon = (s) => {
    if (s === "pending") return <Clock className="w-4 h-4 text-amber-400" />;
    if (s === "confirmed") return <CheckCircle className="w-4 h-4 text-purple-400" />;
    if (s === "shipped") return <Truck className="w-4 h-4 text-blue-400" />;
    if (s === "delivered") return <CheckCircle className="w-4 h-4 text-green-400" />;
    return <XCircle className="w-4 h-4 text-red-400" />;
  };

  const pendingCount = orders.filter(o => o.status === "pending").length;
  const totalRevenue = orders.reduce((s, o) => s + (o.total_amount || 0), 0);

  return (
    <div data-testid="admin-orders-page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Orders</h1>
          <p className="text-slate-400">{orders.length} orders, {pendingCount} pending</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center"><Package className="w-5 h-5 text-white" /></div>
            <div><p className="text-2xl font-bold text-white">{orders.length}</p><p className="text-sm text-slate-400">Total Orders</p></div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center"><Clock className="w-5 h-5 text-white" /></div>
            <div><p className="text-2xl font-bold text-white">{pendingCount}</p><p className="text-sm text-slate-400">Pending</p></div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center"><CheckCircle className="w-5 h-5 text-white" /></div>
            <div><p className="text-2xl font-bold text-amber-400">₹{totalRevenue.toLocaleString()}</p><p className="text-sm text-slate-400">Revenue</p></div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-800/50 border-slate-700 mb-4">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input placeholder="Search orders..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-slate-900 border-slate-700" />
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[160px] bg-slate-900 border-slate-700"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700">
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Order ID</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Customer</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Items</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Total</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Date</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="py-8 text-center text-slate-400">Loading...</td></tr>
                ) : filtered.map((o) => (
                  <tr key={o.id} className="border-b border-slate-700/50 hover:bg-slate-800/50">
                    <td className="py-3 px-4 text-white font-mono text-sm">#{o.id?.slice(0, 8)}</td>
                    <td className="py-3 px-4">
                      <p className="text-white">{o.user_name}</p>
                      <p className="text-xs text-slate-400">{o.user_email}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-300">{o.items?.length || 0} items</td>
                    <td className="py-3 px-4 text-amber-400 font-medium">₹{o.total_amount?.toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {statusIcon(o.status)}
                        <Badge className={
                          o.status === "pending" ? "bg-amber-500/20 text-amber-400" :
                          o.status === "confirmed" ? "bg-purple-500/20 text-purple-400" :
                          o.status === "shipped" ? "bg-blue-500/20 text-blue-400" :
                          "bg-green-500/20 text-green-400"
                        }>
                          {o.status}
                        </Badge>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-400">{new Date(o.created_at).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <Button size="sm" variant="ghost" onClick={() => setSelected(o)}><Eye className="w-4 h-4 text-blue-400" /></Button>
                        {o.status === "pending" && <Button size="sm" variant="ghost" className="text-purple-400" onClick={() => updateStatus(o.id, "confirmed")}>Confirm</Button>}
                        {o.status === "confirmed" && <Button size="sm" variant="ghost" className="text-blue-400" onClick={() => updateStatus(o.id, "shipped")}>Ship</Button>}
                        {o.status === "shipped" && <Button size="sm" variant="ghost" className="text-green-400" onClick={() => updateStatus(o.id, "delivered")}>Delivered</Button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={(o) => { if (!o) setSelected(null); }}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-lg">
          {selected && (
            <>
              <DialogHeader><DialogTitle className="text-white">Order #{selected.id?.slice(0, 8)}</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-800 rounded-lg">
                    <p className="text-sm text-slate-400">Customer</p>
                    <p className="text-white">{selected.user_name}</p>
                  </div>
                  <div className="p-3 bg-slate-800 rounded-lg">
                    <p className="text-sm text-slate-400">Total</p>
                    <p className="text-amber-400 font-bold">₹{selected.total_amount?.toLocaleString()}</p>
                  </div>
                  <div className="p-3 bg-slate-800 rounded-lg">
                    <p className="text-sm text-slate-400">Payment</p>
                    <p className="text-white capitalize">{selected.payment_method || "wallet"}</p>
                  </div>
                  <div className="p-3 bg-slate-800 rounded-lg">
                    <p className="text-sm text-slate-400">Status</p>
                    <Badge className={
                      selected.status === "pending" ? "bg-amber-500/20 text-amber-400" :
                      selected.status === "delivered" ? "bg-green-500/20 text-green-400" :
                      "bg-blue-500/20 text-blue-400"
                    }>{selected.status}</Badge>
                  </div>
                </div>
                {selected.shipping_address && (
                  <div className="p-3 bg-slate-800 rounded-lg">
                    <p className="text-sm text-slate-400">Shipping Address</p>
                    <p className="text-white">{selected.shipping_address}</p>
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-medium text-slate-300 mb-2">Items</h4>
                  {selected.items?.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-slate-800 rounded mb-1">
                      <span className="text-white">{item.name} x{item.qty}</span>
                      <span className="text-amber-400">₹{item.price}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  {selected.status === "pending" && <Button className="bg-purple-600 hover:bg-purple-700 flex-1" onClick={() => updateStatus(selected.id, "confirmed")}>Confirm Order</Button>}
                  {selected.status === "confirmed" && <Button className="bg-blue-600 hover:bg-blue-700 flex-1" onClick={() => updateStatus(selected.id, "shipped")}>Mark Shipped</Button>}
                  {selected.status === "shipped" && <Button className="bg-green-600 hover:bg-green-700 flex-1" onClick={() => updateStatus(selected.id, "delivered")}>Mark Delivered</Button>}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOrders;
