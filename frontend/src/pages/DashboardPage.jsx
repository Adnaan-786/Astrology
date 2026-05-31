import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  User, Wallet, Star, Clock, Heart, FileText, 
  Gift, Settings, LogOut, ChevronRight, Plus,
  Calendar, Moon, TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import apiClient from "@/lib/apiClient";

const DashboardPage = () => {
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
          walletBalance: parsed.wallet_balance || 500,
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
      walletBalance: 500,
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
            // In a real app, you would fetch the updated user state here.
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

  const quickStats = [
    { label: "Wallet Balance", value: `₹${user.walletBalance}`, icon: Wallet, color: "text-cosmic-gold" },
    { label: "Login Streak", value: `${user.loginStreak} days`, icon: TrendingUp, color: "text-green-400" },
    { label: "AI Reports", value: "3 left", icon: FileText, color: "text-cosmic-purple" },
    { label: "Daily Rashifal", value: "Active", icon: Calendar, color: "text-blue-400" },
  ];


  const [savedReports, setSavedReports] = useState([]);
  
  useEffect(() => {
    const fetchReports = async () => {
      try {
        const { data } = await apiClient.get('/ai/reports');
        setSavedReports(data);
      } catch (err) {
        console.error("Failed to fetch reports", err);
      }
    };
    fetchReports();
  }, []);

  const rechargeOptions = [99, 199, 299, 499, 999, 1499];

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
                            <Button size="sm" variant="outline" className="border-cosmic-purple/50 text-xs">
                              Download
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <FileText className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                        <p className="text-zinc-400">No reports yet</p>
                        <Link to="/nakshatra-ai">
                          <Button className="mt-4 btn-cosmic">Generate First Report</Button>
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

            </Tabs>

            {/* Referral Section */}
            <Card className="cosmic-card border-cosmic-purple/30">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-cosmic-purple/20 flex items-center justify-center flex-shrink-0">
                    <Gift className="w-6 h-6 text-cosmic-purple" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-cinzel font-semibold text-white mb-1">Refer & Earn ₹50</h3>
                    <p className="text-zinc-400 text-sm mb-3">
                      Invite friends and earn ₹50 for each successful referral!
                    </p>
                    <div className="flex gap-2">
                      <div className="flex-1 px-3 py-2 bg-cosmic-surface rounded-lg text-sm text-zinc-300 font-mono">
                        ASTRO-GUEST123
                      </div>
                      <Button size="sm" className="btn-gold">Copy</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
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
                  <Badge className="bg-green-500/20 text-green-400">{user.loginStreak} days</Badge>
                </div>
                <Progress value={(user.loginStreak / 30) * 100} className="h-2 mb-2" />
                <p className="text-xs text-zinc-400">
                  {30 - user.loginStreak} days to unlock free report!
                </p>
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card className="cosmic-card">
              <CardContent className="p-4">
                <h4 className="font-semibold text-white text-sm mb-3">Quick Links</h4>
                <div className="space-y-2">
                  {[
                    { icon: Calendar, label: "My Kundli", href: "/nakshatra-ai" },
                    { icon: Settings, label: "Settings", href: "#" },
                    { icon: FileText, label: "Transaction History", href: "#" },
                    { icon: LogOut, label: "Logout", href: "#", color: "text-red-400" },
                  ].map((link, idx) => (
                    <Link 
                      key={idx}
                      to={link.href}
                      className={`flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors ${link.color || 'text-zinc-300'}`}
                    >
                      <span className="flex items-center gap-2 text-sm">
                        <link.icon className="w-4 h-4" />
                        {link.label}
                      </span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  ))}
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
