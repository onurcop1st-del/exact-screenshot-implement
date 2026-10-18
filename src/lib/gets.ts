import { supabase } from "@/integrations/supabase/client";

/** Remember a product a signed-in shopper tapped GET on ("about to get"). */
export async function recordGet(userId: string, productId: string) {
  await supabase
    .from("user_gets")
    .upsert({ user_id: userId, product_id: productId, status: "getting", updated_at: new Date().toISOString() }, { onConflict: "user_id,product_id" });
}

/** After an order code is made, the products move to "got". */
export async function markGot(userId: string, productIds: string[]) {
  if (!productIds.length) return;
  const now = new Date().toISOString();
  await supabase
    .from("user_gets")
    .upsert(productIds.map((product_id) => ({ user_id: userId, product_id, status: "got", updated_at: now })), { onConflict: "user_id,product_id" });
}
