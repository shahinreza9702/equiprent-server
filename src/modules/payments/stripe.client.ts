import Stripe from "stripe";

import { env } from "../../config/env.js";
import ApiError from "../../utils/api-error.js";
import HTTP_STATUS from "../../constants/http-status.js";

let stripeClient: Stripe | null = null;

// Initialize Stripe client only when required.
const getStripeClient = (): Stripe => {
  if (!env.STRIPE_SECRET_KEY) {
    throw new ApiError(
      HTTP_STATUS.SERVICE_UNAVAILABLE,
      "Payment service is not configured",
    );
  }

  if (!stripeClient) {
    stripeClient = new Stripe(env.STRIPE_SECRET_KEY);
  }

  return stripeClient;
};

export default getStripeClient;
