import { useState } from "react";
import {
  Heart,
  MessageCircle,
  Plus,
  Send,
  Share2,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { useAppData } from "../../providers/AppDataProvider";
import { sanitizeUserText } from "../../lib/security";

const categories = ["All", "Applications", "Scholarships", "Visa", "IELTS & Exams", "Country Advice", "Housing", "Motivation Letters", "PhD Applications"];

const initialPosts = [
  {
    id: "1",
    author: "Maria G.",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=60&h=60&fit=crop&auto=format",
    country: "Brazil",
    category: "Applications",
    time: "2h ago",
    title: "Accepted to TU Munich: what made the difference",
    content: "I customized my motivation letter around the research group rather than sending a generic statement. Happy to answer questions about the process.",
    likes: 142,
    comments: 38,
    tags: ["TUM", "Germany", "Admitted"],
    liked: false,
  },
  {
    id: "2",
    author: "Kwame A.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop&auto=format",
    country: "Ghana",
    category: "Scholarships",
    time: "5h ago",
    title: "DAAD scholarship timeline from submission to interview",
    content: "The research proposal and home-country impact were central in my interview. My result arrived in March after an October application.",
    likes: 89,
    comments: 24,
    tags: ["DAAD", "Germany", "Funding"],
    liked: true,
  },
  {
    id: "3",
    author: "Priya S.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60&h=60&fit=crop&auto=format",
    country: "India",
    category: "Visa",
    time: "1d ago",
    title: "German student visa checklist and blocked-account timing",
    content: "Prepare the blocked account before the appointment and start checking appointment availability as soon as your admission arrives.",
    likes: 203,
    comments: 67,
    tags: ["Germany", "Visa", "Checklist"],
    liked: false,
  },
  {
    id: "4",
    author: "Omar H.",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=60&h=60&fit=crop&auto=format",
    country: "Egypt",
    category: "IELTS & Exams",
    time: "2d ago",
    title: "From IELTS 6.0 to 7.5 in three months",
    content: "Daily writing practice and timed reading made the largest difference. I compared every draft with a model answer and tracked recurring mistakes.",
    likes: 312,
    comments: 91,
    tags: ["IELTS", "Study tips", "Scores"],
    liked: false,
  },
];

type CommunityPost = (typeof initialPosts)[number];
type Comment = { id: string; author: string; content: string; time: string };

function loadPosts() {
  try {
    const stored = sessionStorage.getItem("edvora.community.posts");
    return stored ? (JSON.parse(stored) as CommunityPost[]) : initialPosts;
  } catch {
    return initialPosts;
  }
}

function loadComments() {
  try {
    return JSON.parse(sessionStorage.getItem("edvora.community.comments") ?? "{}") as Record<string, Comment[]>;
  } catch {
    return {};
  }
}

export function CommunityPage() {
  const { userProfile } = useAppData();
  const [activeCategory, setActiveCategory] = useState("All");
  const [posts, setPosts] = useState<CommunityPost[]>(loadPosts);
  const [postLikes, setPostLikes] = useState<Record<string, boolean>>({ "2": true });
  const [comments, setComments] = useState<Record<string, Comment[]>>(loadComments);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [showComposer, setShowComposer] = useState(false);
  const [notice, setNotice] = useState("");
  const [commentDraft, setCommentDraft] = useState("");
  const [draft, setDraft] = useState({ category: "Applications", content: "", tags: "", title: "" });

  const filteredPosts = posts.filter((post) => activeCategory === "All" || post.category === activeCategory);
  const selectedPost = posts.find((post) => post.id === selectedPostId);

  const persistPosts = (nextPosts: CommunityPost[]) => {
    setPosts(nextPosts);
    sessionStorage.setItem("edvora.community.posts", JSON.stringify(nextPosts));
  };

  const persistComments = (nextComments: Record<string, Comment[]>) => {
    setComments(nextComments);
    sessionStorage.setItem("edvora.community.comments", JSON.stringify(nextComments));
  };

  const createPost = () => {
    const title = sanitizeUserText(draft.title, 140);
    const content = sanitizeUserText(draft.content, 1200);
    if (!title || !content) {
      setNotice("Add both a title and post content.");
      return;
    }

    const post: CommunityPost = {
      id: "post-" + crypto.randomUUID(),
      author: userProfile.name,
      avatar: userProfile.avatar,
      country: userProfile.nationality,
      category: draft.category,
      time: "Just now",
      title,
      content,
      likes: 0,
      comments: 0,
      tags: draft.tags.split(",").map((tag) => sanitizeUserText(tag.trim(), 30)).filter(Boolean).slice(0, 6),
      liked: false,
    };
    persistPosts([post, ...posts]);
    setDraft({ category: "Applications", content: "", tags: "", title: "" });
    setShowComposer(false);
    setActiveCategory("All");
    setNotice("Post published to the community.");
  };

  const addComment = () => {
    if (!selectedPost || !commentDraft.trim()) return;
    const comment: Comment = {
      id: crypto.randomUUID(),
      author: userProfile.name,
      content: sanitizeUserText(commentDraft, 500),
      time: "Just now",
    };
    persistComments({
      ...comments,
      [selectedPost.id]: [...(comments[selectedPost.id] ?? []), comment],
    });
    setCommentDraft("");
  };

  const sharePost = async (post: CommunityPost) => {
    const shareText = post.title + " - Edvora Community";
    try {
      await navigator.clipboard.writeText(shareText);
      setNotice("Post title copied for sharing.");
    } catch {
      setNotice("Sharing is unavailable in this browser.");
    }
  };

  return (
    <main style={{ background: "#080d1a", minHeight: "100%" }}>
      <div className="px-4 lg:px-8 py-6 pb-24 lg:pb-8">
        <header className="flex items-start justify-between gap-4 mb-6">
          <div><h1 className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>Community</h1><p className="text-sm mt-1" style={{ color: "#6b7a9e" }}>Exchange practical application experience with other students.</p></div>
          <button type="button" onClick={() => { setShowComposer(true); setNotice(""); }} className="app-primary-action flex items-center gap-2 px-4 py-2 text-sm font-medium text-white" style={{ background: "#665bd7" }}><Plus size={15} /> New post</button>
        </header>

        {notice && (
          <div role="status" className="flex items-center justify-between gap-3 p-3 rounded-lg mb-5" style={{ background: "rgba(85,205,230,0.08)", border: "1px solid rgba(85,205,230,0.2)", color: "#55cde6" }}><span className="text-sm">{notice}</span><button type="button" onClick={() => setNotice("")} aria-label="Dismiss message"><X size={15} /></button></div>
        )}

        <section className="grid grid-cols-3 gap-3 mb-5" aria-label="Community summary">
          {[
            { icon: Users, label: "Members", value: "52.4K", color: "#8f84e8" },
            { icon: MessageCircle, label: "Posts in view", value: String(filteredPosts.length), color: "#55cde6" },
            { icon: TrendingUp, label: "Online now", value: "1.2K", color: "#4dd39e" },
          ].map(({ icon: Icon, label, value, color }) => <div key={label} className="p-4 rounded-lg text-center" style={{ background: "rgba(13,20,50,0.6)", border: "1px solid rgba(124,106,247,0.12)" }}><Icon size={17} className="mx-auto mb-1.5" style={{ color }} /><strong className="text-lg" style={{ color, fontFamily: "var(--font-mono)" }}>{value}</strong><p className="text-[10px]" style={{ color: "#6b7a9e" }}>{label}</p></div>)}
        </section>

        <nav className="flex gap-2 overflow-x-auto scrollbar-none mb-5" aria-label="Community categories">
          {categories.map((category) => (
            <button key={category} type="button" onClick={() => setActiveCategory(category)} className="shrink-0 px-3 py-1.5 rounded-md text-xs font-medium" style={{ background: activeCategory === category ? "rgba(124,106,247,0.18)" : "rgba(13,22,53,0.45)", border: "1px solid " + (activeCategory === category ? "#7c6af7" : "rgba(124,106,247,0.1)"), color: activeCategory === category ? "#c1bbff" : "#7d89a2" }}>{category}</button>
          ))}
        </nav>

        <section className="space-y-3" aria-label="Community posts">
          {filteredPosts.map((post) => {
            const liked = Boolean(postLikes[post.id]);
            const addedComments = comments[post.id]?.length ?? 0;
            return (
              <article key={post.id} className="p-5 rounded-lg" style={{ background: "rgba(13,20,50,0.64)", border: "1px solid rgba(124,106,247,0.12)" }}>
                <div className="flex items-start gap-3 mb-3"><img src={post.avatar} alt="" className="w-9 h-9 rounded-full object-cover" /><div className="flex-1"><div className="flex items-center gap-2 flex-wrap"><strong className="text-sm text-white">{post.author}</strong><span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(124,106,247,0.1)", color: "#aaa2f2" }}>{post.country}</span><span className="text-[10px]" style={{ color: "#6b7a9e" }}>{post.time}</span></div><span className="text-[10px]" style={{ color: "#8f84e8" }}>{post.category}</span></div></div>
                <h2 className="font-semibold text-white mb-2">{post.title}</h2>
                <p className="text-sm leading-relaxed mb-3" style={{ color: "#a8b4d0" }}>{post.content}</p>
                <div className="flex flex-wrap gap-1.5 mb-4">{post.tags.map((tag) => <span key={tag} className="text-[10px] px-2 py-0.5 rounded-md" style={{ background: "rgba(6,182,212,0.09)", color: "#55cde6" }}>#{tag}</span>)}</div>
                <div className="flex items-center gap-4">
                  <button type="button" onClick={() => setPostLikes((current) => ({ ...current, [post.id]: !current[post.id] }))} className="flex items-center gap-1.5 text-xs" style={{ color: liked ? "#ef6d75" : "#7d89a2" }}><Heart size={15} fill={liked ? "currentColor" : "none"} />{post.likes + (liked && !post.liked ? 1 : 0)}</button>
                  <button type="button" onClick={() => setSelectedPostId(post.id)} className="flex items-center gap-1.5 text-xs" style={{ color: "#7d89a2" }}><MessageCircle size={15} />{post.comments + addedComments}</button>
                  <button type="button" onClick={() => sharePost(post)} className="ml-auto flex items-center gap-1.5 text-xs" style={{ color: "#7d89a2" }}><Share2 size={15} /> Share</button>
                </div>
              </article>
            );
          })}
          {filteredPosts.length === 0 && <div className="py-16 text-center" style={{ color: "#6b7a9e" }}><MessageCircle size={27} className="mx-auto mb-3" /><p className="text-sm">No posts in this category yet.</p><button type="button" onClick={() => setShowComposer(true)} className="mt-3 text-xs" style={{ color: "#aaa2f2" }}>Create the first post</button></div>}
        </section>
      </div>

      {showComposer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(8px)" }}>
          <section className="w-full max-w-lg p-6 rounded-lg" role="dialog" aria-modal="true" aria-labelledby="new-post-title" style={{ background: "#0d1432", border: "1px solid rgba(124,106,247,0.25)" }}>
            <div className="flex items-center justify-between mb-4"><h2 id="new-post-title" className="font-semibold text-white">Create a community post</h2><button type="button" onClick={() => setShowComposer(false)} aria-label="Close composer"><X size={18} /></button></div>
            <div className="space-y-3">
              <label className="block text-xs" style={{ color: "#7d89a2" }}>Category<select value={draft.category} onChange={(event) => setDraft((current) => ({ ...current, category: event.target.value }))} className="w-full mt-1.5 px-3 py-2.5 rounded-md text-sm" style={{ background: "#0a1221", border: "1px solid rgba(124,106,247,0.18)", color: "#e8eaf0" }}>{categories.slice(1).map((category) => <option key={category}>{category}</option>)}</select></label>
              <label className="block text-xs" style={{ color: "#7d89a2" }}>Title<input value={draft.title} maxLength={140} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} className="w-full mt-1.5 px-3 py-2.5 rounded-md text-sm" style={{ background: "#0a1221", border: "1px solid rgba(124,106,247,0.18)", color: "#e8eaf0" }} /></label>
              <label className="block text-xs" style={{ color: "#7d89a2" }}>Post<textarea value={draft.content} maxLength={1200} rows={6} onChange={(event) => setDraft((current) => ({ ...current, content: event.target.value }))} className="w-full mt-1.5 px-3 py-2.5 rounded-md text-sm resize-none" style={{ background: "#0a1221", border: "1px solid rgba(124,106,247,0.18)", color: "#e8eaf0" }} /></label>
              <label className="block text-xs" style={{ color: "#7d89a2" }}>Tags, separated by commas<input value={draft.tags} onChange={(event) => setDraft((current) => ({ ...current, tags: event.target.value }))} className="w-full mt-1.5 px-3 py-2.5 rounded-md text-sm" style={{ background: "#0a1221", border: "1px solid rgba(124,106,247,0.18)", color: "#e8eaf0" }} /></label>
            </div>
            <button type="button" onClick={createPost} className="app-primary-action w-full mt-4 py-3 text-sm font-semibold text-white" style={{ background: "#665bd7" }}>Publish post</button>
          </section>
        </div>
      )}

      {selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(8px)" }}>
          <section className="w-full max-w-lg max-h-[88vh] overflow-y-auto p-6 rounded-lg" role="dialog" aria-modal="true" aria-labelledby="comments-title" style={{ background: "#0d1432", border: "1px solid rgba(124,106,247,0.25)" }}>
            <div className="flex items-start justify-between gap-4 mb-4"><div><h2 id="comments-title" className="font-semibold text-white">Discussion</h2><p className="text-xs mt-1" style={{ color: "#7d89a2" }}>{selectedPost.title}</p></div><button type="button" onClick={() => setSelectedPostId(null)} aria-label="Close comments"><X size={18} /></button></div>
            <div className="space-y-2 mb-4">{(comments[selectedPost.id] ?? []).map((comment) => <article key={comment.id} className="p-3 rounded-md" style={{ background: "#0a1221" }}><div className="flex justify-between gap-3"><strong className="text-xs text-white">{comment.author}</strong><span className="text-[10px]" style={{ color: "#6b7a9e" }}>{comment.time}</span></div><p className="text-xs mt-1" style={{ color: "#a8b4d0" }}>{comment.content}</p></article>)}{!(comments[selectedPost.id]?.length) && <p className="text-xs py-8 text-center" style={{ color: "#6b7a9e" }}>Be the first Edvora user in this session to comment.</p>}</div>
            <form onSubmit={(event) => { event.preventDefault(); addComment(); }} className="flex gap-2"><input value={commentDraft} onChange={(event) => setCommentDraft(event.target.value)} placeholder="Add a helpful comment" className="flex-1 px-3 py-2.5 rounded-md text-sm" style={{ background: "#0a1221", border: "1px solid rgba(124,106,247,0.18)", color: "#e8eaf0" }} /><button type="submit" disabled={!commentDraft.trim()} className="app-primary-action w-10 flex items-center justify-center text-white disabled:opacity-40" style={{ background: "#665bd7" }} aria-label="Post comment"><Send size={15} /></button></form>
          </section>
        </div>
      )}
    </main>
  );
}