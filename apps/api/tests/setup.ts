import { prisma } from '../src/lib/prisma';

export const resetDatabase = async () => {
  await prisma.content.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.userOrganization.deleteMany();
  await prisma.team.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.user.deleteMany();
};

export const disconnect = async () => {
  await prisma.$disconnect();
};
