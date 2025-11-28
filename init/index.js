const mongoose = require("mongoose");
const axios = require("axios");
const Listing = require("../models/listing.js");
const User = require("../models/user.js");
const initData = require("./data.js");

require("dotenv").config({ path: "../.env" });
const MONGO_URL = process.env.ATLASDB_URL;

if (!MONGO_URL) {
  console.log("ERROR: ATLASDB_URL is missing in .env");
  process.exit(1);
}

async function main() {
  await mongoose.connect(MONGO_URL);
}

main()
  .then(() => console.log("Connected to DB"))
  .catch((err) => console.log("Connection error:", err));

const seedDB = async () => {
  await Listing.deleteMany({});
  await User.deleteMany({});
  console.log(" Old listings & users deleted");

  const demoUser = new User({
    email: "demo@wanderlust.com",
    username: "demoUser",
  });

  const registeredUser = await User.register(demoUser, "demoPassword");
  console.log("Demo user created", registeredUser._id);

  for (let item of initData.data) {
    try {
      const response = await axios.get(
        "https://nominatim.openstreetmap.org/search",
        {
          params: {
            q: `${item.location}, ${item.country}`,
            format: "json",
            limit: 1,
          },
          headers: {
            "User-Agent": "wanderlust-seed-script",
          },
        }
      );

      if (response.data[0]) {
        item.geometry = {
          type: "Point",
          coordinates: [
            parseFloat(response.data[0].lon),
            parseFloat(response.data[0].lat),
          ],
        };
      } else {
        item.geometry = { type: "Point", coordinates: [0, 0] };
      }
    } catch {
      item.geometry = { type: "Point", coordinates: [0, 0] };
    }

    item.owner = registeredUser._id;

    const listing = new Listing(item);
    await listing.save();
    console.log("Added:", item.title);
  }

  mongoose.connection.close();
};

seedDB();
