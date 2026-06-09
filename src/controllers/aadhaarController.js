const { sandboxRequest, isTestEnvironment } = require("../services/sandboxClient");
const { setAadhaarVerifiedByUserId } = require("../repositories/userOtpRepository");

const AADHAAR_PATTERN = /^\d{12}$/;
const OTP_PATTERN = /^\d{6}$/;

const TEST_AADHAAR_NUMBER = "123456789015";
const TEST_REFERENCE_ID = "1234567";
const TEST_OTP = "121212";
const TEST_REASON = "For KYC";

const normalizeAadhaar = (value) => String(value || "").replace(/\s/g, "");

const sendError = (res, status, message, extra = {}) =>
  res.status(status).json({
    success: false,
    message,
    ...extra,
  });

const generateOtp = async (req, res) => {
  const aadhaarNumber = normalizeAadhaar(req.body?.aadhaar_number);
  const consent = String(req.body?.consent || "y").trim().toLowerCase();

  if (!AADHAAR_PATTERN.test(aadhaarNumber)) {
    return sendError(res, 400, "Valid 12-digit Aadhaar number is required.");
  }

  if (consent !== "y") {
    return sendError(res, 400, "User consent is required to verify Aadhaar.");
  }

  const sandboxBody = isTestEnvironment()
    ? {
        "@entity": "in.co.sandbox.kyc.aadhaar.okyc.otp.request",
        aadhaar_number: TEST_AADHAAR_NUMBER,
        consent: "y",
        reason: TEST_REASON,
      }
    : {
        "@entity": "in.co.sandbox.kyc.aadhaar.okyc.otp.request",
        aadhaar_number: aadhaarNumber,
        consent: "y",
        reason: String(req.body?.reason || TEST_REASON).trim(),
      };

  try {
    console.log(
      `[AADHAAR] generate testMode=${isTestEnvironment()} aadhaar=${sandboxBody.aadhaar_number}`
    );

    const { ok, status, payload } = await sandboxRequest(
      "/kyc/aadhaar/okyc/otp",
      sandboxBody
    );

    if (!ok) {
      return sendError(
        res,
        status >= 400 && status < 600 ? status : 502,
        payload?.message || payload?.data?.message || "Failed to generate Aadhaar OTP.",
        {
          code: payload?.code,
          transactionId: payload?.transaction_id,
        }
      );
    }

    console.log(
      `[AADHAAR] OTP generated reference_id=${payload?.data?.reference_id}`
    );

    return res.status(200).json({
      success: true,
      message: payload?.data?.message || "OTP sent to Aadhaar-linked mobile number.",
      referenceId: isTestEnvironment()
        ? TEST_REFERENCE_ID
        : payload?.data?.reference_id,
      transactionId: payload?.transaction_id,
      ...(isTestEnvironment() && {
        testMode: true,
        testOtp: TEST_OTP,
        testAadhaarNumber: TEST_AADHAAR_NUMBER,
      }),
    });
  } catch (error) {
    console.error("[AADHAAR] Generate OTP failed:", error.message);
    return sendError(
      res,
      error.statusCode || 502,
      error.message || "Failed to generate Aadhaar OTP."
    );
  }
};

const verifyOtp = async (req, res) => {
  const referenceId = String(req.body?.reference_id || "").trim();
  const otp = String(req.body?.otp || "").trim();
  const userId = Number(req.body?.user_id);

  if (!referenceId) {
    return sendError(res, 400, "reference_id is required.");
  }

  if (!Number.isInteger(userId) || userId <= 0) {
    return sendError(res, 400, "Valid user_id is required.");
  }

  if (!OTP_PATTERN.test(otp)) {
    return sendError(res, 400, "Valid 6-digit OTP is required.");
  }

  if (isTestEnvironment() && otp !== TEST_OTP) {
    return sendError(
      res,
      400,
      `Sandbox test environment only accepts OTP ${TEST_OTP}.`,
      { testMode: true, testOtp: TEST_OTP, testReferenceId: TEST_REFERENCE_ID }
    );
  }

  const sandboxBody = isTestEnvironment()
    ? {
        "@entity": "in.co.sandbox.kyc.aadhaar.okyc.request",
        reference_id: TEST_REFERENCE_ID,
        otp: TEST_OTP,
      }
    : {
        "@entity": "in.co.sandbox.kyc.aadhaar.okyc.request",
        reference_id: referenceId,
        otp,
      };

  try {
    const { ok, status, payload } = await sandboxRequest(
      "/kyc/aadhaar/okyc/otp/verify",
      sandboxBody
    );

    if (!ok) {
      return sendError(
        res,
        status >= 400 && status < 600 ? status : 502,
        payload?.message || payload?.data?.message || "Aadhaar OTP verification failed.",
        {
          code: payload?.code,
          transactionId: payload?.transaction_id,
        }
      );
    }

    console.log(`[AADHAAR] OTP verified reference_id=${referenceId}`);

    try {
      const { rowCount } = await setAadhaarVerifiedByUserId(userId);
      if (rowCount === 0) {
        console.warn(
          `[AADHAAR] Verified with Sandbox but failed to update user_otp for user_id=${userId}`
        );
      }
    } catch (dbError) {
      console.error("[AADHAAR] Failed to set aadhaar_verified:", dbError.message);
    }

    return res.status(200).json({
      success: true,
      message: "Aadhaar verified successfully.",
      aadhaarVerified: true,
      data: payload?.data || {},
      transactionId: payload?.transaction_id,
    });
  } catch (error) {
    console.error("[AADHAAR] Verify OTP failed:", error.message);
    return sendError(
      res,
      error.statusCode || 502,
      error.message || "Failed to verify Aadhaar OTP."
    );
  }
};

module.exports = {
  generateOtp,
  verifyOtp,
};
