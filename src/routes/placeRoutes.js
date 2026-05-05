const express = require("express");

const { autocomplete } = require("../controllers/placeController");

const placeRouter = express.Router();

placeRouter.get("/autocomplete", autocomplete);

module.exports = placeRouter;
