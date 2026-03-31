"use server";

import type { User as AuthUser } from "@clerk/nextjs/server";
import { clerkClient, currentUser } from "@clerk/nextjs/server";
import { Agency, Funnel, Lane, Plan, Prisma, Role, SubAccount, Tag, Ticket, User } from "@prisma/client";
import { redirect } from "next/navigation";
import { v4 } from "uuid";
import { db } from "./db";
import { CreateFunnelFormSchema, CreateMediaType, CreatePipeLineType, UpsertFunnelPage } from "./types";
import { z } from "zod";
import { revalidatePath } from "next/cache";

export const getUser = async (id: string) => {
    const user = await db.user.findUnique({
        where: {
            id,
        },
    });

    return user;
};

export const deleteUser = async (userId: string) => {
    await (await clerkClient()).users.updateUserMetadata(userId, {
        privateMetadata: {
            role: undefined,
        },
    });
    const deletedUser = await db.user.delete({ where: { id: userId } });
    return deletedUser;
};

export const getAuthUserDetails = async () => {
    const user = await currentUser();

    if (!user) {
        return;
    }

    const userData = await db.user.findUnique({
        where: {
            email: user.emailAddresses[0].emailAddress,
        },
        include: {
            Agency: {
                include: {
                    SidebarOption: true,
                    SubAccount: {
                        include: {
                            SidebarOption: true,
                        },
                    },
                },
            },
            Permissions: true,
        },
    });

    return userData;
};

export const saveActivityLogsNotification = async ({ agencyId, description, subAccountId }: { agencyId?: string; description?: string; subAccountId?: string }) => {
    const authUser = await currentUser();
    let userData;
    if (!authUser) {
        const response = await db.user.findFirst({
            where: {
                Agency: {
                    SubAccount: {
                        some: { id: subAccountId },
                    },
                },
            },
        });
        if (response) {
            userData = response;
        }
    } else {
        userData = await db.user.findUnique({
            where: { email: authUser?.emailAddresses[0].emailAddress },
        });
    }

    if (!userData) {
        console.log("Could not find a user");
        return;
    }

    let foundAgencyId = agencyId;
    if (!foundAgencyId) {
        if (!subAccountId) {
            throw new Error("You need to provide at least an agency Id or subAccount id");
        }

        const response = await db.subAccount.findUnique({
            where: {
                id: subAccountId,
            },
        });

        if (response) foundAgencyId = response.agencyId;
    }

    if (subAccountId) {
        await db.notification.create({
            data: {
                notification: `${userData.name} | ${description}`,
                User: {
                    connect: {
                        id: userData.id,
                    },
                },
                Agency: {
                    connect: {
                        id: foundAgencyId as string,
                    },
                },
                SubAccount: {
                    connect: {
                        id: subAccountId,
                    },
                },
            },
        });
    } else {
        await db.notification.create({
            data: {
                notification: `${userData.name} | ${description}`,
                User: {
                    connect: {
                        id: userData.id,
                    },
                },
                Agency: {
                    connect: {
                        id: foundAgencyId as string,
                    },
                },
            },
        });
    }
};

export const updateUser = async (user: Partial<User>) => {
    const response = await db.user.update({
        where: {
            email: user.email,
        },
        data: {
            ...user,
        },
    });

    const client = await clerkClient();
    
    await client.users.updateUserMetadata(response.id, {
        publicMetadata: {
            role: user.role || "SUBACCOUNT_USER",
        },
    });

    if (user.name) {
        const nameParts = user.name.split(" ");
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ") || "";
        
        await client.users.updateUser(response.id, {
            firstName,
            lastName,
        });
    }
    revalidatePath("/", "layout");
    return response;
};

export const changeUserPermission = async (permissionId: string, userEmail: string, subAccountId: string, permission: boolean) => {
    try {
        const response = await db.permissions.upsert({
            where: {
                id: permissionId,
            },
            update: {
                access: permission,
            },
            create: {
                access: permission,
                email: userEmail,
                subAccountId: subAccountId,
            },
        });
        revalidatePath("/", "layout");
        return response;
    } catch (err) {
        console.log(err);
    }
};

export const createTeamUser = async (user: User) => {
    if (user.role === "AGENCY_OWNER") return null;
    const response = await db.user.create({ data: { ...user } });
    return response;
};

export const verifyAndAcceptInvitation = async () => {
    const user = await currentUser();

    if (!user) {
        redirect("/sign-in");
    }
    const invitationExists = await db.invitation.findUnique({
        where: {
            email: user.emailAddresses[0].emailAddress,
            status: "PENDING",
        },
    });

    if (invitationExists) {
        const exitsUser = await getAuthUserDetails();

        if (exitsUser) {
            return exitsUser.agencyId;
        }

        const userDetails = await createTeamUser({
            email: invitationExists.email,
            agencyId: invitationExists.agencyId,
            avatarUrl: user.imageUrl,
            id: user.id,
            name: `${user.firstName}${user.lastName && user.lastName !== 'null' ? ` ${user.lastName}` : ""}`,
            role: invitationExists.role,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        await saveActivityLogsNotification({
            agencyId: invitationExists?.agencyId,
            description: "Joined",
            subAccountId: undefined,
        });
        if (userDetails) {
            await (await clerkClient()).users.updateUserMetadata(user.id, {
                privateMetadata: {
                    role: userDetails.role || "SUBACCOUNT_USER",
                },
            });
            await db.invitation.delete({
                where: {
                    email: userDetails.email,
                },
            });
            return userDetails.agencyId;
        } else {
            return null;
        }
    } else {
        const agency = await db.user.findUnique({
            where: {
                email: user.emailAddresses[0].emailAddress,
            },
        });

        return agency ? agency.agencyId : null;
    }
};

export const updateAgencyDetails = async (agencyId: string, agencyDetails: Partial<Agency>) => {
    const response = await db.agency.update({
        where: { id: agencyId },
        data: { ...agencyDetails },
    });
    return response;
};

export const getAgencyDetails = async (agencyId: string) => {
    const response = await db.agency.findUnique({
        where: { id: agencyId },
        include: {
            SubAccount: true,
        },
    });
    return response;
};

export const deleteAgency = async (agencyId: string) => {
    const response = await db.agency.delete({
        where: {
            id: agencyId,
        },
    });
    return response;
};

export const ensureAgencyMediaSidebarOption = async (agencyId: string) => {
    const existing = await db.agencySidebarOption.findFirst({
        where: { agencyId, name: "Media" },
    });
    if (!existing) {
        await db.agencySidebarOption.create({
            data: {
                name: "Media",
                icon: "database",
                link: `/agency/${agencyId}/media`,
                agencyId,
            },
        });
    }
};

export const initUser = async (newUser: Partial<User>) => {
    const user = await currentUser();
    if (!user) return;

    const userData = await db.user.upsert({
        where: {
            email: user.emailAddresses[0].emailAddress,
        },
        update: newUser,
        create: {
            id: user.id,
            avatarUrl: user.imageUrl,
            email: user.emailAddresses[0].emailAddress,
            name: `${user.firstName}${user.lastName && user.lastName !== 'null' ? ` ${user.lastName}` : ""}`,
            role: newUser.role || "SUBACCOUNT_USER",
        },
    });

    await (await clerkClient()).users.updateUserMetadata(user.id, {
        privateMetadata: {
            role: newUser.role || "SUBACCOUNT_USER",
        },
    });

    return userData;
};

export const upsertAgency = async (agency: Agency, price?: Plan) => {
    if (!agency.companyEmail) return null;

    try {
        const agencyDetails = await db.agency.upsert({
            where: {
                id: agency.id,
            },
            update: agency,
            create: {
                users: {
                    connect: {
                        email: agency.companyEmail,
                    },
                },
                ...agency,
                SidebarOption: {
                    create: [
                        {
                            name: "Dashboard",
                            icon: "category",
                            link: `/agency/${agency.id}`,
                        },
                        {
                            name: "Launchpad",
                            icon: "clipboardIcon",
                            link: `/agency/${agency.id}/launchpad`,
                        },
                        {
                            name: "Billing",
                            icon: "payment",
                            link: `/agency/${agency.id}/billing`,
                        },
                        {
                            name: "Settings",
                            icon: "settings",
                            link: `/agency/${agency.id}/settings`,
                        },
                        {
                            name: "Sub Accounts",
                            icon: "person",
                            link: `/agency/${agency.id}/all-subaccounts`,
                        },
                        {
                            name: "Team",
                            icon: "shield",
                            link: `/agency/${agency.id}/team`,
                        },
                        {
                            name: "Media",
                            icon: "database",
                            link: `/agency/${agency.id}/media`,
                        },
                    ],
                },
            },
        });

        return agencyDetails;
    } catch (error) {
        console.error("UPSERT AGENCY ERROR:", error);
        throw error;
    }
};

export const getNotificationAndUser = async (agencyId: string) => {
    try {
        const response = await db.notification.findMany({
            where: {
                agencyId,
            },
            include: {
                User: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });
        return response;
    } catch (error) {
        console.log(error);
    }
};

export const upsertSubAccount = async (subAccount: Partial<SubAccount> & { id: string, name: string, agencyId: string, companyEmail: string, companyPhone: string, address: string, city: string, zipCode: string, state: string, country: string, subAccountLogo: string }) => {
    if (!subAccount.companyEmail) return null;

    let agencyOwner = await db.user.findFirst({
        where: {
            Agency: {
                id: subAccount.agencyId,
            },
            role: "AGENCY_OWNER",
        },
    });

    if (!agencyOwner) {
        console.log("No AGENCY_OWNER found. Searching for AGENCY_ADMIN or falling back to current user.");
        agencyOwner = await db.user.findFirst({
            where: {
                agencyId: subAccount.agencyId,
                role: "AGENCY_ADMIN"
            }
        });
    }

    if (!agencyOwner) {
         console.log("Still no owner/admin found. Cannot assign explicit permissions, will use current user's email.");
    }
    const permissionId = v4();
    const authUser = await currentUser();
    const userEmail = authUser?.emailAddresses[0].emailAddress;
    const permissionsToCreate: any[] = [];
    
    if (agencyOwner) {
        permissionsToCreate.push({
            access: true,
            email: agencyOwner.email,
            id: permissionId,
        });
    }

    if (userEmail && (!agencyOwner || userEmail !== agencyOwner.email)) {
        permissionsToCreate.push({
            access: true,
            email: userEmail,
            id: v4(),
        });
    }

    try {
        const response = await db.subAccount.upsert({
            where: { id: subAccount.id },
            update: subAccount,
            create: {
                ...subAccount,
                Permissions: {
                    create: permissionsToCreate,
                },
                Pipeline: {
                    create: { name: "Lead Cycle" },
                },
                SidebarOption: {
                    create: [
                        {
                            name: "Launchpad",
                            icon: "clipboardIcon",
                            link: `/subaccount/${subAccount.id}/launchpad`,
                        },
                        {
                            name: "Settings",
                            icon: "settings",
                            link: `/subaccount/${subAccount.id}/settings`,
                        },
                        {
                            name: "Funnels",
                            icon: "pipelines",
                            link: `/subaccount/${subAccount.id}/funnels`,
                        },
                        {
                            name: "Media",
                            icon: "database",
                            link: `/subaccount/${subAccount.id}/media`,
                        },
                        {
                            name: "Automations",
                            icon: "chip",
                            link: `/subaccount/${subAccount.id}/automations`,
                        },
                        {
                            name: "Pipelines",
                            icon: "flag",
                            link: `/subaccount/${subAccount.id}/pipelines`,
                        },
                        {
                            name: "Contacts",
                            icon: "person",
                            link: `/subaccount/${subAccount.id}/contacts`,
                        },
                        {
                            name: "Dashboard",
                            icon: "category",
                            link: `/subaccount/${subAccount.id}`,
                        },
                    ],
                },
            },
        });
        
        return {
            id: response.id,
            name: response.name,
            agencyId: response.agencyId,
        };
    } catch (dbError) {
        console.error("UPSERT ERROR:", dbError);
        throw dbError;
    }
};

export const getUserDetailsByAuthEmail = async (authEmail: AuthUser) => {
    try {
        const response = await db.user.findUnique({
            where: {
                email: authEmail.emailAddresses[0].emailAddress,
            },
        });

        return response;
    } catch (err) {
        console.log(err);
    }
};

export const getUserPermissions = async (userId: string) => {
    const response = await db.user.findUnique({
        where: { id: userId },
        select: {
            Permissions: {
                include: {
                    SubAccount: true,
                },
            },
        },
    });

    return response;
};

export const getSubAccountDetails = async (subaccountId: string) => {
    const response = await db.subAccount.findUnique({
        where: { id: subaccountId },
    });

    return response;
};

export const deleteSubAccount = async (subaccountId: string) => {
    const response = await db.subAccount.delete({
        where: {
            id: subaccountId,
        },
    });

    return response;
};

export const addExistingUserToAgency = async (email: string, role: Role, agencyId: string) => {
    const user = await db.user.findUnique({ where: { email } });
    if (!user) return { error: "User not found." };

    const client = await clerkClient();
    await db.user.update({
        where: { email },
        data: { agencyId, role },
    });
    await client.users.updateUserMetadata(user.id, {
        privateMetadata: { role },
    });
    revalidatePath("/", "layout");
    return { added: user };
};

export const sendInvitation = async (email: string, role: Role, agencyId: string) => {
    try {
        const userExists = await db.user.findUnique({
            where: { email },
        });

        if (userExists) {
            // User is already a member of THIS agency
            if (userExists.agencyId === agencyId) {
                return { error: "This user is already a member of your team." };
            }

            // User belongs to a DIFFERENT agency
            if (userExists.agencyId && userExists.agencyId !== agencyId) {
                return { error: "This user already belongs to another agency and cannot be added." };
            }

            // User has an account but NO agency — link them directly (no email needed)
            const result = await addExistingUserToAgency(email, role, agencyId);
            if (result.error) return result;
            return { success: result.added, directAdd: true };
        }

        const invitationExists = await db.invitation.findUnique({
            where: { email }
        });
        if (invitationExists) return { error: "An invitation has already been sent to this email." };

        let clerkRes;
        try {
            clerkRes = await (await clerkClient()).invitations.createInvitation({
                emailAddress: email,
                redirectUrl: process.env.NEXT_PUBLIC_URL,
                publicMetadata: {
                    throwDeprecation: true,
                    role,
                },
            });
        } catch (error: any) {
            console.log("Clerk Error API:", JSON.stringify(error.errors, null, 2));
            const clerkErrMessage = error.errors?.[0]?.longMessage || error.errors?.[0]?.message || "Failed to create Clerk invitation. The email might already be registered.";
            return { error: clerkErrMessage };
        }

        const response = await db.invitation.create({
            data: {
                email,
                agencyId,
                role,
            },
        });

        return { success: response };
    } catch (err) {
        console.log("Error sending invitation:", err);
        return { error: "Failed to send invitation. Please try again." };
    }
};

export const getMedia = async (subaccountId: string) => {
    const response = await db.subAccount.findUnique({
        where: {
            id: subaccountId,
        },
        include: {
            Media: true,
        },
    });
    return response;
};

export const createMedia = async (subaccountId: string, media: CreateMediaType) => {
    const response = await db.media.create({
        data: {
            link: media.link,
            name: media.name,
            subAccountId: subaccountId,
        },
    });

    return response;
};

export const deleteMedia = async (mediaId: string) => {
    const response = await db.media.delete({
        where: {
            id: mediaId,
        },
    });
    return response;
};

export const getAgencyMedia = async (agencyId: string) => {
    const response = await db.subAccount.findMany({
        where: {
            agencyId,
        },
        include: {
            Media: {
                orderBy: {
                    createdAt: "desc",
                },
            },
        },
        orderBy: {
            name: "asc",
        },
    });
    return response;
};

export const getPipelineDetails = async (pipelineId: string) => {
    const response = await db.pipeline.findUnique({
        where: {
            id: pipelineId,
        },
    });

    return response;
};

export const deletePipeline = async (pipelineId: string) => {
    const response = await db.pipeline.delete({
        where: {
            id: pipelineId,
        },
    });

    return response;
};

export const getLanesWithTicketAndTags = async (pipelineId: string) => {
    const response = await db.lane.findMany({
        where: {
            pipelineId,
        },
        orderBy: {
            order: "asc",
        },
        include: {
            Tickets: {
                orderBy: {
                    order: "asc",
                },
                include: {
                    Tags: true,
                    Assigned: true,
                    Customer: true,
                },
            },
        },
    });

    return response;
};

export const upsertPipeline = async (pipeline: CreatePipeLineType) => {
    const response = await db.pipeline.upsert({
        where: {
            id: pipeline.id || v4(),
        },
        create: pipeline,
        update: pipeline,
    });

    return response;
};

export const getTicketsWithTags = async (pipelineId: string) => {
    const response = await db.ticket.findMany({
        where: {
            Lane: {
                pipelineId,
            },
        },
        include: { Tags: true, Assigned: true, Customer: true },
    });
    return response;
};

export const upsertFunnel = async (subaccountId: string, funnel: z.infer<typeof CreateFunnelFormSchema> & { liveProducts: string }, funnelId: string) => {
    const response = await db.funnel.upsert({
        where: {
            id: funnelId,
        },
        update: funnel,
        create: {
            ...funnel,
            id: funnelId || v4(),
            subAccountId: subaccountId,
        },
    });

    return response;
};

export const upsertLane = async (lane: Prisma.LaneUncheckedCreateInput) => {
    let order: number;

    if (!lane.order) {
        const lanes = await db.lane.findMany({
            where: {
                pipelineId: lane.pipelineId,
            },
        });
        order = lanes.length;
    } else {
        order = lane.order;
    }

    const response = await db.lane.upsert({
        where: {
            id: lane.id || v4(),
        },
        update: lane,
        create: {
            ...lane,
            order,
        },
    });

    return response;
};

export const deleteLane = async (laneId: string) => {
    const response = await db.lane.delete({
        where: {
            id: laneId,
        },
    });
    return response;
};

export const updateLanesOrder = async (lanes: Lane[]) => {
    try {
        const updateTrans = lanes.map((lane) =>
            db.lane.update({
                where: { id: lane.id },
                data: { order: lane.order },
            })
        );

        await db.$transaction(updateTrans);
        console.log("🟢 Done reordered 🟢");
    } catch (error) {
        console.log(error, "ERROR UPDATE LANES ORDER");
    }
};

export const updateTicketsOrder = async (tickets: Ticket[]) => {
    try {
        const updateTrans = tickets.map((ticket) =>
            db.ticket.update({
                where: { id: ticket.id },
                data: { order: ticket.order, laneId: ticket.laneId },
            })
        );

        await db.$transaction(updateTrans);
        console.log("🟢 Done reordered 🟢");
    } catch (error) {
        console.log(error, "ERROR UPDATE TICKETS ORDER");
    }
};

export const deleteTicket = async (ticketId: string) => {
    const response = await db.ticket.delete({
        where: {
            id: ticketId,
        },
    });

    return response;
};

export const _getTicketsWithAllRelations = async (laneId: string) => {
    const response = await db.ticket.findMany({
        where: { laneId: laneId },
        include: {
            Assigned: true,
            Customer: true,
            Lane: true,
            Tags: true,
        },
    });
    return response;
};

export const getSubAccountTeamMembers = async (subaccountId: string) => {
    const subaccountUsersWithAccess = await db.user.findMany({
        where: {
            Agency: {
                SubAccount: {
                    some: {
                        id: subaccountId,
                    },
                },
            },
            role: "SUBACCOUNT_USER",
            Permissions: {
                some: {
                    subAccountId: subaccountId,
                    access: true,
                },
            },
        },
    });
    return subaccountUsersWithAccess;
};

export const searchContacts = async (searchTerms: string) => {
    const response = await db.contact.findMany({
        where: {
            name: {
                contains: searchTerms,
            },
        },
    });
    return response;
};

export const upsertTicket = async (ticket: Prisma.TicketUncheckedCreateInput, tags: Tag[]) => {
    let order: number;
    if (!ticket.order) {
        const tickets = await db.ticket.findMany({
            where: { laneId: ticket.laneId },
        });
        order = tickets.length;
    } else {
        order = ticket.order;
    }

    const response = await db.ticket.upsert({
        where: {
            id: ticket.id || v4(),
        },
        update: { ...ticket, Tags: { set: tags } },
        create: { ...ticket, Tags: { connect: tags }, order },
        include: {
            Assigned: true,
            Customer: true,
            Tags: true,
            Lane: true,
        },
    });

    return response;
};

export const upsertTag = async (subaccountId: string, tag: Prisma.TagUncheckedCreateInput) => {
    const response = await db.tag.upsert({
        where: { id: tag.id || v4(), subAccountId: subaccountId },
        update: tag,
        create: { ...tag, subAccountId: subaccountId },
    });

    return response;
};

export const getTagsForSubaccount = async (subaccountId: string) => {
    const response = await db.subAccount.findUnique({
        where: { id: subaccountId },
        select: { Tags: true },
    });
    return response;
};

export const deleteTag = async (tagId: string) => {
    const response = await db.tag.delete({ where: { id: tagId } });
    return response;
};

export const getContact = async (subaccountId: string) => {
    const response = await db.subAccount.findUnique({
        where: {
            id: subaccountId,
        },
        include: {
            Contact: {
                include: {
                    Ticket: {
                        select: {
                            value: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: "asc",
                },
            },
        },
    });

    return response;
};

export const upsertContact = async (contact: Prisma.ContactUncheckedCreateInput) => {
    const response = await db.contact.upsert({
        where: { id: contact.id || v4() },
        update: contact,
        create: contact,
    });

    return response;
};

export const getFunnels = async (subaccountId: string) => {
    const response = await db.funnel.findMany({
        where: {
            subAccountId: subaccountId,
        },
        include: {
            FunnelPages: true,
        },
    });

    return response;
};

export const getFunnel = async (funnelId: string) => {
    const funnel = await db.funnel.findUnique({
        where: { id: funnelId },
        include: {
            FunnelPages: {
                orderBy: {
                    order: "asc",
                },
            },
        },
    });

    return funnel;
};

export const upsertFunnelPage = async (subaccountId: string, funnelPage: UpsertFunnelPage, funnelId: string) => {
    if (!subaccountId || !funnelId) return;

    const response = await db.funnelPage.upsert({
        where: {
            id: funnelPage.id || "",
        },
        update: {
            ...funnelPage,
        },
        create: {
            ...funnelPage,
            content: funnelPage.content
                ? funnelPage.content
                : JSON.stringify([
                      {
                          content: [],
                          id: "__body",
                          name: "Body",
                          styles: {
                              backgroundColor: "white",
                              type: "_body",
                          },
                      },
                  ]),
            funnelId,
        },
    });

    revalidatePath(`/subaccount/${subaccountId}/funnels/${funnelId}`);
    return response;
};

export const deleteFunnelsPage = async (funnelPageId: string) => {
    const response = await db.funnelPage.delete({
        where: {
            id: funnelPageId,
        },
    });

    return response;
};

export const updateFunnelProducts = async (products: string, funnelId: string) => {
    const data = await db.funnel.update({
        where: { id: funnelId },
        data: { liveProducts: products },
    });

    return data;
};

export const getFunnelPageDetails = async (funnelPageId: string) => {
    const data = await db.funnelPage.findUnique({
        where: {
            id: funnelPageId,
        },
    });
    return data;
};