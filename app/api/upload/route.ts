import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { auth } from "@/lib/auth";

// Configure Cloudinary from the environment variable provided by user
cloudinary.config({
    cloudinary_url: process.env.CLOUDINARY_URL
});

export async function POST(request: NextRequest) {
    try {
        // BUG-04 FIX: Wajib login sebagai admin untuk upload gambar produk
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session || session.user.role !== "admin") {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ message: "No file provided" }, { status: 400 });
        }

        // Limit to 2MB
        if (file.size > 2 * 1024 * 1024) {
            return NextResponse.json({ message: "File size too large (max 2MB)" }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Upload to Cloudinary using a promise to handle the stream/callback
        const uploadResult = (await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: "netcatalog",
                    resource_type: "auto",
                },
                (error, result) => {
                    if (error) reject(error);
                    else if (!result) reject(new Error("Upload failed"));
                    else resolve(result);
                }
            );
            uploadStream.end(buffer);
        })) as { secure_url: string; public_id: string };


        return NextResponse.json({
            url: uploadResult.secure_url,
            public_id: uploadResult.public_id
        });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json(
            { message: "Upload failed" },
            { status: 500 }
        );
    }
}
