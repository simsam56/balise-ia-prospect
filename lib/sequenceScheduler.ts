import { PrismaClient } from "@prisma/client";

import {
  buildProspectionBody,
  buildProspectionSubject,
  LeadEmailContext,
} from "@/lib/email-templates";
import { sendEmailViaResend } from "@/lib/emailSender";
import { buildStepDate, getSequenceById } from "@/lib/sequenceCatalog";

function asHtml(body: string): string {
  return body.replace(/\n/g, "<br/>");
}

function buildStepPrefix(stepType: string): string {
  if (stepType === "FOLLOW_UP") return "[Relance] ";
  if (stepType === "VALUE") return "[Cas d usage] ";
  if (stepType === "OFFER") return "[Proposition] ";
  if (stepType === "BREAKUP") return "[Dernier message] ";
  return "";
}

export async function processSequences(prisma: PrismaClient): Promise<{
  processed: number;
  completed: number;
  failed: number;
}> {
  const now = new Date();

  const enrollments = await prisma.sequenceEnrollment.findMany({
    where: {
      status: "active",
      nextSendDate: {
        lte: now,
      },
    },
    include: {
      lead: {
        include: {
          contact: {
            include: {
              entreprise: true,
            },
          },
        },
      },
    },
    orderBy: [{ nextSendDate: "asc" }],
  });

  let processed = 0;
  let completed = 0;
  let failed = 0;

  for (const enrollment of enrollments) {
    const sequence = getSequenceById(enrollment.sequenceId);
    if (!sequence) {
      await prisma.sequenceEnrollment.update({
        where: { id: enrollment.id },
        data: { status: "stopped" },
      });
      failed += 1;
      continue;
    }

    const step = sequence.steps[enrollment.currentStep];
    if (!step) {
      await prisma.sequenceEnrollment.update({
        where: { id: enrollment.id },
        data: { status: "completed" },
      });
      completed += 1;
      continue;
    }

    const emailContext: LeadEmailContext = {
      prenom: enrollment.lead.contact.prenom,
      nom: enrollment.lead.contact.nom,
      poste: enrollment.lead.contact.poste,
      entreprise: enrollment.lead.contact.entreprise.nom,
      secteur: enrollment.lead.contact.entreprise.secteurActivite,
      ville: enrollment.lead.contact.entreprise.ville,
      priorite: enrollment.lead.priorite as "A" | "B" | "C",
      descriptionActivite: enrollment.lead.contact.entreprise.descriptionActivite,
      motsCles: enrollment.lead.contact.entreprise.motsCles,
    };

    const baseSubject = buildProspectionSubject(
      emailContext.priorite,
      emailContext.entreprise,
    );
    const subject = `${buildStepPrefix(step.type)}${baseSubject}`;
    const body = buildProspectionBody({
      lead: emailContext,
      tone: "consulting",
      length: "moyen",
    });

    if (!enrollment.lead.contact.emailPro.trim()) {
      failed += 1;
      await prisma.emailLog.create({
        data: {
          leadId: enrollment.leadId,
          subject,
          body,
          provider: "resend",
          status: "failed_no_email",
          sentAt: new Date(),
        },
      });
      continue;
    }

    try {
      const result = await sendEmailViaResend({
        to: enrollment.lead.contact.emailPro,
        subject,
        html: asHtml(body),
      });

      await prisma.emailLog.create({
        data: {
          leadId: enrollment.leadId,
          subject,
          body,
          provider: "resend",
          status: result.status,
          messageId: result.messageId ?? undefined,
          sentAt: new Date(),
        },
      });

      const nextStepIndex = enrollment.currentStep + 1;
      const nextStep = sequence.steps[nextStepIndex];

      if (!nextStep) {
        await prisma.sequenceEnrollment.update({
          where: { id: enrollment.id },
          data: {
            currentStep: nextStepIndex,
            status: "completed",
          },
        });
        completed += 1;
      } else {
        await prisma.sequenceEnrollment.update({
          where: { id: enrollment.id },
          data: {
            currentStep: nextStepIndex,
            nextSendDate: buildStepDate(enrollment.startDate, nextStep.dayOffset),
          },
        });
      }

      processed += 1;
    } catch (error) {
      failed += 1;
      await prisma.emailLog.create({
        data: {
          leadId: enrollment.leadId,
          subject,
          body,
          provider: "resend",
          status: "failed",
          sentAt: new Date(),
        },
      });
      console.error(error);
    }
  }

  return { processed, completed, failed };
}
