import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
const TELEGRAM_CHAT_ID = Deno.env.get("TELEGRAM_CHAT_ID");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "content-type, authorization",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  try {
    const body = await req.json();
    const order = body?.order ?? {};
    const items = Array.isArray(body?.items) ? body.items : [];

    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      return new Response(
        JSON.stringify({ error: "Telegram configuration is missing" }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        },
      );
    }

    const paymentLabel =
      order.payment_method === "cod"
        ? "الدفع عند الاستلام"
        : (order.payment_method ?? "-");
    const deliveryLabel =
      order.delivery_type === "home"
        ? "توصيل للبيت"
        : order.delivery_type === "desk"
          ? "استلام من المكتب"
          : (order.delivery_type ?? "-");
    const totalLabel = `${Number(order.total_dzd ?? 0).toLocaleString("ar-DZ")} د.ج`;

    const messageLines = [
      "🛍️ طلب جديد",
      "",
      `📦 رقم الطلب: #${order.id ?? "-"}`,
      `👤 العميل: ${order.full_name ?? "-"}`,
      `📱 الهاتف: ${order.phone ?? "-"}`,
      `🏙️ الولاية: ${order.wilaya ?? "-"}`,
      `🏘️ البلدية: ${order.commune ?? "-"}`,
      `📍 العنوان: ${order.address ?? "-"}`,
      `💳 طريقة الدفع: ${paymentLabel}`,
      `🚚 نوع التوصيل: ${deliveryLabel}`,
      `💰 الإجمالي: ${totalLabel}`,
    ];

    if (items.length > 0) {
      messageLines.push("", "🧾 تفاصيل المنتجات:");
      items.forEach((item: any, index: number) => {
        const label = item?.name ?? `المنتج ${index + 1}`;
        const quantity = item?.quantity ?? 1;
        const price = Number(item?.price_dzd ?? 0).toLocaleString("ar-DZ");
        messageLines.push(`• ${label} × ${quantity} — ${price} د.ج`);
      });
    }

    const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const response = await fetch(telegramUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: messageLines.join("\n"),
        disable_web_page_preview: true,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      throw new Error(data?.description || "Failed to send Telegram message");
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Telegram notification failed", error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  }
});
