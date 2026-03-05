import { Resend } from "resend";

const RESEND_FROM = "Simon Hingant <simon@balise-ia.fr>";

export async function sendEmailViaResend(input: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ messageId: string | null; status: "sent" | "mocked" | "failed" }> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    if (process.env.NODE_ENV === "development") {
      return {
        messageId: null,
        status: "mocked",
      };
    }
    throw new Error("RESEND_API_KEY manquant.");
  }

  const resend = new Resend(apiKey);
  const result = await resend.emails.send({
    from: RESEND_FROM,
    to: [input.to],
    subject: input.subject,
    html: input.html,
  });

  if (result.error) {
    throw new Error(result.error.message);
  }

  return {
    messageId: result.data?.id ?? null,
    status: "sent",
  };
}
