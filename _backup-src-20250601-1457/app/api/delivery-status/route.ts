import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const deliveryData = {
      MessageSid: formData.get("MessageSid"),
      MessageStatus: formData.get("MessageStatus"),
      ErrorCode: formData.get("ErrorCode"),
      To: formData.get("To")
    };
    console.log("📊 Delivery status:", deliveryData);
    return new NextResponse("OK", { status: 200 });
  } catch (error) {
    console.error("Delivery webhook error:", error);
    return new NextResponse("OK", { status: 200 });
  }
}