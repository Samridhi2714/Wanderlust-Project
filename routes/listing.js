const express = require("express");
const multer = require("multer");
const { storage } = require("../cloudConfig.js");
const upload = multer({ storage });
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const Listing = require("../models/listing.js");

const {
  isLoggedIn,
  isOwner,
  validateListing,
} = require("../middleware.js");
const listingController = require("../controllers/listing.js");

// ------------------ CATEGORY FILTER ------------------
router.get(
  "/category/:categoryName",
  wrapAsync(listingController.categoryFilter)
);

// ------------------ SEARCH ROUTE ------------------
router.get("/search", async (req, res) => {
  const searchQuery = req.query.q;

  if (!searchQuery) {
    req.flash("error", "Please enter something to search.");
    return res.redirect("/listings");
  }

  const results = await Listing.find({
    $or: [
      { title: { $regex: searchQuery, $options: "i" } },
      { location: { $regex: searchQuery, $options: "i" } },
    ],
  });

  res.render("listings/searchResults.ejs", { results, searchQuery });
});

// ------------------ INDEX + CREATE ROUTE ------------------
router
  .route("/")
  .get(wrapAsync(listingController.index))
  .post(
    isLoggedIn,
    upload.single("listing[image]"),
    validateListing,
    wrapAsync(listingController.createListing)
  );

// ------------------ NEW FORM ------------------
router.get("/new", isLoggedIn, listingController.renderNewForm);

// ------------------ SHOW + UPDATE + DELETE ROUTES ------------------
router
  .route("/:id")
  .get(wrapAsync(listingController.showListing))
  .put(
    isLoggedIn,
    isOwner,
    upload.single("listing[image]"),
    validateListing,
    wrapAsync(listingController.updateListing)
  )
  .delete(
    isLoggedIn,
    isOwner,
    wrapAsync(listingController.deleteListing)
  );

// ------------------ EDIT FORM ------------------
router.get(
  "/:id/edit",
  isLoggedIn,
  isOwner,
  wrapAsync(listingController.renderEditForm)
);

module.exports = router;
