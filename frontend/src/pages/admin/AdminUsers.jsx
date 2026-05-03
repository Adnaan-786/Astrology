import { useState, useEffect } from "react";
import axios from "axios";
import { API } from "@/App";
import { toast } from "sonner";
import {
  Users, Search, Filter, MoreVertical, Eye, Ban, 
  Wallet, Edit, Trash2, ChevronLeft, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPlan, setFilterPlan] = useState("all");
  const [selectedUser, setSelectedUser] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchUsers();
  }, [page, filterPlan]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page, limit: 10 });
      if (filterPlan !== "all") params.append("plan", filterPlan);
      
      const res = await axios.get(`${API}/admin/users?${params.toString()}`);
      setUsers(res.data.users || []);
      setTotal(res.data.total || 0);
    } catch (e) {
      console.error("Error fetching users:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleBlockUser = async (userId, isBlocked) => {
    try {
      await axios.patch(`${API}/admin/users/${userId}/block`, { is_blocked: !isBlocked });
      toast.success(isBlocked ? "User unblocked" : "User blocked");
      fetchUsers();
    } catch (e) {
      toast.error("Failed to update user");
    }
  };

  const handleAdjustWallet = async (userId, amount, reason) => {
    try {
      await axios.post(`${API}/admin/users/${userId}/wallet`, { amount, reason });
      toast.success("Wallet adjusted successfully");
      fetchUsers();
    } catch (e) {
      toast.error("Failed to adjust wallet");
    }
  };

  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div data-testid="admin-users-page">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">User Management</h1>
          <p className="text-slate-400">{total} total users</p>
        </div>
        <Button className="bg-purple-600 hover:bg-purple-700">
          <Users className="w-4 h-4 mr-2" /> Export Users
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-slate-800/50 border-slate-700 mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-900 border-slate-700"
                data-testid="user-search-input"
              />
            </div>
            <Select value={filterPlan} onValueChange={setFilterPlan}>
              <SelectTrigger className="w-[180px] bg-slate-900 border-slate-700">
                <SelectValue placeholder="Filter by plan" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700">
                <SelectItem value="all">All Plans</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="silver">Silver</SelectItem>
                <SelectItem value="gold">Gold</SelectItem>
                <SelectItem value="platinum">Platinum</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-4 px-4 text-sm font-medium text-slate-400">User</th>
                  <th className="text-left py-4 px-4 text-sm font-medium text-slate-400">Plan</th>
                  <th className="text-left py-4 px-4 text-sm font-medium text-slate-400">Wallet</th>
                  <th className="text-left py-4 px-4 text-sm font-medium text-slate-400">Joined</th>
                  <th className="text-left py-4 px-4 text-sm font-medium text-slate-400">Status</th>
                  <th className="text-right py-4 px-4 text-sm font-medium text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i} className="border-b border-slate-700/50">
                      <td colSpan={6} className="py-4 px-4">
                        <div className="h-10 bg-slate-700/50 rounded animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No users found
                    </td>
                  </tr>
                ) : filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-slate-700/50 hover:bg-slate-800/50">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                          <span className="text-purple-400 font-medium">
                            {user.name?.charAt(0) || "U"}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-white">{user.name || "Unknown"}</p>
                          <p className="text-sm text-slate-400">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <Badge className={`
                        ${user.plan === "platinum" ? "bg-purple-500/20 text-purple-400" :
                          user.plan === "gold" ? "bg-amber-500/20 text-amber-400" :
                          user.plan === "silver" ? "bg-slate-500/20 text-slate-400" :
                          "bg-slate-700 text-slate-300"}
                      `}>
                        {user.plan || "Free"}
                      </Badge>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-amber-400 font-medium">₹{user.wallet_balance || 0}</span>
                    </td>
                    <td className="py-4 px-4 text-sm text-slate-400">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4">
                      <Badge className={user.is_blocked ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"}>
                        {user.is_blocked ? "Blocked" : "Active"}
                      </Badge>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-slate-900 border-slate-700">
                          <DropdownMenuItem 
                            className="cursor-pointer"
                            onClick={() => setSelectedUser(user)}
                          >
                            <Eye className="w-4 h-4 mr-2" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer">
                            <Wallet className="w-4 h-4 mr-2" /> Adjust Wallet
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="cursor-pointer"
                            onClick={() => handleBlockUser(user.id, user.is_blocked)}
                          >
                            <Ban className="w-4 h-4 mr-2" /> 
                            {user.is_blocked ? "Unblock" : "Block"}
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer text-red-400">
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between p-4 border-t border-slate-700">
            <p className="text-sm text-slate-400">
              Page {page} of {Math.ceil(total / 10)}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="border-slate-700"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= Math.ceil(total / 10)}
                onClick={() => setPage(p => p + 1)}
                className="border-slate-700"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Detail Modal */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-lg">
          {selectedUser && (
            <>
              <DialogHeader>
                <DialogTitle className="text-white">User Details</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <span className="text-2xl text-purple-400 font-medium">
                      {selectedUser.name?.charAt(0) || "U"}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-white">{selectedUser.name}</h3>
                    <p className="text-slate-400">{selectedUser.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-800 rounded-lg">
                    <p className="text-sm text-slate-400">Plan</p>
                    <p className="text-white font-medium">{selectedUser.plan || "Free"}</p>
                  </div>
                  <div className="p-3 bg-slate-800 rounded-lg">
                    <p className="text-sm text-slate-400">Wallet Balance</p>
                    <p className="text-amber-400 font-medium">₹{selectedUser.wallet_balance || 0}</p>
                  </div>
                  <div className="p-3 bg-slate-800 rounded-lg">
                    <p className="text-sm text-slate-400">Rashi</p>
                    <p className="text-white font-medium">{selectedUser.rashi || "Not set"}</p>
                  </div>
                  <div className="p-3 bg-slate-800 rounded-lg">
                    <p className="text-sm text-slate-400">Total Spent</p>
                    <p className="text-white font-medium">₹{selectedUser.total_spent || 0}</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;
