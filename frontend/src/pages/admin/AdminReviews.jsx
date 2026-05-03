import { useState, useEffect } from "react";
import axios from "axios";
import { API } from "@/App";
import { toast } from "sonner";
import { MessageSquare, Check, X, Flag, Trash2, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const AdminReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => { fetchReviews(); }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/admin/reviews`);
      setReviews(res.data || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const approveReview = async (id, approve) => {
    try {
      await axios.patch(`${API}/admin/reviews/${id}/approve`, { is_approved: approve });
      toast.success(approve ? "Review approved" : "Review rejected");
      fetchReviews();
    } catch (e) { toast.error("Failed"); }
  };

  const flagReview = async (id, flag) => {
    try {
      await axios.patch(`${API}/admin/reviews/${id}/flag`, { is_flagged: flag });
      toast.success(flag ? "Review flagged" : "Flag removed");
      fetchReviews();
    } catch (e) { toast.error("Failed"); }
  };

  const deleteReview = async (id) => {
    if (!confirm("Delete review?")) return;
    try {
      await axios.delete(`${API}/admin/reviews/${id}`);
      toast.success("Deleted"); fetchReviews();
    } catch (e) { toast.error("Failed"); }
  };

  const filtered = reviews.filter(r => {
    if (filter === "pending") return !r.is_approved;
    if (filter === "approved") return r.is_approved;
    if (filter === "flagged") return r.is_flagged;
    return true;
  });

  const pendingCount = reviews.filter(r => !r.is_approved).length;

  return (
    <div data-testid="admin-reviews-page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Reviews</h1>
          <p className="text-slate-400">{reviews.length} reviews, {pendingCount} pending</p>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[160px] bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-700">
            <SelectItem value="all">All Reviews</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="flagged">Flagged</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {loading ? <p className="text-slate-400 text-center py-8">Loading...</p> : filtered.map((r) => (
          <Card key={r.id} className={`border ${r.is_flagged ? "bg-red-900/10 border-red-800/50" : "bg-slate-800/50 border-slate-700"}`}>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-purple-400 font-medium">{r.user_name?.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-medium text-white">{r.user_name}</span>
                    <span className="text-slate-500">reviewed</span>
                    <span className="text-purple-400">{r.entity_name}</span>
                    <Badge variant="outline" className="border-slate-600 text-xs">{r.entity_type}</Badge>
                    {r.is_flagged && <Badge className="bg-red-500/20 text-red-400">Flagged</Badge>}
                    <Badge className={r.is_approved ? "bg-green-500/20 text-green-400" : "bg-amber-500/20 text-amber-400"}>
                      {r.is_approved ? "Approved" : "Pending"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 mb-2">
                    {Array(5).fill(0).map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < r.rating ? "text-amber-400 fill-amber-400" : "text-slate-600"}`} />
                    ))}
                  </div>
                  <p className="text-sm text-slate-300">{r.comment}</p>
                  <p className="text-xs text-slate-500 mt-2">{new Date(r.created_at).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {!r.is_approved && (
                    <Button size="sm" variant="ghost" className="text-green-400 hover:text-green-300" onClick={() => approveReview(r.id, true)} title="Approve">
                      <Check className="w-4 h-4" />
                    </Button>
                  )}
                  {r.is_approved && (
                    <Button size="sm" variant="ghost" className="text-amber-400 hover:text-amber-300" onClick={() => approveReview(r.id, false)} title="Unapprove">
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => flagReview(r.id, !r.is_flagged)} title={r.is_flagged ? "Unflag" : "Flag"}>
                    <Flag className={`w-4 h-4 ${r.is_flagged ? "text-red-400 fill-red-400" : "text-slate-400"}`} />
                  </Button>
                  <Button size="sm" variant="ghost" className="text-red-400" onClick={() => deleteReview(r.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminReviews;
