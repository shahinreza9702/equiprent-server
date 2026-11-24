
import type { RequestHandler } from "express";
import type Stripe from "stripe";

import getStripeClient from "./stripe.client.js";
import paymentWebhookService from "./payment.webhook.service.js";

import { env } from "../../config/env.js";

const handleStripeWebhook: RequestHandler = async (req, res) => {
    const signature = req.headers["stripe-signature"];

    if (!signature || Array.isArray(signature)) {
        res.status(400).json({
            success: false,
            message: "Missing Stripe signature",
        });
        return;
    }

    if (!env.STRIPE_WEBHOOK_SECRET) {
        res.status(503).json({
            success: false,
            message: "Stripe webhook is not configured",
        });
        return;
    }

    if (!Buffer.isBuffer(req.body)) {
        res.status(400).json({
            success: false,
            message: "Invalid webhook request body",
        });
        return;
    }

    let payload: { object?: string };

    try {
        payload = JSON.parse(req.body.toString("utf8")) as {
            object?: string;
        };
    } catch {
        res.status(400).json({
            success: false,
            message: "Invalid webhook payload",
        });
        return;
    }

    const stripe = getStripeClient();

    // Handle Stripe Thin Event Notifications.
    if (payload.object === "v2.core.event") {
        let eventNotification;

        try {
            eventNotification = stripe.parseEventNotification(
                req.body,
                signature,
                env.STRIPE_WEBHOOK_SECRET,
            );
        } catch (error) {
            console.error(
                "Stripe thin event signature verification failed:",
                error,
            );

            res.status(400).json({
                success: false,
                message: "Invalid Stripe webhook signature",
            });
            return;
        }

        try {

            switch (eventNotification.type) {
                case "v1.checkout.session.completed": {
                    const checkoutSession =
                        (await eventNotification.fetchRelatedObject()) as Stripe.Checkout.Session;

                    await paymentWebhookService.handleCheckoutSessionCompleted(
                        checkoutSession,
                    );

                    break;
                }

                case "v1.refund.updated": {
                    const refund =
                        (await eventNotification.fetchRelatedObject()) as Stripe.Refund;

                    await paymentWebhookService.handleRefundUpdated(refund);

                    break;
                }

                default: {
                    console.log(
                        "Ignored Stripe thin event:",
                        eventNotification.type,
                    );
                    break;
                }
            }


            res.status(200).json({
                success: true,
                received: true,
            });
            return;
        } catch (error) {
            console.error("Stripe thin event processing failed:", error);

            res.status(500).json({
                success: false,
                message: "Webhook processing failed",
            });
            return;
        }
    }

    // Handle traditional Stripe Snapshot Events.
    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            signature,
            env.STRIPE_WEBHOOK_SECRET,
        );
    } catch (error) {
        console.error(
            "Stripe snapshot event signature verification failed:",
            error,
        );

        res.status(400).json({
            success: false,
            message: "Invalid Stripe webhook signature",
        });
        return;
    }

    try {
        switch (event.type) {
            case "checkout.session.completed": {
                const checkoutSession =
                    event.data.object as Stripe.Checkout.Session;

                await paymentWebhookService.handleCheckoutSessionCompleted(
                    checkoutSession,
                );

                break;
            }

            case "refund.updated": {
                const refund = event.data.object as Stripe.Refund;

                await paymentWebhookService.handleRefundUpdated(refund);

                break;
            }

            default: {
                console.log("Ignored Stripe snapshot event:", event.type);
                break;
            }
        }

        res.status(200).json({
            success: true,
            received: true,
        });
    } catch (error) {
        console.error("Stripe snapshot event processing failed:", error);

        res.status(500).json({
            success: false,
            message: "Webhook processing failed",
        });
    }
};

export const paymentWebhookController = {
    handleStripeWebhook,
};
