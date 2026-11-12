import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateResponse, GatewayError } from "@lovable.dev/ai-gateway";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const input = z.object({
  title: z.string().trim().min(2).max(120),
  category: z.string().max(30),
  notes: z.string().max(400).optional(),
  image: z.string().max(3_000_000).optional(),
});

export const writeDescription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => input.parse(d))
  .handler(async ({ data, context }): Promise<{ text: string; error: string | null }> => {
    const { data: ok } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!ok) return { text: "", error: "Only the admin can use this." };
    try {
      const res = await generateResponse({
        model: "openai/gpt-6-astra",
        instructions:
          "You write product descriptions for ONUR, a Nigerian streetwear brand. Write 2 short paragraphs (about 70-110 words total): the vibe and look, then fit, feel and how to style it. Then a line 'Key features:' followed by 3-4 bullet lines starting with '• '. Plain text only, no markdown, no prices. If a photo is given, describe exactly what is visible in it: colours, prints, logos, shape, texture and style.",
        input: [{ role: "user", content: [
          { type: "input_text", text: `Product: ${data.title}\nCategory: ${data.category}\n${data.notes ? `Owner notes: ${data.notes}` : ""}` },
          ...(data.image ? [{ type: "input_image" as const, image_url: data.image, detail: "auto" as const }] : []),
        ] }],
      });
      const text = extractText(res).trim();
      return text ? { text, error: null } : { text: "", error: "No description came back. Try again." };
    } catch (e) {
      console.error("describe failed", e instanceof GatewayError ? { code: e.code, ids: e.ids } : e);
      return { text: "", error: "The AI writer is busy. Try again in a moment." };
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
