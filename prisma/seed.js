/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  if (!email) {
    throw new Error("Usage: node prisma/seed.js user@example.com");
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new Error(`User not found: ${email}`);
  }

  const memberships = await prisma.membership.findMany({
    where: { userId: user.id },
  });

  if (memberships.length > 0) {
    console.log("User already has organization memberships.");
    return;
  }

  const organization = await prisma.organization.create({
    data: {
      name: `${user.name ?? email.split("@")[0]}'s Organization`,
      slug: `org-${user.id.slice(0, 6)}`,
    },
  });

  await prisma.membership.create({
    data: {
      userId: user.id,
      organizationId: organization.id,
      role: "OWNER",
    },
  });

  console.log("Created organization and membership:", organization.id);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
