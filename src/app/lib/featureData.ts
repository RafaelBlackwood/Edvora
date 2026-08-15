import { isSupabaseConfigured, supabase } from "./supabase";

export type BudgetValues = {
  appFees: number;
  examFees: number;
  flights: number;
  food: number;
  health: number;
  housing: number;
  personal: number;
  transport: number;
  tuition: number;
  visa: number;
};

export type BudgetScenario = {
  budget: BudgetValues;
  currency: string;
  duration: number;
  preset: string;
  scholarship: number;
};

export type ConsultationBooking = {
  day: string;
  id: string;
  mentorId: string;
  status: "booked" | "completed" | "cancelled";
  time: string;
  topic: string;
};

export type ConsultationSlot = {
  day: string;
  mentorId: string;
  time: string;
};

export type CommunityComment = {
  author: string;
  content: string;
  id: string;
  time: string;
};

export type CommunityPost = {
  author: string;
  avatar: string;
  category: string;
  commentCount: number;
  comments: CommunityComment[];
  content: string;
  country: string;
  createdAt: string;
  id: string;
  liked: boolean;
  likeCount: number;
  tags: string[];
  title: string;
};

type CommunityPostRow = {
  author_avatar: string;
  author_country: string;
  author_name: string;
  category: string;
  content: string;
  created_at: string;
  id: string;
  tags: string[];
  title: string;
};

type CommunityCommentRow = {
  author_name: string;
  content: string;
  created_at: string;
  id: string;
  post_id: string;
};

function backend() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error("Edvora is not connected to its backend.");
  }

  return supabase;
}

function localDateParts(value: string) {
  const date = new Date(value);
  const day = [
    String(date.getFullYear()).padStart(4, "0"),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
  const time = [
    String(date.getHours()).padStart(2, "0"),
    String(date.getMinutes()).padStart(2, "0"),
  ].join(":");

  return { day, time };
}

export async function loadBudgetScenario(userId: string) {
  const { data, error } = await backend()
    .from("budget_scenarios")
    .select("budget, currency, duration, preset, scholarship")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    budget: data.budget as BudgetValues,
    currency: data.currency,
    duration: Number(data.duration),
    preset: data.preset,
    scholarship: Number(data.scholarship),
  } satisfies BudgetScenario;
}

export async function saveBudgetScenario(userId: string, scenario: BudgetScenario) {
  const { error } = await backend().from("budget_scenarios").upsert({
    budget: scenario.budget,
    currency: scenario.currency,
    duration: scenario.duration,
    preset: scenario.preset,
    scholarship: scenario.scholarship,
    user_id: userId,
  });

  if (error) throw error;
}

export async function loadConsultationBookings(userId: string) {
  const { data, error } = await backend()
    .from("consultation_bookings")
    .select("id, mentor_id, starts_at, status, topic")
    .eq("user_id", userId)
    .eq("status", "booked")
    .order("starts_at");

  if (error) throw error;

  return (data ?? []).map((row) => ({
    ...localDateParts(row.starts_at),
    id: row.id,
    mentorId: row.mentor_id,
    status: row.status as ConsultationBooking["status"],
    topic: row.topic,
  }));
}

export async function loadBookedConsultationSlots(
  firstDay: string,
  lastDay: string,
) {
  const from = new Date(`${firstDay}T00:00:00`);
  const to = new Date(`${lastDay}T00:00:00`);
  to.setDate(to.getDate() + 1);

  if (Number.isNaN(from.valueOf()) || Number.isNaN(to.valueOf())) {
    throw new Error("Choose a valid consultation date range.");
  }

  const { data, error } = await backend().rpc("get_booked_consultation_slots", {
    p_from: from.toISOString(),
    p_to: to.toISOString(),
  });

  if (error) throw error;

  return ((data ?? []) as Array<{ mentor_id: string; starts_at: string }>).map(
    (row) => ({
      ...localDateParts(row.starts_at),
      mentorId: row.mentor_id,
    }),
  ) satisfies ConsultationSlot[];
}

export async function createConsultationBooking(
  userId: string,
  input: Omit<ConsultationBooking, "id" | "status">,
) {
  const startsAt = new Date(`${input.day}T${input.time}:00`);
  if (Number.isNaN(startsAt.valueOf())) {
    throw new Error("Choose a valid consultation time.");
  }

  const { data, error } = await backend()
    .from("consultation_bookings")
    .insert({
      mentor_id: input.mentorId,
      starts_at: startsAt.toISOString(),
      topic: input.topic,
      user_id: userId,
    })
    .select("id, mentor_id, starts_at, status, topic")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("That time was just booked. Choose another slot.");
    }
    throw error;
  }

  return {
    ...localDateParts(data.starts_at),
    id: data.id,
    mentorId: data.mentor_id,
    status: data.status as ConsultationBooking["status"],
    topic: data.topic,
  };
}

export async function cancelConsultationBooking(userId: string, bookingId: string) {
  const { error } = await backend()
    .from("consultation_bookings")
    .update({ status: "cancelled" })
    .eq("id", bookingId)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function loadCommunityFeed(userId: string) {
  const db = backend();
  const { data: postData, error: postError } = await db
    .from("community_posts")
    .select("id, author_name, author_avatar, author_country, category, title, content, tags, created_at")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(100);

  if (postError) throw postError;

  const posts = (postData ?? []) as CommunityPostRow[];
  const postIds = posts.map((post) => post.id);
  if (postIds.length === 0) return [];

  const [likesResult, commentsResult] = await Promise.all([
    db.rpc("get_community_like_summary", { p_post_ids: postIds }),
    db
      .from("community_comments")
      .select("id, post_id, author_name, content, created_at")
      .eq("status", "published")
      .in("post_id", postIds)
      .order("created_at", { ascending: true }),
  ]);

  if (likesResult.error) throw likesResult.error;
  if (commentsResult.error) throw commentsResult.error;

  const likes = (likesResult.data ?? []) as Array<{
    liked_by_me: boolean;
    like_count: number;
    post_id: string;
  }>;
  const comments = (commentsResult.data ?? []) as CommunityCommentRow[];

  return posts.map((post) => {
    const postComments = comments.filter((comment) => comment.post_id === post.id);
    const engagement = likes.find((like) => like.post_id === post.id);

    return {
      author: post.author_name,
      avatar: post.author_avatar,
      category: post.category,
      commentCount: postComments.length,
      comments: postComments.map((comment) => ({
        author: comment.author_name,
        content: comment.content,
        id: comment.id,
        time: comment.created_at,
      })),
      content: post.content,
      country: post.author_country,
      createdAt: post.created_at,
      id: post.id,
      liked: Boolean(engagement?.liked_by_me),
      likeCount: Number(engagement?.like_count ?? 0),
      tags: post.tags,
      title: post.title,
    } satisfies CommunityPost;
  });
}

export async function createCommunityPost(
  userId: string,
  input: Pick<CommunityPost, "author" | "avatar" | "category" | "content" | "country" | "tags" | "title">,
) {
  const { data, error } = await backend()
    .from("community_posts")
    .insert({
      author_avatar: input.avatar,
      author_country: input.country,
      author_name: input.author,
      category: input.category,
      content: input.content,
      tags: input.tags,
      title: input.title,
      user_id: userId,
    })
    .select("id, author_name, author_avatar, author_country, category, title, content, tags, created_at")
    .single();

  if (error) throw error;
  const row = data as CommunityPostRow;

  return {
    author: row.author_name,
    avatar: row.author_avatar,
    category: row.category,
    commentCount: 0,
    comments: [],
    content: row.content,
    country: row.author_country,
    createdAt: row.created_at,
    id: row.id,
    liked: false,
    likeCount: 0,
    tags: row.tags,
    title: row.title,
  } satisfies CommunityPost;
}

export async function setCommunityPostLiked(userId: string, postId: string, liked: boolean) {
  const query = liked
    ? backend().from("community_post_likes").insert({ post_id: postId, user_id: userId })
    : backend().from("community_post_likes").delete().eq("post_id", postId).eq("user_id", userId);
  const { error } = await query;
  if (error) throw error;
}

export async function createCommunityComment(
  userId: string,
  postId: string,
  author: string,
  content: string,
) {
  const { data, error } = await backend()
    .from("community_comments")
    .insert({ author_name: author, content, post_id: postId, user_id: userId })
    .select("id, author_name, content, created_at")
    .single();

  if (error) throw error;

  return {
    author: data.author_name,
    content: data.content,
    id: data.id,
    time: data.created_at,
  } satisfies CommunityComment;
}
