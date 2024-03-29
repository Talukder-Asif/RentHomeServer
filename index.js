const express = require("express");
const app = express();
require("dotenv").config();
const jwt = require("jsonwebtoken");
const port = process.env.PORT || 5000;
const cors = require("cors");
const cookieParser = require("cookie-parser");

// middleware
app.use(cookieParser());
app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:4173","https://house-rent-sooty.vercel.app", "https://house-rent-asif-talukders-projects.vercel.app"],
    credentials: true,
  })
);

// JWT Middleware
const verifyToken = async (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).send({ message: "No token provided" });
  }
  jwt.verify(token, process.env.SECRET, function (err, decoded) {
    //err
    if (err) {
      console.log(err);
      return res.status(401).send({ message: "Invalid token" });
    }
    //decoded
    req.user = decoded;
    next();
  });
};

// Mongodb server code

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.PASSWORD}@cluster0.eykzqz7.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const database = client.db("HouseRent");
    const userCollection = database.collection("UserData");
    const houseCollection = database.collection("HouseData");

    // Post user details
    app.post("/user", async (req, res) => {
      const data = req.body;
      const query = { email: data.email };
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: "user already exists", insertedId: false });
      }
      const result = await userCollection?.insertOne(data);
      res.send(result);
    });

    // Post House Details
    app.post("/addhouse", async (req, res) => {
      const data = req.body;
      const result = await houseCollection?.insertOne(data);
      res.send(result);
    });


    app.get("/allhouse/search", async (req, res) => {
      const houseName = req.query.query;
      const results = await houseCollection
        .find({ name: { $regex: houseName, $options: "i" } })
        .toArray();
      res.send(results);
    });





    // Update user information to database
    app.put("/user/:email", async (req, res) => {
      const userEmail = req.params.email;
      const filter = { email: userEmail };
      const data = req.body;
      const updatedDoc = {
        $set: {
          name: data.name,
          email: data.email,
          photo: data.photo,
          Rent: data.Rent,
          role: data.role,
          password: data.password
        },
      };
      const options = { upsert: true };
      const result = await userCollection.updateOne(
        filter,
        updatedDoc,
        options
      );
      res.send(result);
    });

    // Get user data from database
    app.get("/user/:email", async (req, res) => {
      const userEmail = req.params.email;
      const quary = { email: userEmail };
      const result = await userCollection.findOne(quary);
      res.send(result);
    });

    // Get user data from database
    app.get("/houses", async (req, res) => {
      const result = await houseCollection.find().toArray();
      res.send(result);
    });

    // Get user data from database
    app.get("/dashboard/houses/:email", async (req, res) => {
      const userEmail = req.params.email;
      const quary = { createdBy: userEmail };
      const result = await houseCollection.find(quary).toArray();
      res.send(result);
    });

    // Delete a house
    app.delete("/house/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await houseCollection.deleteOne(query);
      res.send(result);
    });
    // get indivisual house data by id
    app.get("/house/:id", async (req, res) => {
      const id = req.params.id;
      const quary = { _id: new ObjectId(id) };
      const result = await houseCollection.findOne(quary);
      res.send(result);
    });
    // Update House information to database
    app.put("/house/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const data = req.body;
      const updatedDoc = {
        $set: {
          name: data.name,
          image: data.image,
          address: data.address,
          city: data.city,
          details: data.details,
          bedroom: data.bedroom,
          bathroom: data.bathroom,
          createdBy: data.createdBy,
          size: data.size,
          rent: data.rent,
          phone: data.phone,
          Deadline: data.Deadline,
        },
      };
      const options = { upsert: true };
      const result = await houseCollection.updateOne(
        filter,
        updatedDoc,
        options
      );
      res.send(result);
    });

    // JWT
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.SECRET, { expiresIn: "24h" });
      // const expirationDate = new Date();
      // expirationDate.setDate(expirationDate.getDate() + 7);
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: true,
          sameSite: "none",
          // expires: expirationDate,
        })
        .send({ msg: "Succeed" });
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

// Route
app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
