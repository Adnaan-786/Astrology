import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { API } from "@/App";
import { Clock, Eye, ChevronLeft, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getImageUrl } from "@/lib/utils";

const BlogPostPage = () => {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await axios.get(`${API}/blog/${slug}`);
        setPost(res.data);
      } catch (e) {
        console.error("Error fetching post:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-12 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cosmic-gold"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen pt-24 pb-12 text-center text-white">
        <h1 className="text-3xl font-cinzel font-bold mb-4">Post Not Found</h1>
        <Link to="/blog" className="text-cosmic-gold hover:underline">
          Return to Blog
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 lg:pt-24 pb-24 lg:pb-12" data-testid="blog-post-page">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/blog" className="inline-flex items-center text-zinc-400 hover:text-white mb-8 transition-colors">
          <ChevronLeft className="w-4 h-4 mr-1" /> Back to Blog
        </Link>

        {/* Header */}
        <div className="mb-8">
          <Badge className="mb-4 bg-cosmic-indigo/80 text-cosmic-gold border-cosmic-purple/30">
            {post.category}
          </Badge>
          <h1 className="font-cinzel text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">
            {post.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm text-zinc-400">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {new Date(post.created_at).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric"
              })}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {post.reading_time} min read
            </span>
            <span className="flex items-center gap-1.5">
              <Eye className="w-4 h-4" />
              {post.views?.toLocaleString()} views
            </span>
          </div>
        </div>

        {/* Cover Image */}
        {post.cover_image && (
          <div className="aspect-video w-full rounded-2xl overflow-hidden mb-12 border border-cosmic-purple/30 shadow-2xl">
            <img 
              src={getImageUrl(post.cover_image)} 
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Content */}
        <div className="prose prose-invert prose-purple max-w-none">
          {/* We are parsing line breaks for basic text content. If it's HTML, consider using dangerouslySetInnerHTML */}
          <div className="text-zinc-300 leading-relaxed whitespace-pre-wrap font-sans text-lg">
            {post.content}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogPostPage;
