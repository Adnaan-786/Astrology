import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { API } from "@/App";
import { 
  Search, Clock, Eye, Calendar, ChevronRight, Tag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const categories = ["All", "Kundli", "Vastu", "Numerology", "Gemstones", "Festivals", "Yoga", "Relationship", "Career"];

const BlogPage = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    fetchPosts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const params = selectedCategory !== "All" ? `?category=${selectedCategory}` : "";
      const res = await axios.get(`${API}/blog${params}`);
      setPosts(res.data);
    } catch (e) {
      console.error("Error fetching posts:", e);
    } finally {
      setLoading(false);
    }
  };

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const featuredPost = filteredPosts[0];
  const otherPosts = filteredPosts.slice(1);

  return (
    <div className="min-h-screen pt-20 lg:pt-24 pb-24 lg:pb-12" data-testid="blog-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-cinzel text-3xl sm:text-4xl font-bold text-white mb-2">
            Cosmic <span className="text-gradient-gold">Knowledge</span>
          </h1>
          <p className="text-zinc-400">Explore the wisdom of Vedic astrology</p>
        </div>

        {/* Search & Categories */}
        <div className="mb-8">
          <div className="relative max-w-xl mx-auto mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <Input
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-cosmic-surface border-cosmic-purple/30 focus:border-cosmic-gold"
              data-testid="search-input"
            />
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            {categories.map(cat => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                size="sm"
                className={selectedCategory === cat 
                  ? "bg-cosmic-indigo text-cosmic-gold" 
                  : "border-cosmic-purple/30 hover:bg-cosmic-purple/20"
                }
                onClick={() => setSelectedCategory(cat)}
                data-testid={`category-${cat.toLowerCase()}`}
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-6">
            <div className="cosmic-card rounded-xl h-96 shimmer" />
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="cosmic-card rounded-xl h-72 shimmer" />
              ))}
            </div>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-zinc-400 mb-4">No articles found</p>
            <Button 
              variant="outline" 
              onClick={() => { setSearchQuery(""); setSelectedCategory("All"); }}
              className="border-cosmic-purple/50"
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          <>
            {/* Featured Post */}
            {featuredPost && (
              <Card className="cosmic-card overflow-hidden mb-8" data-testid="featured-post">
                <div className="grid md:grid-cols-2">
                  <div className="aspect-video md:aspect-auto overflow-hidden">
                    <img 
                      src={featuredPost.cover_image} 
                      alt={featuredPost.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <CardContent className="p-6 md:p-8 flex flex-col justify-center">
                    <Badge className="w-fit mb-4 bg-cosmic-gold/20 text-cosmic-gold border-cosmic-gold/30">
                      {featuredPost.category}
                    </Badge>
                    <h2 className="font-cinzel text-2xl md:text-3xl font-bold text-white mb-3">
                      {featuredPost.title}
                    </h2>
                    <p className="text-zinc-400 mb-4 line-clamp-3">{featuredPost.excerpt}</p>
                    <div className="flex items-center gap-4 text-sm text-zinc-500 mb-6">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {featuredPost.reading_time} min read
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {featuredPost.views.toLocaleString()} views
                      </span>
                    </div>
                    <Link to={`/blog/${featuredPost.slug}`}>
                      <Button className="btn-gold w-fit" data-testid="read-featured">
                        Read Article <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </CardContent>
                </div>
              </Card>
            )}

            {/* Other Posts Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {otherPosts.map(post => (
                <Card key={post.id} className="cosmic-card overflow-hidden group" data-testid={`post-${post.id}`}>
                  <Link to={`/blog/${post.slug}`} className="block h-full">
                    <CardContent className="p-0">
                      <div className="relative aspect-video overflow-hidden">
                        <img 
                          src={post.cover_image} 
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <Badge className="absolute top-3 left-3 bg-cosmic-indigo/80">
                          {post.category}
                        </Badge>
                      </div>
                      <div className="p-5">
                        <h3 className="font-cinzel font-semibold text-white mb-2 line-clamp-2 group-hover:text-cosmic-gold transition-colors">
                          {post.title}
                        </h3>
                        <p className="text-sm text-zinc-400 mb-4 line-clamp-2">{post.excerpt}</p>
                        <div className="flex items-center justify-between text-xs text-zinc-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {post.reading_time} min
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {post.views.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Link>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* Newsletter CTA */}
        <div className="mt-16">
          <div className="glass rounded-2xl p-8 text-center border border-cosmic-gold/20">
            <h3 className="font-cinzel text-2xl font-bold text-white mb-3">
              Get Cosmic Updates
            </h3>
            <p className="text-zinc-400 mb-6 max-w-md mx-auto">
              Subscribe to receive daily horoscopes, astrological insights, and special offers directly in your inbox.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <Input 
                placeholder="Enter your email"
                className="bg-cosmic-surface border-cosmic-purple/30"
                data-testid="newsletter-input"
              />
              <Button className="btn-gold" data-testid="subscribe-btn">
                Subscribe
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogPage;
