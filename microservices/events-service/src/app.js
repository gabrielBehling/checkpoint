const express = require("express");
const cookieParser = require("cookie-parser");
const eventsControllers = require("./controllers/eventsControllers");
const teamsControllers = require("./controllers/teamsControllers");
const matchControlles = require("./controllers/matchControllers");

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(responseMiddleware);

app.use("/", eventsControllers);

app.use("/", matchControlles)

app.use("/", teamsControllers);

app.get("/health", (req, res) => {
    res.success({ status: "OK" }, "Service is healthy");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Events Service is running on port ${PORT}`);
});
