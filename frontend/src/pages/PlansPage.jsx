import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import apiClient from "@/lib/apiClient";
import { API } from "@/App";
import { 
  Check, Star, Sparkles, Crown, Zap, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import BannerCarousel from "@/components/BannerCarousel";

const PlansPage = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAnnual, setIsAnnual] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem("astrovedic_user");
      if (stored) return JSON.parse(stored);
    } catch (e) { }
    return null;
  });
  const navigate = useNavigate();

  const handleSubscribe = async (plan) => {
    const userStr = localStorage.getItem("astrovedic_user");
    if (!userStr) {
      toast.error("Please login to subscribe to a plan");
      navigate("/login");
      return;
    }
    const user = JSON.parse(userStr);

    if (plan.price_monthly === 0 || plan.slug === "free") {
      try {
        setSubscribing(true);
        await apiClient.post("/plans/subscribe-free");
        const updatedUser = { ...user, plan: "free" };
        localStorage.setItem("astrovedic_user", JSON.stringify(updatedUser));
        setCurrentUser(updatedUser);
        toast.success("Successfully switched to Free plan");
        navigate("/nakshatra-ai");
      } catch (err) {
        toast.error("Failed to update plan");
      } finally {
        setSubscribing(false);
      }
      return;
    }

    try {
      setSubscribing(true);
      const { data: orderData } = await apiClient.post("/plans/create-order", {
        plan_slug: plan.slug,
        is_annual: isAnnual
      });

      const options = {
        key: "rzp_live_SxaIbfgFZqYfom", // Or inject via env in real setup
        amount: orderData.amount,
        currency: orderData.currency,
        name: "AstroVedic",
        description: `Subscribe to ${plan.name}`,
        order_id: orderData.order_id,
        handler: async function (response) {
          try {
            await apiClient.post("/plans/verify-payment", {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              plan_slug: plan.slug
            });
            const updatedUser = { ...user, plan: plan.slug };
            localStorage.setItem("astrovedic_user", JSON.stringify(updatedUser));
            setCurrentUser(updatedUser);
            toast.success(`Successfully subscribed to ${plan.name}!`);
            navigate("/nakshatra-ai");
          } catch (err) {
            console.error("Verification error:", err);
            toast.error("Payment verification failed. Please contact support.");
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
        toast.error("Payment failed: " + response.error.description);
      });
      rzp.open();
    } catch (error) {
      console.error("Subscription init error:", error);
      toast.error(error?.response?.data?.detail || "Failed to initiate subscription.");
    } finally {
      setSubscribing(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const res = await axios.get(`${API}/plans`);
      setPlans(res.data);
    } catch (e) {
      console.error("Error fetching plans:", e);
    } finally {
      setLoading(false);
    }
  };

  const getPlanIcon = (slug) => {
    switch (slug) {
      case "free": return <Star className="w-6 h-6" />;
      case "silver": return <Sparkles className="w-6 h-6" />;
      case "gold": return <Crown className="w-6 h-6" />;
      case "platinum": return <Zap className="w-6 h-6" />;
      default: return <Star className="w-6 h-6" />;
    }
  };

  const getPlanGradient = (slug) => {
    switch (slug) {
      case "free": return "from-zinc-600 to-zinc-700";
      case "silver": return "from-zinc-400 to-zinc-500";
      case "gold": return "from-cosmic-gold to-yellow-500";
      case "platinum": return "from-cosmic-purple to-indigo-500";
      default: return "from-cosmic-purple to-cosmic-gold";
    }
  };

  return (
    <div className="min-h-screen pt-20 lg:pt-24 pb-24 lg:pb-12" data-testid="plans-page">
      <BannerCarousel page="plans" showDefault={false} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="bg-cosmic-gold/20 text-cosmic-gold border-cosmic-gold/30 mb-4">
            Save 20% with Annual Billing
          </Badge>
          <h1 className="font-cinzel text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Choose Your <span className="text-gradient-gold">Cosmic Plan</span>
          </h1>
          <p className="text-zinc-400 max-w-2xl mx-auto mb-8">
            Unlock the full power of Vedic astrology with AI-powered insights, expert consultations, and exclusive benefits
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4">
            <span className={`text-sm ${!isAnnual ? 'text-white' : 'text-zinc-500'}`}>Monthly</span>
            <Switch 
              checked={isAnnual} 
              onCheckedChange={setIsAnnual}
              className="data-[state=checked]:bg-cosmic-gold"
              data-testid="billing-toggle"
            />
            <span className={`text-sm ${isAnnual ? 'text-white' : 'text-zinc-500'}`}>
              Annual
              <Badge className="ml-2 bg-green-500/20 text-green-400 text-xs">-20%</Badge>
            </span>
          </div>
        </div>

        {/* Plans Grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="cosmic-card rounded-xl h-[500px] shimmer" />
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan, idx) => {
              const price = isAnnual ? plan.price_annual : plan.price_monthly;
              const monthlyEquivalent = isAnnual ? Math.round(plan.price_annual / 12) : plan.price_monthly;
              const isFeatured = plan.is_featured;
              const isCurrentPlan = currentUser?.plan === plan.slug;
              
              return (
                <Card 
                  key={plan.id}
                  className={`cosmic-card overflow-hidden relative ${isFeatured ? 'border-cosmic-gold ring-2 ring-cosmic-gold/30' : ''}`}
                  data-testid={`plan-card-${plan.slug}`}
                >
                  {isFeatured && (
                    <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-cosmic-gold to-yellow-500 py-1 text-center">
                      <span className="text-xs font-bold text-cosmic-dark">MOST POPULAR</span>
                    </div>
                  )}
                  
                  <CardHeader className={`text-center ${isFeatured ? 'pt-10' : 'pt-6'}`}>
                    <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br ${getPlanGradient(plan.slug)} flex items-center justify-center text-white`}>
                      {getPlanIcon(plan.slug)}
                    </div>
                    <CardTitle className="font-cinzel text-xl text-white">{plan.name}</CardTitle>
                    <p className="text-sm text-zinc-400">{plan.description}</p>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="text-center mb-6">
                      <div className="flex items-end justify-center gap-1">
                        <span className="text-4xl font-bold text-white">
                          {price === 0 ? 'Free' : `₹${monthlyEquivalent.toLocaleString()}`}
                        </span>
                        {price > 0 && <span className="text-zinc-400 mb-1">/mo</span>}
                      </div>
                      {isAnnual && price > 0 && (
                        <p className="text-xs text-zinc-500 mt-1">
                          ₹{price.toLocaleString()} billed annually
                        </p>
                      )}
                    </div>

                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, fidx) => (
                        <li key={fidx} className="flex items-start gap-2 text-sm">
                          <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                          <span className="text-zinc-300">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button 
                      onClick={() => handleSubscribe(plan)}
                      disabled={subscribing || isCurrentPlan}
                      className={`w-full ${isCurrentPlan ? 'bg-zinc-700 text-zinc-400 hover:bg-zinc-700' : isFeatured ? 'btn-gold' : 'btn-cosmic'}`}
                      data-testid={`select-plan-${plan.slug}`}
                    >
                      {isCurrentPlan ? 'Current Plan' : price === 0 ? 'Get Started Free' : 'Subscribe Now'}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Feature Comparison */}
        <div className="mt-16">
          <h2 className="font-cinzel text-2xl font-bold text-white text-center mb-8">
            Compare Plans
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-4 text-zinc-400 font-medium">Feature</th>
                  {plans.map(plan => (
                    <th key={plan.id} className="text-center py-4">
                      <span className="text-white font-cinzel">{plan.name}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { name: "AI Reports/Month", key: "ai_reports_per_month", format: (v) => v === -1 ? "Unlimited" : v },
                  { name: "Free Consultation Minutes", key: "free_chat_minutes", format: (v) => v || "0" },
                  { name: "Store Discount", key: "discount_on_products", format: (v) => v ? `${v}%` : "-" },
                  { name: "AI Chat", key: "ai_chat_messages_limit", format: (v, plan) => {
                    if (v === -1) return "Unlimited";
                    const period = plan?.ai_chat_limit_period || "day";
                    const periodLabel = period === "month" ? "mo" : period === "lifetime" ? "lifetime" : "day";
                    return `${v} msg/${periodLabel}`;
                  }},
                  { name: "Video Calls", key: null, values: ["-", "-", "✓", "✓"] },
                  { name: "Priority Support", key: null, values: ["-", "✓", "✓", "✓"] },
                  { name: "Dedicated Astrologer", key: null, values: ["-", "-", "-", "✓"] },
                ].map((row, idx) => (
                  <tr key={idx} className="border-b border-white/5">
                    <td className="py-4 text-zinc-300 text-sm">{row.name}</td>
                    {plans.map((plan, pidx) => (
                      <td key={plan.id} className="text-center py-4 text-white text-sm">
                        {row.key ? row.format(plan[row.key], plan) : row.values[pidx]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <h2 className="font-cinzel text-2xl font-bold text-white text-center mb-8">
            Frequently Asked Questions
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {[
              {
                q: "Can I cancel anytime?",
                a: "Yes! You can cancel your subscription anytime. Your benefits will continue until the end of your billing period."
              },
              {
                q: "What payment methods do you accept?",
                a: "We accept all major credit/debit cards, UPI, net banking, and popular digital wallets through Razorpay."
              },
              {
                q: "Can I upgrade or downgrade my plan?",
                a: "Absolutely! You can change your plan anytime. We'll prorate the charges accordingly."
              },
              {
                q: "Is my payment information secure?",
                a: "Yes, all payments are processed through Razorpay with bank-level encryption and PCI DSS compliance."
              }
            ].map((faq, idx) => (
              <Card key={idx} className="cosmic-card" data-testid={`faq-${idx}`}>
                <CardContent className="p-5">
                  <h4 className="font-semibold text-white mb-2">{faq.q}</h4>
                  <p className="text-sm text-zinc-400">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <div className="glass rounded-2xl p-8 max-w-2xl mx-auto border border-cosmic-gold/20">
            <h3 className="font-cinzel text-2xl font-bold text-white mb-4">
              Not sure which plan is right for you?
            </h3>
            <p className="text-zinc-400 mb-6">
              Try our free plan first and upgrade whenever you're ready. No credit card required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/nakshatra-ai">
                <Button className="btn-gold px-8">Start Free Trial</Button>
              </Link>
              {/*
              <Link to="/astrologers">
                <Button variant="outline" className="border-cosmic-purple/50 px-8">
                  Talk to an Astrologer
                </Button>
              </Link>
              */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlansPage;
