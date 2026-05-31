import { useState, useEffect } from "react";
import apiClient from "@/lib/apiClient";
import { API } from "@/App";
import { toast } from "sonner";
import {
  ShoppingBag, Plus, Search, MoreVertical, Edit, Trash2,
  Eye, Upload, Package
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const categories = ["gemstone", "rudraksha", "yantra", "puja", "book", "bracelet"];

const AdminStore = () => {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "gemstone",
    price: 0,
    discounted_price: null,
    stock_quantity: 10,
    images: [""],
    tags: [],
    is_active: true,
    is_featured: false
  });

  useEffect(() => {
    fetchProducts();
    fetchOrders();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`${API}/products`);
      setProducts(res.data);
    } catch (e) {
      console.error("Error fetching products:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await apiClient.get(`${API}/admin/orders`);
      setOrders(res.data || []);
    } catch (e) {
      console.error("Error fetching orders:", e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        images: formData.images.filter(img => img.trim() !== "")
      };
      
      if (editingProduct) {
        await apiClient.put(`${API}/admin/products/${editingProduct.id}`, payload);
        toast.success("Product updated successfully");
      } else {
        await apiClient.post(`${API}/admin/products`, payload);
        toast.success("Product added successfully");
      }
      setShowForm(false);
      setEditingProduct(null);
      resetForm();
      fetchProducts();
    } catch (e) {
      toast.error("Failed to save product");
    }
  };

  const handleEdit = (product) => {
    setFormData({
      name: product.name,
      description: product.description,
      category: product.category,
      price: product.price,
      discounted_price: product.discounted_price,
      stock_quantity: product.stock_quantity,
      images: product.images?.length > 0 ? product.images : [""],
      tags: product.tags || [],
      is_active: product.is_active,
      is_featured: product.is_featured
    });
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      await apiClient.delete(`${API}/admin/products/${id}`);
      toast.success("Product deleted");
      fetchProducts();
    } catch (e) {
      toast.error("Failed to delete product");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      category: "gemstone",
      price: 0,
      discounted_price: null,
      stock_quantity: 10,
      images: [""],
      tags: [],
      is_active: true,
      is_featured: false
    });
  };

  const addImageField = () => {
    setFormData(p => ({ ...p, images: [...p.images, ""] }));
  };

  const updateImage = (index, value) => {
    const newImages = [...formData.images];
    newImages[index] = value;
    setFormData(p => ({ ...p, images: newImages }));
  };

  const filteredProducts = products.filter(p => {
    if (selectedCategory !== "all" && p.category !== selectedCategory) return false;
    if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div data-testid="admin-store-page">
      <Tabs defaultValue="products" className="w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Store Management</h1>
            <p className="text-slate-400">{products.length} products</p>
          </div>
          <TabsList className="bg-slate-800">
            <TabsTrigger value="products" className="data-[state=active]:bg-purple-600">Products</TabsTrigger>
            <TabsTrigger value="orders" className="data-[state=active]:bg-purple-600">Orders</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="products">
          {/* Products Controls */}
          <Card className="bg-slate-800/50 border-slate-700 mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-slate-900 border-slate-700"
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[180px] bg-slate-900 border-slate-700">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(c => (
                      <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  className="bg-purple-600 hover:bg-purple-700"
                  onClick={() => { resetForm(); setEditingProduct(null); setShowForm(true); }}
                  data-testid="add-product-btn"
                >
                  <Plus className="w-4 h-4 mr-2" /> Add Product
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Products Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {loading ? (
              Array(8).fill(0).map((_, i) => (
                <Card key={i} className="bg-slate-800/50 border-slate-700 h-[300px] animate-pulse" />
              ))
            ) : filteredProducts.map((product) => (
              <Card key={product.id} className="bg-slate-800/50 border-slate-700 overflow-hidden" data-testid={`product-card-${product.id}`}>
                <div className="relative aspect-square">
                  <img 
                    src={product.images?.[0] || "https://via.placeholder.com/300"} 
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                  {product.discounted_price && (
                    <Badge className="absolute top-2 left-2 bg-red-500">
                      {Math.round((1 - product.discounted_price / product.price) * 100)}% OFF
                    </Badge>
                  )}
                  {!product.is_active && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Badge className="bg-slate-600">Inactive</Badge>
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <Badge variant="outline" className="text-xs border-slate-600 mb-2 capitalize">
                        {product.category}
                      </Badge>
                      <h3 className="font-medium text-white text-sm truncate">{product.name}</h3>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-slate-900 border-slate-700">
                        <DropdownMenuItem onClick={() => handleEdit(product)} className="cursor-pointer">
                          <Edit className="w-4 h-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(product.id)} className="cursor-pointer text-red-400">
                          <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-amber-400 font-bold">
                        ₹{(product.discounted_price || product.price).toLocaleString()}
                      </span>
                      {product.discounted_price && (
                        <span className="text-xs text-slate-500 line-through ml-2">
                          ₹{product.price.toLocaleString()}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400">Stock: {product.stock_quantity}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="orders">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-4 px-4 text-sm font-medium text-slate-400">Order ID</th>
                      <th className="text-left py-4 px-4 text-sm font-medium text-slate-400">Customer</th>
                      <th className="text-left py-4 px-4 text-sm font-medium text-slate-400">Items</th>
                      <th className="text-left py-4 px-4 text-sm font-medium text-slate-400">Total</th>
                      <th className="text-left py-4 px-4 text-sm font-medium text-slate-400">Status</th>
                      <th className="text-left py-4 px-4 text-sm font-medium text-slate-400">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          No orders yet
                        </td>
                      </tr>
                    ) : orders.map((order) => (
                      <tr key={order.id} className="border-b border-slate-700/50 hover:bg-slate-800/50">
                        <td className="py-4 px-4 text-white font-mono text-sm">
                          #{order.id?.slice(0, 8)}
                        </td>
                        <td className="py-4 px-4 text-white">
                          {order.user_name || "Guest"}
                        </td>
                        <td className="py-4 px-4 text-slate-400">
                          {order.items?.length || 0} items
                        </td>
                        <td className="py-4 px-4 text-amber-400 font-medium">
                          ₹{order.total_amount?.toLocaleString() || 0}
                        </td>
                        <td className="py-4 px-4">
                          <Badge className={`
                            ${order.status === "delivered" ? "bg-green-500/20 text-green-400" :
                              order.status === "shipped" ? "bg-blue-500/20 text-blue-400" :
                              order.status === "confirmed" ? "bg-purple-500/20 text-purple-400" :
                              "bg-amber-500/20 text-amber-400"}
                          `}>
                            {order.status || "pending"}
                          </Badge>
                        </td>
                        <td className="py-4 px-4 text-sm text-slate-400">
                          {new Date(order.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Product Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => { if (!open) { setShowForm(false); setEditingProduct(null); } }}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingProduct ? "Edit Product" : "Add New Product"}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Product Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                  className="bg-slate-800 border-slate-700"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Category *</label>
                <Select
                  value={formData.category}
                  onValueChange={(v) => setFormData(p => ({ ...p, category: v }))}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    {categories.map(c => (
                      <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                className="bg-slate-800 border-slate-700"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Price (₹) *</label>
                <Input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData(p => ({ ...p, price: parseFloat(e.target.value) || 0 }))}
                  className="bg-slate-800 border-slate-700"
                  min="0"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Discounted Price</label>
                <Input
                  type="number"
                  value={formData.discounted_price || ""}
                  onChange={(e) => setFormData(p => ({ ...p, discounted_price: e.target.value ? parseFloat(e.target.value) : null }))}
                  className="bg-slate-800 border-slate-700"
                  min="0"
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Stock Quantity</label>
                <Input
                  type="number"
                  value={formData.stock_quantity}
                  onChange={(e) => setFormData(p => ({ ...p, stock_quantity: parseInt(e.target.value) || 0 }))}
                  className="bg-slate-800 border-slate-700"
                  min="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Image URLs</label>
              {formData.images.map((img, idx) => (
                <Input
                  key={idx}
                  value={img}
                  onChange={(e) => updateImage(idx, e.target.value)}
                  className="bg-slate-800 border-slate-700 mb-2"
                  placeholder="https://..."
                />
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addImageField} className="border-slate-700">
                <Plus className="w-4 h-4 mr-2" /> Add Image
              </Button>
            </div>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(p => ({ ...p, is_active: checked }))}
                />
                <span className="text-sm text-slate-300">Active</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Switch
                  checked={formData.is_featured}
                  onCheckedChange={(checked) => setFormData(p => ({ ...p, is_featured: checked }))}
                />
                <span className="text-sm text-slate-300">Featured</span>
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700">
                {editingProduct ? "Update Product" : "Add Product"}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                className="border-slate-700"
                onClick={() => { setShowForm(false); setEditingProduct(null); }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminStore;
