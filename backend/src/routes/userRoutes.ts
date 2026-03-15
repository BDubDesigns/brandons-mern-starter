import { Router } from "express";
import { requireAuth } from "@clerk/express";
import { getCurrentUser } from "../controllers/userController.js";

const router = Router();

// All user routes require a valid Clerk session
router.use(requireAuth());

router.get("/me", getCurrentUser);

export default router;
