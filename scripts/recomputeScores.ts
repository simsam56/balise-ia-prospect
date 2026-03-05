import { prisma } from "../lib/db";
import { recomputeAllLeadScores } from "../lib/scoring";

async function main() {
  const result = await recomputeAllLeadScores(prisma);
  console.log(`[score] ${result.updatedCount} leads recalcules.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
