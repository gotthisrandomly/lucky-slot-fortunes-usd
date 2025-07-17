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

interface PaymentRequest {
  userId: string;
  amount: number;
  currency?: string;
  returnUrl?: string;
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
    const paymentRequest: PaymentRequest = await req.json();
    const { userId, amount, currency = "USD", returnUrl = "" } = paymentRequest;

    if (!userId || !amount || amount <= 0) {
      return new Response(
        JSON.stringify({ error: "Invalid payment request parameters" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create a PayNow.gg payment session
    // Since we don't have actual API integration yet, we'll simulate the response
    const paymentSession = {
      id: `pay_${Date.now()}`,
      checkout_url: `https://paynow.gg/checkout?session=${Date.now()}`, // This would be the actual URL from PayNow API
      amount,
      currency,
      expires_at: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
    };

    // Create a payment record in the database
    const { data: paymentRecord, error: paymentError } = await supabase
      .from("payment_records")
      .insert({
        user_id: userId,
        amount,
        currency,
        status: "pending",
        payment_method: "paynow",
        stripe_session_id: paymentSession.id, // We're reusing this field for PayNow session ID
      })
      .select()
      .single();

    if (paymentError) {
      throw paymentError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        payment_id: paymentRecord.id,
        checkout_url: paymentSession.checkout_url,
        session_id: paymentSession.id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Payment processing error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Payment processing failed" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});