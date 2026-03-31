import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    console.log('--- USERS ---');
    const users = await prisma.user.findMany();
    console.log(users);
    console.log('--- AGENCIES ---');
    const agencies = await prisma.agency.findMany();
    console.log(agencies);
}
main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
