import express from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";

import mainRouter from "./routes/index.js";

const app = express();

app.use(helmet());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(mainRouter);

const PORT = process.env.PORT || 3000;

app.listen(PORT, (e) => {
    if (!e) {
        console.log("Server is running on http://localhost:" + PORT);
    } else {
        console.log("Error starting server: " + e);
    }
});
