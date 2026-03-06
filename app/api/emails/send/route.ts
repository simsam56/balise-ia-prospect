import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  buildProspectionBody,
  buildProspectionSubject,
  EmailLength,
  EmailTone,
} from "@/lib/email-templates";
import { sendEmailViaResend } from "@/lib/emailSender";
import { prisma } from "@/lib/db";

const payloadSchema = z.object({
  leadId: z.string().uuid(),
  subject: z.string().max(250).optional(),
  body: z.string().max(10000).optional(),
  ton: z.enum(["professionnel", "amical", "technique", "consulting"]).optional(),
  longueur: z.enum(["court", "moyen", "long"]).optional(),
});

function toHtml(text: string): string {
  return text.replace(/\n/g, "<br/>");
}

export async function POST(request: NextRequest) {
  try {
    const payload = payloadSchema.parse(await request.json());

    const lead = await prisma.lead.findUnique({
      where: { id: payload.leadId },
      include: {
        contact: {
          include: {
            entreprise: true,
          },
        },
      },
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead introuvable." }, { status: 404 });
    }
    if (!lead.contact.emailPro.trim()) {
      return NextResponse.json(
        { error: "Email professionnel manquant pour ce contact." },
        { status: 400 },
      );
    }

    const context = {
      prenom: lead.contact.prenom,
      nom: lead.contact.nom,
      poste: lead.contact.poste,
      entreprise: lead.contact.entreprise.nom,
      secteur: lead.contact.entreprise.secteurActivite,
      ville: lead.contact.entreprise.ville,
      priorite: lead.priorite as "A" | "B" | "C",
      descriptionActivite: lead.contact.entreprise.descriptionActivite,
      motsCles: lead.contact.entreprise.motsCles,
    };

    const subject =
      payload.subject ||
      buildProspectionSubject(context.priorite, context.entreprise);
    const body =
      payload.body ||
      buildProspectionBody({
        lead: context,
        tone: (payload.ton || "consulting") as EmailTone,
        length: (payload.longueur || "moyen") as EmailLength,
      });

    const result = await sendEmailViaResend({
      to: lead.contact.emailPro,
      subject,
      html: toHtml(body),
    });

    await prisma.emailLog.create({
      data: {
        leadId: lead.id,
        subject,
        body,
        provider: "resend",
        status: result.status,
        messageId: result.messageId ?? undefined,
        sentAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      status: result.status,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: "Erreur envoi email." }, { status: 500 });
  }
}
