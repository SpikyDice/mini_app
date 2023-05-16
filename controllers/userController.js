const { db, query } = require(`../database/index`);
const bcrypt = require(`bcrypt`);
const jwt = require("jsonwebtoken");
const nodemailer = require(`../helper/nodemailer`);

module.exports = {
  register: async (req, res) => {
    try {
      // destructuring user data from FE
      const { username, password, email } = req.body;

      // if no data being passed, return data as false
      if (!req.body) {
        return res
          .status(200)
          .send({ success: false, message: "No Data being passed!" });
      }

      //search if username already available in database, if none return false
      const userNameQuery = `select * from users where username=${db.escape(
        username
      )}`;
      const isUserNameExist = await query(userNameQuery);
      if (isUserNameExist.length > 0)
        return res
          .status(200)
          .send({ success: false, message: "Username already exist!" });

      //search if email already available in database, if none return false
      const emailQuery = `select * from users where email=${db.escape(email)}`;
      const isEmailExist = await query(emailQuery);
      if (isEmailExist.length > 0)
        return res
          .status(200)
          .send({ success: false, message: "Email already exist!" });

      //starts hashing user password
      const hashedPassword = await bcrypt.hash(password, 10);

      //inserting userdata into mySQL
      const addUserQuery = `insert into users values (null, ${db.escape(
        username
      )}, ${db.escape(email)} , ${db.escape(hashedPassword)}, 0);`;
      const addUserResult = await query(addUserQuery);

      //get userback to know what iduser was assign when inserting
      const insertedUserQuery = `select iduser, username, email, isVerified from users where email = "${email}"`;
      const insertedUser = await query(insertedUserQuery);

      //create initial userprofile of specific user
      const initialImage = "2606517_5856-1684057125944.jpg";
      const initialUserProfileQuery = `insert into profiles values (null, ${db.escape(
        insertedUser[0].iduser
      )}, null, null, ${db.escape(initialImage)})`;
      const initialUserProfile = await query(initialUserProfileQuery);
      console.log(initialUserProfile);

      // define iduser as payload to be passed into nodemailer
      const payload = {
        id: addUserResult.insertId,
      };
      const token = jwt.sign(payload, "meong", { expiresIn: "1h" });

      //define nodemailer detail for verification
      const mail = {
        from: "Administrator <gozalidonny@gmail.com>",
        to: `${email}`,
        subject: "Account Verification",
        html: `<div>
                <p>Click here to verify your account</p>
                <a href="http://localhost:3000/user/verification/${token}">Click here</a>
              </div>`,
      };

      //sending the verification mail to the user
      await nodemailer.sendMail(mail);

      //return success status
      return res
        .status(200)
        .send({ success: true, message: "Username added", addUserResult });
    } catch (error) {
      return res.status(400).send(error);
    }
  },
  verification: async (req, res) => {
    try {
      const id = req.user.id;
      const updateActiveQuery = `update users set isVerified = true where iduser = ${db.escape(
        id
      )}`;
      await query(updateActiveQuery);
      return res
        .status(200)
        .send({ success: true, message: "Account is verified" });
    } catch (error) {
      return res.status(400).send(error);
    }
  },
  login: async (req, res) => {
    try {
      //destructuring req.body into email and password
      const { email, password } = req.body;

      //check whether the email existed or not
      const isEmailExistQuery = `select profiles.iduser, users.password, users.username, users.email, fullname, bio, profile_picture from profiles inner join users on users.iduser = 	profiles.iduser where email=${db.escape(
        email
      )};`;

      const isEmailExist = await query(isEmailExistQuery);

      //condition setup if no email found, return below status
      if (isEmailExist.length === 0) {
        return res
          .status(200)
          .send({ success: false, message: `No email found, please register` });
      }

      //check whether the password is correct
      const validator = await bcrypt.compare(
        password,
        isEmailExist[0].password
      );
      if (!validator) {
        return res
          .status(200)
          .send({ success: false, message: `Password not match!` });
      }

      //jwt all data that you want to pass into FE
      const payload = {
        id: isEmailExist[0].iduser,
        username: isEmailExist[0].username,
      };
      const token = jwt.sign(payload, "meong", { expiresIn: "1h" });

      //destructure data that we want to pass to FE
      const { iduser, username, fullname, bio, profile_picture } =
        isEmailExist[0];

      //return the data
      return res.status(200).send({
        token,
        success: true,
        userData: {
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
    } catch (error) {
      return res.status(400).send(error);
    }
  },
  resetPassword: async (req, res) => {
    try {
      if (!req.body) {
        return res.status(200).send({
          success: false,
          message: "No data available",
        });
      }

      //destructuring passing data
      const { email } = req.body;

      //check whether email is available in the database or not
      const isEmailExistQuery = `select * from users where email=${db.escape(
        email
      )}`;
      const isEmailExist = await query(isEmailExistQuery);
      if (isEmailExist.length === 0) {
        return res
          .status(200)
          .send({ success: false, message: "Email not found" });
      }

      const payload = {
        id: isEmailExist[0].iduser,
      };

      const token = jwt.sign(payload, "meong", { expiresIn: "1h" });
      console.log(token);
      //define nodemailer detail for verification
      const mail = {
        from: "Administrator <gozalidonny@gmail.com>",
        to: `${isEmailExist[0].email}`,
        subject: "Reset Password",
        html: `<div>
                <p>Link to Reset Your Password</p>
                <a href="http://localhost:3000/insertnewpassword/${token}">Click here</a>
              </div>`,
      };

      //sending mail to user email
      await nodemailer.sendMail(mail);

      //email
      return res.status(200).send({
        success: true,
        message: "Check Your Email for Link to Reset Your Password",
        token,
      });
    } catch (error) {
      return res.status(400).error;
    }
  },
  insertNewPassword: async (req, res) => {
    try {
      //destructuring required data
      const { newPassword } = req.body;
      const { id } = req.user;

      //bcryping the new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      //update password user in database
      userChangedPasswordQuery = `update users set password="${hashedPassword}" where iduser=${id}`;
      const userChangedPassword = await query(userChangedPasswordQuery);

      if (userChangedPassword.affectedRows === 0) {
        return res
          .status(200)
          .send({ success: false, message: "No Password has been changed" });
      }

      return res
        .status(200)
        .send({ success: true, message: "Password successfully changed!" });
    } catch (error) {
      return res.status(400).send(error);
    }
  },

  checkLogin: async (req, res) => {
    try {
      const userQuery = await query(
        `select profiles.iduser, users.password, users.username, users.email, fullname, bio, profile_picture from profiles inner join users on users.iduser = profiles.iduser where users.iduser=${db.escape(
          req.user.id
        )};`
      );
      const { iduser, username, email, fullname, bio, profile_picture } =
        userQuery[0];
      return res.status(200).send({
        success: true,
        message: "User token available",
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
    } catch (error) {
      return res.status(error.stats || 500).send(error);
    }
  },
};
