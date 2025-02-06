import { Router } from "express";

import { getHome } from "../controllers/index.js"; 

const mainRouter = Router();

mainRouter.get("/", getHome);

export default mainRouter;