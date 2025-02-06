var express = require("express");
var helmet = require("helmet");
var path = require("path");
var cookieParser = require("cookie-parser");
var bodyParser = require("body-parser");

const app = express();

app.use(helmet());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.send("Checkpoint!");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, (e) => {
    if (!e) {
        console.log("Server is running on port " + PORT);
    } else {
        console.log("Error starting server: " + e);
    }
});
