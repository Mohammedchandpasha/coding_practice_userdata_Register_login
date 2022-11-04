const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const app = express();
const bcrypt = require("bcrypt");
const dbPath = path.join(__dirname, "userData.db");
let db = null;
app.use(express.json());

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`Db error:${e.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

// Register API
app.post("/register/", async (request, response) => {
  const { username, name, password, gender, location } = request.body;

  const hashedPassword = await bcrypt.hash(password, 10);

  const selectUserQuery = `
    SELECT * FROM user 
    WHERE username='${username}';`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const createUserQuery = `INSERT INTO user(
            username,name,password,gender,location)
            VALUES (
               '${username}',
                '${name}',
                '${hashedPassword}',
                '${gender}',
                '${location}'
                );`;
      await db.run(createUserQuery);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});
//login API
app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `
   SELECT * FROM user
   WHERE username='${username}';`;
  const dbUser = await db.get(selectUserQuery);

  if (dbUser != undefined) {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  } else {
    response.status(400);
    response.send("Invalid user");
  }
});
//update password API
app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  const selectUserQuery = `
   SELECT * FROM user
   WHERE username='${username}';`;
  const dbUser = await db.get(selectUserQuery);

  const isOldPasswordMatched = await bcrypt.compare(
    oldPassword,
    dbUser.password
  );
  if (isOldPasswordMatched) {
    if (newPassword.length < 5) {
      response.status(400);
      response.send("Password is too short");
    }
    //update password
    else {
      const updatePasswordQuery = `
      UPDATE user 
      SET password='${hashedPassword}'
      WHERE username='${username}';`;
      const updatePassword = await db.run(updatePasswordQuery);
      response.send("Password updated");
    }
  } else {
    response.status(400);
    response.send("Invalid current password");
  }
});
module.exports = app;
