const dotenv = require("dotenv");

dotenv.config();

const app = require("./src/app");
const connectDB = require("./src/config/db");

const port = Number.parseInt(process.env.PORT || "5000", 10);

async function startServer() {
  await connectDB();

  app.listen(port, () => {
    console.log(`FernwehSafari API running on http://localhost:${port}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start API server:", error.message);
  process.exit(1);
});
