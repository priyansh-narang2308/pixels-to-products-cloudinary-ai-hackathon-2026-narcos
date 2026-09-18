import { POST } from "../app/api/sign-cloudinary-params/route";
import { cloudinary } from "../lib/cloudinary";

async function verifySigning() {
  console.log("🔐 Testing Cloudinary HMAC-SHA256 Signed Upload Endpoint...");

  const paramsToSign = {
    folder: "lumina/uploads",
    timestamp: 1740000000,
    source: "uw",
  };

  const request = new Request("http://localhost:3000/api/sign-cloudinary-params", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ paramsToSign }),
  });

  const response = await POST(request);
  const data = await response.json();

  console.log("Status Code:", response.status);
  console.log("Generated Signature:", data.signature);

  // Validate against reference Cloudinary computation
  const expectedSignature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET!
  );

  if (data.signature === expectedSignature) {
    console.log("✅ Signature Matches Official Cloudinary HMAC-SHA256 Algorithm!");
    console.log("🎉 Signed Upload Security Layer (Task 07) Verified Successfully!");
  } else {
    console.error("❌ Signature mismatch:", data.signature, "vs expected:", expectedSignature);
    process.exit(1);
  }
}

verifySigning().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
