const twilio = require("twilio");
const env = require("../config/env");
const { updateOtpVerifiedByPhone } = require("../repositories/userRepository");

const getClient = () => {
  if (!env.twilioAccountSid || !env.twilioAuthToken) {
    return null;
  }
  return twilio(env.twilioAccountSid, env.twilioAuthToken);
};

/**
 * Normalizes to E.164. Ten-digit numbers are treated as India (+91).
 */
const toE164 = (phone) => {
  const raw = String(phone || "")
    .trim()
    .replace(/\s/g, "");
  if (!raw) return "";
  if (raw.startsWith("+")) return raw;
  if (/^\d{10}$/.test(raw)) return `+91${raw}`;
  if (/^91\d{10}$/.test(raw)) return `+${raw}`;
  return `+${raw.replace(/^\+/, "")}`;
};

const requireTwilioConfig = (res) => {
  if (!env.twilioAccountSid || !env.twilioAuthToken || !env.twilioVerifyServiceSid) {
    res.status(500).json({
      success: false,
      message:
        "Twilio is not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_VERIFY_SERVICE_SID.",
    });
    return false;
  }
  return true;
};

const sendOtp = async (req, res) => {
  if (!requireTwilioConfig(res)) return;

  const phone = req.body?.phone;
  const to = toE164(phone);

  if (!to || to.length < 10) {
    return res.status(400).json({
      success: false,
      message: "Valid phone number is required.",
    });
  }

  const client = getClient();
  try {
    const verification = await client.verify.v2
      .services(env.twilioVerifyServiceSid)
      .verifications.create({ to, channel: "sms" });

    console.log(`[OTP] Verification sent sid=${verification.sid} to=${to}`);

    return res.status(200).json({
      success: true,
      message: "Verification code sent.",
      sid: verification.sid,
    });
  } catch (error) {
    console.error("[OTP] Send failed:", error.message);
    return res.status(502).json({
      success: false,
      message: error.message || "Failed to send verification code.",
    });
  }
};

const verifyOtp = async (req, res) => {
  if (!requireTwilioConfig(res)) return;

  const phone = req.body?.phone;
  const code = String(req.body?.code ?? "").trim();
  const to = toE164(phone);

  if (!to || to.length < 10) {
    return res.status(400).json({
      success: false,
      message: "Valid phone number is required.",
    });
  }

  if (!code) {
    return res.status(400).json({
      success: false,
      message: "Verification code is required.",
    });
  }

  const client = getClient();
  try {
    const check = await client.verify.v2
      .services(env.twilioVerifyServiceSid)
      .verificationChecks.create({ to, code });

    if (check.status === "approved") {
      try {
        const { rowCount } = await updateOtpVerifiedByPhone(phone);
        if (rowCount === 0) {
          console.warn(
            "[OTP] Twilio approved but no users row matched phone for otp_verified update"
          );
        }
      } catch (dbError) {
        console.error("[OTP] Failed to set otp_verified:", dbError.message);
      }

      return res.status(200).json({
        success: true,
        message: "Phone number verified.",
        status: check.status,
      });
    }

    return res.status(400).json({
      success: false,
      message: "Invalid or expired code.",
      status: check.status,
    });
  } catch (error) {
    console.error("[OTP] Verify failed:", error.message);
    return res.status(400).json({
      success: false,
      message: error.message || "Verification failed.",
    });
  }
};

module.exports = {
  sendOtp,
  verifyOtp,
};
