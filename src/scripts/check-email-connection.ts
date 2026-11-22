
import { emailService } from "../services/email.service.js";

const checkEmailConnection = async () => {
    try {
        const isConfigured =
            await emailService.verifyEmailConnection();

        if (!isConfigured) {
            console.error("SMTP configuration is incomplete");
            process.exitCode = 1;
            return;
        }

        console.log("Gmail SMTP connection verified successfully");
    } catch (error) {
        console.error("SMTP connection verification failed");

        if (error instanceof Error) {
            console.error(error.message);
        }

        process.exitCode = 1;
    }
};

await checkEmailConnection();
