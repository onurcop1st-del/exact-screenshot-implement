import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateResponse, GatewayError } from "@lovable.dev/ai-gateway";

const input = z.object({
  need: z.string().trim().min(3).max(400),
  catalog: z
    .array(z.object({ code: z.string().max(12), title: z.string().max(120), category: z.string().max(30), price: z.number(), description: z.string().max(400).nullable() }))
    .max(200),
});

export type Recommendation = { code: string; reason: string };

export const recommendProducts = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => input.parse(d))
  .handler(async ({ data }): Promise<{ picks: Recommendation[]; error: string | null }> => {
    const list = data.catalog.map((p) => `${p.code} | ${p.title} | ${p.category} | ₦${p.price} | ${p.description ?? ""}`).join("\n");
    try {
      const res = await generateResponse({
        model: "openai/gpt-6-astra",
        instructions:
          "You are ONUR's streetwear shop assistant. Pick up to 4 products from the catalog that best match the shopper's need. Only use codes from the catalog. Reply in JSON only.",
        input: `Catalog (code | title | category | price | description):\n${list}\n\nShopper need: ${data.need}\n\nReturn JSON: {"picks":[{"code":"...","reason":"short friendly reason"}]}`,
        text: { format: { type: "json_schema", name: "picks", strict: true, schema: { type: "object", additionalProperties: false, required: ["picks"], properties: { picks: { type: "array", items: { type: "object", additionalProperties: false, required: ["code", "reason"], properties: { code: { type: "string" }, reason: { type: "string" } } } } } } } },
      });
      const text = extractText(res);
      const parsed = z.object({ picks: z.array(z.object({ code: z.string(), reason: z.string() })) }).safeParse(JSON.parse(text || "{}"));
      const codes = new Set(data.catalog.map((p) => p.code));
      const picks = parsed.success ? parsed.data.picks.filter((p) => codes.has(p.code)).slice(0, 4) : [];
      return { picks, error: null };
    } catch (e) {
      console.error("recommend failed", e instanceof GatewayError ? { code: e.code, ids: e.ids } : e);
      return { picks: [], error: "Our style helper is busy right now. Please try again in a moment." };
    }
  });

function extractText(res: unknown): string {
  const out = (res as { output?: unknown })?.output;
  if (!Array.isArray(out)) return "";
  for (const item of out) {
    const content = (item as { content?: unknown })?.content;
    if (!Array.isArray(content)) continue;
    for (const c of content) {
      const t = c as { type?: string; text?: string };
      if (t.type === "output_text" && typeof t.text === "string") return t.text;
    }
  }
  return "";
}
