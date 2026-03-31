import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function clean() {
    await prisma.user.deleteMany({ where: { email: "thepeeyushyadav0@gmail.com" } });
    console.log("Cleanup done.");
}
clean().finally(() => prisma.$disconnect());
