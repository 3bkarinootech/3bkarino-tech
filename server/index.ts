import express, { Request, Response } from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type Invoice = {
  id: number;
  name: string;
  phone: string;
  email: string;
  package: string;
  price: number;
  status: string;
  createdAt: Date;
};

async function startServer() {
  const app = express();
  const server = createServer(app);

  // ✅ مهم
  app.use(express.json());

  // 🔥 DB مؤقتة
  let invoices: Invoice[] = [];

  // =========================
  // ✅ إنشاء طلب
  // =========================
  app.post("/api/create-order", (req: Request, res: Response) => {
    const { name, phone, email, packageName } = req.body;

    const invoice: Invoice = {
      id: Date.now(),
      name,
      phone,
      email,
      package: packageName,
      price: 500,
      status: "pending",
      createdAt: new Date()
    };

    invoices.push(invoice);

    console.log("New Invoice:", invoice);

    res.json({
      success: true,
      invoice
    });
  });

  // =========================
  // ✅ جلب الفواتير
  // =========================
  app.get("/api/invoices", (_req: Request, res: Response) => {
    res.json(invoices);
  });

  // =========================
  // 🟡 تشغيل الموقع
  // =========================
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));

  // ⚠️ لازم في الآخر
  app.get("*", (_req: Request, res: Response) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  const port = process.env.PORT || 3000;

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
