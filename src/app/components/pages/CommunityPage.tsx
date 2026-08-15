import { useEffect, useState } from "react";
import {
  Heart,
  MessageCircle,
  Plus,
  Send,
  Share2,
  Tags,
  TrendingUp,
  X,
} from "lucide-react";
import {
  createCommunityComment,
  createCommunityPost,
  loadCommunityFeed,
  setCommunityPostLiked,
  type CommunityPost,
} from "../../lib/featureData";
import { sanitizeUserText } from "../../lib/security";
import { useAppData } from "../../providers/AppDataProvider";
import { useAuth } from "../../providers/AuthProvider";

const categories = [
  "All",
  "Applications",
  "Scholarships",
  "Visa",
  "IELTS & Exams",
  "Country Advice",
  "Housing",
  "Motivation Letters",
  "PhD Applications",
];
const GUEST_POSTS_KEY = "edvora.community.posts.v2";

const initialGuestPosts: CommunityPost[] = [
  {
    author: "Maria G.",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=60&h=60&fit=crop&auto=format",
    category: "Applications",
    commentCount: 38,
    comments: [],
    content:
      "I customized my motivation letter around the research group rather than sending a generic statement. Happy to answer questions about the process.",
    country: "Brazil",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    id: "guest-1",
    liked: false,
    likeCount: 142,
    tags: ["TUM", "Germany", "Admitted"],
    title: "Accepted to TU Munich: what made the difference",
  },
  {
    author: "Kwame A.",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop&auto=format",
    category: "Scholarships",
    commentCount: 24,
    comments: [],
    content:
      "The research proposal and home-country impact were central in my interview. My result arrived in March after an October application.",
    country: "Ghana",
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    id: "guest-2",
    liked: true,
    likeCount: 89,
    tags: ["DAAD", "Germany", "Funding"],
    title: "DAAD scholarship timeline from submission to interview",
  },
];

function loadGuestPosts() {
  try {
    const stored = JSON.parse(
      sessionStorage.getItem(GUEST_POSTS_KEY) ?? "null",
    ) as CommunityPost[] | null;

    if (
      Array.isArray(stored) &&
      stored.every(
        (post) =>
          typeof post.id === "string" &&
          typeof post.likeCount === "number" &&
          Array.isArray(post.comments),
      )
    ) {
      return stored;
    }
  } catch {
    // Fall back to the bundled guest feed.
  }

  return initialGuestPosts;
}

function saveGuestPosts(posts: CommunityPost[]) {
  try {
    sessionStorage.setItem(GUEST_POSTS_KEY, JSON.stringify(posts));
  } catch {
    // Guest storage may be unavailable in a locked-down browser.
  }
}

function relativeTime(value: string) {
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return "Recently";

  const elapsedMinutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60000));
  if (elapsedMinutes < 1) return "Just now";
  if (elapsedMinutes < 60) return `${elapsedMinutes}m ago`;

  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) return `${elapsedHours}h ago`;

  const elapsedDays = Math.floor(elapsedHours / 24);
  if (elapsedDays < 7) return `${elapsedDays}d ago`;

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(timestamp));
}

function avatar(post: CommunityPost) {
  if (post.avatar) {
    return (
      <img
        src={post.avatar}
        alt=""
        className="w-9 h-9 rounded-full object-cover"
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <span
      className="w-9 h-9 rounded-full inline-flex items-center justify-center text-sm font-semibold"
      style={{ background: "rgba(124,106,247,0.16)", color: "#c1bbff" }}
      aria-hidden="true"
    >
      {post.author.slice(0, 1).toUpperCase() || "E"}
    </span>
  );
}

export function CommunityPage() {
  const { userProfile } = useAppData();
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState("All");
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [showComposer, setShowComposer] = useState(false);
  const [notice, setNotice] = useState("");
  const [commentDraft, setCommentDraft] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [pendingPostIds, setPendingPostIds] = useState<string[]>([]);
  const [draft, setDraft] = useState({
    category: "Applications",
    content: "",
    tags: "",
    title: "",
  });

  useEffect(() => {
    if (!user) return;

    if (user.isGuest) {
      setPosts(loadGuestPosts());
      setIsLoading(false);
      return;
    }

    let active = true;
    setIsLoading(true);

    void loadCommunityFeed(user.id)
      .then((feed) => {
        if (active) setPosts(feed);
      })
      .catch(() => {
        if (active) {
          setNotice("The community feed could not be loaded. Check your connection and try again.");
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user]);

  const filteredPosts = posts.filter(
    (post) => activeCategory === "All" || post.category === activeCategory,
  );
  const selectedPost = posts.find((post) => post.id === selectedPostId);
  const discussionCount = posts.reduce((total, post) => total + post.commentCount, 0);
  const categoryCount = new Set(posts.map((post) => post.category)).size;

  const replacePosts = (
    updater: (current: CommunityPost[]) => CommunityPost[],
  ) => {
    setPosts((current) => {
      const next = updater(current);
      if (user?.isGuest) saveGuestPosts(next);
      return next;
    });
  };

  const publishPost = async () => {
    const title = sanitizeUserText(draft.title, 140);
    const content = sanitizeUserText(draft.content, 1200);

    if (!user || !title || !content) {
      setNotice("Add both a title and post content.");
      return;
    }

    const tags = draft.tags
      .split(",")
      .map((tag) => sanitizeUserText(tag, 30))
      .filter(Boolean)
      .slice(0, 6);
    const category = categories.includes(draft.category)
      ? draft.category
      : "Applications";
    setIsPublishing(true);
    setNotice("");

    try {
      const post = user.isGuest
        ? ({
            author: userProfile.name,
            avatar: userProfile.avatar,
            category,
            commentCount: 0,
            comments: [],
            content,
            country: userProfile.nationality,
            createdAt: new Date().toISOString(),
            id: `guest-${crypto.randomUUID()}`,
            liked: false,
            likeCount: 0,
            tags,
            title,
          } satisfies CommunityPost)
        : await createCommunityPost(user.id, {
            author: userProfile.name,
            avatar: userProfile.avatar,
            category,
            content,
            country: userProfile.nationality,
            tags,
            title,
          });

      replacePosts((current) => [post, ...current]);
      setDraft({ category: "Applications", content: "", tags: "", title: "" });
      setShowComposer(false);
      setActiveCategory("All");
      setNotice(
        user.isGuest
          ? "Post saved for this guest session."
          : "Post published to the community.",
      );
    } catch {
      setNotice("The post could not be published. Check your connection and try again.");
    } finally {
      setIsPublishing(false);
    }
  };

  const toggleLike = async (post: CommunityPost) => {
    if (!user || pendingPostIds.includes(post.id)) return;

    const nextLiked = !post.liked;
    const applyLike = (current: CommunityPost[], liked: boolean) =>
      current.map((candidate) =>
        candidate.id === post.id
          ? {
              ...candidate,
              liked,
              likeCount: Math.max(
                0,
                candidate.likeCount +
                  (liked === candidate.liked ? 0 : liked ? 1 : -1),
              ),
            }
          : candidate,
      );

    replacePosts((current) => applyLike(current, nextLiked));
    if (user.isGuest) return;

    setPendingPostIds((current) => [...current, post.id]);
    try {
      await setCommunityPostLiked(user.id, post.id, nextLiked);
    } catch {
      replacePosts((current) => applyLike(current, post.liked));
      setNotice("The like could not be saved. Check your connection and try again.");
    } finally {
      setPendingPostIds((current) => current.filter((id) => id !== post.id));
    }
  };

  const addComment = async () => {
    const content = sanitizeUserText(commentDraft, 500);
    if (!user || !selectedPost || !content || pendingPostIds.includes(selectedPost.id)) {
      return;
    }

    setPendingPostIds((current) => [...current, selectedPost.id]);
    try {
      const comment = user.isGuest
        ? {
            author: userProfile.name,
            content,
            id: crypto.randomUUID(),
            time: new Date().toISOString(),
          }
        : await createCommunityComment(
            user.id,
            selectedPost.id,
            userProfile.name,
            content,
          );

      replacePosts((current) =>
        current.map((post) =>
          post.id === selectedPost.id
            ? {
                ...post,
                commentCount: post.commentCount + 1,
                comments: [...post.comments, comment],
              }
            : post,
        ),
      );
      setCommentDraft("");
    } catch {
      setNotice("The comment could not be posted. Check your connection and try again.");
    } finally {
      setPendingPostIds((current) =>
        current.filter((id) => id !== selectedPost.id),
      );
    }
  };

  const sharePost = async (post: CommunityPost) => {
    const shareText = `${post.title} - Edvora Community`;
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
          <div>
            <h1
              className="text-2xl font-bold text-white"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Community
            </h1>
            <p className="text-sm mt-1" style={{ color: "#6b7a9e" }}>
              Exchange practical application experience with other students.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setShowComposer(true);
              setNotice("");
            }}
            className="app-primary-action flex items-center gap-2 px-4 py-2 text-sm font-medium text-white"
            style={{ background: "#665bd7" }}
          >
            <Plus size={15} /> New post
          </button>
        </header>

        {notice && (
          <div
            role="status"
            className="flex items-center justify-between gap-3 p-3 rounded-lg mb-5"
            style={{
              background: "rgba(85,205,230,0.08)",
              border: "1px solid rgba(85,205,230,0.2)",
              color: "#55cde6",
            }}
          >
            <span className="text-sm">{notice}</span>
            <button
              type="button"
              onClick={() => setNotice("")}
              aria-label="Dismiss message"
            >
              <X size={15} />
            </button>
          </div>
        )}

        <section
          className="grid grid-cols-3 gap-3 mb-5"
          aria-label="Community summary"
        >
          {[
            {
              icon: TrendingUp,
              label: "Posts",
              value: String(posts.length),
              color: "#8f84e8",
            },
            {
              icon: MessageCircle,
              label: "Discussions",
              value: String(discussionCount),
              color: "#55cde6",
            },
            {
              icon: Tags,
              label: "Categories",
              value: String(categoryCount),
              color: "#4dd39e",
            },
          ].map(({ icon: Icon, label, value, color }) => (
            <div
              key={label}
              className="p-4 rounded-lg text-center"
              style={{
                background: "rgba(13,20,50,0.6)",
                border: "1px solid rgba(124,106,247,0.12)",
              }}
            >
              <Icon size={17} className="mx-auto mb-1.5" style={{ color }} />
              <strong
                className="text-lg"
                style={{ color, fontFamily: "var(--font-mono)" }}
              >
                {value}
              </strong>
              <p className="text-[10px]" style={{ color: "#6b7a9e" }}>
                {label}
              </p>
            </div>
          ))}
        </section>

        <nav
          className="flex gap-2 overflow-x-auto scrollbar-none mb-5"
          aria-label="Community categories"
        >
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className="shrink-0 px-3 py-1.5 rounded-md text-xs font-medium"
              style={{
                background:
                  activeCategory === category
                    ? "rgba(124,106,247,0.18)"
                    : "rgba(13,22,53,0.45)",
                border:
                  "1px solid " +
                  (activeCategory === category
                    ? "#7c6af7"
                    : "rgba(124,106,247,0.1)"),
                color: activeCategory === category ? "#c1bbff" : "#7d89a2",
              }}
            >
              {category}
            </button>
          ))}
        </nav>

        <section className="space-y-3" aria-label="Community posts">
          {isLoading && (
            <div
              className="py-16 flex justify-center"
              aria-busy="true"
              aria-label="Loading community"
            >
              <span className="auth-spinner" aria-hidden="true" />
            </div>
          )}

          {!isLoading &&
            filteredPosts.map((post) => (
              <article
                key={post.id}
                className="p-5 rounded-lg"
                style={{
                  background: "rgba(13,20,50,0.64)",
                  border: "1px solid rgba(124,106,247,0.12)",
                }}
              >
                <div className="flex items-start gap-3 mb-3">
                  {avatar(post)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <strong className="text-sm text-white">{post.author}</strong>
                      {post.country && (
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full"
                          style={{
                            background: "rgba(124,106,247,0.1)",
                            color: "#aaa2f2",
                          }}
                        >
                          {post.country}
                        </span>
                      )}
                      <span className="text-[10px]" style={{ color: "#6b7a9e" }}>
                        {relativeTime(post.createdAt)}
                      </span>
                    </div>
                    <span className="text-[10px]" style={{ color: "#8f84e8" }}>
                      {post.category}
                    </span>
                  </div>
                </div>
                <h2 className="font-semibold text-white mb-2">{post.title}</h2>
                <p
                  className="text-sm leading-relaxed mb-3"
                  style={{ color: "#a8b4d0" }}
                >
                  {post.content}
                </p>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] px-2 py-0.5 rounded-md"
                      style={{
                        background: "rgba(6,182,212,0.09)",
                        color: "#55cde6",
                      }}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => void toggleLike(post)}
                    disabled={pendingPostIds.includes(post.id)}
                    className="flex items-center gap-1.5 text-xs disabled:opacity-50"
                    style={{ color: post.liked ? "#ef6d75" : "#7d89a2" }}
                    aria-label={post.liked ? "Unlike post" : "Like post"}
                  >
                    <Heart size={15} fill={post.liked ? "currentColor" : "none"} />
                    {post.likeCount}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPostId(post.id)}
                    className="flex items-center gap-1.5 text-xs"
                    style={{ color: "#7d89a2" }}
                    aria-label={`Open ${post.commentCount} comments`}
                  >
                    <MessageCircle size={15} />
                    {post.commentCount}
                  </button>
                  <button
                    type="button"
                    onClick={() => void sharePost(post)}
                    className="ml-auto flex items-center gap-1.5 text-xs"
                    style={{ color: "#7d89a2" }}
                  >
                    <Share2 size={15} /> Share
                  </button>
                </div>
              </article>
            ))}

          {!isLoading && filteredPosts.length === 0 && (
            <div className="py-16 text-center" style={{ color: "#6b7a9e" }}>
              <MessageCircle size={27} className="mx-auto mb-3" />
              <p className="text-sm">No posts in this category yet.</p>
              <button
                type="button"
                onClick={() => setShowComposer(true)}
                className="mt-3 text-xs"
                style={{ color: "#aaa2f2" }}
              >
                Create the first post
              </button>
            </div>
          )}
        </section>
      </div>

      {showComposer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(8px)" }}
        >
          <section
            className="w-full max-w-lg p-6 rounded-lg"
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-post-title"
            style={{
              background: "#0d1432",
              border: "1px solid rgba(124,106,247,0.25)",
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 id="new-post-title" className="font-semibold text-white">
                Create a community post
              </h2>
              <button
                type="button"
                onClick={() => setShowComposer(false)}
                aria-label="Close composer"
              >
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3">
              <label className="block text-xs" style={{ color: "#7d89a2" }}>
                Category
                <select
                  value={draft.category}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      category: event.target.value,
                    }))
                  }
                  className="w-full mt-1.5 px-3 py-2.5 rounded-md text-sm"
                  style={{
                    background: "#0a1221",
                    border: "1px solid rgba(124,106,247,0.18)",
                    color: "#e8eaf0",
                  }}
                >
                  {categories.slice(1).map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>
              </label>
              <label className="block text-xs" style={{ color: "#7d89a2" }}>
                Title
                <input
                  value={draft.title}
                  maxLength={140}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  className="w-full mt-1.5 px-3 py-2.5 rounded-md text-sm"
                  style={{
                    background: "#0a1221",
                    border: "1px solid rgba(124,106,247,0.18)",
                    color: "#e8eaf0",
                  }}
                />
              </label>
              <label className="block text-xs" style={{ color: "#7d89a2" }}>
                Post
                <textarea
                  value={draft.content}
                  maxLength={1200}
                  rows={6}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      content: event.target.value,
                    }))
                  }
                  className="w-full mt-1.5 px-3 py-2.5 rounded-md text-sm resize-none"
                  style={{
                    background: "#0a1221",
                    border: "1px solid rgba(124,106,247,0.18)",
                    color: "#e8eaf0",
                  }}
                />
              </label>
              <label className="block text-xs" style={{ color: "#7d89a2" }}>
                Tags, separated by commas
                <input
                  value={draft.tags}
                  maxLength={240}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      tags: event.target.value,
                    }))
                  }
                  className="w-full mt-1.5 px-3 py-2.5 rounded-md text-sm"
                  style={{
                    background: "#0a1221",
                    border: "1px solid rgba(124,106,247,0.18)",
                    color: "#e8eaf0",
                  }}
                />
              </label>
            </div>
            <button
              type="button"
              onClick={() => void publishPost()}
              disabled={isPublishing}
              className="app-primary-action w-full mt-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: "#665bd7" }}
            >
              {isPublishing ? "Publishing..." : "Publish post"}
            </button>
          </section>
        </div>
      )}

      {selectedPost && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(8px)" }}
        >
          <section
            className="w-full max-w-lg max-h-[88vh] overflow-y-auto p-6 rounded-lg"
            role="dialog"
            aria-modal="true"
            aria-labelledby="comments-title"
            style={{
              background: "#0d1432",
              border: "1px solid rgba(124,106,247,0.25)",
            }}
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 id="comments-title" className="font-semibold text-white">
                  Discussion
                </h2>
                <p className="text-xs mt-1" style={{ color: "#7d89a2" }}>
                  {selectedPost.title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPostId(null)}
                aria-label="Close comments"
              >
                <X size={18} />
              </button>
            </div>
            <div className="space-y-2 mb-4">
              {selectedPost.comments.map((comment) => (
                <article
                  key={comment.id}
                  className="p-3 rounded-md"
                  style={{ background: "#0a1221" }}
                >
                  <div className="flex justify-between gap-3">
                    <strong className="text-xs text-white">{comment.author}</strong>
                    <span className="text-[10px]" style={{ color: "#6b7a9e" }}>
                      {relativeTime(comment.time)}
                    </span>
                  </div>
                  <p className="text-xs mt-1" style={{ color: "#a8b4d0" }}>
                    {comment.content}
                  </p>
                </article>
              ))}
              {!selectedPost.comments.length && (
                <p className="text-xs py-8 text-center" style={{ color: "#6b7a9e" }}>
                  Be the first to add a helpful comment.
                </p>
              )}
            </div>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void addComment();
              }}
              className="flex gap-2"
            >
              <input
                value={commentDraft}
                maxLength={500}
                onChange={(event) => setCommentDraft(event.target.value)}
                placeholder="Add a helpful comment"
                className="flex-1 min-w-0 px-3 py-2.5 rounded-md text-sm"
                style={{
                  background: "#0a1221",
                  border: "1px solid rgba(124,106,247,0.18)",
                  color: "#e8eaf0",
                }}
              />
              <button
                type="submit"
                disabled={
                  !commentDraft.trim() || pendingPostIds.includes(selectedPost.id)
                }
                className="app-primary-action w-10 flex items-center justify-center text-white disabled:opacity-40"
                style={{ background: "#665bd7" }}
                aria-label="Post comment"
              >
                <Send size={15} />
              </button>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
