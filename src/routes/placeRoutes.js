const express = require("express");

const { autocomplete, placeDetails } = require("../controllers/placeController");

const placeRouter = express.Router();

placeRouter.get("/autocomplete", autocomplete);
placeRouter.get("/details", placeDetails);

module.exports = placeRouter;
