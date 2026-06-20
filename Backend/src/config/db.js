const dns = require("node:dns");
const mongoose = require("mongoose");

function parseDnsServers(value = "") {
  return value
    .split(",")
    .map((server) => server.trim())
    .filter(Boolean);
}

function isLoopbackDnsServer(server) {
  return server === "::1" || server === "[::1]" || server.startsWith("127.");
}

function configureMongoSrvDns(mongoUri) {
  if (!mongoUri.startsWith("mongodb+srv://")) {
    return;
  }

  const configuredServers = parseDnsServers(process.env.MONGO_DNS_SERVERS);

  if (configuredServers.length > 0) {
    dns.setServers(configuredServers);
    console.log(`MongoDB DNS servers: ${configuredServers.join(", ")}`);
    return;
  }

  const currentServers = dns.getServers();
  const shouldUseDevFallback =
    process.env.NODE_ENV !== "production" &&
    currentServers.length > 0 &&
    currentServers.every(isLoopbackDnsServer);

  if (shouldUseDevFallback) {
    const fallbackServers = ["1.1.1.1", "8.8.8.8"];
    dns.setServers(fallbackServers);
    console.warn(
      `MongoDB SRV DNS was using ${currentServers.join(
        ", "
      )}; using ${fallbackServers.join(", ")} for Atlas lookup.`
    );
  }
}

async function connectDB() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is required. Add it to Backend/.env before starting the API.");
  }

  configureMongoSrvDns(process.env.MONGO_URI);

  mongoose.set("strictQuery", true);
  const connection = await mongoose.connect(process.env.MONGO_URI);
  console.log(`MongoDB connected: ${connection.connection.host}`);
}

module.exports = connectDB;
