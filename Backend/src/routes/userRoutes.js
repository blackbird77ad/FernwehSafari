const express = require("express");
const { removeSavedTour, saveTour } = require("../controllers/userController");
const { auth } = require("../middleware/auth");

const router = express.Router();

router.patch("/me/saved-tours/:tourId", auth, saveTour);
router.delete("/me/saved-tours/:tourId", auth, removeSavedTour);

module.exports = router;
