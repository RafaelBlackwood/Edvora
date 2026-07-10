import { useState } from "react";
import { MessageCircle, Heart, Share2, Plus, ThumbsUp, Users, TrendingUp } from "lucide-react";

const categories = ["All", "Applications", "Scholarships", "Visa", "IELTS & Exams", "Country Advice", "Housing", "Motivation Letters", "PhD Applications"];

const posts = [
  {
    id: "1",
    author: "Maria G.",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=60&h=60&fit=crop&auto=format",
    country: "Brazil",
    category: "Applications",
    time: "2h ago",
    title: "Just got accepted to TU Munich! Here's what worked for me 🎉",
    content: "After 6 months of preparation, I finally got my acceptance letter from TU Munich for MSc Informatics! GPA 3.7, IELTS 7.5. The key was my motivation letter — I customized it specifically for the professor's research group. Happy to share my template!",
    likes: 142,
    comments: 38,
    tags: ["TUM", "Germany", "CS", "Admitted"],
    liked: false,
  },
  {
    id: "2",
    author: "Kwame A.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop&auto=format",
    country: "Ghana",
    category: "Scholarships",
    time: "5h ago",
    title: "DAAD Scholarship timeline — my experience",
    content: "Applied in October, got the result in March. The key is the research proposal — they want to see a clear impact on your home country. My interview lasted 30 minutes. 3 of us from my university applied, 2 got it. Don't sleep on this one!",
    likes: 89,
    comments: 24,
    tags: ["DAAD", "Germany", "Scholarship"],
    liked: true,
  },
  {
    id: "3",
    author: "Priya S.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60&h=60&fit=crop&auto=format",
    country: "India",
    category: "Visa",
    time: "1d ago",
    title: "German student visa checklist — complete guide for 2025",
    content: "I've been through this twice now. The biggest mistake people make is not having their blocked account ready BEFORE the visa appointment. You need €11,904 blocked for 12 months. Appointment slots are rare — book the moment you get your admission letter.",
    likes: 203,
    comments: 67,
    tags: ["Germany", "Visa", "Guide", "2025"],
    liked: false,
  },
  {
    id: "4",
    author: "Omar H.",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=60&h=60&fit=crop&auto=format",
    country: "Egypt",
    category: "IELTS & Exams",
    time: "2d ago",
    title: "Went from IELTS 6.0 to 7.5 in 3 months — my strategy",
    content: "Writing was my weakest section. I spent 45 mins daily on writing alone. The secret: study model answers, then practice without looking, then compare. For reading, do timed practice every day — speed is everything. Also E2Language on YouTube is gold.",
    likes: 312,
    comments: 91,
    tags: ["IELTS", "Study Tips", "Score Improvement"],
    liked: false,
  },
];

const forums = [
  { name: "Applications", icon: "📋", posts: 1240, color: "#7c6af7" },
  { name: "Scholarships", icon: "💰", posts: 876, color: "#10b981" },
  { name: "Visa", icon: "🛂", posts: 543, color: "#06b6d4" },
  { name: "Country Advice", icon: "🌍", posts: 432, color: "#f59e0b" },
  { name: "Housing", icon: "🏠", posts: 298, color: "#ef4444" },
  { name: "IELTS & Exams", icon: "📝", posts: 1104, color: "#a855f7" },
];

export function CommunityPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [postLikes, setPostLikes] = useState<Record<string, boolean>>({ "2": true });

  const filtered = posts.filter((p) => activeCategory === "All" || p.category === activeCategory);

  return (
    <div style={{ background: "#080d1a", minHeight: "100%" }}>
      <div className="px-4 lg:px-8 py-6 pb-24 lg:pb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>Community</h1>
            <p className="text-sm mt-1" style={{ color: "#6b7a9e" }}>Connect with 50,000+ applicants worldwide</p>
          </div>
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white hover:opacity-90 transition-all"
            style={{ background: "linear-gradient(135deg, #7c6af7, #06b6d4)" }}
          >
            <Plus size={15} /> New Post
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { icon: Users, label: "Members", value: "52,400", color: "#7c6af7" },
            { icon: MessageCircle, label: "Posts", value: "8,920", color: "#06b6d4" },
            { icon: TrendingUp, label: "Online Now", value: "1,240", color: "#10b981" },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="p-4 rounded-2xl text-center" style={{ background: "rgba(13,20,50,0.6)", border: "1px solid rgba(124,106,247,0.12)" }}>
              <Icon size={18} className="mx-auto mb-2" style={{ color }} />
              <div className="text-lg font-bold" style={{ color, fontFamily: "var(--font-mono)" }}>{value}</div>
              <div className="text-xs" style={{ color: "#6b7a9e" }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Forum categories */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {forums.map((f) => (
            <button
              key={f.name}
              onClick={() => setActiveCategory(f.name)}
              className="p-3 rounded-2xl text-center transition-all hover:-translate-y-0.5"
              style={{
                background: activeCategory === f.name ? `${f.color}20` : "rgba(13,20,50,0.6)",
                border: `1px solid ${activeCategory === f.name ? f.color : "rgba(124,106,247,0.12)"}`,
              }}
            >
              <div className="text-xl mb-1">{f.icon}</div>
              <div className="text-xs font-medium" style={{ color: activeCategory === f.name ? f.color : "#a8b4d0" }}>{f.name}</div>
              <div className="text-xs mt-0.5" style={{ color: "#6b7a9e" }}>{f.posts} posts</div>
            </button>
          ))}
        </div>

        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto scrollbar-none mb-5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
              style={{
                background: activeCategory === cat ? "rgba(124,106,247,0.2)" : "rgba(13,22,53,0.4)",
                border: `1px solid ${activeCategory === cat ? "#7c6af7" : "rgba(124,106,247,0.1)"}`,
                color: activeCategory === cat ? "#a89bf5" : "#6b7a9e",
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Posts */}
        <div className="space-y-4">
          {filtered.map((post) => {
            const liked = postLikes[post.id];
            return (
              <div
                key={post.id}
                className="p-5 rounded-2xl transition-all hover:border-purple-500/20"
                style={{ background: "rgba(13,20,50,0.6)", border: "1px solid rgba(124,106,247,0.12)" }}
              >
                <div className="flex items-start gap-3 mb-3">
                  <img src={post.avatar} alt={post.author} className="w-9 h-9 rounded-full object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-white">{post.author}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(124,106,247,0.1)", color: "#a89bf5" }}>{post.country}</span>
                      <span className="text-xs" style={{ color: "#6b7a9e" }}>{post.time}</span>
                    </div>
                    <span className="text-xs" style={{ color: "#7c6af7" }}>{post.category}</span>
                  </div>
                </div>

                <h3 className="font-semibold text-white mb-2">{post.title}</h3>
                <p className="text-sm mb-3" style={{ color: "#a8b4d0" }}>{post.content}</p>

                <div className="flex flex-wrap gap-1.5 mb-3">
                  {post.tags.map((tag) => (
                    <span key={tag} className="text-xs px-2 py-0.5 rounded" style={{ background: "rgba(6,182,212,0.1)", color: "#06b6d4" }}>#{tag}</span>
                  ))}
                </div>

                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setPostLikes((prev) => ({ ...prev, [post.id]: !prev[post.id] }))}
                    className="flex items-center gap-1.5 text-sm transition-all hover:scale-105"
                    style={{ color: liked ? "#ef4444" : "#6b7a9e" }}
                  >
                    <Heart size={15} fill={liked ? "#ef4444" : "none"} />
                    {post.likes + (liked && !post.liked ? 1 : 0)}
                  </button>
                  <button className="flex items-center gap-1.5 text-sm" style={{ color: "#6b7a9e" }}>
                    <MessageCircle size={15} /> {post.comments}
                  </button>
                  <button className="flex items-center gap-1.5 text-sm ml-auto" style={{ color: "#6b7a9e" }}>
                    <Share2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
