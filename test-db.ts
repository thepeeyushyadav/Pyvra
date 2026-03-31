import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const q: any = await import('./src/lib/queries');
  if (!q || !q.upsertSubAccount) return console.log('cant import queries');
  
  try {
    const res = await q.upsertSubAccount({
        id: '123',
        address: 'test',
        subAccountLogo: 'test',
        city: 'test',
        companyPhone: 'test',
        country: 'test',
        name: 'test',
        state: 'test',
        zipCode: 'test',
        createdAt: new Date(),
        updatedAt: new Date(),
        companyEmail: 'thepeeyushyadav0@gmail.com',
        agencyId: 'a8b4e8bc-b80f-4843-9d92-569938205daf',
        connectAccountId: "",
        goal: 5000,
    });
    console.log('Result:', res);
  } catch (e) {
    console.error('Caught error:', e);
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
