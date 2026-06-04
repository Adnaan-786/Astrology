import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  User, Wallet, Star, Clock, Heart, FileText, 
  Gift, Settings, LogOut, ChevronRight, Plus,
  Calendar, Moon, TrendingUp, Download, ArrowLeft, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import apiClient from "@/lib/apiClient";
import { toast } from "sonner";
import { logout } from "@/lib/authService";
import jsPDF from "jspdf";

const DashboardPage = () => {
  const navigate = useNavigate();
  // Initialize user from local storage
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("astrovedic_user");
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          name: parsed.name || "Guest User",
          email: parsed.email || "guest@example.com",
          rashi: parsed.rashi || "Leo",
          rashiHindi: parsed.rashiHindi || "सिंह",
          plan: parsed.plan || "Free",
          walletBalance: parsed.wallet_balance || 0,
          loginStreak: parsed.loginStreak || 7
        };
      }
    } catch (e) {
      console.error("Failed to parse user from local storage", e);
    }
    return {
      name: "Guest User",
      email: "guest@example.com",
      rashi: "Leo",
      rashiHindi: "सिंह",
      plan: "Free",
      walletBalance: 0,
      loginStreak: 7
    };
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await apiClient.get('/auth/me');
        if (data?.user) {
          localStorage.setItem("astrovedic_user", JSON.stringify(data.user));
          setUser({
            ...data.user,
            walletBalance: data.user.wallet_balance || 0
          });
        }
      } catch (e) {
        console.error("Failed to fetch fresh user data", e);
      }
    };
    if (localStorage.getItem("astrovedic_token")) {
      fetchUser();
    }
  }, []);

  const [rechargeAmount, setRechargeAmount] = useState(499);
  const [isRecharging, setIsRecharging] = useState(false);
  const [showTransactions, setShowTransactions] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [downloadingReport, setDownloadingReport] = useState(null);

  const handleRecharge = async () => {
    if (!rechargeAmount) return;
    setIsRecharging(true);
    try {
      const { data: orderData } = await apiClient.post(`/wallet/create-order`, {
        amount: rechargeAmount,
      });

      const options = {
        key: "rzp_test_Ss2yfn9UjqYkwa",
        amount: orderData.amount,
        currency: orderData.currency,
        name: "AstroVedic",
        description: "Wallet Recharge",
        order_id: orderData.order_id,
        handler: async function (response) {
          try {
            await apiClient.post(`/wallet/verify-payment`, {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            });
            alert("Payment successful! Your wallet has been recharged.");
          } catch (err) {
            console.error("Verification error:", err);
            alert("Payment verification failed.");
          }
        },
        prefill: {
          name: user.name,
          email: user.email,
        },
        theme: {
          color: "#8B5CF6"
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response){
        alert("Payment failed: " + response.error.description);
      });
      rzp.open();
    } catch (error) {
      console.error("Recharge init error:", error);
      alert("Failed to initiate recharge. Please try again.");
    } finally {
      setIsRecharging(false);
    }
  };

  const fetchTransactions = async () => {
    setLoadingTransactions(true);
    try {
      const { data } = await apiClient.get('/wallet/my-transactions');
      setTransactions(data);
    } catch (err) {
      console.error("Failed to fetch transactions", err);
      toast.error("Failed to load transactions");
    } finally {
      setLoadingTransactions(false);
    }
  };

  const handleDownloadReport = async (reportId, reportType) => {
    setDownloadingReport(reportId);
    try {
      const { data: report } = await apiClient.get(`/ai/reports/${reportId}`);
      if (!report?.content) {
        toast.error("Report content not available");
        return;
      }

      // Generate PDF
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      const maxWidth = pageWidth - margin * 2;

      // Header
      doc.setFontSize(18);
      doc.setTextColor(139, 92, 246);
      doc.text("AstroVedic AI Report", margin, 25);

      doc.setFontSize(11);
      doc.setTextColor(100, 100, 100);
      doc.text(`Report: ${reportType?.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())}`, margin, 35);
      doc.text(`Name: ${report.user_name || "N/A"}`, margin, 42);
      doc.text(`Generated: ${new Date(report.created_at).toLocaleDateString()}`, margin, 49);

      doc.setDrawColor(139, 92, 246);
      doc.line(margin, 54, pageWidth - margin, 54);

      // Content
      doc.setFontSize(10);
      doc.setTextColor(30, 30, 30);
      const content = report.content.replace(/[#*]/g, "").trim();
      const lines = doc.splitTextToSize(content, maxWidth);

      let y = 62;
      for (const line of lines) {
        if (y > 280) {
          doc.addPage();
          y = 20;
        }
        doc.text(line, margin, y);
        y += 5.5;
      }

      // Footer on last page
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text("Generated by AstroVedic AI — astrovedic.ai", margin, 290);

      doc.save(`AstroVedic_${reportType || "report"}_${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success("Report downloaded successfully!");
    } catch (err) {
      console.error("Download error:", err);
      toast.error("Failed to download report");
    } finally {
      setDownloadingReport(null);
    }
  };

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  const [savedReports, setSavedReports] = useState([]);
  const [reportUsage, setReportUsage] = useState(null);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const { data } = await apiClient.get('/ai/reports');
        setSavedReports(data);
      } catch (err) {
        console.error("Failed to fetch reports", err);
      }
    };
    const fetchUsage = async () => {
      try {
        const { data } = await apiClient.get('/ai/report-usage');
        setReportUsage(data);
      } catch (err) {
        console.error("Failed to fetch report usage", err);
      }
    };
    if (localStorage.getItem("astrovedic_token")) {
      fetchReports();
      fetchUsage();
    }
  }, []);

  const aiReportsText = reportUsage
    ? (reportUsage.unlimited ? "Unlimited" : `${reportUsage.remaining} left`)
    : "Loading...";

  const quickStats = [
    { label: "Wallet Balance", value: `₹${user.walletBalance}`, icon: Wallet, color: "text-cosmic-gold" },
    { label: "Login Streak", value: `${user.loginStreak || 0} days`, icon: TrendingUp, color: "text-green-400" },
    { label: "AI Reports", value: aiReportsText, icon: FileText, color: "text-cosmic-purple" },
    { label: "Daily Rashifal", value: "Active", icon: Calendar, color: "text-blue-400" },
  ];

  const rechargeOptions = [99, 199, 299, 499, 999, 1499];

  // Transaction History View
  if (showTransactions) {
    return (
      <div className="min-h-screen pt-20 lg:pt-24 pb-24 lg:pb-12" data-testid="transactions-page">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => setShowTransactions(false)}
            className="flex items-center gap-1 text-sm text-zinc-400 hover:text-white mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>

          <h1 className="font-cinzel text-2xl font-bold text-white mb-6">Transaction History</h1>

          {loadingTransactions ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin w-8 h-8 border-2 border-[#D4A017] border-t-transparent rounded-full" />
            </div>
          ) : transactions.length > 0 ? (
            <div className="space-y-3">
              {transactions.map((txn, idx) => (
                <Card key={txn.id || idx} className="cosmic-card" data-testid={`txn-${idx}`}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        txn.type === "credit"
                          ? "bg-green-500/15"
                          : "bg-red-500/15"
                      }`}>
                        <Wallet className={`w-5 h-5 ${
                          txn.type === "credit" ? "text-green-400" : "text-red-400"
                        }`} />
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">{txn.description || (txn.type === "credit" ? "Wallet Recharge" : "Purchase")}</p>
                        <p className="text-xs text-zinc-400">
                          {new Date(txn.created_at).toLocaleDateString("en-IN", {
                            day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
                          })}
                        </p>
                      </div>
                    </div>
                    <span className={`text-lg font-bold ${
                      txn.type === "credit" ? "text-green-400" : "text-red-400"
                    }`}>
                      {txn.type === "credit" ? "+" : "-"}₹{txn.amount}
                    </span>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="cosmic-card">
              <CardContent className="p-8 text-center">
                <Wallet className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                <p className="text-zinc-400">No transactions yet</p>
                <p className="text-xs text-zinc-500 mt-1">Recharge your wallet or purchase a report to see transactions here.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 lg:pt-24 pb-24 lg:pb-12" data-testid="dashboard-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cosmic-gold to-cosmic-purple flex items-center justify-center overflow-hidden border-2 border-cosmic-gold shadow-[0_0_15px_rgba(251,191,36,0.3)]">
              <img src="/images/leo_sign.png" alt="Leo Sign" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="font-cinzel text-2xl font-bold text-white">Welcome, {user.name}</h1>
              <div className="flex items-center gap-2">
                <Badge className="bg-cosmic-indigo/50">{user.plan} Plan</Badge>
                <span className="text-sm text-zinc-400">
                  <span className="rashi-symbol text-lg">{user.rashi === "Leo" ? "♌" : "♈"}</span>
                  {user.rashi}
                </span>
              </div>
            </div>
          </div>
          <Link to="/plans">
            <Button className="btn-gold" data-testid="upgrade-btn">
              <Star className="w-4 h-4 mr-2" />
              Upgrade Plan
            </Button>
          </Link>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {quickStats.map((stat, idx) => (
            <Card key={idx} className="cosmic-card" data-testid={`stat-${idx}`}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-cosmic-surface flex items-center justify-center">
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-xs text-zinc-400">{stat.label}</p>
                  <p className="text-lg font-bold text-white">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Today's Lucky Tip */}
        <Card className="cosmic-card mb-8 border-cosmic-gold/30">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-cosmic-gold/20 flex items-center justify-center flex-shrink-0">
                <Moon className="w-6 h-6 text-cosmic-gold" />
              </div>
              <div>
                <h3 className="font-cinzel font-semibold text-white mb-1">Today's Lucky Tip for {user.rashi}</h3>
                <p className="text-zinc-300 text-sm">
                  The Sun's position in your 5th house brings creative energy today. Wear yellow for enhanced luck. 
                  Lucky time: 10 AM - 12 PM. Avoid starting new ventures after sunset.
                </p>
                <Link to="/rashifal" className="text-cosmic-gold text-sm hover:underline inline-flex items-center gap-1 mt-2">
                  Read Full Rashifal <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="reports" className="w-full">
              <TabsList className="bg-cosmic-surface w-full justify-start">
                <TabsTrigger value="reports" className="data-[state=active]:bg-cosmic-indigo">Reports</TabsTrigger>
              </TabsList>

              <TabsContent value="reports" className="mt-4">
                <Card className="cosmic-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg text-white">Your AI Reports</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {savedReports.length > 0 ? (
                      <div className="space-y-4">
                        {savedReports.map(report => (
                          <div key={report.id} className="flex items-center justify-between p-3 glass rounded-lg" data-testid={`report-${report.id}`}>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-cosmic-surface flex items-center justify-center">
                                <FileText className="w-5 h-5 text-cosmic-purple" />
                              </div>
                              <div>
                                <p className="text-white font-medium text-sm capitalize">{report.report_type?.replace('-', ' ')}</p>
                                <p className="text-xs text-zinc-400">{new Date(report.created_at).toLocaleDateString()}</p>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-cosmic-purple/50 text-xs"
                              disabled={downloadingReport === report.id}
                              onClick={() => handleDownloadReport(report.id, report.report_type)}
                            >
                              {downloadingReport === report.id ? (
                                <span className="flex items-center gap-1">
                                  <div className="w-3 h-3 border-2 border-white/30 border-t-white animate-spin rounded-full" />
                                  Loading...
                                </span>
                              ) : (
                                <span className="flex items-center gap-1">
                                  <Download className="w-3.5 h-3.5" /> Download
                                </span>
                              )}
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <FileText className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                        <p className="text-zinc-400">No reports yet</p>
                        <Link to="/nakshatra-ai?tab=reports">
                          <Button className="mt-4 btn-cosmic">Generate First Report</Button>
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Wallet Card */}
            <Card className="cosmic-card" data-testid="wallet-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-cosmic-gold" />
                  Wallet
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-4">
                  <p className="text-4xl font-bold text-cosmic-gold">₹{user.walletBalance}</p>
                  <p className="text-xs text-zinc-400">Available Balance</p>
                </div>
                
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {rechargeOptions.slice(0, 3).map(amount => (
                    <Button 
                      key={amount}
                      onClick={() => setRechargeAmount(amount)}
                      variant={rechargeAmount === amount ? "default" : "outline"} 
                      className={`text-sm ${rechargeAmount === amount ? 'bg-cosmic-purple text-white hover:bg-cosmic-purple/90 border-cosmic-purple' : 'border-cosmic-purple/50 hover:bg-cosmic-purple/20'}`}
                      data-testid={`recharge-${amount}`}
                    >
                      ₹{amount}
                    </Button>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {rechargeOptions.slice(3).map(amount => (
                    <Button 
                      key={amount}
                      onClick={() => setRechargeAmount(amount)}
                      variant={rechargeAmount === amount ? "default" : "outline"} 
                      className={`text-sm ${rechargeAmount === amount ? 'bg-cosmic-purple text-white hover:bg-cosmic-purple/90 border-cosmic-purple' : 'border-cosmic-purple/50 hover:bg-cosmic-purple/20'}`}
                    >
                      ₹{amount}
                    </Button>
                  ))}
                </div>
                
                <Button className="w-full btn-gold" data-testid="add-money-btn" onClick={handleRecharge} disabled={isRecharging}>
                  <Plus className="w-4 h-4 mr-2" />
                  {isRecharging ? "Processing..." : "Add Money"}
                </Button>
                
                <p className="text-[10px] text-zinc-500 mt-2 text-center">
                  Recharge ₹499+ and get ₹50 extra!
                </p>
              </CardContent>
            </Card>

            {/* Login Streak */}
            <Card className="cosmic-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-white text-sm">Login Streak</h4>
                  <Badge className="bg-green-500/20 text-green-400">{user.loginStreak || 0} days</Badge>
                </div>
                <Progress value={((user.loginStreak || 0) / 30) * 100} className="h-2 mb-2" />
                <p className="text-xs text-zinc-400">
                  {30 - (user.loginStreak || 0)} days to unlock free report!
                </p>
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card className="cosmic-card">
              <CardContent className="p-4">
                <h4 className="font-semibold text-white text-sm mb-3">Quick Links</h4>
                <div className="space-y-2">
                  <button
                    onClick={() => { setShowTransactions(true); fetchTransactions(); }}
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors text-zinc-300"
                    data-testid="quick-link-transactions"
                  >
                    <span className="flex items-center gap-2 text-sm">
                      <FileText className="w-4 h-4" />
                      Transaction History
                    </span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors text-red-400"
                    data-testid="quick-link-logout"
                  >
                    <span className="flex items-center gap-2 text-sm">
                      <LogOut className="w-4 h-4" />
                      Logout
                    </span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
