const { userController } = require(`../controllers/index`);
const express = require(`express`);
const { verifyToken } = require("../middleware/auth");

const router = express.Router();

router.post("/register", userController.register);
router.post("/verification", verifyToken, userController.verification);
router.post("/login", userController.login);
router.post("/resetpassword", userController.resetPassword);
router.post(
  "/insertnewpassword",
  verifyToken,
  userController.insertNewPassword
);
router.post("/check-login", verifyToken, userController.checkLogin);

module.exports = router;
