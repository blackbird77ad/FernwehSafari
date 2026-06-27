const express = require("express");
const {
  createUser,
  deleteUser,
  listUsers,
  removeSavedTour,
  saveTour,
  updateUser,
  updateUserSuspension,
  updateUserRole
} = require("../controllers/userController");
const { auth } = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");

const router = express.Router();

router.patch("/me/saved-tours/:tourId", auth, saveTour);
router.delete("/me/saved-tours/:tourId", auth, removeSavedTour);
router.get("/", auth, adminOnly, listUsers);
router.post("/", auth, adminOnly, createUser);
router.patch("/:id/role", auth, adminOnly, updateUserRole);
router.patch("/:id/suspension", auth, adminOnly, updateUserSuspension);
router.put("/:id", auth, adminOnly, updateUser);
router.delete("/:id", auth, adminOnly, deleteUser);

module.exports = router;
