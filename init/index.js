const mongoose = require("mongoose");
const axios = require("axios");
const Listing = require("../models/listing.js");
const initData = require("./data.js");

const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

main()
  .then(() => console.log(" Connected to DB"))
  .catch((err) => console.log(" Connection error:", err));

async function main() {
  await mongoose.connect(MONGO_URL);
}

const initDB = async () => {
  await Listing.deleteMany({});
  console.log(" Old data deleted");

  for (let item of initData.data) {
    try {
      //  Geocode location using OpenStreetMap
      const response = await axios.get("https://nominatim.openstreetmap.org/search", {
        params: {
          q: `${item.location}, ${item.country}`,
          format: "json",
          limit: 1,
        },
        headers: {
          "User-Agent": "wanderlust-student-project", // required by OSM
        },
      });

      const place = response.data[0];
      if (place) {
        item.geometry = {
          type: "Point",
          coordinates: [parseFloat(place.lon), parseFloat(place.lat)], // [lon, lat]
        };
      } else {
        console.warn(` No geocode found for: ${item.location}`);
        item.geometry = { type: "Point", coordinates: [0, 0] };
      }

      item.owner = "69047192f15d719c61f5250d";

      const listing = new Listing(item);
      await listing.save();
      console.log(`
         Added: ${item.title}`);
    } catch (err) {
      console.error(` Error for ${item.title}:`, err.message);
    }
  }

  console.log(" All listings initialized with coordinates!");
  mongoose.connection.close();
};

initDB();
