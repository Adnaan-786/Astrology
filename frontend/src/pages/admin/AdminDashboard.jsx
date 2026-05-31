import { useState, useEffect } from "react";
import apiClient from "@/lib/apiClient";
import { API } from "@/App";
import { Link } from "react-router-dom";
import {
  Users, Star, Zap, DollarSign, ShoppingBag, HeadphonesIcon,
  TrendingUp, TrendingDown, ArrowRight, Plus, Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSessions: 0,
    todayRevenue: 0,
    onlineAstrologers: 0,
    pendingOrders: 0,
    openTickets: 0
  });
  const [financeSummary, setFinanceSummary] = useState({
    this_month: 0,
    last_month: 0
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, usersRes, financeRes] = await Promise.all([
        apiClient.get('/admin/stats'),
        apiClient.get('/admin/users?limit=10'),
        apiClient.get('/admin/finance')
      ]);
      if (statsRes.data) setStats(statsRes.data);
      if (usersRes.data) setRecentUsers(usersRes.data.users || []);
      if (financeRes.data && financeRes.data.summary) setFinanceSummary(financeRes.data.summary);
    } catch (e) {
      console.error("Error fetching dashboard data:", e);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { 
      label: "Total Users", 
      value: stats.totalUsers.toLocaleString(), 
      icon: Users, 
      change: "+12%",
      positive: true,
      color: "bg-blue-500" 
    },
    { 
      label: "Active Sessions", 
      value: stats.activeSessions, 
      icon: Zap, 
      change: "Live",
      positive: true,
      color: "bg-green-500" 
    },
    { 
      label: "Today's Revenue", 
      value: `₹${stats.todayRevenue.toLocaleString()}`, 
      icon: DollarSign, 
      change: "+8%",
      positive: true,
      color: "bg-purple-500" 
    },
    { 
      label: "Online Astrologers", 
      value: stats.onlineAstrologers, 
      icon: Star, 
      change: "Active",
      positive: true,
      color: "bg-amber-500" 
    },
    { 
      label: "Pending Orders", 
      value: stats.pendingOrders, 
      icon: ShoppingBag, 
      change: "-3",
      positive: false,
      color: "bg-red-500" 
    },
    { 
      label: "Open Tickets", 
      value: stats.openTickets, 
      icon: HeadphonesIcon, 
      change: "5 new",
      positive: false,
      color: "bg-orange-500" 
    },
  ];

  return (
    <div data-testid="admin-dashboard">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Dashboard Overview</h1>
        <p className="text-slate-400">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {statCards.map((stat, idx) => (
          <Card key={idx} className="bg-slate-800/50 border-slate-700" data-testid={`stat-card-${idx}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
                <Badge className={`text-xs ${stat.positive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {stat.change}
                </Badge>
              </div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-sm text-slate-400">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Publish Today's Horoscope", icon: Calendar, href: "/admin/horoscope", color: "bg-purple-600" },
          { label: "Add Astrologer", icon: Star, href: "/admin/astrologers", color: "bg-amber-600" },
          { label: "Add Product", icon: ShoppingBag, href: "/admin/store", color: "bg-green-600" },
          { label: "Create Coupon", icon: Plus, href: "/admin/coupons", color: "bg-blue-600" },
        ].map((action, idx) => (
          <Link key={idx} to={action.href}>
            <Card className="bg-slate-800/50 border-slate-700 hover:border-purple-500/50 transition-colors cursor-pointer">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center`}>
                  <action.icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-medium text-white">{action.label}</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg text-white">Recent Users</CardTitle>
            <Link to="/admin/users" className="text-sm text-purple-400 hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentUsers.length > 0 ? recentUsers.slice(0, 5).map((user, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-900/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <Users className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{user.name || "User"}</p>
                      <p className="text-xs text-slate-400">{user.email}</p>
                    </div>
                  </div>
                  <Badge className="bg-green-500/20 text-green-400 text-xs">
                    {user.plan || "Free"}
                  </Badge>
                </div>
              )) : (
                <p className="text-sm text-slate-400 text-center py-4">No recent users</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Revenue Chart Placeholder */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-white">Revenue (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-center justify-center">
              <div className="text-center">
                <TrendingUp className="w-12 h-12 text-green-400 mx-auto mb-3" />
                <p className="text-2xl font-bold text-white">₹{financeSummary.this_month.toLocaleString()}</p>
                <p className="text-sm text-slate-400">Total Revenue This Month</p>
                <Badge className={`mt-2 ${financeSummary.this_month >= financeSummary.last_month ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {financeSummary.this_month >= financeSummary.last_month ? '+' : ''}
                  {financeSummary.last_month > 0 
                    ? Math.round(((financeSummary.this_month - financeSummary.last_month) / financeSummary.last_month) * 100) 
                    : 100}% vs last month
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
