import express from "express";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import Stripe from "stripe";
import nodemailer from "nodemailer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT || 3000);
const isProd = process.env.NODE_ENV === "production";
const JWT_SECRET =
  process.env.JWT_SECRET || (!isProd ? "dev-only-change-me" : null);
if (!JWT_SECRET) throw new Error("JWT_SECRET est obligatoire en production.");
if (isProd) {
  if (JWT_SECRET.length < 32 || JWT_SECRET === "dev-only-change-me") throw new Error("JWT_SECRET doit contenir au moins 32 caractères aléatoires en production.");
  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD || process.env.ADMIN_EMAIL === "admin@maelie.local" || process.env.ADMIN_PASSWORD === "ChangeMe123!") throw new Error("ADMIN_EMAIL et ADMIN_PASSWORD doivent être configurés avec de vraies valeurs en production.");
  if (!process.env.PUBLIC_URL || !/^https:\/\//i.test(process.env.PUBLIC_URL)) throw new Error("PUBLIC_URL HTTPS est obligatoire en production.");
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) console.warn("[MAELIE] Stripe n'est pas entièrement configuré : les paiements réels resteront indisponibles.");
}
const dbDir = path.join(__dirname, "data");
fs.mkdirSync(dbDir, { recursive: true });
const db = new Database(path.join(dbDir, "maelie.sqlite"));
db.pragma("journal_mode=WAL");
try { db.exec("ALTER TABLE orders ADD COLUMN stock_reserved INTEGER DEFAULT 0"); } catch {}
db.exec(`CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY AUTOINCREMENT,email TEXT UNIQUE NOT NULL,password_hash TEXT NOT NULL,first_name TEXT DEFAULT '',last_name TEXT DEFAULT '',role TEXT DEFAULT 'customer',created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS products(id INTEGER PRIMARY KEY AUTOINCREMENT,slug TEXT UNIQUE NOT NULL,name TEXT NOT NULL,category TEXT NOT NULL,description TEXT DEFAULT '',price_cents INTEGER NOT NULL CHECK(price_cents>=0),old_price_cents INTEGER,image TEXT NOT NULL,badge TEXT DEFAULT '',stock INTEGER DEFAULT 0 CHECK(stock>=0),active INTEGER DEFAULT 1,created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS orders(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER,number TEXT UNIQUE NOT NULL,email TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'pending',subtotal_cents INTEGER NOT NULL,shipping_cents INTEGER NOT NULL,discount_cents INTEGER DEFAULT 0,total_cents INTEGER NOT NULL,address_json TEXT NOT NULL,stock_reserved INTEGER DEFAULT 0,created_at TEXT DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(user_id) REFERENCES users(id));
CREATE TABLE IF NOT EXISTS password_reset_tokens(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,token_hash TEXT UNIQUE NOT NULL,expires_at INTEGER NOT NULL,used_at INTEGER,created_at TEXT DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(user_id) REFERENCES users(id));
CREATE TABLE IF NOT EXISTS newsletter_subscribers(id INTEGER PRIMARY KEY AUTOINCREMENT,email TEXT UNIQUE NOT NULL,subscribed_at TEXT DEFAULT CURRENT_TIMESTAMP,active INTEGER DEFAULT 1);
CREATE TABLE IF NOT EXISTS contact_messages(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,email TEXT NOT NULL,subject TEXT NOT NULL,message TEXT NOT NULL,created_at TEXT DEFAULT CURRENT_TIMESTAMP,status TEXT DEFAULT 'new');
CREATE TABLE IF NOT EXISTS order_status_history(id INTEGER PRIMARY KEY AUTOINCREMENT,order_id INTEGER NOT NULL,status TEXT NOT NULL,created_at TEXT DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(order_id) REFERENCES orders(id));
CREATE TABLE IF NOT EXISTS order_items(id INTEGER PRIMARY KEY AUTOINCREMENT,order_id INTEGER NOT NULL,product_id INTEGER NOT NULL,name TEXT NOT NULL,price_cents INTEGER NOT NULL,quantity INTEGER NOT NULL,FOREIGN KEY(order_id) REFERENCES orders(id),FOREIGN KEY(product_id) REFERENCES products(id));`);
const statuses = [
  "pending",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
];
const adminEmail = (
    process.env.ADMIN_EMAIL || "admin@maelie.local"
  ).toLowerCase(),
  adminPassword =
    process.env.ADMIN_PASSWORD || (!isProd ? "ChangeMe123!" : null);
if (
  adminPassword &&
  !db.prepare("SELECT id FROM users WHERE email=?").get(adminEmail)
)
  db.prepare(
    "INSERT INTO users(email,password_hash,first_name,last_name,role) VALUES(?,?,?,?,?)",
  ).run(
    adminEmail,
    bcrypt.hashSync(adminPassword, 12),
    "Admin",
    "MAELIE",
    "admin",
  );
const seed = [
  [
    "robe-eclat",
    "Robe Éclat",
    "Mode",
    "Une robe fluide et lumineuse.",
    6990,
    8990,
    "img/produits/robe-eclat.svg",
    "Bestseller",
    12,
  ],
  [
    "bracelet-luna",
    "Bracelet Luna",
    "Bijoux",
    "Un bracelet délicat et lumineux.",
    2990,
    null,
    "img/produits/bracelet-luna.svg",
    "Nouveau",
    25,
  ],
  [
    "collier-perle",
    "Collier Perlé",
    "Bijoux",
    "Un collier raffiné aux lignes intemporelles.",
    3490,
    4490,
    "img/produits/collier-perle.svg",
    "-22%",
    18,
  ],
  [
    "bague-rose",
    "Bague Rose",
    "Bijoux",
    "Une bague fine et lumineuse.",
    2490,
    null,
    "img/produits/bague-rose.svg",
    "",
    30,
  ],
  [
    "bougie-fleurie",
    "Bougie Fleurie",
    "Maison",
    "Une bougie parfumée aux notes florales.",
    2490,
    2990,
    "img/produits/bougie-fleurie.svg",
    "Coup de cœur",
    40,
  ],
  [
    "bougie-vanille",
    "Bougie Vanille",
    "Maison",
    "Une senteur douce et réconfortante.",
    1990,
    null,
    "img/produits/bougie-vanille.svg",
    "",
    35,
  ],
  [
    "coffret-elegance",
    "Coffret Élégance",
    "Coffrets",
    "Une parenthèse élégante à offrir.",
    5990,
    6990,
    "img/produits/coffret-elegance.svg",
    "Idée cadeau",
    16,
  ],
  [
    "diffuseur-floral",
    "Diffuseur Floral",
    "Maison",
    "Un parfum discret pour votre intérieur.",
    3990,
    4990,
    "img/produits/diffuseur-floral.svg",
    "-20%",
    20,
  ],
  [
    "chemise-satin",
    "Chemise Satin",
    "Mode",
    "Une coupe souple et satinée.",
    4490,
    null,
    "img/produits/chemise-satin.svg",
    "Nouveau",
    10,
  ],
  [
    "pochette-nacre",
    "Pochette Nacre",
    "Accessoires",
    "Une pochette chic pour vos essentiels.",
    3290,
    3990,
    "img/produits/pochette-nacre.svg",
    "-18%",
    14,
  ],
  [
    "bougie-coton",
    "Bougie Coton",
    "Maison",
    "Une fragrance propre et douce.",
    2290,
    null,
    "img/produits/bougie-coton.svg",
    "Nouveau",
    35,
  ],
  [
    "coffret-douceur",
    "Coffret Douceur",
    "Coffrets",
    "Une sélection généreuse à offrir.",
    6990,
    7990,
    "img/produits/coffret-douceur.svg",
    "Cadeau",
    16,
  ],
  [
    "sac-maelie",
    "Sac Maelie",
    "Accessoires",
    "Un sac souple et structuré.",
    5490,
    null,
    "img/produits/sac-maelie.svg",
    "Signature",
    12,
  ],
  [
    "boucles-nacre",
    "Boucles Nacre",
    "Bijoux",
    "Des boucles délicates aux reflets nacrés.",
    2790,
    null,
    "img/produits/boucles-nacre.svg",
    "",
    22,
  ],
  [
    "parfum-rose",
    "Brume Rose",
    "Beauté",
    "Une brume légère aux notes poudrées.",
    3690,
    4290,
    "img/produits/parfum-rose.svg",
    "Nouveau",
    15,
  ],
  [
    "porte-cartes",
    "Porte-cartes Nacre",
    "Accessoires",
    "Un essentiel élégant du quotidien.",
    2190,
    null,
    "img/produits/porte-cartes.svg",
    "",
    28,
  ],
  [
    "echarpe-douceur",
    "Écharpe Douceur",
    "Mode",
    "Une écharpe légère et enveloppante.",
    3990,
    null,
    "img/produits/echarpe-douceur.svg",
    "",
    18,
  ],
  [
    "set-rituel",
    "Set Rituel Maison",
    "Maison",
    "Un trio parfumé pour votre rituel douceur.",
    4990,
    5990,
    "img/produits/set-rituel.svg",
    "Coup de cœur",
    14,
  ],
];
if (!db.prepare("SELECT id FROM products LIMIT 1").get()) {
  const q = db.prepare(
    "INSERT INTO products(slug,name,category,description,price_cents,old_price_cents,image,badge,stock) VALUES(?,?,?,?,?,?,?,?,?)",
  );
  const tx = db.transaction(() => seed.forEach((x) => q.run(...x)));
  tx();
}
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;
const stripeCouponId = process.env.STRIPE_COUPON_ID || "";
const mailer = process.env.SMTP_HOST ? nodemailer.createTransport({
  host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587),
  secure: String(process.env.SMTP_SECURE || "false") === "true",
  auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD || "" } : undefined,
}) : null;
const sendMail = async (to, subject, html) => {
  if (!mailer || !to) return false;
  await mailer.sendMail({ from: process.env.MAIL_FROM || process.env.SMTP_USER, to, subject, html });
  return true;
};
app.disable("x-powered-by");
if (process.env.TRUST_PROXY === "true") app.set("trust proxy", 1);
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  if (req.path.startsWith("/api/")) res.setHeader("Cache-Control", "no-store");
  if (isProd) res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  next();
});
const hits = new Map();
const publicLimit = (limit=20, windowMs=15*60e3) => (req,res,next) => {
  const key=`${req.ip}:${req.path}`, now=Date.now(); const x=hits.get(key)||{n:0,t:now};
  if(now-x.t>windowMs){x.n=0;x.t=now;} x.n++; hits.set(key,x);
  if(x.n>limit) return res.status(429).json({error:"Trop de demandes, réessayez plus tard."});
  next();
};
app.use("/api/auth", (req, res, next) => {
  const now = Date.now(),
    key = req.ip;
  const x = hits.get(key) || { n: 0, t: now };
  if (now - x.t > 15 * 60e3) {
    x.n = 0;
    x.t = now;
  }
  x.n++;
  hits.set(key, x);
  if (x.n > 60)
    return res
      .status(429)
      .json({ error: "Trop de tentatives, réessayez plus tard." });
  next();
});
app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  (req, res) => {
    if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) return res.status(501).send("Webhook non configuré");
    try {
      const event = stripe.webhooks.constructEvent(req.body, req.headers["stripe-signature"], process.env.STRIPE_WEBHOOK_SECRET);
      if (!["checkout.session.completed", "checkout.session.async_payment_succeeded", "checkout.session.expired", "checkout.session.async_payment_failed"].includes(event.type)) return res.json({ received: true });
      const session = event.data.object;
      const orderId = Number(session.metadata?.orderId);
      if (!orderId) return res.json({ received: true });
      const tx = db.transaction(() => {
        const order = db.prepare("SELECT * FROM orders WHERE id=?").get(orderId);
        if (!order) return;
        if (["checkout.session.completed", "checkout.session.async_payment_succeeded"].includes(event.type)) {
          const amountOk = Number(session.amount_total) === Number(order.total_cents);
          const currencyOk = String(session.currency || "").toLowerCase() === "eur";
          const paidOk = event.type === "checkout.session.async_payment_succeeded" || session.payment_status === "paid";
          if (order.status === "pending" && amountOk && currencyOk && paidOk) {
            db.prepare("UPDATE orders SET status='paid', stock_reserved=0 WHERE id=?").run(orderId);
            db.prepare("INSERT INTO order_status_history(order_id,status) VALUES(?,?)").run(orderId, "paid");
          }
          return;
        }
        if (order.status === "pending" && order.stock_reserved) {
          const items = db.prepare("SELECT product_id, quantity FROM order_items WHERE order_id=?").all(orderId);
          const restore = db.prepare("UPDATE products SET stock=stock+? WHERE id=?");
          for (const item of items) restore.run(item.quantity, item.product_id);
          db.prepare("UPDATE orders SET status='cancelled', stock_reserved=0 WHERE id=?").run(orderId);
          db.prepare("INSERT INTO order_status_history(order_id,status) VALUES(?,?)").run(orderId, "cancelled");
        }
      });
      tx();
      res.json({ received: true });
    } catch (e) {
      res.status(400).send(`Webhook Error: ${e.message}`);
    }
  },
);

app.use(express.json({ limit: "100kb" }));
app.use(express.static(__dirname));
const sign = (u) =>
  jwt.sign({ id: u.id, email: u.email, role: u.role }, JWT_SECRET, {
    expiresIn: "7d",
  });
const auth = (req, res, next) => {
  try {
    const h = req.headers.authorization || "";
    if (!h.startsWith("Bearer ")) throw 0;
    req.user = jwt.verify(h.slice(7), JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Authentification requise" });
  }
};
const admin = (req, res, next) =>
  auth(req, res, () =>
    req.user.role === "admin"
      ? next()
      : res.status(403).json({ error: "Accès administrateur refusé" }),
  );
const cleanEmail = (e) =>
  String(e || "")
    .trim()
    .toLowerCase();
const validEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const cleanText = (v, max = 200) => String(v ?? "").trim().slice(0, max);
const escapeHtml = (v) => String(v ?? "").replace(/[&<>\"]/g, (c) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "\"":"&quot;" }[c]));
const orderNumber = () =>
  "MAE-" +
  new Date().getFullYear() +
  "-" +
  crypto.randomBytes(3).toString("hex").toUpperCase();
app.get("/api/config", (req, res) => res.json({ stripeEnabled: Boolean(stripe) }));

app.post("/api/newsletter", publicLimit(10), async (req,res) => {
  const email = cleanEmail(req.body?.email);
  if (!validEmail(email)) return res.status(400).json({error:"Adresse e-mail invalide."});
  db.prepare("INSERT INTO newsletter_subscribers(email) VALUES(?) ON CONFLICT(email) DO UPDATE SET active=1").run(email);
  await sendMail(email,"Bienvenue dans l'univers MAELIE",`<p>Merci pour votre inscription à la newsletter MAELIE.</p>`).catch(()=>{});
  res.json({ok:true});
});
app.post("/api/contact", publicLimit(10), async (req,res) => {
  const name=cleanText(req.body?.name,100), email=cleanEmail(req.body?.email), subject=cleanText(req.body?.subject,120), message=cleanText(req.body?.message,4000);
  if (!name || !validEmail(email) || !subject || message.length < 5) return res.status(400).json({error:"Merci de vérifier les informations saisies."});
  db.prepare("INSERT INTO contact_messages(name,email,subject,message) VALUES(?,?,?,?)").run(name,email,subject,message);
  const adminTo=process.env.CONTACT_EMAIL || process.env.ADMIN_EMAIL;
  if (adminTo) await sendMail(adminTo,`Nouveau message MAELIE — ${subject}`,`<p><strong>${escapeHtml(name)}</strong> (${escapeHtml(email)})</p><p>${escapeHtml(message).replace(/\n/g,"<br>")}</p>`).catch(()=>{});
  res.status(201).json({ok:true});
});
app.get("/api/products", (req, res) => {
  let { category, search, maxPrice, sort } = req.query,
    sql = "SELECT * FROM products WHERE active=1",
    p = [];
  if (category) {
    sql += " AND category=?";
    p.push(String(category).slice(0, 40));
  }
  if (search) {
    const q = String(search).slice(0, 80);
    sql += " AND (name LIKE ? OR description LIKE ?)";
    p.push(`%${q}%`, `%${q}%`);
  }
  if (maxPrice && Number.isFinite(Number(maxPrice))) {
    sql += " AND price_cents<=?";
    p.push(Math.round(Number(maxPrice) * 100));
  }
  sql +=
    " ORDER BY " +
    ({
      price_asc: "price_cents ASC",
      price_desc: "price_cents DESC",
      name: "name ASC",
      newest: "created_at DESC",
    }[sort] || "id DESC");
  res.json(db.prepare(sql).all(...p));
});
app.get("/api/products/:slug", (req, res) => {
  const p = db
    .prepare("SELECT * FROM products WHERE slug=? AND active=1")
    .get(req.params.slug);
  p ? res.json(p) : res.status(404).json({ error: "Produit introuvable" });
});
app.post("/api/auth/register", async (req, res) => {
  const { email, password, firstName = "", lastName = "" } = req.body || {},
    e = cleanEmail(email);
  if (!validEmail(e) || typeof password !== "string" || password.length < 8)
    return res
      .status(400)
      .json({
        error: "Email valide et mot de passe de 8 caractères minimum requis.",
      });
  try {
    const r = db
      .prepare(
        "INSERT INTO users(email,password_hash,first_name,last_name) VALUES(?,?,?,?)",
      )
      .run(
        e,
        await bcrypt.hash(password, 12),
        String(firstName).slice(0, 60),
        String(lastName).slice(0, 60),
      );
    const u = db
      .prepare(
        "SELECT id,email,first_name firstName,last_name lastName,role FROM users WHERE id=?",
      )
      .get(r.lastInsertRowid);
    res.status(201).json({ token: sign(u), user: u });
  } catch {
    res.status(409).json({ error: "Cette adresse email est déjà utilisée." });
  }
});
app.post("/api/auth/login", async (req, res) => {
  const e = cleanEmail(req.body?.email);
  const u = db.prepare("SELECT * FROM users WHERE email=?").get(e);
  if (
    !u ||
    !(await bcrypt.compare(String(req.body?.password || ""), u.password_hash))
  )
    return res.status(401).json({ error: "Identifiants incorrects." });
  res.json({
    token: sign(u),
    user: {
      id: u.id,
      email: u.email,
      firstName: u.first_name,
      lastName: u.last_name,
      role: u.role,
    },
  });
});
app.post("/api/auth/forgot-password", publicLimit(8), async (req, res) => {
  const email = cleanEmail(req.body?.email);
  if (!validEmail(email)) return res.status(400).json({ error: "Adresse e-mail invalide." });
  const user = db.prepare("SELECT id,email,first_name FROM users WHERE email=? AND role='customer'").get(email);
  // Réponse générique pour éviter l'énumération des comptes.
  if (user) {
    const raw = crypto.randomBytes(32).toString("hex");
    const hash = crypto.createHash("sha256").update(raw).digest("hex");
    db.prepare("DELETE FROM password_reset_tokens WHERE user_id=?").run(user.id);
    db.prepare("INSERT INTO password_reset_tokens(user_id,token_hash,expires_at) VALUES(?,?,?)").run(user.id, hash, Date.now()+30*60*1000);
    const base = process.env.PUBLIC_URL || `${req.protocol}://${req.get("host")}`;
    await sendMail(user.email, "Réinitialisation de votre mot de passe — MAELIE", `<p>Bonjour ${escapeHtml(cleanText(user.first_name || "",60))},</p><p>Une demande de réinitialisation a été effectuée.</p><p><a href="${base}/compte.html?reset=${raw}">Réinitialiser mon mot de passe</a></p><p>Ce lien expire dans 30 minutes.</p>`).catch(()=>{});
  }
  res.json({ ok: true, message: "Si cette adresse existe, un lien de réinitialisation a été envoyé." });
});
app.post("/api/auth/reset-password", async (req, res) => {
  const token = cleanText(req.body?.token, 100);
  const password = String(req.body?.password || "");
  if (!/^[a-f0-9]{64}$/.test(token) || password.length < 8) return res.status(400).json({ error: "Lien invalide ou mot de passe trop court." });
  const hash = crypto.createHash("sha256").update(token).digest("hex");
  const row = db.prepare("SELECT * FROM password_reset_tokens WHERE token_hash=? AND used_at IS NULL AND expires_at>? ").get(hash, Date.now());
  if (!row) return res.status(400).json({ error: "Ce lien est invalide ou expiré." });
  const tx = db.transaction(() => {
    db.prepare("UPDATE users SET password_hash=? WHERE id=?").run(bcrypt.hashSync(password,12), row.user_id);
    db.prepare("UPDATE password_reset_tokens SET used_at=? WHERE id=?").run(Date.now(), row.id);
  });
  tx(); res.json({ ok: true });
});
app.get("/api/me", auth, (req, res) => {
  const u = db
    .prepare(
      "SELECT id,email,first_name firstName,last_name lastName,role,created_at createdAt FROM users WHERE id=?",
    )
    .get(req.user.id);
  res.json(u);
});
app.get("/api/orders", auth, (req, res) =>
  res.json(
    db
      .prepare(
        "SELECT id,number,status,total_cents totalCents,created_at createdAt FROM orders WHERE user_id=? ORDER BY id DESC",
      )
      .all(req.user.id),
  ),
);
app.post("/api/orders/track", publicLimit(20), (req, res) => {
  const number = cleanText(req.body?.number, 40).toUpperCase();
  const email = cleanEmail(req.body?.email);
  if (!/^MAE-[0-9]{4}-[A-F0-9]{6}$/.test(number) || !validEmail(email))
    return res.status(400).json({ error: "Numéro de commande ou e-mail invalide." });
  const order = db
    .prepare("SELECT number,status,created_at createdAt FROM orders WHERE number=? AND lower(email)=?")
    .get(number, email);
  if (!order) return res.status(404).json({ error: "Commande introuvable." });
  res.json(order);
});
app.post("/api/orders", auth, publicLimit(20), (req, res) => {
  if (isProd) return res.status(410).json({ error: "Le paiement direct de démonstration est désactivé en production. Utilisez Stripe Checkout." });
  const { items, address, coupon } = req.body || {};
  if (!Array.isArray(items) || !items.length || items.length > 50)
    return res.status(400).json({ error: "Panier invalide." });
  if (
    !address ||
    !validEmail(address.email) ||
    !address.address ||
    !address.zip ||
    !address.city
  )
    return res.status(400).json({ error: "Adresse de livraison incomplète." });
  if (cleanText(address.name, 100).length > 100 || cleanText(address.phone, 30).length > 30 || cleanText(address.address, 200).length > 200 || cleanText(address.zip, 20).length > 20 || cleanText(address.city, 100).length > 100)
    return res.status(400).json({ error: "Informations de livraison invalides." });
  const get = db.prepare("SELECT * FROM products WHERE id=? AND active=1");
  let subtotal = 0,
    rows = [];
  for (const i of items) {
    const p = get.get(Number(i.id));
    const q = Number(i.quantity);
    if (!p || !Number.isInteger(q) || q < 1 || q > 99 || p.stock < q)
      return res
        .status(400)
        .json({ error: `Stock insuffisant pour ${p?.name || "un produit"}.` });
    subtotal += p.price_cents * q;
    rows.push([p, q]);
  }
  const discount = coupon === "MAELIE10" ? Math.round(subtotal * 0.1) : 0,
    shipping = subtotal - discount >= 8000 ? 0 : 490,
    total = subtotal - discount + shipping,
    number = orderNumber();
  const tx = db.transaction(() => {
    const o = db
      .prepare(
        "INSERT INTO orders(user_id,number,email,subtotal_cents,shipping_cents,discount_cents,total_cents,address_json,stock_reserved) VALUES(?,?,?,?,?,?,?,?,?)",
      )
      .run(
        req.user.id,
        number,
        cleanEmail(address.email),
        subtotal,
        shipping,
        discount,
        total,
        JSON.stringify(address),
        1,
      );
    const oi = db.prepare(
        "INSERT INTO order_items(order_id,product_id,name,price_cents,quantity) VALUES(?,?,?,?,?)",
      ),
      up = db.prepare(
        "UPDATE products SET stock=stock-? WHERE id=? AND stock>=?",
      );
    for (const [p, q] of rows) {
      const u = up.run(q, p.id, q);
      if (!u.changes) throw new Error("STOCK");
      oi.run(o.lastInsertRowid, p.id, p.name, p.price_cents, q);
    }
    return o.lastInsertRowid;
  });
  try {
    const id = tx();
    db.prepare("UPDATE orders SET status='paid', stock_reserved=0 WHERE id=?").run(id); db.prepare("INSERT INTO order_status_history(order_id,status) VALUES(?,?)").run(id,"paid");
    res
      .status(201)
      .json({
        id,
        number,
        status: "pending",
        subtotalCents: subtotal,
        shippingCents: shipping,
        discountCents: discount,
        totalCents: total,
      });
  } catch (e) {
    res
      .status(409)
      .json({
        error:
          "La commande n’a pas pu être finalisée, veuillez vérifier le stock.",
      });
  }
});
app.post("/api/payment/checkout", auth, publicLimit(20), async (req, res) => {
  if (!stripe) return res.status(501).json({ error: "Stripe non configuré." });
  const { items, address, coupon } = req.body || {};
  if (!Array.isArray(items) || !items.length || items.length > 50)
    return res.status(400).json({ error: "Panier invalide." });
  if (!address || !validEmail(address.email) || !address.address || !address.zip || !address.city)
    return res.status(400).json({ error: "Adresse de livraison incomplète." });
  if (coupon === "MAELIE10" && !stripeCouponId)
    return res.status(503).json({ error: "Le code promotionnel est temporairement indisponible pour le paiement en ligne." });

  const get = db.prepare("SELECT * FROM products WHERE id=? AND active=1");
  const rows = [];
  let subtotal = 0;
  for (const i of items) {
    const product = get.get(Number(i.id));
    const quantity = Number(i.quantity);
    if (!product || !Number.isInteger(quantity) || quantity < 1 || quantity > 99 || product.stock < quantity)
      return res.status(400).json({ error: `Stock insuffisant pour ${product?.name || "un produit"}.` });
    rows.push([product, quantity]);
    subtotal += product.price_cents * quantity;
  }
  const discount = coupon === "MAELIE10" ? Math.round(subtotal * 0.1) : 0;
  const shipping = subtotal - discount >= 8000 ? 0 : 490;
  const total = subtotal - discount + shipping;
  const number = orderNumber();
  const insertOrder = db.prepare(
    "INSERT INTO orders(user_id,number,email,subtotal_cents,shipping_cents,discount_cents,total_cents,address_json,stock_reserved) VALUES(?,?,?,?,?,?,?,?,?)"
  );
  const insertItem = db.prepare(
    "INSERT INTO order_items(order_id,product_id,name,price_cents,quantity) VALUES(?,?,?,?,?)"
  );
  let orderId;
  try {
    orderId = db.transaction(() => {
      const o = insertOrder.run(req.user.id, number, cleanEmail(address.email), subtotal, shipping, discount, total, JSON.stringify(address), 1);
      const reserve = db.prepare("UPDATE products SET stock=stock-? WHERE id=? AND stock>=?");
      for (const [product, quantity] of rows) {
        if (!reserve.run(quantity, product.id, quantity).changes) throw new Error("STOCK");
        insertItem.run(o.lastInsertRowid, product.id, product.name, product.price_cents, quantity);
      }
      return o.lastInsertRowid;
    })();
  } catch {
    return res.status(409).json({ error: "Le stock vient de changer. Veuillez réessayer." });
  }

  try {
    const base = process.env.PUBLIC_URL || `${req.protocol}://${req.get("host")}`;
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: rows.map(([product, quantity]) => ({
        price_data: { currency: "eur", product_data: { name: product.name }, unit_amount: product.price_cents },
        quantity,
      })).concat(shipping ? [{ price_data: { currency: "eur", product_data: { name: "Livraison" }, unit_amount: shipping }, quantity: 1 }] : []),
      discounts: coupon === "MAELIE10" && stripeCouponId ? [{ coupon: stripeCouponId }] : [],
      success_url: `${base}/compte.html?paid=1&order=${encodeURIComponent(number)}`,
      cancel_url: `${base}/panier.html?cancelled=1`,
      customer_email: req.user.email,
      metadata: { orderId: String(orderId), number },
    });
    db.prepare("UPDATE orders SET status='pending' WHERE id=?").run(orderId);
    res.json({ url: session.url, orderId, number });
  } catch (error) {
    const restore = db.transaction(() => {
      const order = db.prepare("SELECT stock_reserved,status FROM orders WHERE id=?").get(orderId);
      if (order?.status === "pending" && order.stock_reserved) {
        for (const item of db.prepare("SELECT product_id,quantity FROM order_items WHERE order_id=?").all(orderId)) db.prepare("UPDATE products SET stock=stock+? WHERE id=?").run(item.quantity,item.product_id);
      }
      db.prepare("UPDATE orders SET status='cancelled',stock_reserved=0 WHERE id=?").run(orderId);
    });
    try { restore(); } catch {}
    res.status(502).json({ error: "Impossible de préparer le paiement Stripe." });
  }
});

app.get("/api/admin/products", admin, (req, res) =>
  res.json(db.prepare("SELECT * FROM products ORDER BY id DESC").all()),
);
app.post("/api/admin/products", admin, (req, res) => {
  const p = req.body || {};
  const name = cleanText(p.name, 120);
  const slug = cleanText(p.slug, 120).toLowerCase();
  const price = Number(p.price);
  const stock = Number(p.stock);
  if (!name || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || !Number.isFinite(price) || price < 0 || !Number.isFinite(stock) || stock < 0)
    return res.status(400).json({ error: "Produit incomplet ou invalide." });
  try {
    const r = db
      .prepare(
        "INSERT INTO products(slug,name,category,description,price_cents,old_price_cents,image,badge,stock,active) VALUES(?,?,?,?,?,?,?,?,?,?)",
      )
      .run(
        slug,
        name,
        p.category || "Autres",
        p.description || "",
        Math.round(Number(p.price) * 100),
        p.oldPrice ? Math.round(Number(p.oldPrice) * 100) : null,
        p.image || "img/produits/robe-eclat.svg",
        p.badge || "",
        Math.floor(stock),
        p.active === false ? 0 : 1,
      );
    res.status(201).json({ id: r.lastInsertRowid });
  } catch {
    res.status(409).json({ error: "Slug déjà utilisé." });
  }
});
app.patch("/api/admin/products/:id", admin, (req, res) => {
  const p = req.body || {};
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: "Produit invalide." });
  const name = p.name == null ? null : cleanText(p.name, 120);
  const category = p.category == null ? null : cleanText(p.category, 60);
  const description = p.description == null ? null : cleanText(p.description, 500);
  const badge = p.badge == null ? null : cleanText(p.badge, 40);
  const price = p.price == null ? null : Number(p.price);
  const oldPrice = p.oldPrice == null ? null : Number(p.oldPrice);
  const stock = p.stock == null ? null : Number(p.stock);
  if (name !== null && !name) return res.status(400).json({ error: "Nom invalide." });
  if (price !== null && (!Number.isFinite(price) || price < 0)) return res.status(400).json({ error: "Prix invalide." });
  if (oldPrice !== null && (!Number.isFinite(oldPrice) || oldPrice < 0)) return res.status(400).json({ error: "Ancien prix invalide." });
  if (stock !== null && (!Number.isFinite(stock) || stock < 0 || !Number.isInteger(stock))) return res.status(400).json({ error: "Stock invalide." });
  const r = db.prepare(
    "UPDATE products SET name=COALESCE(?,name),category=COALESCE(?,category),description=COALESCE(?,description),price_cents=COALESCE(?,price_cents),old_price_cents=COALESCE(?,old_price_cents),badge=COALESCE(?,badge),stock=COALESCE(?,stock),active=COALESCE(?,active) WHERE id=?",
  ).run(
    name, category, description,
    price === null ? null : Math.round(price * 100),
    oldPrice === null ? null : Math.round(oldPrice * 100),
    badge, stock,
    p.active == null ? null : p.active ? 1 : 0, id,
  );
  if (!r.changes) return res.status(404).json({ error: "Produit introuvable." });
  res.json({ ok: true });
});
app.get("/api/admin/orders", admin, (req, res) =>
  res.json(db.prepare("SELECT * FROM orders ORDER BY id DESC").all()),
);
const allowedTransitions = {
  pending: new Set(["paid", "cancelled"]),
  paid: new Set(["processing", "cancelled", "refunded"]),
  processing: new Set(["shipped", "cancelled", "refunded"]),
  shipped: new Set(["delivered", "refunded"]),
  delivered: new Set(["refunded"]),
  cancelled: new Set([]),
  refunded: new Set([]),
};

app.patch("/api/admin/orders/:id", admin, async (req, res) => {
  const s = req.body?.status;
  if (!statuses.includes(s)) return res.status(400).json({ error: "Statut invalide." });
  const id = Number(req.params.id);
  const order = db.prepare("SELECT * FROM orders WHERE id=?").get(id);
  if (!order) return res.status(404).json({ error: "Commande introuvable." });
  if (order.status === s) return res.json({ ok: true, unchanged: true });
  if (!allowedTransitions[order.status]?.has(s)) return res.status(409).json({ error: `Transition ${order.status} → ${s} interdite.` });
  const tx = db.transaction(() => {
    if (["cancelled", "refunded"].includes(s) && order.stock_reserved) {
      for (const item of db.prepare("SELECT product_id,quantity FROM order_items WHERE order_id=?").all(id)) db.prepare("UPDATE products SET stock=stock+? WHERE id=?").run(item.quantity, item.product_id);
      db.prepare("UPDATE orders SET status=?,stock_reserved=0 WHERE id=?").run(s, id);
    } else {
      db.prepare("UPDATE orders SET status=? WHERE id=?").run(s, id);
    }
    db.prepare("INSERT INTO order_status_history(order_id,status) VALUES(?,?)").run(id, s);
  });
  try { tx(); } catch { return res.status(409).json({ error: "Impossible de mettre à jour cette commande." }); }
  const labels={paid:"payée",processing:"en préparation",shipped:"expédiée",delivered:"livrée",cancelled:"annulée",refunded:"remboursée",pending:"en attente"};
  await sendMail(order.email,`MAELIE — Mise à jour de la commande ${order.number}`,`<p>Le statut de votre commande <strong>${order.number}</strong> est maintenant : <strong>${labels[s]||s}</strong>.</p>`).catch(()=>{});
  res.json({ ok: true });
});

app.get("/api/admin/messages", admin, (req,res) => res.json(db.prepare("SELECT * FROM contact_messages ORDER BY id DESC LIMIT 200").all()));
app.patch("/api/admin/messages/:id", admin, (req,res) => {
  const status = ["new","read","archived"].includes(req.body?.status) ? req.body.status : null;
  if (!status) return res.status(400).json({error:"Statut de message invalide."});
  const r=db.prepare("UPDATE contact_messages SET status=? WHERE id=?").run(status, Number(req.params.id));
  if (!r.changes) return res.status(404).json({error:"Message introuvable."});
  res.json({ok:true});
});

app.post("/api/newsletter/unsubscribe", publicLimit(10), (req,res) => {
  const email=cleanEmail(req.body?.email);
  if (!validEmail(email)) return res.status(400).json({error:"Adresse e-mail invalide."});
  db.prepare("UPDATE newsletter_subscribers SET active=0 WHERE email=?").run(email);
  res.json({ok:true});
});

app.get("/api/health", (req, res) => {
  try {
    db.prepare("SELECT 1").get();
    const payload = { ok: true, app: "MAELIE", version: "6.1.0" };
    if (!isProd) Object.assign(payload, { environment: "development", stripe: Boolean(stripe), smtp: Boolean(mailer) });
    res.json(payload);
  } catch { res.status(503).json({ ok:false, app:"MAELIE", error:"Base de données indisponible." }); }
});
app.get("/admin", (req, res) =>
  res.sendFile(path.join(__dirname, "admin.html")),
);
app.use((req, res) => {
  if (req.path.startsWith("/api/")) return res.status(404).json({ error: "Ressource introuvable." });
  res.status(404).sendFile(path.join(__dirname, "404.html"));
});
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Erreur serveur." });
});
app.listen(PORT, () => console.log(`MAELIE → http://localhost:${PORT}`));
