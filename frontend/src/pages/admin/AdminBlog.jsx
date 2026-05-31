import { useState, useEffect } from "react";
import apiClient from "@/lib/apiClient";
import { API } from "@/App";
import { toast } from "sonner";
import { FileText, Plus, Edit, Trash2, Eye, EyeOff, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const categories = ["Kundli", "Gemstones", "Vastu", "Remedies", "Predictions", "Numerology", "General"];

const AdminBlog = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    title: "", slug: "", content: "", excerpt: "", cover_image: "",
    category: "General", tags: [], is_published: false, reading_time: 5
  });

  useEffect(() => { fetchPosts(); }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`${API}/admin/blog`);
      setPosts(res.data || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const resetForm = () => {
    setForm({ title: "", slug: "", content: "", excerpt: "", cover_image: "", category: "General", tags: [], is_published: false, reading_time: 5 });
    setEditing(null);
  };

  const handleEdit = (post) => {
    setForm({
      title: post.title, slug: post.slug, content: post.content, excerpt: post.excerpt,
      cover_image: post.cover_image, category: post.category, tags: post.tags || [],
      is_published: post.is_published, reading_time: post.reading_time || 5
    });
    setEditing(post);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form, slug: form.slug || form.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 50) };
    try {
      if (editing) {
        await apiClient.put(`${API}/admin/blog/${editing.id}`, payload);
        toast.success("Post updated");
      } else {
        await apiClient.post(`${API}/admin/blog`, payload);
        toast.success("Post created");
      }
      setShowForm(false);
      resetForm();
      fetchPosts();
    } catch (e) { toast.error("Failed to save post"); }
  };

  const togglePublish = async (post) => {
    try {
      await apiClient.patch(`${API}/admin/blog/${post.id}/publish`, { is_published: !post.is_published });
      toast.success(post.is_published ? "Post unpublished" : "Post published");
      fetchPosts();
    } catch (e) { toast.error("Failed to update"); }
  };

  const deletePost = async (id) => {
    if (!confirm("Delete this post?")) return;
    try {
      await apiClient.delete(`${API}/admin/blog/${id}`);
      toast.success("Post deleted");
      fetchPosts();
    } catch (e) { toast.error("Failed to delete"); }
  };

  const filtered = posts.filter(p => p.title?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div data-testid="admin-blog-page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Blog Management</h1>
          <p className="text-slate-400">{posts.length} posts</p>
        </div>
        <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => { resetForm(); setShowForm(true); }} data-testid="add-blog-btn">
          <Plus className="w-4 h-4 mr-2" /> New Post
        </Button>
      </div>

      <Card className="bg-slate-800/50 border-slate-700 mb-6">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input placeholder="Search posts..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-slate-900 border-slate-700" />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {loading ? <p className="text-slate-400 text-center py-8">Loading...</p> : filtered.map((post) => (
          <Card key={post.id} className="bg-slate-800/50 border-slate-700" data-testid={`blog-card-${post.id}`}>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                {post.cover_image && (
                  <img src={post.cover_image} alt="" className="w-24 h-16 rounded-lg object-cover flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-white truncate">{post.title}</h3>
                    <Badge className={post.is_published ? "bg-green-500/20 text-green-400" : "bg-amber-500/20 text-amber-400"}>
                      {post.is_published ? "Published" : "Draft"}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-400 truncate">{post.excerpt}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                    <span>{post.category}</span>
                    <span>{post.views || 0} views</span>
                    <span>{post.reading_time || 5} min read</span>
                    <span>{new Date(post.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button size="sm" variant="ghost" onClick={() => togglePublish(post)} title={post.is_published ? "Unpublish" : "Publish"}>
                    {post.is_published ? <EyeOff className="w-4 h-4 text-slate-400" /> : <Eye className="w-4 h-4 text-green-400" />}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleEdit(post)}>
                    <Edit className="w-4 h-4 text-blue-400" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => deletePost(post.id)}>
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showForm} onOpenChange={(open) => { if (!open) { setShowForm(false); resetForm(); } }}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">{editing ? "Edit Post" : "New Blog Post"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Title *</label>
              <Input value={form.title} onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))} className="bg-slate-800 border-slate-700" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Slug</label>
                <Input value={form.slug} onChange={(e) => setForm(p => ({ ...p, slug: e.target.value }))} className="bg-slate-800 border-slate-700" placeholder="auto-generated" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Category</label>
                <Select value={form.category} onValueChange={(v) => setForm(p => ({ ...p, category: v }))}>
                  <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Excerpt</label>
              <Input value={form.excerpt} onChange={(e) => setForm(p => ({ ...p, excerpt: e.target.value }))} className="bg-slate-800 border-slate-700" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Content *</label>
              <Textarea value={form.content} onChange={(e) => setForm(p => ({ ...p, content: e.target.value }))} className="bg-slate-800 border-slate-700" rows={8} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Cover Image URL</label>
                <Input value={form.cover_image} onChange={(e) => setForm(p => ({ ...p, cover_image: e.target.value }))} className="bg-slate-800 border-slate-700" placeholder="https://..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Reading Time (min)</label>
                <Input type="number" value={form.reading_time} onChange={(e) => setForm(p => ({ ...p, reading_time: parseInt(e.target.value) || 5 }))} className="bg-slate-800 border-slate-700" min="1" />
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <Switch checked={form.is_published} onCheckedChange={(c) => setForm(p => ({ ...p, is_published: c }))} />
              <span className="text-sm text-slate-300">Publish immediately</span>
            </label>
            <div className="flex gap-3 pt-2">
              <Button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700">{editing ? "Update Post" : "Create Post"}</Button>
              <Button type="button" variant="outline" className="border-slate-700" onClick={() => { setShowForm(false); resetForm(); }}>Cancel</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminBlog;
