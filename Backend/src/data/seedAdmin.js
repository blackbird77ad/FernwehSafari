const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/User");

dotenv.config();

const adminEmail = (process.env.SEED_ADMIN_EMAIL || "blackbird77ad@gmail.com").toLowerCase();
const adminPassword = process.env.SEED_ADMIN_PASSWORD || "Fern2341";
const adminName = process.env.SEED_ADMIN_NAME || "Blackbird Admin";
const adminCountry = process.env.SEED_ADMIN_COUNTRY || "Germany";

async function seedAdmin() {
  if (adminPassword.length < 8) {
    throw new Error("SEED_ADMIN_PASSWORD must be at least 8 characters.");
  }

  await connectDB();

  const passwordHash = await bcrypt.hash(adminPassword, 12);
  const user = await User.findOneAndUpdate(
    { email: adminEmail },
    {
      $set: {
        name: adminName,
        email: adminEmail,
        passwordHash,
        role: "admin",
        country: adminCountry
      }
    },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );

  console.log(`Admin account ready: ${user.email}`);
  await mongoose.connection.close();
  process.exit(0);
}

seedAdmin().catch(async (error) => {
  console.error(error);
  await mongoose.connection.close();
  process.exit(1);
});
