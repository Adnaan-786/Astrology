import { useState, useEffect } from "react";
import axios from "axios";
import apiClient from "@/lib/apiClient";
import { API } from "@/App";
import { toast } from "sonner";
import { 
  Search, Filter, Star, ShoppingCart, Heart, 
  ChevronDown, X, Package, Truck, Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BannerCarousel from "@/components/BannerCarousel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const categories = [
  { id: "all", name: "All Products", icon: "✨" },
  { id: "gemstone", name: "Gemstones", icon: "💎" },
  { id: "rudraksha", name: "Rudraksha", icon: "📿" },
  { id: "yantra", name: "Yantra", icon: "🔯" },
  { id: "puja", name: "Puja Kits", icon: "🪔" },
];

const CosmicStorePage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [cart, setCart] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showCart, setShowCart] = useState(false);

  useEffect(() => {
    fetchProducts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory]);


  const [checkoutStep, setCheckoutStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "", email: "", phone: "", street: "", city: "", state: "", zipCode: ""
  });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    setCheckoutStep(3);
    
    const userStr = localStorage.getItem("astrovedic_user");
    if (!userStr) {
      toast.error("Please login to place an order");
      setCheckoutStep(2);
      return;
    }

    try {
      const payload = {
        items: cart.map(i => ({ id: i.id, quantity: i.quantity })),
        customer_name: formData.name,
        customer_email: formData.email,
        customer_phone: formData.phone,
        address: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode
        }
      };
      
      const { data: orderData } = await apiClient.post("/store/checkout", payload);
      
      const options = {
        key: "rzp_test_SxZsoRYGIR7Tnn",
        amount: orderData.amount,
        currency: orderData.currency,
        name: "AstroVedic Cosmic Store",
        description: `Order ${orderData.order_id}`,
        order_id: orderData.order_id,
        handler: async function (response) {
          try {
            await apiClient.post("/store/verify-payment", {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            });
            toast.success("Payment successful! Order confirmed.");
            setCart([]);
            setShowCart(false);
            setCheckoutStep(1);
          } catch (err) {
            console.error("Verification error:", err);
            toast.error("Payment verification failed. Contact support.");
            setCheckoutStep(2);
          }
        },
        prefill: {
          name: formData.name,
          email: formData.email,
          contact: formData.phone
        },
        theme: { color: "#D4AF37" }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response){
        toast.error("Payment failed: " + response.error.description);
        setCheckoutStep(2);
      });
      rzp.open();
    } catch (error) {
      console.error("Checkout init error:", error);
      toast.error(error?.response?.data?.detail || "Failed to initiate checkout.");
      setCheckoutStep(2);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = selectedCategory !== "all" ? `?category=${selectedCategory}` : "";
      const res = await axios.get(`${API}/products${params}`);
      setProducts(res.data);
    } catch (e) {
      console.error("Error fetching products:", e);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    toast.success(`${product.name} added to cart!`);
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const cartTotal = cart.reduce((sum, item) => 
    sum + (item.discounted_price || item.price) * item.quantity, 0
  );

  return (
    <div className="min-h-screen pt-20 lg:pt-24 pb-24 lg:pb-12" data-testid="cosmic-store-page">
      <BannerCarousel page="store" showDefault={false} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-cinzel text-3xl sm:text-4xl font-bold text-white mb-2">
              Cosmic <span className="text-gradient-gold">Store</span>
            </h1>
            <p className="text-zinc-400">Sacred products for spiritual growth</p>
          </div>
          
          {/* Cart Button */}
          <Button 
            variant="outline" 
            className="border-cosmic-gold/50 text-cosmic-gold hover:bg-cosmic-gold/10 relative"
            onClick={() => setShowCart(true)}
            data-testid="cart-button"
          >
            <ShoppingCart className="w-5 h-5 mr-2" />
            Cart
            {cart.length > 0 && (
              <Badge className="absolute -top-2 -right-2 bg-cosmic-gold text-cosmic-dark h-5 w-5 p-0 flex items-center justify-center text-xs">
                {cart.reduce((sum, item) => sum + item.quantity, 0)}
              </Badge>
            )}
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-xl mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
          <Input
            placeholder="Search gemstones, rudraksha, yantra..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-cosmic-surface border-cosmic-purple/30 focus:border-cosmic-gold"
            data-testid="search-input"
          />
        </div>

        {/* Category Tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-8">
          <TabsList className="flex flex-wrap gap-2 bg-transparent h-auto p-0">
            {categories.map(cat => (
              <TabsTrigger
                key={cat.id}
                value={cat.id}
                className="px-4 py-2 rounded-full bg-cosmic-surface border border-cosmic-purple/30 data-[state=active]:bg-cosmic-indigo data-[state=active]:border-cosmic-gold data-[state=active]:text-cosmic-gold"
                data-testid={`category-${cat.id}`}
              >
                <span className="mr-2">{cat.icon}</span>
                {cat.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Trust Badges removed per user request */}

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="cosmic-card rounded-xl aspect-square shimmer" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredProducts.map(product => (
              <Card 
                key={product.id} 
                className="cosmic-card overflow-hidden group cursor-pointer"
                onClick={() => setSelectedProduct(product)}
                data-testid={`product-card-${product.id}`}
              >
                <CardContent className="p-0">
                  <div className="relative aspect-square overflow-hidden">
                    <img 
                      src={product.images[0]} 
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    {product.discounted_price && (
                      <Badge className="absolute top-2 left-2 bg-red-500 text-xs">
                        {Math.round((1 - product.discounted_price / product.price) * 100)}% OFF
                      </Badge>
                    )}
                    {product.is_featured && (
                      <Badge className="absolute top-2 right-2 bg-cosmic-gold text-cosmic-dark text-xs">
                        Featured
                      </Badge>
                    )}
                    <button 
                      className="absolute bottom-2 right-2 p-2 rounded-full bg-white/10 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Add to wishlist
                      }}
                    >
                      <Heart className="w-4 h-4 text-white" />
                    </button>
                  </div>
                  <div className="p-4">
                    <Badge variant="outline" className="text-[10px] border-cosmic-purple/30 text-zinc-400 mb-2">
                      {product.category}
                    </Badge>
                    <h3 className="font-medium text-white text-sm mb-1 truncate">{product.name}</h3>
                    <div className="flex items-center gap-1 mb-2">
                      <Star className="w-3 h-3 text-cosmic-gold fill-cosmic-gold" />
                      <span className="text-xs text-zinc-400">{product.rating} ({product.sold_count} sold)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-cosmic-gold font-bold">
                          ₹{(product.discounted_price || product.price).toLocaleString()}
                        </span>
                        {product.discounted_price && (
                          <span className="text-xs text-zinc-500 line-through ml-2">
                            ₹{product.price.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button 
                      className="w-full mt-3 btn-gold text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(product);
                      }}
                      data-testid={`add-to-cart-${product.id}`}
                    >
                      Add to Cart
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && filteredProducts.length === 0 && (
          <div className="text-center py-16">
            <p className="text-zinc-400 mb-4">No products found</p>
            <Button 
              variant="outline" 
              onClick={() => { setSearchQuery(""); setSelectedCategory("all"); }}
              className="border-cosmic-purple/50"
            >
              Clear Filters
            </Button>
          </div>
        )}

        {/* Product Detail Dialog */}
        <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
          <DialogContent className="bg-cosmic-dark border-cosmic-purple/30 max-w-2xl max-h-[90vh] overflow-y-auto">
            {selectedProduct && (
              <>
                <DialogHeader>
                  <DialogTitle className="font-cinzel text-xl text-white">{selectedProduct.name}</DialogTitle>
                </DialogHeader>
                <div className="grid md:grid-cols-2 gap-6 mt-4">
                  <div className="aspect-square rounded-xl overflow-hidden">
                    <img 
                      src={selectedProduct.images[0]} 
                      alt={selectedProduct.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <Badge variant="outline" className="border-cosmic-purple/30 text-zinc-400 mb-4">
                      {selectedProduct.category}
                    </Badge>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-cosmic-gold fill-cosmic-gold" />
                        <span className="text-white">{selectedProduct.rating}</span>
                      </div>
                      <span className="text-zinc-400">•</span>
                      <span className="text-zinc-400">{selectedProduct.sold_count} sold</span>
                    </div>
                    <div className="mb-4">
                      <span className="text-3xl font-bold text-cosmic-gold">
                        ₹{(selectedProduct.discounted_price || selectedProduct.price).toLocaleString()}
                      </span>
                      {selectedProduct.discounted_price && (
                        <span className="text-lg text-zinc-500 line-through ml-3">
                          ₹{selectedProduct.price.toLocaleString()}
                        </span>
                      )}
                    </div>
                    <p className="text-zinc-300 mb-6">{selectedProduct.description}</p>
                    <div className="flex flex-wrap gap-2 mb-6">
                      {selectedProduct.tags.map((tag, idx) => (
                        <Badge key={idx} variant="outline" className="border-cosmic-purple/30 text-zinc-400 text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="space-y-3">
                      <Button 
                        className="w-full btn-gold"
                        onClick={() => {
                          addToCart(selectedProduct);
                          setSelectedProduct(null);
                        }}
                        data-testid="dialog-add-to-cart"
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Add to Cart
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full border-cosmic-purple/50"
                        onClick={() => {
                          addToCart(selectedProduct);
                          setSelectedProduct(null);
                          setShowCart(true);
                        }}
                      >
                        Buy Now
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Cart Drawer & Checkout */}
        <Dialog open={showCart} onOpenChange={(open) => {
          setShowCart(open);
          if (!open) setTimeout(() => setCheckoutStep(1), 300);
        }}>
          <DialogContent className="bg-cosmic-dark border-cosmic-purple/30 max-w-md max-h-[90vh] overflow-y-auto">
            {checkoutStep === 1 ? (
              <>
                <DialogHeader>
                  <DialogTitle className="font-cinzel text-xl text-white flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-cosmic-gold" />
                    Your Cart
                  </DialogTitle>
                </DialogHeader>
                
                {cart.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                    <p className="text-zinc-400">Your cart is empty</p>
                  </div>
                ) : (
                  <div className="space-y-4 mt-4">
                    {cart.map(item => (
                      <div key={item.id} className="flex gap-3 p-3 glass rounded-lg" data-testid={`cart-item-${item.id}`}>
                        <img 
                          src={item.images[0]} 
                          alt={item.name}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-white">{item.name}</h4>
                          <p className="text-cosmic-gold font-semibold">
                            ₹{(item.discounted_price || item.price).toLocaleString()}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <button 
                              className="w-6 h-6 rounded bg-cosmic-surface text-white"
                              onClick={() => updateQuantity(item.id, -1)}
                            >
                              -
                            </button>
                            <span className="text-white text-sm">{item.quantity}</span>
                            <button 
                              className="w-6 h-6 rounded bg-cosmic-surface text-white"
                              onClick={() => updateQuantity(item.id, 1)}
                            >
                              +
                            </button>
                          </div>
                        </div>
                        <button 
                          className="text-zinc-400 hover:text-red-400"
                          onClick={() => removeFromCart(item.id)}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    
                    <div className="pt-4 border-t border-white/10">
                      <div className="flex justify-between mb-4">
                        <span className="text-zinc-400">Total</span>
                        <span className="text-xl font-bold text-cosmic-gold">₹{cartTotal.toLocaleString()}</span>
                      </div>
                      <Button className="w-full btn-gold" onClick={() => {
                        const userStr = localStorage.getItem("astrovedic_user");
                        if (!userStr) {
                           toast.error("Please login to place an order");
                           return;
                        }
                        const user = JSON.parse(userStr);
                        setFormData(prev => ({
                          ...prev,
                          name: user.name || "",
                          email: user.email || ""
                        }));
                        setCheckoutStep(2);
                      }} data-testid="checkout-btn">
                        Proceed to Checkout
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle className="font-cinzel text-xl text-white flex items-center gap-2">
                    <Truck className="w-5 h-5 text-cosmic-gold" />
                    Shipping Details
                  </DialogTitle>
                </DialogHeader>
                
                <form onSubmit={handleCheckout} className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs text-zinc-400">Name</label>
                      <Input required name="name" value={formData.name} onChange={handleInputChange} className="bg-cosmic-surface border-cosmic-purple/30" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-zinc-400">Phone</label>
                      <Input required name="phone" type="tel" value={formData.phone} onChange={handleInputChange} className="bg-cosmic-surface border-cosmic-purple/30" />
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-xs text-zinc-400">Email</label>
                    <Input required name="email" type="email" value={formData.email} onChange={handleInputChange} className="bg-cosmic-surface border-cosmic-purple/30" />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-zinc-400">Street Address</label>
                    <Input required name="street" value={formData.street} onChange={handleInputChange} className="bg-cosmic-surface border-cosmic-purple/30" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs text-zinc-400">City</label>
                      <Input required name="city" value={formData.city} onChange={handleInputChange} className="bg-cosmic-surface border-cosmic-purple/30" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-zinc-400">State</label>
                      <Input required name="state" value={formData.state} onChange={handleInputChange} className="bg-cosmic-surface border-cosmic-purple/30" />
                    </div>
                  </div>

                  <div className="space-y-1 w-1/2">
                    <label className="text-xs text-zinc-400">PIN Code</label>
                    <Input required name="zipCode" value={formData.zipCode} onChange={handleInputChange} className="bg-cosmic-surface border-cosmic-purple/30" />
                  </div>

                  <div className="pt-4 border-t border-white/10 flex items-center justify-between mt-6">
                    <Button type="button" variant="ghost" onClick={() => setCheckoutStep(1)} className="text-zinc-400 hover:text-white">
                      Back
                    </Button>
                    <Button type="submit" disabled={checkoutStep === 3} className="btn-gold">
                      {checkoutStep === 3 ? "Processing..." : `Pay ₹${cartTotal.toLocaleString()}`}
                    </Button>
                  </div>
                </form>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default CosmicStorePage;
