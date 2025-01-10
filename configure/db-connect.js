const { MongoClient } = require("mongodb");

// Connection URL & Database Name
const url = "mongodb://localhost:27017";
const dbName = "toyWorld";
const client = new MongoClient(url);

let db;

// Connect with data base
const connectDB = async () => {
  try {
    await client.connect();
    db = client.db(dbName);
    console.log("Connected to database");
    
  } catch (error) {
    console.error("Failed to connect to database:", error);
  }
  // finally {
  //   // Ensures that the client will close when you finish/error
  //   await client.close();
  // }
};

const getDB = () => {
    if (!db) {
      throw new Error("Database not connected!");
    }
    return db;
  };

module.exports = {
  connectDB,
  getDB
};
