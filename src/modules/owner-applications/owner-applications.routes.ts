import { Router } from "express";

import authMiddleware from "../../middlewares/auth.middleware.js";
import authorizeRoles from "../../middlewares/role.middleware.js";
import { ownerApplicationController } from "./owner-applications.controller.js";

const router = Router();

router.use(authMiddleware, authorizeRoles("customer"));

router.post("/", ownerApplicationController.createApplication);
router.get("/me", ownerApplicationController.getMyApplication);

export default router;