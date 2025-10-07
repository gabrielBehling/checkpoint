const express = require("express");
const cookieParser = require("cookie-parser");
const eventsControllers = require("./constrollers/eventsControllers");
const teamsControllers = require("./constrollers/teamsControllers");

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use("/", eventsControllers);

app.use("/", teamsControllers);

app.get("/health", (req, res) => {
    res.json({ status: "OK", timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Events Service is running on port ${PORT}`);
});
