import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const smsData = {
      MessageSid: formData.get("MessageSid"),
      From: formData.get("From"),
      To: formData.get("To"),
      Body: formData.get("Body")
    };
    console.log("📨 SMS webhook:", smsData);
    return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?><Response><Message>Thank you for contacting Asteria.</Message></Response>`, {
      status: 200,
      headers: { "Content-Type": "text/xml" }
    });
  } catch (error) {
    console.error("SMS webhook error:", error);
    return new NextResponse("OK", { status: 200 });
  }
}