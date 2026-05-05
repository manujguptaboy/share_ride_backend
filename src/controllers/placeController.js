const env = require("../config/env");

const autocomplete = async (req, res) => {
  const input = (req.query.input || "").trim();

  if (!input) {
    return res.status(400).json({
      success: false,
      message: "Query param 'input' is required.",
    });
  }

  if (!env.googleMapsApiKey) {
    return res.status(500).json({
      success: false,
      message: "Google Maps API key is not configured on server.",
    });
  }

  const params = new URLSearchParams({
    input,
    key: env.googleMapsApiKey,
  });

  const sessionToken = (req.query.sessionToken || "").trim();
  if (sessionToken) {
    params.set("sessiontoken", sessionToken);
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params.toString()}`,
      {
        method: "GET",
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      return res.status(502).json({
        success: false,
        message: "Failed to fetch suggestions from Google Places.",
      });
    }

    const payload = await response.json();

    const predictions = Array.isArray(payload.predictions)
      ? payload.predictions.map((item) => ({
          description: item.description,
          placeId: item.place_id,
        }))
      : [];

    return res.status(200).json({
      success: true,
      suggestions: predictions,
      status: payload.status || "UNKNOWN",
    });
  } catch (error) {
    const isAbort = error && error.name === "AbortError";
    return res.status(502).json({
      success: false,
      message: isAbort
        ? "Google Places request timed out."
        : "Unable to fetch Google Places suggestions.",
    });
  }
};

module.exports = {
  autocomplete,
};
