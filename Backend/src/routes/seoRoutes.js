const express = require("express");
const { robots, sitemap } = require("../controllers/seoController");

const router = express.Router();

router.get("/robots.txt", robots);
router.get("/sitemap.xml", sitemap);

module.exports = router;
