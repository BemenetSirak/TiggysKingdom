import express, { type Request, type Response, type NextFunction } from "express";
import Stripe from "stripe";
import cors from "cors";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { supabase } from "./supabase.js";

// ── Data interfaces ───────────────────────────────────────────────────────────
interface Product {
  id: number;
  title: string;
  author?: string;
  price: number;
  originalPrice?: number | null;
  category: string;
  ages?: string;
  stock: number;
  badge?: string | null;
  active?: boolean;
  sold?: number;
  rating?: number;
  reviews?: number;
  createdAt?: string;
}

interface OrderItem {
  id?: number;
  title: string;
  price: number;
  quantity?: number;
}

interface Order {
  id: string;
  stripeSessionId?: string;
  userId?: string | null;
  customerName?: string | null;
  customerEmail?: string | null;
  items?: OrderItem[];
  total: number;
  status: string;
  paymentStatus?: string;
  paidAt?: string;
  note?: string;
  cancellationRequested?: boolean;
  cancellationRequestedAt?: string;
  cancellationDeniedAt?: string;
  createdAt?: string;
}

interface Subscriber {
  id: number;
  email: string;
  name?: string;
  source?: string;
  active?: boolean;
  createdAt?: string;
}

interface Episode {
  id: number;
  videoId: string;
  title: string;
  description?: string;
  ages?: string;
  category?: string;
  featured?: boolean;
  order?: number;
  active?: boolean;
  createdAt?: string;
}

interface AppUser {
  id: string;
  name: string;
  email: string;
  joinedDate?: string;
  createdAt?: string;
}

interface ResetToken {
  email: string;
  code: string;
  expiresAt: number;
}

interface ActivityLogEntry {
  id: number;
  action: string;
  details: Record<string, unknown>;
  at: string;
}

// Extend Express Request to carry the decoded JWT admin payload
declare global {
  namespace Express {
    interface Request {
      admin?: Record<string, unknown>;
    }
  }
}

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env if present (dotenv optional — falls back to hardcoded defaults)
try {
  const { config } = await import("dotenv");
  config({ path: join(__dirname, ".env") });
} catch { /* dotenv not installed, use defaults */ }

// ── Config ───────────────────────────────────────────────────────────────────
const PORT          = process.env.PORT            || 4242;
const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY || "";
const JWT_SECRET    = process.env.JWT_SECRET      || "tiggy-kingdom-admin-secret-2025";
const ADMIN_USERNAME= process.env.ADMIN_USERNAME  || "admin";
const ADMIN_PASSWORD= process.env.ADMIN_PASSWORD  || "tiggy2025";
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN   || "http://localhost";

const stripe = new Stripe(STRIPE_SECRET);
const app    = express();

// ── Email transport (optional — only active when SMTP_HOST is set) ────────────
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
    console.log(`📧 Email sent to ${to}: ${subject}`);
  } catch (err) {
    console.warn("Email send failed:", err.message);
  }
};

const emailWelcome = (name: string, email: string) => sendMail(email, "Welcome to Tiggy's Kingdom! 🐑",
  `<div style="font-family:sans-serif;max-width:560px;margin:auto;padding:32px">
    <h1 style="color:#6B2020">Welcome, ${name}! 🐑</h1>
    <p>You've joined <strong>Tiggy's Kingdom</strong> — a place where faith and wonder meet.</p>
    <p>Explore our <a href="${CLIENT_ORIGIN}:5173/episodes" style="color:#C9922A">free episodes</a>, browse the <a href="${CLIENT_ORIGIN}:5173/shop" style="color:#C9922A">shop</a>, and download <a href="${CLIENT_ORIGIN}:5173/activities" style="color:#C9922A">free activities</a>.</p>
    <p style="color:#888;font-size:12px">© 2025 Tiggy's Kingdom — Unsubscribe anytime.</p>
  </div>`
);

const emailOrderConfirmation = (order: Order) => {
  if (!order.customerEmail) return;
  const itemsList = (order.items || []).map(i => `<li>${i.title} × ${i.quantity || 1} — $${(i.price * (i.quantity || 1)).toFixed(2)}</li>`).join("");
  sendMail(order.customerEmail, `Order Confirmed — ${order.id}`,
    `<div style="font-family:sans-serif;max-width:560px;margin:auto;padding:32px">
      <h1 style="color:#6B2020">Order Confirmed! 📦</h1>
      <p>Hi ${order.customerName || "there"}, your order <strong>${order.id}</strong> has been placed.</p>
      <ul>${itemsList}</ul>
      <p><strong>Total: $${order.total.toFixed(2)}</strong></p>
      <p>Track your order at <a href="${CLIENT_ORIGIN}:5173/orders" style="color:#C9922A">Your Orders</a>.</p>
      <p style="color:#888;font-size:12px">© 2025 Tiggy's Kingdom</p>
    </div>`
  );
};

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: (origin, cb) => cb(null, true), // restrict to CLIENT_ORIGIN in production
  credentials: true,
}));

// Webhook must receive raw body BEFORE express.json() consumes it
app.post("/webhook", express.raw({ type: "application/json" }), async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  if (webhookSecret) {
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  } else {
    // Dev fallback — no secret configured, parse manually
    try { event = JSON.parse(req.body.toString()); } catch { return res.status(400).send("Invalid JSON"); }
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const orders = readData<Order>("orders.json");
    const idx = orders.findIndex(o => o.stripeSessionId === session.id);
    if (idx !== -1 && orders[idx].paymentStatus !== "paid") {
      orders[idx].paymentStatus = "paid";
      orders[idx].paidAt = new Date().toISOString();
      writeData("orders.json", orders);
      console.log(`✅  Payment confirmed for order ${orders[idx].id}`);
    }
  }

  res.json({ received: true });
});

app.use(express.json());

// ── Data helpers ──────────────────────────────────────────────────────────────
const dataPath = (file: string) => join(__dirname, "data", file);
const readData  = <T = unknown>(file: string): T[] => { try { return JSON.parse(readFileSync(dataPath(file), "utf8")); } catch { return []; } };
const writeData = (file: string, data: unknown) => writeFileSync(dataPath(file), JSON.stringify(data, null, 2), "utf8");
const nextId    = (arr: { id: number }[]) => arr.length === 0 ? 1 : Math.max(...arr.map(x => x.id)) + 1;

const appendLog = (action: string, details: Record<string, unknown> = {}) => {
  try {
    const log = readData<ActivityLogEntry>("activity-log.json");
    const id = log.length === 0 ? 1 : Math.max(...log.map(x => x.id)) + 1;
    log.push({ id, action, details, at: new Date().toISOString() });
    if (log.length > 500) log.splice(0, log.length - 500);
    writeData("activity-log.json", log);
  } catch { /* non-critical */ }
};

// ── Auth middleware ───────────────────────────────────────────────────────────
const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" });
  try { req.admin = jwt.verify(auth.slice(7), JWT_SECRET) as Record<string, unknown>; next(); }
  catch { res.status(401).json({ error: "Invalid or expired token" }); }
};

// ═════════════════════════════════════════════════════════════════════════════
// PUBLIC ROUTES
// ═════════════════════════════════════════════════════════════════════════════

// ── One-time checkout (cart) ──────────────────────────────────────────────────
app.post("/create-checkout-session", async (req: Request, res: Response) => {
  const { items, userId, customerName, customerEmail } = req.body;
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: items.map(item => ({
        price_data: {
          currency: "usd",
          product_data: { name: item.title },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity || 1,
      })),
      success_url: `${CLIENT_ORIGIN}:5173/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${CLIENT_ORIGIN}:5173/cart`,
    });
    res.json({ url: session.url });

    const orders = readData<Order>("orders.json");
    const total  = items.reduce((s: number, i: OrderItem) => s + i.price * (i.quantity || 1), 0);
    const order  = {
      id: `TK-${new Date().getFullYear()}-${String(orders.length + 1).padStart(5, "0")}`,
      stripeSessionId: session.id,
      userId: userId || null,
      customerName: customerName || null,
      customerEmail: customerEmail || null,
      items,
      total: Math.round(total * 100) / 100,
      status: "placed",
      createdAt: new Date().toISOString(),
    };
    orders.push(order);
    writeData("orders.json", orders);
    emailOrderConfirmation(order);

    // Decrement product stock
    const products = readData<Product>("products.json");
    let stockChanged = false;
    for (const item of items) {
      const idx = products.findIndex(p => p.id === item.id);
      if (idx !== -1) {
        const current = Number(products[idx].stock);
        if (!isNaN(current)) {
          products[idx].stock = Math.max(0, current - (item.quantity || 1));
          stockChanged = true;
        }
      }
    }
    if (stockChanged) writeData("products.json", products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
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
      success_url: `${CLIENT_ORIGIN}:5173/success?plan=${planId}`,
      cancel_url: `${CLIENT_ORIGIN}:5173/subscribe`,
    });
    res.json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ── User orders ───────────────────────────────────────────────────────────────
app.get("/api/orders/user/:userId", (req: Request, res: Response) => {
  const orders = readData<Order>("orders.json").filter(o => o.userId === req.params.userId).reverse();
  res.json(orders);
});

// ── Newsletter subscribe ──────────────────────────────────────────────────────
app.post("/api/subscribe", async (req: Request, res: Response) => {
  const { email, name, source } = req.body;
  if (!email) return res.status(400).json({ error: "Email required" });

  const subs = readData<Subscriber>("subscribers.json");
  if (subs.find(s => s.email === email)) return res.json({ success: true, message: "Already subscribed!" });

  const newSub: Subscriber = { id: nextId(subs), email, name: name || "", source: source || "api", active: true, createdAt: new Date().toISOString() };
  subs.push(newSub);
  writeData("subscribers.json", subs);
  res.json({ success: true, message: "Subscribed!" });
});

// ── Register user ─────────────────────────────────────────────────────────────
app.post("/api/users/register", (req: Request, res: Response) => {
  const { id, name, email, joinedDate } = req.body;
  const users = readData<AppUser>("users.json");
  if (!users.find(u => u.email === email)) {
    users.push({ id, name, email, joinedDate, createdAt: new Date().toISOString() });
    writeData("users.json", users);
    emailWelcome(name, email);
  }
  res.json({ success: true });
});

// ── Password reset ────────────────────────────────────────────────────────────
app.post("/api/auth/request-reset", (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email required" });

  const users = readData<AppUser>("users.json");
  if (!users.find(u => u.email === email)) return res.status(404).json({ error: "No account found with this email." });

  const tokens = readData<ResetToken>("reset-tokens.json").filter(t => t.expiresAt > Date.now());
  const code   = String(Math.floor(100000 + Math.random() * 900000));
  tokens.push({ email, code, expiresAt: Date.now() + 15 * 60 * 1000 }); // 15 min TTL
  writeData("reset-tokens.json", tokens);

  sendMail(email, "Your Password Reset Code — Tiggy's Kingdom",
    `<div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px">
      <h2 style="color:#6B2020">Password Reset Code</h2>
      <p>Use this code to reset your password. It expires in 15 minutes.</p>
      <div style="font-size:2.5rem;font-weight:900;letter-spacing:0.3em;text-align:center;color:#6B2020;padding:24px;background:#FAF8F3;border-radius:12px;margin:16px 0">${code}</div>
      <p style="color:#888;font-size:12px">If you didn't request this, ignore this email.</p>
    </div>`
  );

  console.log(`🔑 Reset code for ${email}: ${code}`); // dev fallback when email is not configured
  res.json({ success: true });
});

app.post("/api/auth/verify-reset", (req: Request, res: Response) => {
  const { email, code } = req.body;
  if (!email || !code) return res.status(400).json({ error: "Email and code required" });

  const tokens = readData<ResetToken>("reset-tokens.json");
  const match  = tokens.find(t => t.email === email && t.code === code && t.expiresAt > Date.now());
  if (!match) return res.status(400).json({ error: "Invalid or expired code." });

  writeData("reset-tokens.json", tokens.filter(t => !(t.email === email && t.code === code)));
  res.json({ success: true });
});

// ── Order cancellation request (user-initiated) ───────────────────────────────
app.post("/api/orders/:id/cancel-request", (req: Request, res: Response) => {
  const orders = readData<Order>("orders.json");
  const idx = orders.findIndex(o => o.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Order not found" });
  if (!["placed", "processing"].includes(orders[idx].status)) {
    return res.status(400).json({ error: "Cancellation can only be requested for placed or processing orders." });
  }
  orders[idx].cancellationRequested = true;
  orders[idx].cancellationRequestedAt = new Date().toISOString();
  writeData("orders.json", orders);
  res.json({ success: true });
});

// ── Cancel denial (admin clears the flag without cancelling) ─────────────────
app.post("/api/orders/:id/cancel-deny", (req: Request, res: Response) => {
  const orders = readData<Order>("orders.json");
  const idx = orders.findIndex(o => o.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Order not found" });
  orders[idx].cancellationRequested = false;
  orders[idx].cancellationDeniedAt = new Date().toISOString();
  writeData("orders.json", orders);
  res.json({ success: true });
});

// ── Public products ───────────────────────────────────────────────────────────
app.get("/api/products", (_req: Request, res: Response) => {
  res.json(readData<Product>("products.json").filter(p => p.active));
});

// ── Public episodes (curated/featured) ───────────────────────────────────────
app.get("/api/episodes", (_req: Request, res: Response) => {
  const eps = readData<Episode>("episodes.json").filter(e => e.active).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  res.json(eps);
});

// ═════════════════════════════════════════════════════════════════════════════
// ADMIN ROUTES (all require JWT)
// ═════════════════════════════════════════════════════════════════════════════

app.post("/api/admin/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email and password required" });
  if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: "Invalid credentials" });

  // Verify email is in Supabase admins table (falls back to env ADMIN_USERNAME if Supabase not configured)
  const { data, error } = await supabase.from("admins").select("email").eq("email", email).maybeSingle();
  const fallbackAllowed = !process.env.SUPABASE_URL && email === ADMIN_USERNAME;
  if (error || (!data && !fallbackAllowed)) return res.status(401).json({ error: "Not authorised as admin" });

  const token = jwt.sign({ email, role: "admin" }, JWT_SECRET, { expiresIn: "8h" });
  res.json({ token, email });
});

app.get("/api/admin/stats", requireAdmin, (_req: Request, res: Response) => {
  const products    = readData<Product>("products.json");
  const orders      = readData<Order>("orders.json");
  const subscribers = readData<Subscriber>("subscribers.json");
  const users       = readData<AppUser>("users.json");
  const episodes    = readData<Episode>("episodes.json");
  const revenue     = orders.reduce((s, o) => s + (o.total || 0), 0);
  const statusCounts = orders.reduce((acc: Record<string, number>, o) => { acc[o.status] = (acc[o.status] || 0) + 1; return acc; }, {});
  const cancelRequests = orders.filter(o => o.cancellationRequested && o.status !== "cancelled").length;
  const lowStock = products
    .filter(p => p.active && Number(p.stock) < 5)
    .map(p => ({ id: p.id, title: p.title, stock: Number(p.stock) }));
  res.json({
    products:       { total: products.length,    active: products.filter(p => p.active).length },
    orders:         { total: orders.length,      ...statusCounts },
    revenue:        Math.round(revenue * 100) / 100,
    subscribers:    { total: subscribers.length, active: subscribers.filter(s => s.active).length },
    users:          { total: users.length },
    episodes:       { total: episodes.length,    featured: episodes.filter(e => e.featured && e.active).length },
    cancelRequests,
    lowStock,
  });
});

// ── Products CRUD ─────────────────────────────────────────────────────────────
app.get("/api/admin/products", requireAdmin, (_req: Request, res: Response) => res.json(readData<Product>("products.json")));

app.post("/api/admin/products", requireAdmin, (req: Request, res: Response) => {
  const products = readData<Product>("products.json");
  const product  = { id: nextId(products), ...req.body, sold: 0, rating: 5.0, active: true, createdAt: new Date().toISOString() };
  products.push(product);
  writeData("products.json", products);
  appendLog("product_create", { id: product.id, title: product.title });
  res.status(201).json(product);
});

app.put("/api/admin/products/:id", requireAdmin, (req: Request, res: Response) => {
  const products = readData<Product>("products.json");
  const idx = products.findIndex(p => p.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  products[idx] = { ...products[idx], ...req.body, id: products[idx].id };
  writeData("products.json", products);
  appendLog("product_update", { id: products[idx].id, title: products[idx].title });
  res.json(products[idx]);
});

app.delete("/api/admin/products/:id", requireAdmin, (req: Request, res: Response) => {
  const products = readData<Product>("products.json");
  const idx = products.findIndex(p => p.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  products[idx].active = false;
  writeData("products.json", products);
  appendLog("product_delete", { id: products[idx].id, title: products[idx].title });
  res.json({ success: true });
});

// ── Orders ────────────────────────────────────────────────────────────────────
app.get("/api/admin/orders", requireAdmin, (_req: Request, res: Response) => res.json(readData<Order>("orders.json").reverse()));

app.put("/api/admin/orders/:id/status", requireAdmin, (req: Request, res: Response) => {
  const orders = readData<Order>("orders.json");
  const idx = orders.findIndex(o => o.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  const prev = orders[idx].status;
  orders[idx].status = req.body.status;
  if (req.body.status === "cancelled") orders[idx].cancellationRequested = false;
  writeData("orders.json", orders);
  appendLog("order_status", { orderId: req.params.id, from: prev, to: req.body.status });
  res.json(orders[idx]);
});

app.put("/api/admin/orders/:id/note", requireAdmin, (req: Request, res: Response) => {
  const orders = readData<Order>("orders.json");
  const idx = orders.findIndex(o => o.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  orders[idx].note = req.body.note || "";
  writeData("orders.json", orders);
  appendLog("order_note", { orderId: req.params.id, note: req.body.note });
  res.json(orders[idx]);
});

// ── Subscribers ───────────────────────────────────────────────────────────────
app.get("/api/admin/subscribers", requireAdmin, (_req: Request, res: Response) => res.json(readData<Subscriber>("subscribers.json").reverse()));

app.delete("/api/admin/subscribers/:id", requireAdmin, (req: Request, res: Response) => {
  const subs = readData<Subscriber>("subscribers.json");
  const idx = subs.findIndex(s => s.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  subs[idx].active = false;
  writeData("subscribers.json", subs);
  appendLog("subscriber_remove", { email: subs[idx].email });
  res.json({ success: true });
});

app.post("/api/admin/email-blast", requireAdmin, async (req: Request, res: Response) => {
  const { subject, html } = req.body;
  if (!subject || !html) return res.status(400).json({ error: "subject and html required" });
  if (!mailer) return res.status(503).json({ error: "Email not configured — add SMTP settings to server/.env" });
  const subs = readData<Subscriber>("subscribers.json").filter(s => s.active);
  let sent = 0, failed = 0;
  for (const sub of subs) {
    try { await sendMail(sub.email, subject, html); sent++; }
    catch { failed++; }
  }
  appendLog("email_blast", { subject, sent, failed, total: subs.length });
  res.json({ success: true, sent, failed });
});

app.get("/api/admin/activity-log", requireAdmin, (_req: Request, res: Response) => {
  res.json(readData<ActivityLogEntry>("activity-log.json").reverse().slice(0, 200));
});

// ── Users ─────────────────────────────────────────────────────────────────────
app.get("/api/admin/users", requireAdmin, (_req: Request, res: Response) => res.json(readData<AppUser>("users.json").reverse()));

// ── Episodes CRUD ─────────────────────────────────────────────────────────────
app.get("/api/admin/episodes", requireAdmin, (_req: Request, res: Response) => res.json(readData<Episode>("episodes.json")));

app.post("/api/admin/episodes", requireAdmin, (req: Request, res: Response) => {
  const eps = readData<Episode>("episodes.json");
  const ep  = { id: nextId(eps), ...req.body, active: true, createdAt: new Date().toISOString() };
  eps.push(ep);
  writeData("episodes.json", eps);
  res.status(201).json(ep);
});

app.put("/api/admin/episodes/:id", requireAdmin, (req: Request, res: Response) => {
  const eps = readData<Episode>("episodes.json");
  const idx = eps.findIndex(e => e.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  eps[idx] = { ...eps[idx], ...req.body, id: eps[idx].id };
  writeData("episodes.json", eps);
  res.json(eps[idx]);
});

app.delete("/api/admin/episodes/:id", requireAdmin, (req: Request, res: Response) => {
  const eps = readData<Episode>("episodes.json");
  const idx = eps.findIndex(e => e.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  eps[idx].active = false;
  writeData("episodes.json", eps);
  res.json({ success: true });
});

// ── Health ────────────────────────────────────────────────────────────────────
app.get("/health", (_req: Request, res: Response) => res.json({ status: "ok", time: new Date().toISOString() }));

// ── Startup ───────────────────────────────────────────────────────────────────
const server = app.listen(PORT, () => console.log(`✅  Tiggy's Kingdom API  →  http://localhost:${PORT}`));

process.on("uncaughtException",  (err)    => { console.error("Uncaught Exception:",  err);    process.exit(1); });
process.on("unhandledRejection", (reason) => { console.error("Unhandled Rejection:", reason); process.exit(1); });
server.on("error", (err: NodeJS.ErrnoException) => {
  console.error(err.code === "EADDRINUSE" ? `Port ${PORT} is already in use.` : err);
  process.exit(1);
});
