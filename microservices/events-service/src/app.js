const express = require("express");
const cookieParser = require("cookie-parser");
const path = require("path");

const responseMiddleware = require("./responseMiddleware");

const eventsControllers = require("./controllers/eventsControllers");
const teamsControllers = require("./controllers/teamsControllers");
const matchControlles = require("./controllers/matchControllers");

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(responseMiddleware);

app.use("/uploads/banners", express.static(path.join(__dirname, "..", "uploads", "banners")));

app.use("/", teamsControllers);

app.use("/", eventsControllers);

app.use("/", matchControlles)

// Serve static banner files

app.get("/health", (req, res) => {
    res.success({ status: "OK" }, "Service is healthy");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Events Service is running on port ${PORT}`);
});
