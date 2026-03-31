import { createUploadthing, type FileRouter } from "uploadthing/next";
import { auth } from "@clerk/nextjs/server";

const f = createUploadthing();

const authenticateUser = async () => {
    const { userId } = await auth();

    if (!userId) throw new Error("Unauthorized");

    return { userId };
};

export const ourFileRouter = {
    subaccountLogo: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
        .middleware(authenticateUser)
        .onUploadComplete(() => {}),
    avatar: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
        .middleware(authenticateUser)
        .onUploadComplete(() => {}),
    agencyLogo: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
        .middleware(authenticateUser)
        .onUploadComplete(() => {}),
    media: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
        .middleware(authenticateUser)
        .onUploadComplete(() => {}),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;