import { destinationStories } from "./staticContent";

function unique(values) {
  return values.filter((value, index, list) => value && list.indexOf(value) === index);
}

export const africaDestinationSuggestions = [
  "Anywhere in Africa",
  "Tanzania safari",
  "Zanzibar coast",
  "Kenya safari",
  "Uganda gorilla trekking",
  "Rwanda gorilla trekking",
  "Botswana Okavango Delta",
  "South Africa Cape Town and safari",
  "Namibia desert adventure",
  "Morocco cultural tour",
  "Egypt history tour",
  "Ghana culture and heritage",
  "Victoria Falls adventure",
  "Ethiopia highlands",
  "Madagascar nature route"
];

export const destinationOptions = unique([
  ...africaDestinationSuggestions,
  ...destinationStories.map((story) => story.name)
]);

export const activityOptions = [
  "Safari",
  "Beach",
  "Cultural",
  "Mountain",
  "Combination",
  "Adventure",
  "Wildlife",
  "City",
  "Food",
  "History",
  "Honeymoon",
  "Family"
];

export const tourSortOptions = [
  { value: "featured", label: "Featured first" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "rating-desc", label: "Best reviewed" },
  { value: "duration-asc", label: "Shortest first" },
  { value: "title-asc", label: "A-Z" }
];

export const comfortLevelOptions = ["Budget", "Midrange", "Luxury", "Premium", "Mixed"];

export const tourTypeOptions = ["Private", "Shared", "Private or shared"];

export const priceBasisOptions = ["Per person", "Per group", "Per vehicle", "Per booking", "On request"];

export const confirmationTypeOptions = ["On request", "Manual confirmation", "Instant confirmation"];
