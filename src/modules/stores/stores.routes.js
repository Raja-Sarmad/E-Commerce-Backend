import express from "express";
import { listStores } from "./stores.controller.js";

const router = express.Router();

router.get("/", listStores);

export default router;
