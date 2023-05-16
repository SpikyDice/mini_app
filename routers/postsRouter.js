const { userController, posts } = require(`../controllers/index`);
const express = require(`express`);

const router = express.Router();

router.get("/getposts", posts.getPosts);
router.post("/updatecaption", posts.setNewCaption);
router.post("/getspecificpost", posts.getSpecificPost);
router.post("/deletepost", posts.deletePost);
router.post("/addcomment", posts.addPostComment);

module.exports = router;
