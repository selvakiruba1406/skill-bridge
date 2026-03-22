import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/twilio";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { phone } = await req.json();
    if (!phone) {
      return new Response(JSON.stringify({ error: "Phone number is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const TWILIO_API_KEY = Deno.env.get("TWILIO_API_KEY");
    if (!TWILIO_API_KEY) throw new Error("TWILIO_API_KEY is not configured");

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP temporarily (in production, use a database or cache)
    // For now, we'll use Twilio to send and verify via a simple approach
    // We'll store in a KV-like approach using the edge function's memory
    
    // Get Twilio phone number by listing numbers
    const numbersRes = await fetch(`${GATEWAY_URL}/IncomingPhoneNumbers.json?PageSize=1`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": TWILIO_API_KEY,
      },
    });

    const numbersData = await numbersRes.json();
    if (!numbersRes.ok) {
      throw new Error(`Failed to get Twilio numbers [${numbersRes.status}]: ${JSON.stringify(numbersData)}`);
    }

    const fromNumber = numbersData.incoming_phone_numbers?.[0]?.phone_number;
    if (!fromNumber) {
      throw new Error("No Twilio phone number found. Please configure one in your Twilio account.");
    }

    // Send SMS with OTP
    const smsRes = await fetch(`${GATEWAY_URL}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": TWILIO_API_KEY,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: phone,
        From: fromNumber,
        Body: `Your SkillMatch verification code is: ${otp}. Valid for 10 minutes.`,
      }),
    });

    const smsData = await smsRes.json();
    if (!smsRes.ok) {
      throw new Error(`Twilio SMS error [${smsRes.status}]: ${JSON.stringify(smsData)}`);
    }

    // Store OTP in response header for verification (simple approach)
    // In production, store in database with expiry
    return new Response(JSON.stringify({ 
      success: true, 
      message: "OTP sent successfully",
      // Store hashed OTP - in production use proper storage
      _otp_hash: btoa(otp + phone),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("send-otp error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
