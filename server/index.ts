import express, { type Request, type Response, type NextFunction } from "express";
import Stripe from "stripe";
import cors from "cors";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { supabase } from "./supabase.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env if present
try {
  const { config } = await import("dotenv");
  config({ path: join(__dirname, ".env") });
} catch { /* dotenv not installed */ }

// ── Config ────────────────────────────────────────────────────────────────────
const PORT          = process.env.PORT             || 4242;
const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY || "";
const JWT_SECRET    = process.env.JWT_SECRET        || "tiggy-kingdom-admin-secret-2025";
const ADMIN_EMAIL   = process.env.ADMIN_EMAIL       || "admin@admin.com";
const ADMIN_PASSWORD= process.env.ADMIN_PASSWORD    || "admin1";
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN    || "http://localhost";

const stripe = new Stripe(STRIPE_SECRET);
const app    = express();

// ── Helpers ───────────────────────────────────────────────────────────────────
// snake_case DB rows → camelCase JS objects
type Row = Record<string, unknown>;
const camelize = (row: Row): Row => {
  const out: Row = {};
  for (const [k, v] of Object.entries(row))
    out[k.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())] = v;
  return out;
};
const camelRows = (rows: Row[]) => rows.map(camelize);

// Remap episodes: sort_order → order
const mapEpisode = (row: Row): Row => {
  const r = camelize(row);
  r.order = r.sortOrder;
  delete r.sortOrder;
  return r;
};

const appendLog = async (action: string, details: Row = {}) => {
  try {
    await supabase.from("activity_log").insert({ action, details, at: new Date().toISOString() });
  } catch { /* non-critical */ }
};

// ── Email transport ───────────────────────────────────────────────────────────
const mailer = process.env.SMTP_HOST
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })
  : null;

const sendMail = async (to: string, subject: string, html: string): Promise<void> => {
  if (!mailer || !to) return;
  try {
    await mailer.sendMail({
      from: `"Tiggy's Kingdom" <${process.env.SMTP_USER || "hello@tiggyskingdom.com"}>`,
      to, subject, html,
    });
  } catch (err: unknown) {
    console.warn("Email send failed:", (err as Error).message);
  }
};

const emailWelcome = (name: string, email: string) => sendMail(email, "Welcome to Tiggy's Kingdom! 🐑",
  `<div style="font-family:sans-serif;max-width:560px;margin:auto;padding:32px">
    <h1 style="color:#6B2020">Welcome, ${name}! 🐑</h1>
    <p>You've joined <strong>Tiggy's Kingdom</strong> — a place where faith and wonder meet.</p>
    <p>Explore our <a href="${CLIENT_ORIGIN}/episodes" style="color:#C9922A">free episodes</a>, browse the <a href="${CLIENT_ORIGIN}/shop" style="color:#C9922A">shop</a>, and download <a href="${CLIENT_ORIGIN}/activities" style="color:#C9922A">free activities</a>.</p>
    <p style="color:#888;font-size:12px">© ${new Date().getFullYear()} Tiggy's Kingdom</p>
  </div>`
);

interface OrderRow { id: string; customer_name?: string; customer_email?: string; items?: unknown[]; total: number; }
const emailOrderConfirmation = (order: OrderRow) => {
  if (!order.customer_email) return;
  const items = (order.items || []) as Array<{ title: string; price: number; quantity?: number }>;
  const itemsList = items.map(i => `<li>${i.title} × ${i.quantity || 1} — $${(i.price * (i.quantity || 1)).toFixed(2)}</li>`).join("");
  sendMail(order.customer_email, `Order Confirmed — ${order.id}`,
    `<div style="font-family:sans-serif;max-width:560px;margin:auto;padding:32px">
      <h1 style="color:#6B2020">Order Confirmed! 📦</h1>
      <p>Hi ${order.customer_name || "there"}, your order <strong>${order.id}</strong> has been placed.</p>
      <ul>${itemsList}</ul>
      <p><strong>Total: $${order.total.toFixed(2)}</strong></p>
      <p>Track your order at <a href="${CLIENT_ORIGIN}/orders" style="color:#C9922A">Your Orders</a>.</p>
      <p style="color:#888;font-size:12px">© ${new Date().getFullYear()} Tiggy's Kingdom</p>
    </div>`
  );
};

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || origin === CLIENT_ORIGIN || origin.startsWith('http://localhost')) cb(null, true);
    else cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// Stripe webhook — raw body before express.json()
app.post("/webhook", express.raw({ type: "application/json" }), async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event: Stripe.Event;

  if (webhookSecret) {
    try { event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret); }
    catch (err: unknown) { return res.status(400).send(`Webhook Error: ${(err as Error).message}`); }
  } else {
    try { event = JSON.parse(req.body.toString()); }
    catch { return res.status(400).send("Invalid JSON"); }
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const { data: order } = await supabase
      .from("orders")
      .select("id, payment_status")
      .eq("stripe_session_id", session.id)
      .maybeSingle();
    if (order && order.payment_status !== "paid") {
      await supabase.from("orders").update({ payment_status: "paid", paid_at: new Date().toISOString() })
        .eq("stripe_session_id", session.id);
      console.log(`✅  Payment confirmed for order ${order.id}`);
    }
  }
  res.json({ received: true });
});

app.use(express.json());

// ── Auth middleware ───────────────────────────────────────────────────────────
declare global {
  namespace Express {
    interface Request { admin?: Record<string, unknown>; }
  }
}

const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" });
  try { req.admin = jwt.verify(auth.slice(7), JWT_SECRET) as Record<string, unknown>; next(); }
  catch { res.status(401).json({ error: "Invalid or expired token" }); }
};

// ── Health check ─────────────────────────────────────────────────────────────
app.get("/health", async (_req: Request, res: Response) => {
  const tables = ['episodes', 'products', 'users', 'orders', 'subscribers', 'activity_log'];
  const checks: Record<string, boolean> = {};
  for (const t of tables) {
    const { error } = await supabase.from(t).select('id').limit(1);
    checks[t] = !error;
  }
  const allOk = Object.values(checks).every(Boolean);
  res.status(allOk ? 200 : 207).json({ ok: allOk, supabase: checks, ts: new Date().toISOString() });
});

// ═════════════════════════════════════════════════════════════════════════════
// PUBLIC ROUTES
// ═════════════════════════════════════════════════════════════════════════════

// ── Cart checkout ─────────────────────────────────────────────────────────────
app.post("/create-checkout-session", async (req: Request, res: Response) => {
  const { items, userId, customerName, customerEmail } = req.body;
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: items.map((item: { title: string; price: number; quantity?: number }) => ({
        price_data: {
          currency: "usd",
          product_data: { name: item.title },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity || 1,
      })),
      success_url: `${CLIENT_ORIGIN}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${CLIENT_ORIGIN}/cart`,
    });
    res.json({ url: session.url });

    // Build order record
    const { count } = await supabase.from("orders").select("*", { count: "exact", head: true });
    const orderId  = `TK-${new Date().getFullYear()}-${String((count ?? 0) + 1).padStart(5, "0")}`;
    const total    = items.reduce((s: number, i: { price: number; quantity?: number }) => s + i.price * (i.quantity || 1), 0);

    const orderRow = {
      id:                 orderId,
      stripe_session_id:  session.id,
      user_id:            userId || null,
      customer_name:      customerName || null,
      customer_email:     customerEmail || null,
      items,
      total:              Math.round(total * 100) / 100,
      status:             "placed",
      created_at:         new Date().toISOString(),
    };
    await supabase.from("orders").insert(orderRow);
    emailOrderConfirmation({ ...orderRow, customer_name: customerName, customer_email: customerEmail, items });

    // Decrement stock
    for (const item of items as Array<{ id?: number; quantity?: number }>) {
      if (!item.id) continue;
      const { data: p } = await supabase.from("products").select("stock").eq("id", item.id).maybeSingle();
      if (p) {
        const newStock = Math.max(0, Number(p.stock) - (item.quantity || 1));
        await supabase.from("products").update({ stock: newStock }).eq("id", item.id);
      }
    }
  } catch (err: unknown) {
    console.error(err);
    res.status(500).json({ error: (err as Error).message });
  }
});

// ── Subscription checkout ─────────────────────────────────────────────────────
app.post("/create-subscription-session", async (req: Request, res: Response) => {
  const { planId, planName, priceMonthly, userId, customerEmail } = req.body;
  if (!priceMonthly || !planName) return res.status(400).json({ error: "planName and priceMonthly required" });
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [{
        price_data: {
          currency: "usd",
          product_data: { name: `Tiggy's Kingdom — ${planName}` },
          unit_amount: Math.round(priceMonthly * 100),
          recurring: { interval: "month" },
        },
        quantity: 1,
      }],
      subscription_data: { trial_period_days: 7 },
      customer_email: customerEmail || undefined,
      success_url: `${CLIENT_ORIGIN}/success?plan=${planId}`,
      cancel_url:  `${CLIENT_ORIGIN}/subscribe`,
    });
    res.json({ url: session.url });
  } catch (err: unknown) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ── User orders ───────────────────────────────────────────────────────────────
app.get("/api/orders/user/:userId", async (req: Request, res: Response) => {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", req.params.userId)
    .order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(camelRows(data || []));
});

// ── Newsletter subscribe ──────────────────────────────────────────────────────
app.post("/api/subscribe", async (req: Request, res: Response) => {
  const { email, name, source } = req.body;
  if (!email) return res.status(400).json({ error: "Email required" });

  const { data: existing } = await supabase.from("subscribers").select("email").eq("email", email).maybeSingle();
  if (existing) return res.json({ success: true, message: "Already subscribed!" });

  const { error } = await supabase.from("subscribers").insert({ email, name: name || "", source: source || "api", active: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, message: "Subscribed!" });
});

// ── Register user ─────────────────────────────────────────────────────────────
app.post("/api/users/register", async (req: Request, res: Response) => {
  const { id, name, email, joinedDate } = req.body;
  const { data: existing } = await supabase.from("users").select("email").eq("email", email).maybeSingle();
  if (!existing) {
    await supabase.from("users").insert({ id, name, email, joined_date: joinedDate, created_at: new Date().toISOString() });
    emailWelcome(name, email);
  }
  res.json({ success: true });
});

// ── Update user name ──────────────────────────────────────────────────────────
app.put("/api/users/:id/name", async (req: Request, res: Response) => {
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: "Name required" });
  const { error } = await supabase.from("users").update({ name: name.trim() }).eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// ── Password reset ────────────────────────────────────────────────────────────
app.post("/api/auth/request-reset", async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email required" });

  const { data: user } = await supabase.from("users").select("email").eq("email", email).maybeSingle();
  if (!user) return res.status(404).json({ error: "No account found with this email." });

  // Clean up expired tokens for this email
  await supabase.from("reset_tokens").delete().eq("email", email).lt("expires_at", Date.now());

  const code      = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = Date.now() + 15 * 60 * 1000;
  await supabase.from("reset_tokens").insert({ email, code, expires_at: expiresAt });

  sendMail(email, "Your Password Reset Code — Tiggy's Kingdom",
    `<div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px">
      <h2 style="color:#6B2020">Password Reset Code</h2>
      <p>Use this code to reset your password. It expires in 15 minutes.</p>
      <div style="font-size:2.5rem;font-weight:900;letter-spacing:0.3em;text-align:center;color:#6B2020;padding:24px;background:#FAF8F3;border-radius:12px;margin:16px 0">${code}</div>
      <p style="color:#888;font-size:12px">If you didn't request this, ignore this email.</p>
    </div>`
  );
  console.log(`🔑 Reset code for ${email}: ${code}`);
  res.json({ success: true });
});

app.post("/api/auth/verify-reset", async (req: Request, res: Response) => {
  const { email, code } = req.body;
  if (!email || !code) return res.status(400).json({ error: "Email and code required" });

  const { data: token } = await supabase
    .from("reset_tokens")
    .select("id")
    .eq("email", email)
    .eq("code", code)
    .gt("expires_at", Date.now())
    .maybeSingle();
  if (!token) return res.status(400).json({ error: "Invalid or expired code." });

  await supabase.from("reset_tokens").delete().eq("id", token.id);
  res.json({ success: true });
});

// ── Order cancellation request ────────────────────────────────────────────────
app.post("/api/orders/:id/cancel-request", async (req: Request, res: Response) => {
  const { data: order } = await supabase.from("orders").select("status").eq("id", req.params.id).maybeSingle();
  if (!order) return res.status(404).json({ error: "Order not found" });
  if (!["placed", "processing"].includes(order.status))
    return res.status(400).json({ error: "Cancellation can only be requested for placed or processing orders." });
  await supabase.from("orders").update({ cancellation_requested: true, cancellation_requested_at: new Date().toISOString() }).eq("id", req.params.id);
  res.json({ success: true });
});

app.post("/api/orders/:id/cancel-deny", async (req: Request, res: Response) => {
  const { data: order } = await supabase.from("orders").select("id").eq("id", req.params.id).maybeSingle();
  if (!order) return res.status(404).json({ error: "Order not found" });
  await supabase.from("orders").update({ cancellation_requested: false, cancellation_denied_at: new Date().toISOString() }).eq("id", req.params.id);
  res.json({ success: true });
});

// ── Public products ───────────────────────────────────────────────────────────
app.get("/api/products", async (req: Request, res: Response) => {
  const limit  = Math.min(Number(req.query.limit)  || 100, 200);
  const offset = Number(req.query.offset) || 0;
  const { data, error } = await supabase
    .from("products").select("*").eq("active", true)
    .range(offset, offset + limit - 1);
  if (error) return res.status(500).json({ error: error.message });
  res.json(camelRows(data || []));
});

// ── Public episodes ───────────────────────────────────────────────────────────
app.get("/api/episodes", async (req: Request, res: Response) => {
  const limit  = Math.min(Number(req.query.limit)  || 100, 200);
  const offset = Number(req.query.offset) || 0;
  const { data, error } = await supabase
    .from("episodes")
    .select("*")
    .eq("active", true)
    .order("sort_order", { ascending: true })
    .range(offset, offset + limit - 1);
  if (error) return res.status(500).json({ error: error.message });
  res.json((data || []).map(mapEpisode));
});

// ═════════════════════════════════════════════════════════════════════════════
// ADMIN ROUTES
// ═════════════════════════════════════════════════════════════════════════════

app.post("/api/admin/login", (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email and password required" });
  if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) return res.status(401).json({ error: "Invalid credentials" });
  const token = jwt.sign({ email, role: "admin" }, JWT_SECRET, { expiresIn: "8h" });
  res.json({ token, email });
});

// ── Stats ─────────────────────────────────────────────────────────────────────
app.get("/api/admin/stats", requireAdmin, async (_req: Request, res: Response) => {
  const [
    { count: totalProducts },
    { count: activeProducts },
    { data: orders },
    { count: totalSubs },
    { count: activeSubs },
    { count: totalUsers },
    { count: totalEpisodes },
    { count: featuredEpisodes },
    { data: lowStockData },
  ] = await Promise.all([
    supabase.from("products").select("*", { count: "exact", head: true }),
    supabase.from("products").select("*", { count: "exact", head: true }).eq("active", true),
    supabase.from("orders").select("id, total, status, cancellation_requested"),
    supabase.from("subscribers").select("*", { count: "exact", head: true }),
    supabase.from("subscribers").select("*", { count: "exact", head: true }).eq("active", true),
    supabase.from("users").select("*", { count: "exact", head: true }),
    supabase.from("episodes").select("*", { count: "exact", head: true }),
    supabase.from("episodes").select("*", { count: "exact", head: true }).eq("featured", true).eq("active", true),
    supabase.from("products").select("id, title, stock").eq("active", true).lt("stock", 5),
  ]);

  const rows = (orders || []) as Array<{ id: string; total: number; status: string; cancellation_requested?: boolean }>;
  const revenue = rows.reduce((s, o) => s + (o.total || 0), 0);
  const statusCounts = rows.reduce((acc: Record<string, number>, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1; return acc;
  }, {});
  const cancelRequests = rows.filter(o => o.cancellation_requested && o.status !== "cancelled").length;

  res.json({
    products:    { total: totalProducts ?? 0, active: activeProducts ?? 0 },
    orders:      { total: rows.length, ...statusCounts },
    revenue:     Math.round(revenue * 100) / 100,
    subscribers: { total: totalSubs ?? 0, active: activeSubs ?? 0 },
    users:       { total: totalUsers ?? 0 },
    episodes:    { total: totalEpisodes ?? 0, featured: featuredEpisodes ?? 0 },
    cancelRequests,
    lowStock:    camelRows(lowStockData || []),
  });
});

// ── Products CRUD ─────────────────────────────────────────────────────────────
app.get("/api/admin/products", requireAdmin, async (_req: Request, res: Response) => {
  const { data, error } = await supabase.from("products").select("*").order("id");
  if (error) return res.status(500).json({ error: error.message });
  res.json(camelRows(data || []));
});

app.post("/api/admin/products", requireAdmin, async (req: Request, res: Response) => {
  const b = req.body;
  const { data, error } = await supabase.from("products").insert({
    title: b.title, author: b.author, price: b.price, original_price: b.originalPrice ?? null,
    category: b.category, ages: b.ages, stock: b.stock ?? 0, badge: b.badge ?? null, active: b.active ?? true,
  }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  await appendLog("product_create", { id: data.id, title: data.title });
  res.status(201).json(camelize(data));
});

app.put("/api/admin/products/:id", requireAdmin, async (req: Request, res: Response) => {
  const b = req.body;
  const { data, error } = await supabase.from("products").update({
    title: b.title, author: b.author, price: b.price, original_price: b.originalPrice ?? null,
    category: b.category, ages: b.ages, stock: b.stock, badge: b.badge ?? null, active: b.active,
  }).eq("id", Number(req.params.id)).select().single();
  if (error) return res.status(error.code === "PGRST116" ? 404 : 500).json({ error: error.message });
  await appendLog("product_update", { id: data.id, title: data.title });
  res.json(camelize(data));
});

app.delete("/api/admin/products/:id", requireAdmin, async (req: Request, res: Response) => {
  const { data, error } = await supabase.from("products").update({ active: false })
    .eq("id", Number(req.params.id)).select("id, title").single();
  if (error) return res.status(error.code === "PGRST116" ? 404 : 500).json({ error: error.message });
  await appendLog("product_delete", { id: data.id, title: data.title });
  res.json({ success: true });
});

// ── Orders ────────────────────────────────────────────────────────────────────
app.get("/api/admin/orders", requireAdmin, async (_req: Request, res: Response) => {
  const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(camelRows(data || []));
});

app.put("/api/admin/orders/:id/status", requireAdmin, async (req: Request, res: Response) => {
  const { data: prev } = await supabase.from("orders").select("status").eq("id", req.params.id).maybeSingle();
  const update: Row = { status: req.body.status };
  if (req.body.status === "cancelled") update.cancellation_requested = false;
  const { data, error } = await supabase.from("orders").update(update).eq("id", req.params.id).select().single();
  if (error) return res.status(error.code === "PGRST116" ? 404 : 500).json({ error: error.message });
  await appendLog("order_status", { orderId: req.params.id, from: prev?.status, to: req.body.status });
  res.json(camelize(data));
});

app.put("/api/admin/orders/:id/note", requireAdmin, async (req: Request, res: Response) => {
  const { data, error } = await supabase.from("orders").update({ note: req.body.note || "" })
    .eq("id", req.params.id).select().single();
  if (error) return res.status(error.code === "PGRST116" ? 404 : 500).json({ error: error.message });
  await appendLog("order_note", { orderId: req.params.id, note: req.body.note });
  res.json(camelize(data));
});

// ── Subscribers ───────────────────────────────────────────────────────────────
app.get("/api/admin/subscribers", requireAdmin, async (_req: Request, res: Response) => {
  const { data, error } = await supabase.from("subscribers").select("*").order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(camelRows(data || []));
});

app.delete("/api/admin/subscribers/:id", requireAdmin, async (req: Request, res: Response) => {
  const { data, error } = await supabase.from("subscribers").update({ active: false })
    .eq("id", Number(req.params.id)).select("email").single();
  if (error) return res.status(error.code === "PGRST116" ? 404 : 500).json({ error: error.message });
  await appendLog("subscriber_remove", { email: data.email });
  res.json({ success: true });
});

app.post("/api/admin/email-blast", requireAdmin, async (req: Request, res: Response) => {
  const { subject, html } = req.body;
  if (!subject || !html) return res.status(400).json({ error: "subject and html required" });
  if (!mailer) return res.status(503).json({ error: "Email not configured — add SMTP settings to server/.env" });
  const { data: subs } = await supabase.from("subscribers").select("email").eq("active", true);
  let sent = 0, failed = 0;
  for (const sub of subs || []) {
    try { await sendMail(sub.email, subject, html); sent++; }
    catch { failed++; }
  }
  await appendLog("email_blast", { subject, sent, failed, total: (subs || []).length });
  res.json({ success: true, sent, failed });
});

// ── Activity log ──────────────────────────────────────────────────────────────
app.get("/api/admin/activity-log", requireAdmin, async (_req: Request, res: Response) => {
  const { data, error } = await supabase
    .from("activity_log")
    .select("*")
    .order("at", { ascending: false })
    .limit(200);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

// ── Users ─────────────────────────────────────────────────────────────────────
app.get("/api/admin/users", requireAdmin, async (_req: Request, res: Response) => {
  const { data, error } = await supabase.from("users").select("*").order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(camelRows(data || []));
});

// ── Episodes CRUD ─────────────────────────────────────────────────────────────
app.get("/api/admin/episodes", requireAdmin, async (_req: Request, res: Response) => {
  const { data, error } = await supabase.from("episodes").select("*").order("sort_order");
  if (error) return res.status(500).json({ error: error.message });
  res.json((data || []).map(mapEpisode));
});

app.post("/api/admin/episodes", requireAdmin, async (req: Request, res: Response) => {
  const b = req.body;
  const { data, error } = await supabase.from("episodes").insert({
    video_id: b.videoId, title: b.title, description: b.description,
    ages: b.ages, category: b.category, featured: b.featured ?? false,
    sort_order: b.order ?? 1, active: true,
  }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(mapEpisode(data));
});

app.put("/api/admin/episodes/:id", requireAdmin, async (req: Request, res: Response) => {
  const b = req.body;
  const { data, error } = await supabase.from("episodes").update({
    video_id: b.videoId, title: b.title, description: b.description,
    ages: b.ages, category: b.category, featured: b.featured,
    sort_order: b.order, active: b.active,
  }).eq("id", Number(req.params.id)).select().single();
  if (error) return res.status(error.code === "PGRST116" ? 404 : 500).json({ error: error.message });
  res.json(mapEpisode(data));
});

app.delete("/api/admin/episodes/:id", requireAdmin, async (req: Request, res: Response) => {
  const { error } = await supabase.from("episodes").update({ active: false })
    .eq("id", Number(req.params.id));
  if (error) return res.status(error.code === "PGRST116" ? 404 : 500).json({ error: error.message });
  res.json({ success: true });
});

// ── Health ────────────────────────────────────────────────────────────────────
app.get("/health", (_req: Request, res: Response) => res.json({ status: "ok", time: new Date().toISOString() }));

// ── Startup ───────────────────────────────────────────────────────────────────
const server = app.listen(PORT, () => console.log(`✅  Tiggy's Kingdom API  →  http://localhost:${PORT}`));

process.on("uncaughtException",  (err)    => { console.error("Uncaught Exception:",  err); process.exit(1); });
process.on("unhandledRejection", (reason) => { console.error("Unhandled Rejection:", reason); process.exit(1); });
server.on("error", (err: NodeJS.ErrnoException) => {
  console.error(err.code === "EADDRINUSE" ? `Port ${PORT} is already in use.` : err);
  process.exit(1);
});
