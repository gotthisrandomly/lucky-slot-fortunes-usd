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

interface VerifyRequest {
  sessionId: string;
  userId: string;
}

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

    // Get request body
    const verifyRequest: VerifyRequest = await req.json();
    const { sessionId, userId } = verifyRequest;

    if (!sessionId || !userId) {
      return new Response(
        JSON.stringify({ error: "Missing sessionId or userId" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get the payment record
    const { data: paymentRecord, error: fetchError } = await supabase
      .from("payment_records")
      .select("*")
      .eq("stripe_session_id", sessionId)
      .eq("user_id", userId)
      .single();

    if (fetchError || !paymentRecord) {
      return new Response(
        JSON.stringify({ error: "Payment record not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // In a real implementation, we would verify with PayNow API
    // For now, we'll simulate a successful payment
    
    // Only process if payment is still pending
    if (paymentRecord.status !== "pending") {
      return new Response(
        JSON.stringify({ 
          success: true, 
          status: paymentRecord.status,
          message: "Payment already processed" 
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Update payment record
    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("payment_records")
      .update({
        status: "completed",
        completed_at: now,
      })
      .eq("id", paymentRecord.id);

    if (updateError) {
      throw updateError;
    }

    // Create transaction record
    const { error: transactionError } = await supabase
      .from("transactions")
      .insert({
        user_id: userId,
        amount: paymentRecord.amount,
        type: "deposit",
        description: `Deposit via PayNow - ${paymentRecord.amount} ${paymentRecord.currency}`,
      });

    if (transactionError) {
      throw transactionError;
    }

    // Update user balance
    const { data: userBalance, error: balanceError } = await supabase
      .from("user_balances")
      .select("credits, total_deposited")
      .eq("user_id", userId)
      .single();

    if (balanceError) {
      throw balanceError;
    }

    const newCredits = (userBalance.credits || 0) + paymentRecord.amount;
    const newTotalDeposited = (userBalance.total_deposited || 0) + paymentRecord.amount;

    const { error: updateBalanceError } = await supabase
      .from("user_balances")
      .update({
        credits: newCredits,
        total_deposited: newTotalDeposited,
      })
      .eq("user_id", userId);

    if (updateBalanceError) {
      throw updateBalanceError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        status: "completed",
        message: "Payment processed successfully",
        balance: newCredits,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Payment verification error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Payment verification failed" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});