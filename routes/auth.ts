import express from "express";
import { Login, Signup, Verify } from "../controllers/auth";

const router = express.Router();

router.post("/signup", Signup);
router.post("/login", Login);
router.get("/:id/verify/:token",Verify)
export default router;
