const express = require("express");
const PORT = 8000;
const app = express();
const { db, query } = require("./database/index");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const upload = require("./middleware/multer");
const { userRouter, postsRouter } = require(`./routers/index`);
const { format } = require("date-fns");

//All the routers

app.use(express.json());
app.use(express.static("public"));

//If cross reference origin is blocked
app.use(cors());

//All routers are inside here
app.use(`/user`, userRouter);
app.use(`/post`, postsRouter);

//Upload image
app.post(`/upload`, upload.single(`file`), async (req, res) => {
  const { file } = req;
  const filepath = file ? `/` + file.filename : null;

  let data = JSON.parse(req.body.data);

  const isUserNameExistQuery = `select * from users where username=${db.escape(
    data.username
  )}`;
  const isUserNameExist = await query(isUserNameExistQuery);

  if (isUserNameExist.length > 0) {
    return res.status(200).send({
      success: false,
      message: "Username already exist, please pick another name",
    });
  }

  const updateUserUsernameQuery = `update users set username=${db.escape(
    data.username
  )} where iduser=${db.escape(data.id)}`;

  // console.log(updateUserUsernameQuery);
  await query(updateUserUsernameQuery);

  const userProfileDataQuery = `update profiles set fullname=${db.escape(
    data.fullname
  )}, bio=${db.escape(data.biography)}, profile_picture=${db.escape(
    filepath
  )} where iduser=${db.escape(data.id)};`;

  await query(userProfileDataQuery);

  const userQuery = await query(
    `select profiles.iduser, users.password, users.username, users.email, fullname, bio, profile_picture from profiles inner join users on users.iduser = profiles.iduser where users.iduser=${db.escape(
      data.id
    )};`
  );

  const { iduser, username, email, fullname, bio, profile_picture } =
    userQuery[0];

  return res.status(200).send({
    filepath,
    success: true,
    data: {
      iduser,
      username,
      email,
      profile: {
        fullname,
        bio,
        profile_picture,
      },
    },
  });
});

//Add Post with Image
app.post(`/addpost`, upload.single(`file`), async (req, res) => {
  try {
    const { file } = req;
    const filepath = file ? `/` + file.filename : null;

    let data = JSON.parse(req.body.data);
    const { id, caption } = data;

    const postDate = format(Date.now(), `dd-MMMM-yyyy`);

    const addPostQuery = `insert into posts values (null, ${db.escape(
      caption
    )}, ${db.escape(filepath)},${db.escape(postDate)}, 0)`;

    const response = await query(addPostQuery);
    if (response.affectedRows === 0) {
      return res
        .status(200)
        .send({ success: false, message: "No data was added" });
    }

    const addedUserPostQuery = `insert into user_post values (null,${db.escape(
      id
    )}, ${db.escape(response.insertId)})`;

    const addedUserPost = await query(addedUserPostQuery);

    return res
      .status(200)
      .send({
        success: true,
        message: "Post successfully added",
        addedUserPost,
      });

    // const addedPostQuery = `select * from posts where idposts = ${db.escape(
    //   response.insertId
    // )}`;
    // const addedPost = await query(addedPostQuery);

    // console.log(response);
  } catch (error) {
    return res.status(400).send(error);
  }

  // return res.status(200).send({
  //   filepath,
  //   success: true,
  //   posts: {
  //     iduser,
  //     caption,
  //     post_image,
  //     date,
  //     likes,
  //   },
  // });
});

app.listen(PORT, (error) => {
  console.log(`Server is running on PORT: ${PORT}`);
});
