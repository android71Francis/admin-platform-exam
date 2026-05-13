import { PrismaClient, Role, ContentStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: { email: 'admin@example.com', password: passwordHash, name: 'Super Admin' },
  });

  const alice = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: { email: 'alice@example.com', password: passwordHash, name: 'Alice Smith' },
  });

  const bob = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: { email: 'bob@example.com', password: passwordHash, name: 'Bob Jones' },
  });

  const carol = await prisma.user.upsert({
    where: { email: 'carol@example.com' },
    update: {},
    create: { email: 'carol@example.com', password: passwordHash, name: 'Carol White' },
  });

  const orgAlpha = await prisma.organization.upsert({
    where: { id: 'seed-org-alpha' },
    update: {},
    create: { id: 'seed-org-alpha', name: 'Alpha Corp' },
  });

  const orgBeta = await prisma.organization.upsert({
    where: { id: 'seed-org-beta' },
    update: {},
    create: { id: 'seed-org-beta', name: 'Beta Inc' },
  });

  const teamDev = await prisma.team.upsert({
    where: { id: 'seed-team-dev' },
    update: {},
    create: { id: 'seed-team-dev', name: 'Development', organizationId: orgAlpha.id },
  });

  const teamDesign = await prisma.team.upsert({
    where: { id: 'seed-team-design' },
    update: {},
    create: { id: 'seed-team-design', name: 'Design', organizationId: orgBeta.id },
  });

  const memberships = [
    { userId: admin.id, organizationId: orgAlpha.id, role: Role.FULL },
    { userId: admin.id, organizationId: orgBeta.id, role: Role.FULL },
    { userId: alice.id, organizationId: orgAlpha.id, role: Role.FULL },
    { userId: bob.id, organizationId: orgAlpha.id, role: Role.READ },
    { userId: carol.id, organizationId: orgBeta.id, role: Role.READ },
  ];
  for (const m of memberships) {
    await prisma.userOrganization.upsert({
      where: { userId_organizationId: { userId: m.userId, organizationId: m.organizationId } },
      update: { role: m.role },
      create: m,
    });
  }

  const teamMembers = [
    { userId: alice.id, teamId: teamDev.id },
    { userId: bob.id, teamId: teamDev.id },
    { userId: carol.id, teamId: teamDesign.id },
  ];
  for (const tm of teamMembers) {
    await prisma.teamMember.upsert({
      where: { userId_teamId: tm },
      update: {},
      create: tm,
    });
  }

  const existingContent = await prisma.content.count();
  if (existingContent === 0) {
    await prisma.content.createMany({
      data: [
        { title: 'Getting Started Guide', body: 'Welcome to the platform. This guide walks you through your first steps.', status: ContentStatus.PUBLISHED, assignedToId: alice.id },
        { title: 'API Documentation Draft', body: 'Our REST API exposes endpoints for orgs, teams, users, and content.', status: ContentStatus.DRAFT, assignedToId: alice.id },
        { title: 'Q2 Release Notes', body: 'New features in Q2: role-based access, audit logs, mobile preview.', status: ContentStatus.PUBLISHED, assignedToId: bob.id },
        { title: 'Team Handbook', body: 'How we work, what we value, and how we collaborate across teams.', status: ContentStatus.PUBLISHED, assignedToId: bob.id },
        { title: 'Design System v1', body: 'Tokens, components, and patterns for the upcoming product redesign.', status: ContentStatus.DRAFT, assignedToId: carol.id },
      ],
    });
  }

  console.log('Seed complete:');
  console.log('  Users:', await prisma.user.count());
  console.log('  Orgs:', await prisma.organization.count());
  console.log('  Teams:', await prisma.team.count());
  console.log('  Memberships:', await prisma.userOrganization.count());
  console.log('  Content:', await prisma.content.count());
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
