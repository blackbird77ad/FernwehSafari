const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const connectDB = require("../config/db");
const Enquiry = require("../models/Enquiry");
const Referral = require("../models/Referral");
const Tour = require("../models/Tour");
const TourPartner = require("../models/TourPartner");
const User = require("../models/User");

dotenv.config();

const partners = [
  {
    name: "Northern Tanzania Safari Partners",
    bookingURL: "https://example.com/northern-tanzania-booking",
    location: "Arusha, Tanzania",
    contactEmail: "bookings@northerntanzania.example",
    contactPhone: "+255 700 000 001",
    description:
      "Northern circuit safari partner for Ngorongoro, Lake Manyara and Kilimanjaro-area routes.",
    logo: "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=300&q=80"
  },
  {
    name: "Kilimanjaro Ridge Guides",
    bookingURL: "https://example.com/kilimanjaro-booking",
    location: "Moshi, Tanzania",
    contactEmail: "summit@kiliguides.example",
    contactPhone: "+255 700 000 002",
    description: "Mountain and foothills guides for Kilimanjaro views, coffee visits and Chagga culture.",
    logo: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=300&q=80"
  },
  {
    name: "Southern Tanzania Heritage Safaris",
    bookingURL: "https://example.com/mikumi-isimila-booking",
    location: "Morogoro and Iringa, Tanzania",
    contactEmail: "hello@southerntanzania.example",
    contactPhone: "+255 700 000 003",
    description: "Southern Tanzania partner for Mikumi National Park, Iringa and Isimila heritage routes.",
    logo: "https://images.unsplash.com/photo-1535941339077-2dd1c7963098?auto=format&fit=crop&w=300&q=80"
  },
  {
    name: "Zanzibar Coast and Culture",
    bookingURL: "https://example.com/zanzibar-booking",
    location: "Stone Town, Zanzibar",
    contactEmail: "hello@zanzibarcoast.example",
    contactPhone: "+255 700 000 004",
    description:
      "Zanzibar partner for Stone Town heritage, Prison Island, Jozani Forest, Mnemba Island and beach stays.",
    logo: "https://images.unsplash.com/photo-1586861256632-52a67f94497f?auto=format&fit=crop&w=300&q=80"
  }
];

const tourImages = {
  safari: [
    "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1400&q=80",
    "https://images.unsplash.com/photo-1535941339077-2dd1c7963098?auto=format&fit=crop&w=1400&q=80"
  ],
  mountain: [
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80",
    "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1400&q=80"
  ],
  heritage: [
    "https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=1400&q=80",
    "https://images.unsplash.com/photo-1523805009345-7448845a9e53?auto=format&fit=crop&w=1400&q=80"
  ],
  beach: [
    "https://images.unsplash.com/photo-1586861256632-52a67f94497f?auto=format&fit=crop&w=1400&q=80",
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80",
    "https://images.unsplash.com/photo-1540202404-d5f7f1b149a7?auto=format&fit=crop&w=1400&q=80"
  ],
  forest: [
    "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1400&q=80",
    "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1400&q=80"
  ]
};

async function seed() {
  await connectDB();

  await Promise.all([
    Enquiry.deleteMany({}),
    Referral.deleteMany({}),
    Tour.deleteMany({}),
    TourPartner.deleteMany({}),
    User.deleteMany({})
  ]);

  const createdPartners = await TourPartner.insertMany(partners);
  const [northernPartner, kilimanjaroPartner, southernPartner, zanzibarPartner] = createdPartners;

  await Tour.insertMany([
    {
      title: "Ngorongoro, Manyara and Kilimanjaro Safari",
      description:
        "A compact northern Tanzania route for travellers who want crater wildlife, Lake Manyara scenery and Kilimanjaro-area culture in one clear itinerary.",
      shortDescription: "Five days through Ngorongoro, Lake Manyara and Kilimanjaro foothills.",
      priceEUR: 2190,
      duration: "5 days / 4 nights",
      location: "Ngorongoro, Lake Manyara and Kilimanjaro",
      category: "Safari",
      images: [...tourImages.safari, tourImages.mountain[0]],
      highlights: [
        "Ngorongoro Crater wildlife viewing",
        "Lake Manyara National Park game drive",
        "Kilimanjaro foothills and coffee culture",
        "Referral to a northern Tanzania local operator"
      ],
      itinerary: [
        { day: 1, title: "Arrive in Arusha", description: "Meet the local partner and prepare the safari route." },
        { day: 2, title: "Lake Manyara", description: "Game drive near the Rift Valley escarpment." },
        { day: 3, title: "Ngorongoro Highlands", description: "Travel to the crater area and settle in for the night." },
        { day: 4, title: "Crater Safari", description: "Descend into Ngorongoro for a focused wildlife day." },
        { day: 5, title: "Kilimanjaro Foothills", description: "Coffee, village culture and mountain views before departure." }
      ],
      partner: northernPartner._id,
      referralLink: northernPartner.bookingURL,
      featured: true
    },
    {
      title: "Mikumi and Isimila Southern Tanzania Route",
      description:
        "A southern Tanzania itinerary connecting Mikumi National Park wildlife with Iringa landscapes and the Isimila Stone Age Site.",
      shortDescription: "Safari and heritage across Mikumi, Iringa and Isimila.",
      priceEUR: 1680,
      duration: "4 days / 3 nights",
      location: "Mikumi, Iringa and Isimila",
      category: "Safari",
      images: [...tourImages.safari.slice(1), ...tourImages.heritage],
      highlights: [
        "Mikumi National Park game drive",
        "Iringa highland stop",
        "Isimila Stone Age Site visit",
        "Southern Tanzania alternative to the northern circuit"
      ],
      itinerary: [
        { day: 1, title: "Dar es Salaam to Mikumi", description: "Road transfer and evening safari briefing." },
        { day: 2, title: "Mikumi National Park", description: "Full day wildlife drive with the local operator." },
        { day: 3, title: "Iringa", description: "Continue to Iringa for highland scenery and local context." },
        { day: 4, title: "Isimila", description: "Explore the Stone Age Site before return or onward travel." }
      ],
      partner: southernPartner._id,
      referralLink: southernPartner.bookingURL,
      featured: true
    },
    {
      title: "Kilimanjaro Foothills and Chagga Culture",
      description:
        "A lower-impact Kilimanjaro experience for travellers who want mountain atmosphere, coffee farms and cultural visits without a summit climb.",
      shortDescription: "Mountain views, coffee farms and local culture around Moshi.",
      priceEUR: 890,
      duration: "3 days / 2 nights",
      location: "Moshi and Mount Kilimanjaro",
      category: "Mountain",
      images: tourImages.mountain,
      highlights: ["Kilimanjaro viewpoints", "Coffee farm visit", "Waterfall or village walk"],
      itinerary: [
        { day: 1, title: "Moshi arrival", description: "Meet the guide and settle near Kilimanjaro." },
        { day: 2, title: "Foothills day", description: "Coffee process, village life and mountain views." },
        { day: 3, title: "Flexible morning", description: "Short nature walk before departure." }
      ],
      partner: kilimanjaroPartner._id,
      referralLink: kilimanjaroPartner.bookingURL,
      featured: false
    },
    {
      title: "Zanzibar North Coast and Stone Town Escape",
      description:
        "A Zanzibar route blending Stone Town heritage with Forodhani, Old Fort, Christ Church Cathedral, Prison Island and relaxed Nungwi or Kendwa beach time.",
      shortDescription: "Stone Town culture, Prison Island and north coast beaches.",
      priceEUR: 1390,
      duration: "5 days / 4 nights",
      location: "Stone Town, Nungwi and Kendwa",
      category: "Beach",
      images: [...tourImages.beach, tourImages.heritage[1]],
      highlights: [
        "Stone Town walking tour",
        "Forodhani evening food market",
        "Old Fort and Christ Church Cathedral",
        "Prison Island visit",
        "Nungwi or Kendwa beach stay"
      ],
      itinerary: [
        { day: 1, title: "Arrive in Stone Town", description: "Check in and enjoy Forodhani in the evening." },
        { day: 2, title: "Stone Town Heritage", description: "Visit Old Fort, Christ Church Cathedral and historic lanes." },
        { day: 3, title: "Prison Island", description: "Half-day island visit before transferring north." },
        { day: 4, title: "Nungwi or Kendwa", description: "Beach day with optional dhow or sunset experience." },
        { day: 5, title: "Depart Zanzibar", description: "Transfer to airport or ferry terminal." }
      ],
      partner: zanzibarPartner._id,
      referralLink: zanzibarPartner.bookingURL,
      featured: true
    },
    {
      title: "Paje, Jozani and Mnemba Island Experience",
      description:
        "An east-coast Zanzibar route for travellers who want Paje beach, Jozani Forest and a marine excursion around Mnemba Island.",
      shortDescription: "East coast beach time, forest wildlife and marine adventure.",
      priceEUR: 1580,
      duration: "5 days / 4 nights",
      location: "Paje, Jozani Forest and Mnemba Island",
      category: "Beach",
      images: [...tourImages.beach.slice(2), ...tourImages.forest],
      highlights: ["Paje beach stay", "Jozani Forest visit", "Mnemba Island snorkeling area", "Flexible beach days"],
      itinerary: [
        { day: 1, title: "Arrive in Paje", description: "Transfer to the east coast and settle by the beach." },
        { day: 2, title: "Paje Coast", description: "Open beach day with optional kite or lagoon activities." },
        { day: 3, title: "Jozani Forest", description: "Visit the forest and continue exploring the island interior." },
        { day: 4, title: "Mnemba Marine Day", description: "Snorkeling or boat excursion arranged by the partner." },
        { day: 5, title: "Departure", description: "Return transfer for airport, ferry or extension." }
      ],
      partner: zanzibarPartner._id,
      referralLink: zanzibarPartner.bookingURL,
      featured: false
    },
    {
      title: "Tanzania Safari and Zanzibar Signature Combination",
      description:
        "The complete Travellex sample route: northern Tanzania safari highlights, Kilimanjaro views and Zanzibar culture plus beach recovery.",
      shortDescription: "Safari first, Zanzibar second: a complete Africa holiday plan.",
      priceEUR: 3490,
      duration: "10 days / 9 nights",
      location: "Northern Tanzania and Zanzibar",
      category: "Combination",
      images: [tourImages.safari[0], tourImages.mountain[0], tourImages.beach[0], tourImages.heritage[1]],
      highlights: [
        "Lake Manyara and Ngorongoro safari days",
        "Kilimanjaro-area culture",
        "Stone Town, Forodhani and heritage stops",
        "Nungwi, Kendwa or Paje beach extension"
      ],
      itinerary: [
        { day: 1, title: "Arrive in Arusha", description: "Briefing and overnight before safari." },
        { day: 2, title: "Lake Manyara", description: "First game drive and Rift Valley scenery." },
        { day: 3, title: "Ngorongoro Highlands", description: "Move toward the crater area." },
        { day: 4, title: "Ngorongoro Crater", description: "Full crater safari day." },
        { day: 5, title: "Kilimanjaro Area", description: "Foothills culture and mountain views." },
        { day: 6, title: "Fly to Zanzibar", description: "Transfer from safari to coast." },
        { day: 7, title: "Stone Town", description: "Old Fort, Christ Church Cathedral and Forodhani." },
        { day: 8, title: "Prison Island", description: "Island visit before beach transfer." },
        { day: 9, title: "Beach Day", description: "Nungwi, Kendwa or Paje depending on traveller style." },
        { day: 10, title: "Depart", description: "Transfer for onward travel." }
      ],
      partner: northernPartner._id,
      referralLink: northernPartner.bookingURL,
      featured: true
    }
  ]);

  const passwordHash = await bcrypt.hash("Fern2341", 12);
  await User.create({
    name: "Blackbird Admin",
    email: "blackbird77ad@gmail.com",
    passwordHash,
    role: "admin",
    country: "Germany"
  });

  console.log("Seeded partners, tours and demo admin.");
  console.log("Demo admin: blackbird77ad@gmail.com / Fern2341");
  process.exit(0);
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
