import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL ?? "http://127.0.0.1:54321";
const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const mailpitUrl =
  process.env.SUPABASE_MAILPIT_URL ?? "http://127.0.0.1:54324";

if (!publishableKey || !serviceRoleKey) {
  throw new Error(
    "Set SUPABASE_PUBLISHABLE_KEY and SUPABASE_SERVICE_ROLE_KEY before running this smoke test.",
  );
}

const timestamp = Date.now();
const email = `smoke-${timestamp}@example.com`;
const secondEmail = `smoke-two-${timestamp}@example.com`;
const password = "SmokeTest42!";
const client = createClient(url, publishableKey);
const secondClient = createClient(url, publishableKey);
const admin = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
let storagePath;
let userId;
let secondUserId;

async function waitForVerificationCode() {
  let message;

  for (let attempt = 0; attempt < 30 && !message; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const response = await fetch(`${mailpitUrl}/api/v1/messages`);
    if (!response.ok) {
      throw new Error(`Mailpit list returned ${response.status}.`);
    }
    const mailbox = await response.json();
    message = mailbox.messages?.find((candidate) =>
      JSON.stringify(candidate.To ?? candidate.to ?? [])
        .toLowerCase()
        .includes(email.toLowerCase()),
    );
  }

  if (!message) throw new Error("Verification email did not arrive in Mailpit.");

  const messageId = message.ID ?? message.Id ?? message.id;
  const detailResponse = await fetch(
    `${mailpitUrl}/api/v1/message/${messageId}`,
  );
  const detail = await detailResponse.json();
  const body = `${detail.Text ?? ""}\n${detail.HTML ?? ""}`;
  const token = body.match(/\b\d{6}\b/)?.[0];

  if (!token) {
    throw new Error("No six-digit OTP was found in the verification email.");
  }

  return token;
}

try {
  const signup = await client.auth.signUp({
    email,
    password,
    options: { data: { name: "Backend Smoke Test" } },
  });

  if (signup.error) throw signup.error;
  userId = signup.data.user?.id;
  if (!userId) throw new Error("Sign-up returned no user id.");

  const token = await waitForVerificationCode();
  const verification = await client.auth.verifyOtp({
    email,
    token,
    type: "email",
  });
  if (verification.error) throw verification.error;
  if (!verification.data.session) {
    throw new Error("OTP verification returned no session.");
  }

  const secondUser = await admin.auth.admin.createUser({
    email: secondEmail,
    email_confirm: true,
    password,
    user_metadata: { name: "Second Smoke User" },
  });
  if (secondUser.error) throw secondUser.error;
  secondUserId = secondUser.data.user.id;

  const secondSignIn = await secondClient.auth.signInWithPassword({
    email: secondEmail,
    password,
  });
  if (secondSignIn.error) throw secondSignIn.error;

  const profile = await client
    .from("profiles")
    .select("id, display_name, role")
    .single();
  if (profile.error) throw profile.error;
  if (profile.data.id !== userId || profile.data.role !== "student") {
    throw new Error("The profile trigger returned unexpected data.");
  }

  const workspace = await client
    .from("workspace_state")
    .upsert({ user_id: userId, state: { smoke: true }, version: 1 })
    .select("user_id, state")
    .single();
  if (workspace.error) throw workspace.error;

  const application = await client
    .from("applications")
    .insert({
      intake: "Fall 2027",
      notes: "Private smoke application",
      program: "Computer Science",
      university_id: "smoke-university",
      university_name: "Smoke University",
      user_id: userId,
    })
    .select("id")
    .single();
  if (application.error) throw application.error;

  const task = await client.from("application_tasks").insert({
    application_id: application.data.id,
    title: "Private smoke task",
  });
  if (task.error) throw task.error;

  const budget = await client
    .from("budget_scenarios")
    .upsert({
      budget: { tuition: 12000 },
      currency: "EUR",
      duration: 2,
      preset: "Germany",
      scholarship: 1000,
      user_id: userId,
    })
    .select("user_id")
    .single();
  if (budget.error) throw budget.error;

  const post = await client
    .from("community_posts")
    .insert({
      author_avatar: "https://invalid.example/spoof.png",
      author_country: "Spoofed country",
      author_name: "Spoofed author",
      category: "Applications",
      content: "A backend smoke-test post.",
      tags: ["Smoke"],
      title: "Backend integration smoke test",
      user_id: userId,
    })
    .select("id, author_name")
    .single();
  if (post.error) throw post.error;
  if (post.data.author_name !== "Backend Smoke Test") {
    throw new Error("Community post author identity could be spoofed.");
  }

  const comment = await client
    .from("community_comments")
    .insert({
      author_name: "Spoofed commenter",
      content: "A backend smoke-test comment.",
      post_id: post.data.id,
      user_id: userId,
    })
    .select("id, author_name")
    .single();
  if (comment.error) throw comment.error;
  if (comment.data.author_name !== "Backend Smoke Test") {
    throw new Error("Community comment author identity could be spoofed.");
  }

  const updatedPost = await client
    .from("community_posts")
    .update({
      author_name: "Changed author",
      title: "Backend integration smoke test updated",
    })
    .eq("id", post.data.id)
    .select("author_name")
    .single();
  if (updatedPost.error) throw updatedPost.error;
  if (updatedPost.data.author_name !== "Backend Smoke Test") {
    throw new Error("A community author could be changed after publication.");
  }

  const like = await secondClient.from("community_post_likes").insert({
    post_id: post.data.id,
    user_id: secondUserId,
  });
  if (like.error) throw like.error;

  const publicDiscussion = await secondClient
    .from("community_posts")
    .select("id")
    .eq("id", post.data.id)
    .single();
  if (publicDiscussion.error) throw publicDiscussion.error;

  const slot = new Date();
  slot.setDate(slot.getDate() + 5);
  slot.setHours(10, 0, 0, 0);
  const booking = await client
    .from("consultation_bookings")
    .insert({
      mentor_id: "mentor-smoke",
      starts_at: slot.toISOString(),
      topic: "Application strategy",
      user_id: userId,
    })
    .select("id")
    .single();
  if (booking.error) throw booking.error;

  const rangeStart = new Date(slot);
  rangeStart.setHours(0, 0, 0, 0);
  const rangeEnd = new Date(rangeStart);
  rangeEnd.setDate(rangeEnd.getDate() + 1);
  const availableSlots = await secondClient.rpc(
    "get_booked_consultation_slots",
    {
      p_from: rangeStart.toISOString(),
      p_to: rangeEnd.toISOString(),
    },
  );
  if (availableSlots.error) throw availableSlots.error;
  if (
    !availableSlots.data?.some(
      (candidate) =>
        candidate.mentor_id === "mentor-smoke" &&
        new Date(candidate.starts_at).getTime() === slot.getTime(),
    )
  ) {
    throw new Error("Booked consultation slot was not exposed by availability RPC.");
  }

  const duplicateBooking = await secondClient
    .from("consultation_bookings")
    .insert({
      mentor_id: "mentor-smoke",
      starts_at: slot.toISOString(),
      topic: "Scholarship review",
      user_id: secondUserId,
    });
  if (!duplicateBooking.error || duplicateBooking.error.code !== "23505") {
    throw new Error("The same mentor slot could be double booked.");
  }

  storagePath = `${userId}/smoke/${crypto.randomUUID()}.png`;
  const upload = await client.storage.from("documents").upload(
    storagePath,
    new Blob([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])], {
      type: "image/png",
    }),
    { contentType: "image/png" },
  );
  if (upload.error) throw upload.error;

  const document = await client
    .from("documents")
    .insert({
      category: "Other",
      id: crypto.randomUUID(),
      mime_type: "image/png",
      name: "smoke.png",
      size_bytes: 8,
      status: "Final",
      storage_path: storagePath,
      uploaded_at: new Date().toISOString(),
      user_id: userId,
      version: 1,
    })
    .select("id")
    .single();
  if (document.error) throw document.error;

  const privateChecks = await Promise.all([
    secondClient.from("workspace_state").select("user_id").eq("user_id", userId),
    secondClient.from("profiles").select("id").eq("id", userId),
    secondClient.from("applications").select("id").eq("id", application.data.id),
    secondClient.from("budget_scenarios").select("user_id").eq("user_id", userId),
    secondClient
      .from("consultation_bookings")
      .select("id")
      .eq("id", booking.data.id),
    secondClient.from("documents").select("id").eq("id", document.data.id),
  ]);

  for (const result of privateChecks) {
    if (result.error) throw result.error;
    if (result.data.length !== 0) {
      throw new Error("Cross-user RLS exposed private account data.");
    }
  }

  const forbiddenPostUpdate = await secondClient
    .from("community_posts")
    .update({ title: "Cross-user update" })
    .eq("id", post.data.id)
    .select("id");
  if (forbiddenPostUpdate.error) throw forbiddenPostUpdate.error;
  if (forbiddenPostUpdate.data.length !== 0) {
    throw new Error("A second user could update another user's post.");
  }

  const anonymous = createClient(url, publishableKey, {
    auth: { persistSession: false },
  });
  const anonymousWorkspace = await anonymous
    .from("workspace_state")
    .select("user_id")
    .eq("user_id", userId);
  if (
    anonymousWorkspace.error &&
    anonymousWorkspace.error.code !== "42501" &&
    anonymousWorkspace.error.code !== "PGRST205"
  ) {
    throw anonymousWorkspace.error;
  }
  if (!anonymousWorkspace.error && anonymousWorkspace.data.length !== 0) {
    throw new Error("RLS exposed private workspace data anonymously.");
  }

  const publicCatalog = await anonymous.from("institutions").select("id").limit(1);
  if (publicCatalog.error) throw publicCatalog.error;

  console.log(
    JSON.stringify(
      {
        auth: "verified",
        community: "identity protected; cross-user discussion read only",
        consultations: "availability visible; double booking prevented",
        documentStorage: "private upload passed",
        profileTrigger: profile.data.display_name,
        rls: "anonymous and cross-user private reads denied",
        workspace: "read/write passed",
      },
      null,
      2,
    ),
  );
} finally {
  if (storagePath) {
    await admin.storage.from("documents").remove([storagePath]);
  }
  if (userId) await admin.auth.admin.deleteUser(userId);
  if (secondUserId) await admin.auth.admin.deleteUser(secondUserId);
}
