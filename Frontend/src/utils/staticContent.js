import forodhaniImage from "../assets/photos/Forodhani Zanzibar-seafood.jpg";
import stoneTownImage from "../assets/photos/Aerial-View-Stone-Town-Zanzibar.jpg";
import christChurchImage from "../assets/photos/Christ church cathedral Zanzibar.jpg";
import isimilaImage from "../assets/photos/Isimila in iringa -tall-rock.jpg";
import jozaniImage from "../assets/photos/Jozani forest Zanzibar.jpg";
import jozaniGalleryImage from "../assets/photos/Jozani forest Zanzibar-tourist-gallery.jpg";
import kendwaImage from "../assets/photos/Kendwa-Beach-Zanzibar.jpg";
import kilimanjaroImage from "../assets/photos/Mountain-kilimanjaro-Tanzania1.jpg";
import kilimanjaroGalleryImage from "../assets/photos/mount-kilimanjaro-tourist-gallery.jpg";
import lakeManyaraGalleryImage from "../assets/photos/lake-manyara-national-park-tourist-gallery.jpg";
import manyaraImage from "../assets/photos/manyara-national-park-lion.jpg";
import manyaraElephantGalleryImage from "../assets/photos/manyara-national-park-elephantN-tourist-gallery.jpg";
import mikumiImage from "../assets/photos/Mikumi-national-park-tourist-in-vehicle-and-tigers-closeup.jpg";
import mnembaImage from "../assets/photos/zanzibar-mnemba-island-snorkeling-and-dolphin-tour-from-kendwa-beach-tourist.webp";
import ngorongoroImage from "../assets/photos/Ngorongoro-National-Park-Tanzania-crater.webp";
import ngorongoroGalleryImage from "../assets/photos/The Ngorongoro-crater-tour-gallery.jpg";
import nungwiImage from "../assets/photos/Nungwi beach Zanzibar-homepage.jpg";
import oldFortImage from "../assets/photos/Old fort Zanzibar.webp";
import oldFortGalleryImage from "../assets/photos/Old fort Zanzibar-tourist-gallery.webp";
import pajeImage from "../assets/photos/Paje_Zanzibar-kiting.webp";
import prisonIslandImage from "../assets/photos/Zanzibar_Prison_Island_Aldabra_Giant_Tortoise-tourist-gallery.jpg";

const rawDestinationStories = [
  {
    name: "Mount Kilimanjaro",
    hook: "Stand on the Roof of Africa.",
    description:
      "At 5,895 meters, Kilimanjaro is the world’s tallest free-standing mountain. This walkable icon needs no technical climbing, but it asks for patience, acclimatisation and a crew that knows the mountain’s moods.",
    cta: "Climb with certified trekking teams, safer pacing and summit support that respects the mountain.",
    buttonLabel: "Browse Kilimanjaro",
    category: "Mountain",
    region: "Northern Tanzania",
    image: kilimanjaroImage,
    link: "/tours?location=Kilimanjaro"
  },
  {
    name: "Lake Manyara National Park",
    hook: "Tree-climbing lions and pink horizons.",
    description:
      "Beneath the Great Rift Valley escarpment, Manyara compresses forests, soda lake, elephants and birdlife into one beautifully varied park. Look for lions resting in acacia branches and flamingos softening the lake edge.",
    cta: "Add a compact safari day that pairs easily with Ngorongoro, Arusha or a northern-circuit route.",
    buttonLabel: "Explore Manyara",
    category: "Safari",
    region: "Northern Circuit",
    image: manyaraImage,
    link: "/tours?location=Manyara"
  },
  {
    name: "Mikumi National Park",
    hook: "The Serengeti of the South.",
    description:
      "Wide savannahs and open horizons make Mikumi one of Tanzania’s easiest wildlife escapes. It is especially useful for Zanzibar travellers who want a short, value-friendly safari without losing beach days.",
    cta: "Choose a seamless fly-in safari when time is short but the wildlife dream is not.",
    buttonLabel: "Find Mikumi trips",
    category: "Safari",
    region: "Southern Tanzania",
    image: mikumiImage,
    link: "/tours?location=Mikumi"
  },
  {
    name: "Paje Beach",
    hook: "Zanzibar’s wind-bright kitesurfing coast.",
    description:
      "Paje moves with steady trade winds, shallow turquoise lagoons and a relaxed beach-village rhythm. At low tide, the ocean pulls back to reveal sandbanks, seaweed farms and long barefoot walks.",
    cta: "Book lessons, eco-stays and wind-shaped beach days on Zanzibar’s east coast.",
    buttonLabel: "Discover Paje",
    category: "Beach",
    region: "Zanzibar",
    image: pajeImage,
    link: "/tours?location=Paje"
  },
  {
    name: "Forodhani Night Market",
    hook: "A sizzling waterfront feast after sunset.",
    description:
      "As evening settles over Stone Town, Forodhani Gardens fills with lanterns, grills and the smell of spice. Taste seafood skewers, sugarcane juice and the beloved savoury Zanzibar pizza beside the water.",
    cta: "Let a local guide turn one evening into a food story you can taste and remember.",
    buttonLabel: "Taste Forodhani",
    category: "Food",
    region: "Stone Town",
    image: forodhaniImage,
    link: "/tours?location=Forodhani"
  },
  {
    name: "Stone Town",
    hook: "A living labyrinth of coral and spice.",
    description:
      "This UNESCO World Heritage maze holds narrow alleys, coral-stone walls, brass-studded Omani doors and a layered history shaped by African, Arab, Indian and European currents.",
    cta: "Walk the old city with a certified guide who can make every doorway and courtyard speak.",
    buttonLabel: "Walk Stone Town",
    category: "Heritage",
    region: "Zanzibar",
    image: stoneTownImage,
    link: "/tours?location=Stone Town"
  },
  {
    name: "Prison Island",
    hook: "Meet the ancient giant tortoises.",
    description:
      "A short boat ride from Stone Town reaches Changuu Island, once used for quarantine and now known for tropical water, soft history and Aldabra giant tortoises that can live beyond 150 years.",
    cta: "Plan an easy half-day boat escape with time for history, wildlife and clear-water views.",
    buttonLabel: "Visit Prison Island",
    category: "Island",
    region: "Zanzibar",
    image: prisonIslandImage,
    link: "/tours?location=Prison Island"
  },
  {
    name: "Christ Church Cathedral",
    hook: "A monument to resilience and freedom.",
    description:
      "Built over East Africa’s last permanent slave market, this coral-stone cathedral carries one of Stone Town’s most moving stories. It is a place to slow down, listen and remember.",
    cta: "Choose a respectful heritage walk that treats the site with the depth it deserves.",
    buttonLabel: "Learn the history",
    category: "Heritage",
    region: "Stone Town",
    image: christChurchImage,
    link: "/tours?location=Christ Church Cathedral"
  },
  {
    name: "Old Fort",
    hook: "Stone Town’s oldest stage for culture.",
    description:
      "Built by Omani Arabs in 1698, the Old Fort has moved from military stronghold to creative gathering place. Its open-air amphitheater hosts music, festivals and local craft energy.",
    cta: "Add the Old Fort when you want Stone Town’s history to end with rhythm, art and night air.",
    buttonLabel: "See Old Fort",
    category: "Culture",
    region: "Stone Town",
    image: oldFortImage,
    link: "/tours?location=Old Fort"
  },
  {
    name: "Ngorongoro Crater",
    hook: "Africa’s volcanic Garden of Eden.",
    description:
      "Descend 600 meters into a collapsed caldera sheltering thousands of large mammals. This self-contained safari world is one of East Africa’s strongest chances to see black rhino in a single day.",
    cta: "Go deep into the crater with trusted 4x4 crews and a route paced for the best light.",
    buttonLabel: "Explore Ngorongoro",
    category: "Safari",
    region: "Northern Circuit",
    image: ngorongoroImage,
    link: "/tours?location=Ngorongoro"
  },
  {
    name: "Isimila Stone Age Site",
    hook: "Walk a canyon shaped by deep time.",
    description:
      "In the Southern Highlands, wind-sculpted sandstone pillars rise above dry riverbeds where early hominids left stone handaxes hundreds of thousands of years ago.",
    cta: "Step beyond the classic circuit with Iringa cultural guides and a route that rewards curiosity.",
    buttonLabel: "Go to Isimila",
    category: "Archaeology",
    region: "Iringa",
    image: isimilaImage,
    link: "/tours?location=Isimila"
  },
  {
    name: "Kendwa Beach",
    hook: "Constant tides, white sand and night life.",
    description:
      "Kendwa is a postcard beach with deep water that stays swimmable through the day. By evening, the soft white sand shifts into one of Zanzibar’s most social coastal scenes.",
    cta: "Build a beach finish with luxury stays, water sports and a little after-dark electricity.",
    buttonLabel: "Stay in Kendwa",
    category: "Beach",
    region: "Zanzibar North",
    image: kendwaImage,
    link: "/tours?location=Kendwa"
  },
  {
    name: "Nungwi Beach",
    hook: "Dhow builders, reefs and crimson sunsets.",
    description:
      "At Zanzibar’s northern tip, Nungwi blends dhow-building tradition with resort energy, sunset cruises, turtle conservation and easy access to scuba and snorkelling days.",
    cta: "Choose northern Zanzibar when you want culture, comfort and the island’s richest sunset glow.",
    buttonLabel: "Experience Nungwi",
    category: "Beach",
    region: "Zanzibar North",
    image: nungwiImage,
    link: "/tours?location=Nungwi"
  },
  {
    name: "Jozani Chwaka Bay Forest",
    hook: "Search for the rare red colobus monkey.",
    description:
      "Zanzibar’s only national park protects groundwater forest, mangrove boardwalks and the playful, white-whiskered red colobus monkey, found nowhere else on earth.",
    cta: "Meet Zanzibar’s wild green side with a guided nature trek through forest and mangrove shade.",
    buttonLabel: "Walk Jozani",
    category: "Nature",
    region: "Zanzibar",
    image: jozaniImage,
    link: "/tours?location=Jozani"
  },
  {
    name: "Mnemba Island Atoll",
    hook: "Snorkelling the African Maldives.",
    description:
      "The private island stays exclusive, but the surrounding conservation waters are open for reef trips. Expect bright coral gardens, warm turquoise water and possible dolphin encounters.",
    cta: "Reserve a premium snorkelling cruise when the ocean is the whole point of the day.",
    buttonLabel: "Snorkel Mnemba",
    category: "Marine",
    region: "Zanzibar",
    image: mnembaImage,
    link: "/tours?location=Mnemba"
  }
];

const destinationFacts = {
  "Mount Kilimanjaro": {
    bestTime: "Jan-Mar / Jun-Oct",
    vibe: "Summit trek",
    priceLevel: "$$$",
    entryFee: "Permit required",
    tags: ["Safari", "Wildlife"]
  },
  "Lake Manyara National Park": {
    bestTime: "Jun-Oct",
    vibe: "Safari",
    priceLevel: "$$",
    entryFee: "Park fee",
    tags: ["Safari", "Wildlife"]
  },
  "Mikumi National Park": {
    bestTime: "Jun-Oct",
    vibe: "Fly-in safari",
    priceLevel: "$$",
    entryFee: "Park fee",
    tags: ["Safari", "Wildlife"]
  },
  "Paje Beach": {
    bestTime: "Jun-Sep",
    vibe: "Kitesurfing",
    priceLevel: "$$",
    entryFee: "Free",
    tags: ["Zanzibar"]
  },
  "Forodhani Night Market": {
    bestTime: "Year-round",
    vibe: "Street food",
    priceLevel: "$",
    entryFee: "Free",
    tags: ["Zanzibar", "Historical"]
  },
  "Stone Town": {
    bestTime: "Jun-Oct",
    vibe: "Heritage walk",
    priceLevel: "$$",
    entryFee: "Free",
    tags: ["Zanzibar", "Historical"]
  },
  "Prison Island": {
    bestTime: "Jun-Oct",
    vibe: "Boat escape",
    priceLevel: "$$",
    entryFee: "Island fee",
    tags: ["Zanzibar", "Wildlife", "Historical"]
  },
  "Christ Church Cathedral": {
    bestTime: "Year-round",
    vibe: "History",
    priceLevel: "$",
    entryFee: "Small fee",
    tags: ["Zanzibar", "Historical"]
  },
  "Old Fort": {
    bestTime: "Year-round",
    vibe: "Culture",
    priceLevel: "$",
    entryFee: "Free",
    tags: ["Zanzibar", "Historical"]
  },
  "Ngorongoro Crater": {
    bestTime: "Jun-Oct",
    vibe: "Big safari",
    priceLevel: "$$$",
    entryFee: "Crater fee",
    tags: ["Safari", "Wildlife"]
  },
  "Isimila Stone Age Site": {
    bestTime: "May-Oct",
    vibe: "Archaeology",
    priceLevel: "$",
    entryFee: "Guide fee",
    tags: ["Historical"]
  },
  "Kendwa Beach": {
    bestTime: "Jun-Oct",
    vibe: "Beach nightlife",
    priceLevel: "$$",
    entryFee: "Free",
    tags: ["Zanzibar"]
  },
  "Nungwi Beach": {
    bestTime: "Jun-Oct",
    vibe: "Sunset coast",
    priceLevel: "$$",
    entryFee: "Free",
    tags: ["Zanzibar", "Wildlife"]
  },
  "Jozani Chwaka Bay Forest": {
    bestTime: "Jun-Oct",
    vibe: "Forest wildlife",
    priceLevel: "$",
    entryFee: "Park fee",
    tags: ["Zanzibar", "Wildlife"]
  },
  "Mnemba Island Atoll": {
    bestTime: "Jul-Mar",
    vibe: "Snorkelling",
    priceLevel: "$$$",
    entryFee: "Marine fee",
    tags: ["Zanzibar", "Wildlife"]
  }
};

export const destinationStories = rawDestinationStories.map((story) => ({
  ...story,
  bestTime: destinationFacts[story.name]?.bestTime || "Jun-Oct",
  vibe: destinationFacts[story.name]?.vibe || story.category,
  priceLevel: destinationFacts[story.name]?.priceLevel || "$$",
  entryFee: destinationFacts[story.name]?.entryFee || "Ask operator",
  tags: destinationFacts[story.name]?.tags || [story.category]
}));

export const destinations = destinationStories.map(({ name, image, link }) => ({ name, image, link }));

export const gallerySeedMedia = [
  {
    _id: "seed-jozani-tourist-gallery",
    title: "Jozani Forest Boardwalk",
    description: "A shaded forest moment with Zanzibar's rare wildlife and mangrove pathways.",
    mediaType: "image",
    url: jozaniGalleryImage,
    location: "Jozani Chwaka Bay Forest",
    tags: ["Zanzibar", "Wildlife"],
    tourLink: "/tours?location=Jozani",
    creditName: "FernwehSafari"
  },
  {
    _id: "seed-lake-manyara-tourist-gallery",
    title: "Lake Manyara Safari Gate",
    description: "A northern-circuit safari stop with forest, escarpment views and lake wildlife.",
    mediaType: "image",
    url: lakeManyaraGalleryImage,
    location: "Lake Manyara National Park",
    tags: ["Safari", "Wildlife"],
    tourLink: "/tours?location=Manyara",
    creditName: "FernwehSafari"
  },
  {
    _id: "seed-manyara-elephant-gallery",
    title: "Manyara Elephant Encounter",
    description: "A close wildlife scene from one of Tanzania's compact but diverse safari parks.",
    mediaType: "image",
    url: manyaraElephantGalleryImage,
    location: "Lake Manyara National Park",
    tags: ["Safari", "Wildlife"],
    tourLink: "/tours?location=Manyara",
    creditName: "FernwehSafari"
  },
  {
    _id: "seed-kilimanjaro-tourist-gallery",
    title: "Kilimanjaro Trail Moment",
    description: "Mountain air, trekking pace and the feeling of moving toward the Roof of Africa.",
    mediaType: "image",
    url: kilimanjaroGalleryImage,
    location: "Mount Kilimanjaro",
    tags: ["Safari"],
    tourLink: "/tours?location=Kilimanjaro",
    creditName: "FernwehSafari"
  },
  {
    _id: "seed-old-fort-tourist-gallery",
    title: "Old Fort Cultural Stop",
    description: "Stone Town history, coral walls and the cultural heart of Zanzibar's old city.",
    mediaType: "image",
    url: oldFortGalleryImage,
    location: "Old Fort",
    tags: ["Zanzibar", "Historical"],
    tourLink: "/tours?location=Old Fort",
    creditName: "FernwehSafari"
  },
  {
    _id: "seed-ngorongoro-tour-gallery",
    title: "Ngorongoro Crater View",
    description: "A dramatic crater landscape built for one of East Africa's most memorable safari days.",
    mediaType: "image",
    url: ngorongoroGalleryImage,
    location: "Ngorongoro Crater",
    tags: ["Safari", "Wildlife"],
    tourLink: "/tours?location=Ngorongoro",
    creditName: "FernwehSafari"
  },
  {
    _id: "seed-prison-island-gallery",
    title: "Prison Island Giant Tortoise",
    description: "A half-day Zanzibar island escape with heritage, boat views and ancient tortoises.",
    mediaType: "image",
    url: prisonIslandImage,
    location: "Prison Island",
    tags: ["Zanzibar", "Wildlife", "Historical"],
    tourLink: "/tours?location=Prison Island",
    creditName: "FernwehSafari"
  }
];

export const galleryImages = gallerySeedMedia.map((item) => item.url);

export const testimonials = [
  {
    name: "Anna Keller",
    country: "Germany",
    tour: "Ngorongoro and Manyara Safari",
    rating: 5,
    quote: "FernwehSafari helped us compare the crater, Lake Manyara and Zanzibar before choosing the route."
  },
  {
    name: "Lukas Weber",
    country: "Austria",
    tour: "Kilimanjaro and Zanzibar Combination",
    rating: 5,
    quote: "The route felt clear from the first enquiry: mountain views, safari days and a proper beach finish."
  },
  {
    name: "Sophie Laurent",
    country: "France",
    tour: "Stone Town and North Coast Escape",
    rating: 5,
    quote: "We wanted culture, Forodhani, Prison Island and Nungwi. The tour options made the route easy to understand."
  }
];

export const faqs = [
  {
    question: "How do I book a tour?",
    answer:
      "Choose a tour, send any questions you have, then continue to the selected tour booking page when you are ready."
  },
  {
    question: "Can I ask questions before booking?",
    answer:
      "Yes. Submit an enquiry with your dates, group size, travel style and questions. FernwehSafari will follow up with next steps."
  },
  {
    question: "Which destinations can I ask about?",
    answer:
      "You can enquire about Ngorongoro, Kilimanjaro, Lake Manyara, Mikumi, Isimila, Stone Town, Nungwi, Kendwa, Paje, Jozani Forest, Mnemba Island, Prison Island and other Tanzania or Zanzibar routes."
  },
  {
    question: "Are prices shown in euros?",
    answer: "Yes. Tour listing prices are displayed in EUR for European travellers."
  },
  {
    question: "Is FernwehSafari based in Tanzania?",
    answer:
      "FernwehSafari is built for travellers planning from Europe, with a strong focus on Germany and nearby European markets."
  },
  {
    question: "Can tour operators become partners?",
    answer:
      "Yes. Tour operators can open the Partner page, log in if already approved, or apply to become a partner. FernwehSafari reviews the company profile before publishing access is given."
  }
];
