const Listing = require("../models/listing");
const { cloudinary } = require("../cloudConfig.js");   // <-- IMPORTANT
const axios = require("axios");


module.exports.index = async (req, res) => {
    const allListings = await Listing.find({});
    res.render("listings/index.ejs", { allListings });
   };
module.exports.categoryFilter = async (req, res) => {
  const { categoryName } = req.params;

  const allListings = await Listing.find({ category: categoryName });

  res.render("listings/index.ejs", { allListings, categoryName });
};
module.exports.renderNewForm =  (req, res) => {
  res.render("listings/new.ejs");
   };
module.exports.showListing = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id)
    .populate({
      path:"reviews",
      populate:{
      path: "author",
      },
      })
     .populate("owner");
    if (!listing) {
      req.flash("error", "Listing you requested for does not exist! ");
      return res.redirect("/listings");
    }
    console.log(listing);
    res.render("listings/show.ejs", { listing });
  };
module.exports.createListing = async (req, res) => {
    // 1.Create new listing using form data
  const newListing = new Listing(req.body.listing);
    // 2.Add image
  if (req.file) {
  newListing.image = {
    url: req.file.path,
    filename: req.file.filename,
  };
}
  // 3. OSM Geocoding API call
  const geoResponse = await axios.get("https://nominatim.openstreetmap.org/search", {
    params: {
      q: req.body.listing.location,
      format: "json",
      limit: 1,
    },
    headers: {
      "User-Agent": "wanderlust-student-project",
    },
  });

  const place = geoResponse.data[0];

  if (place) {
    newListing.geometry = {
      type: "Point",
      coordinates: [parseFloat(place.lon), parseFloat(place.lat)],
    };
  } else {
    newListing.geometry = {
      type: "Point",
      coordinates: [0, 0],
    };
  }

  // 4. Set owner
  newListing.owner = req.user._id;

  // 5. Save listing
  await newListing.save();

  req.flash("success", "New listing created successfully!");
  res.redirect(`/listings/${newListing._id}`);
};

module.exports.renderEditForm = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
      req.flash("error", "Listing you requested for does not exist! ");
      return res.redirect("/listings");
    }
//Image Transform
   let originalImageUrl = listing.image.url;
   originalImageUrl = originalImageUrl.replace("/upload","/upload/w_250");
    res.render("listings/edit.ejs", { listing,originalImageUrl });
  };
module.exports.updateListing = async (req, res) => {
  const { id } = req.params;

  let listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing not found!");
    return res.redirect("/listings");
  }
  const oldLocation = listing.location;

  // Update ONLY normal fields manually (Do not overwrite geometry)
  listing.title = req.body.listing.title;
  listing.description = req.body.listing.description;
  listing.price = req.body.listing.price;
  listing.country = req.body.listing.country;
  listing.location = req.body.listing.location;

  // Re-geocode when location changed
  if (req.body.listing.location !== oldLocation) {
    try {
      const geoResponse = await axios.get("https://nominatim.openstreetmap.org/search", {
        params: {
          q: req.body.listing.location,
          format: "json",
          limit: 1,
        },
        headers: { "User-Agent": "wanderlust-student-project" }
      });

      const place = geoResponse.data[0];
      if (place) {
        listing.geometry = {
          type: "Point",
          coordinates: [parseFloat(place.lon), parseFloat(place.lat)]
        };
      }
    } catch (err) {
      console.log("Geocode error:", err.message);
    }
  }

  // Update image if new file uploaded
  if (req.file) {
    listing.image = {
      url: req.file.path,
      filename: req.file.filename
    };
  }

  await listing.save();

  req.flash("success", "Listing Updated Successfully!");
  res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req, res) => {
    let { id } = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    req.flash("success", "Listing Deleted!");
    res.redirect("/listings");
  };