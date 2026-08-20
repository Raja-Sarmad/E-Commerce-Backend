import express from "express";
const router = express.Router();

import authenticate from "../../middlewares/authenticate.js";
import * as wishlistController from "./wishlist.controller.js";
import { param } from "express-validator";
import validate from "../../middlewares/validate.js";

const productIdRule = [param("productId").isMongoId().withMessage("Invalid product id."), validate];

router.use("/", authenticate);
router.get("/", wishlistController.getWishlist);
router.post("/:productId", productIdRule, wishlistController.addProduct);
router.delete("/:productId", productIdRule, wishlistController.removeProduct);
router.delete("/", wishlistController.clearWishlist);

export default router;
