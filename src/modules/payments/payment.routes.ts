
import { Router } from "express";

import { paymentController } from "./payment.controller.js";
import { paymentVerificationController } from "./payment.verification.controller.js";

import authMiddleware from "../../middlewares/auth.middleware.js";
import authorizeRoles from "../../middlewares/role.middleware.js";

const router = Router();

// Owner: Get earnings and payment transactions.
router.get(
  "/owner/earnings",
  authMiddleware,
  authorizeRoles("owner"),
  paymentController.getOwnerEarnings,
);

// Customer: Create a Stripe Checkout Session.
router.post(
  "/checkout-session",
  authMiddleware,
  authorizeRoles("customer"),
  paymentController.createCheckoutSession,
);

// Customer: Verify a Checkout Session.
router.get(
  "/checkout-session/:sessionId",
  authMiddleware,
  authorizeRoles("customer"),
  paymentVerificationController.verifyCheckoutSession,
);

export default router;
