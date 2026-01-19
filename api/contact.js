import { Resend } from "resend";

const ALLOWED_ORIGINS = [
  "http://localhost:4200",
  "http://127.0.0.1:4200",
  "https://www.innubesoluciones.com",
  "https://innubesoluciones.com",
];

export default async function handler(req, res) {
  const origin = req.headers.origin;

  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, message: "Method not allowed" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const { nombre, correo, asunto, mensaje, servicio } = body;

    if (!nombre || !correo || !mensaje) {
      return res.status(400).json({ ok: false, message: "Faltan campos obligatorios" });
    }

    if (!process.env.RESEND_API_KEY) {
      return res.status(500).json({ ok: false, message: "Falta RESEND_API_KEY en Vercel" });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    const subject = asunto ? `Contacto web: ${asunto}` : "Nuevo contacto web";

    const html = `
      <h2>📩 Nuevo mensaje desde Innube</h2>
      <p><strong>Servicio:</strong> ${servicio || "No especificado"}</p>
      <p><strong>Nombre:</strong> ${nombre}</p>
      <p><strong>Correo:</strong> ${correo}</p>
      <p><strong>Asunto:</strong> ${asunto || "N/A"}</p>
      <hr />
      <p><strong>Mensaje:</strong></p>
      <p style="white-space: pre-line;">${mensaje}</p>
    `;

    const result = await resend.emails.send({
      from: "Innube Contacto <onboarding@resend.dev>",
      to: ["fgomezes979@gmail.com"],
      replyTo: correo,
      subject,
      html,
    });

    return res.status(200).json({ ok: true, result });
  } catch (error) {
    console.error("API error:", error);
    return res.status(500).json({ ok: false, message: "Error enviando correo" });
  }
}
