import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Create a Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Only allow POST requests
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get webhook payload
    const payload = await req.json();
    
    // Log webhook payload for debugging
    console.log("Received webhook payload:", JSON.stringify(payload));
    
    // In a real implementation, verify the webhook signature
    // const signature = req.headers.get("x-paynow-signature");
    // if (!verifySignature(payload, signature)) {
    //   return new Response(JSON.stringify({ error: "Invalid signature" }), {
    //     status: 401,
    //     headers: { ...corsHeaders, "Content-Type": "application/json" },
    //   });
    // }

    // Process different event types
    const eventType = payload.type || "";
    const sessionId = payload.data?.id || "";
    
    if (!sessionId) {
      return new Response(JSON.stringify({ error: "Missing session ID" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    // Find the corresponding payment record
    const { data: paymentRecord, error: fetchError } = await supabase
      .from("payment_records")
      .select("*")
      .eq("stripe_session_id", sessionId) // Reusing this field for PayNow sessions
      .single();
      
    if (fetchError || !paymentRecord) {
      return new Response(JSON.stringify({ error: "Payment record not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    const userId = paymentRecord.user_id;
    const amount = paymentRecord.amount;
    
    // Handle different webhook events
    switch (eventType) {
      case "payment.succeeded":
        // Update payment record
        await supabase
          .from("payment_records")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
          })
          .eq("id", paymentRecord.id);
          
        // Create transaction record
        await supabase
          .from("transactions")
          .insert({
            user_id: userId,
            amount: amount,
            type: "deposit",
            description: `Deposit via PayNow - ${amount} ${paymentRecord.currency}`,
          });
          
        // Update user balance
        const { data: userBalance } = await supabase
          .from("user_balances")
          .select("credits, total_deposited")
          .eq("user_id", userId)
          .single();
          
        if (userBalance) {
          await supabase
            .from("user_balances")
            .update({
              credits: (userBalance.credits || 0) + amount,
              total_deposited: (userBalance.total_deposited || 0) + amount,
            })
            .eq("user_id", userId);
        }
        break;
        
      case "payment.failed":
        await supabase
          .from("payment_records")
          .update({
            status: "failed",
          })
          .eq("id", paymentRecord.id);
        break;
        
      case "payment.refunded":
        await supabase
          .from("payment_records")
          .update({
            status: "refunded",
          })
          .eq("id", paymentRecord.id);
        break;
        
      default:
        // Just log unhandled event types
        console.log(`Unhandled event type: ${eventType}`);
    }
    
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
    
  } catch (error) {
    console.error("Webhook processing error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Webhook processing failed" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});