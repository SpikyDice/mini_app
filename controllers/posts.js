const { db, query } = require(`../database/index`);
const bcrypt = require(`bcrypt`);
const { format } = require("date-fns");

module.exports = {
  getPosts: async (req, res) => {
    try {
      const fetchPostsQuery = `select user_post.iduser_post, users.username, users.email, user_post.iduser, posts.idpost, posts.caption, posts.post_image, posts.date, posts.likes from user_post inner join posts on user_post.idpost = posts.idpost inner join users on user_post.iduser = users.iduser;`;
      const fetchPosts = await query(fetchPostsQuery);

      return res
        .status(200)
        .send({ success: true, message: "Fetching success", fetchPosts });
    } catch (error) {
      return res.status(400).send(error);
    }
  },
  setNewCaption: async (req, res) => {
    try {
      const { caption, idpost } = req.body;
      const newCaptionQuery = `update posts set caption=${db.escape(
        caption
      )} where idpost=${db.escape(idpost)}`;

      let newCaption = await query(newCaptionQuery);
      return res
        .status(200)
        .send({ success: true, message: "caption changed" });
    } catch (error) {
      return res.status(400).send(error);
    }
  },
  getSpecificPost: async (req, res) => {
    try {
      const { id, idpost } = req.body;
      let specificPostQuery = `select users.iduser, users.username, posts.idpost, posts.caption,posts.date, user_post.iduser_post, posts.post_image, posts.likes from posts inner join user_post on user_post.idpost = posts.idpost inner join users on user_post.iduser = users.iduser where posts.idpost=${db.escape(
        idpost
      )};`;
      let specificPost = await query(specificPostQuery);

      //fetching all comment for this idpost
      let fetchPostCommentQuery = `select comments.idcomments, comments.idpost, comments.iduser, users.username, comments.comment, comments.commentdate from comments inner join users on users.iduser = comments.iduser where comments.idpost = ${db.escape(
        idpost
      )} order by comments.commentdate desc limit 5;`;

      let fetchPostComment = await query(fetchPostCommentQuery);

      return res
        .status(200)
        .send({ success: true, specificPost, fetchPostComment });
    } catch (error) {
      return res.status(400).send(error);
    }
  },
  deletePost: async (req, res) => {
    try {
      const { idpost } = req.body;
      const deleteSpecificPostQuery = `delete from posts where idpost=${db.escape(
        idpost
      )}`;
      let deleteSPecificPost = await query(deleteSpecificPostQuery);
      return res.status(200).send({ success: true, message: "Post Deleted" });
    } catch (error) {
      return res.status(400).send(error);
    }
  },
  addPostComment: async (req, res) => {
    try {
      const { idpost, comment, iduser, commentedUser } = req.body;
      const addCommentQuery = `insert into comments values (null, ${db.escape(
        idpost
      )}, ${db.escape(iduser)}, ${db.escape(comment)}, "${format(
        Date.now(),
        "yyyy-MM-dd HH:mm:ss"
      )}");`;
      const addComment = await query(addCommentQuery);

      console.log(addComment);

      const getAddedCommentQuery = `select comments.idcomments, comments.idpost, comments.iduser, users.username, comments.comment, comments.commentdate from comments inner join users on users.iduser = comments.iduser where comments.idcomments = ${db.escape(
        addComment.insertId
      )};`;

      const getAddedComment = await query(getAddedCommentQuery);

      const getFiveLatestCommentQuery = `select comments.idcomments, comments.idpost, comments.iduser, users.username, comments.comment, comments.commentdate from comments inner join users on users.iduser = comments.iduser where comments.idpost = ${db.escape(
        idpost
      )} order by comments.commentdate desc limit 5;`;

      const getFiveLatestComment = await query(getFiveLatestCommentQuery);

      return res.status(200).send({
        success: true,
        message: "Comment Added",
        getAddedComment,
        getFiveLatestComment,
      });
    } catch (error) {
      return res.status(400).send(error);
    }
  },
};
