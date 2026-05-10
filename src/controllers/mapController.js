const env = require("../config/env");

const mapFrame = async (req, res) => {
  if (!env.googleMapsApiKey) {
    return res.status(500).json({
      success: false,
      message: "Google Maps API key is not configured on server.",
    });
  }

  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  const zoom = Number(req.query.zoom || 15);
  const width = Number(req.query.width || 800);
  const height = Number(req.query.height || 500);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return res.status(400).json({
      success: false,
      message: "Query params 'lat' and 'lng' are required numbers.",
    });
  }

  const safeZoom = Math.min(21, Math.max(1, Math.floor(zoom)));
  const safeWidth = Math.min(1280, Math.max(200, Math.floor(width)));
  const safeHeight = Math.min(1280, Math.max(200, Math.floor(height)));

  const params = new URLSearchParams({
    center: `${lat},${lng}`,
    zoom: String(safeZoom),
    size: `${safeWidth}x${safeHeight}`,
    markers: `color:red|${lat},${lng}`,
    key: env.googleMapsApiKey,
  });

  const staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?${params.toString()}`;

  return res.status(200).json({
    success: true,
    map: {
      center: { lat, lng },
      zoom: safeZoom,
      size: { width: safeWidth, height: safeHeight },
      staticMapUrl,
    },
  });
};

const directions = async (req, res) => {
  if (!env.googleMapsApiKey) {
    return res.status(500).json({
      success: false,
      message: "Google Maps API key is not configured on server.",
    });
  }

  const origin = String(req.query.origin || "").trim();
  const destination = String(req.query.destination || "").trim();

  if (!origin || !destination) {
    return res.status(400).json({
      success: false,
      message: "Query params 'origin' and 'destination' are required.",
    });
  }

  const params = new URLSearchParams({
    origin,
    destination,
    mode: "driving",
    key: env.googleMapsApiKey,
  });

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/directions/json?${params.toString()}`
    );

    if (!response.ok) {
      return res.status(502).json({
        success: false,
        message: "Failed to fetch directions from Google Maps.",
      });
    }

    const payload = await response.json();
    const route = Array.isArray(payload.routes) ? payload.routes[0] : null;
    const leg = route?.legs?.[0];
    const polyline = route?.overview_polyline?.points;

    if (!route || !leg || !polyline) {
      return res.status(404).json({
        success: false,
        message: "No route found for the selected start and end points.",
        status: payload.status || "ZERO_RESULTS",
      });
    }

    const staticParams = new URLSearchParams({
      size: "1000x600",
      path: `enc:${polyline}`,
      markers: `color:green|label:S|${leg.start_location.lat},${leg.start_location.lng}`,
      key: env.googleMapsApiKey,
    });
    staticParams.append(
      "markers",
      `color:red|label:E|${leg.end_location.lat},${leg.end_location.lng}`
    );
    const staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?${staticParams.toString()}`;

    return res.status(200).json({
      success: true,
      route: {
        origin: leg.start_address,
        destination: leg.end_address,
        distanceText: leg.distance?.text || "",
        durationText: leg.duration?.text || "",
        startLocation: leg.start_location,
        endLocation: leg.end_location,
        polyline,
        staticMapUrl,
      },
      status: payload.status || "OK",
    });
  } catch (error) {
    return res.status(502).json({
      success: false,
      message: "Unable to fetch directions.",
      error: error.message,
    });
  }
};

const reverseGeocode = async (req, res) => {
  if (!env.googleMapsApiKey) {
    return res.status(500).json({
      success: false,
      message: "Google Maps API key is not configured on server.",
    });
  }

  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return res.status(400).json({
      success: false,
      message: "Query params 'lat' and 'lng' are required numbers.",
    });
  }

  const params = new URLSearchParams({
    latlng: `${lat},${lng}`,
    key: env.googleMapsApiKey,
  });

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`
    );

    if (!response.ok) {
      return res.status(502).json({
        success: false,
        message: "Failed to reverse geocode location.",
      });
    }

    const payload = await response.json();
    const first = Array.isArray(payload.results) ? payload.results[0] : null;
    const formattedAddress = first?.formatted_address || "";
    const placeId = first?.place_id || "";

    if (!formattedAddress) {
      return res.status(404).json({
        success: false,
        message: "No nearby place found for selected location.",
        status: payload.status || "ZERO_RESULTS",
      });
    }

    return res.status(200).json({
      success: true,
      location: {
        lat,
        lng,
        formattedAddress,
        placeId,
      },
      status: payload.status || "OK",
    });
  } catch (error) {
    return res.status(502).json({
      success: false,
      message: "Unable to reverse geocode location.",
      error: error.message,
    });
  }
};

module.exports = {
  mapFrame,
  directions,
  reverseGeocode,
};
