import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  try {
    const userEmail = "thepeeyushyadav0@gmail.com";
    
    // Simulate initUser
    console.log("Creating User...");
    const user = await prisma.user.upsert({
      where: { email: userEmail },
      update: { role: "AGENCY_OWNER" },
      create: {
        id: "clerk_id_123",
        avatarUrl: "",
        email: userEmail,
        name: "Piyush Pal",
        role: "AGENCY_OWNER"
      }
    });

    console.log("User Created:", user.id);

    // Simulate upsertAgency
    console.log("Creating Agency...");
    const agency = await prisma.agency.upsert({
      where: { id: "agency_id_123" },
      update: {},
      create: {
        id: "agency_id_123",
        users: { connect: { email: userEmail } },
        customerId: "rzp_cust_123",
        address: "Test Address",
        agencyLogo: "",
        city: "Test City",
        companyPhone: "1234567890",
        country: "India",
        name: "My Test Agency",
        state: "MP",
        whiteLabel: true,
        zipCode: "123456",
        companyEmail: userEmail,
        connectAccountId: "",
        goal: 5,
        SidebarOption: {
          create: [
            { name: "Dashboard", icon: "category", link: "/agency/123" }
          ]
        }
      }
    });

    console.log("Agency Created:", agency.id);
  } catch (error) {
    console.error("PRISMA CRASHED:", error);
  } finally {
    await prisma.$disconnect();
  }
}

run();
