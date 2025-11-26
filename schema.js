const Joi = require("joi");
module.exports.listingSchema = Joi.object({
  listing: Joi.object({
    title: Joi.string().required(),
    description: Joi.string().required(),
    location: Joi.string().required(),
    country: Joi.string().required(),
    price: Joi.number().required().min(0),
    image: Joi.object({
      filename: Joi.string().allow("",null),
      url: Joi.string().allow("",null),
    }),
    category: Joi.string()
  .valid(
    "trending",
    "rooms",
    "iconicCities",
    "mountains",
    "castles",
    "amazingPools",
    "camping",
    "farms",
    "arctic",
    "domes",
    "boats",
    "beaches"
  )
  .required(),
    geometry: Joi.object({
      type: Joi.string().valid("Point").required(),
      coordinates: Joi.array().items(Joi.number()).length(2).required(),
    }).optional(),
  }).required(),
});

module.exports.reviewSchema = Joi.object({
  review: Joi.object({
    rating: Joi.number().required().min(1).max(5),
    comment: Joi.string().required(),
  }).required(),
});
