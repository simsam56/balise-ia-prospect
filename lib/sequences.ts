import { PrismaClient } from "@prisma/client";

import { buildStepDate, getSequenceById } from "@/lib/sequenceCatalog";

export async function enrollLeadInSequence(
  prisma: PrismaClient,
  input: { leadId: string; sequenceId: string },
) {
  const sequence = getSequenceById(input.sequenceId);
  if (!sequence) {
    throw new Error("Sequence inconnue.");
  }

  const startDate = new Date();
  startDate.setHours(9, 0, 0, 0);
  const firstStep = sequence.steps[0];

  const enrollment = await prisma.sequenceEnrollment.create({
    data: {
      leadId: input.leadId,
      sequenceId: sequence.id,
      currentStep: 0,
      startDate,
      nextSendDate: buildStepDate(startDate, firstStep.dayOffset),
      status: "active",
    },
  });

  for (const step of sequence.steps) {
    await prisma.activity.create({
      data: {
        leadId: input.leadId,
        titre: `${sequence.nom} - ${step.label}`,
        description: `Etape sequence ${sequence.id} (${step.type})`,
        type: "email",
        statut: "a_faire",
        dueDate: buildStepDate(startDate, step.dayOffset),
        autoRuleKey: `${sequence.id}_step_${step.dayOffset}`,
      },
    });
  }

  return enrollment;
}
