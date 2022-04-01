const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "goodreads.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

// Get Books API
app.get("/books/", async (request, response) => {
  const getBooksQuery = `
  SELECT
    *
  FROM
    book
  ORDER BY
    book_id;`;
  const booksArray = await db.all(getBooksQuery);
  response.send(booksArray);
});

//register user api
app.post("/users/", async (request, response) => {
  const { name, username, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  const getUserQuery = `select * from user where username='${username}'`;
  const dbUser = await db.get(getUserQuery);
  //console.log(dbUser);
  if (dbUser === undefined) {
    //create user api
    const insertUser = `insert into user (name, username, password, gender,location)
     values(
            '${name}','${username}','${hashedPassword}','${gender}',
            '${location}'
        )`;
    await db.run(insertUser);
    response.send("User created Successfully");
  } else {
    response.status(400);
    response.send("User already exist...!");
  }
});

//delete user
app.delete("/users/:username", async (request, response) => {
  const { username } = request.params;
  const deleteQuery = `delete from user where username='${username}'`;
  const result = await db.run(deleteQuery);
  response.send("user deleted successfully");
});

//login api
app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const selectQuery = `select * from user where username='${username}'`;
  const dbUser = await db.get(selectQuery);
  console.log(dbUser);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid username");
  } else {
    const isPwdMatched = await bcrypt.compare(password, dbUser.password);
    if (isPwdMatched === true) {
      response.send("Login Successfull");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});
