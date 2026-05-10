const express = require("express");

const {
  mapFrame,
  directions,
  reverseGeocode,
} = require("../controllers/mapController");

const mapRouter = express.Router();

mapRouter.get("/frame", mapFrame);
mapRouter.get("/directions", directions);
mapRouter.get("/reverse-geocode", reverseGeocode);

module.exports = mapRouter;
