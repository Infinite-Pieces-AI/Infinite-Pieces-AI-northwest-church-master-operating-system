import { z } from "zod";

const optionalTrimmed = (maximum: number) =>
  z
    .string()
    .trim()
    .max(maximum)
    .optional()
    .or(z.literal(""))
    .transform((value) => value || undefined);

const optionalEmail = z
  .string()
  .trim()
  .email()
  .max(254)
  .optional()
  .or(z.literal(""))
  .transform((value) => value || undefined);

export const recoveryInterestSchema = z
  .object({
    firstName: z.string().trim().min(1).max(80),
    contactMethod: z.enum(["email", "phone"]),
    email: optionalEmail,
    phone: optionalTrimmed(40),
    interestType: z.enum([
      "church_peer_support",
      "online_conversation",
      "family_support",
      "treatment_resources",
      "general_question",
    ]),
    message: optionalTrimmed(3000),
    consentToContact: z.literal(true),
    sourcePath: z.string().trim().max(300).default("/recovery-support-lowell"),
    campaign: optionalTrimmed(200),
    website: z.string().max(0).optional(),
  })
  .superRefine((value, context) => {
    if (value.contactMethod === "email" && !value.email) {
      context.addIssue({
        code: "custom",
        path: ["email"],
        message: "Enter an email address.",
      });
    }
    if (value.contactMethod === "phone" && !value.phone) {
      context.addIssue({
        code: "custom",
        path: ["phone"],
        message: "Enter a phone number.",
      });
    }
  });

export type RecoveryInterestInput = z.infer<typeof recoveryInterestSchema>;
