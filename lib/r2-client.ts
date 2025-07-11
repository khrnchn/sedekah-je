import { randomUUID } from "node:crypto";
import {
	DeleteObjectCommand,
	GetObjectCommand,
	PutObjectCommand,
	S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "../env";

// Create R2 client
const r2Client = new S3Client({
	region: "auto",
	endpoint: env.R2_ENDPOINT,
	credentials: {
		accessKeyId: env.R2_ACCESS_KEY_ID,
		secretAccessKey: env.R2_SECRET_ACCESS_KEY,
	},
});

export class R2Storage {
	private bucketName: string;

	constructor() {
		this.bucketName = env.R2_BUCKET_NAME;
	}

	/**
	 * Upload a file to R2
	 */
	async uploadFile(file: Buffer, originalFilename: string): Promise<string> {
		const ext = originalFilename.split(".").pop() ?? "png";
		const filename = `uploads/${randomUUID()}.${ext}`;

		const command = new PutObjectCommand({
			Bucket: this.bucketName,
			Key: filename,
			Body: file,
			ContentType: this.getContentType(ext),
		});

		await r2Client.send(command);

		// Return the public URL
		return `${env.R2_PUBLIC_URL}/${filename}`;
	}

	/**
	 * Delete a file from R2
	 */
	async deleteFile(fileUrl: string): Promise<void> {
		const key = this.extractKeyFromUrl(fileUrl);

		const command = new DeleteObjectCommand({
			Bucket: this.bucketName,
			Key: key,
		});

		await r2Client.send(command);
	}

	/**
	 * Get a signed URL for temporary access (if needed)
	 */
	async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
		const command = new GetObjectCommand({
			Bucket: this.bucketName,
			Key: key,
		});

		return await getSignedUrl(r2Client, command, { expiresIn });
	}

	/**
	 * Extract the key from a full R2 URL
	 */
	private extractKeyFromUrl(url: string): string {
		const urlParts = url.split("/");
		return urlParts.slice(-2).join("/"); // Get 'uploads/filename.ext'
	}

	/**
	 * Get content type based on file extension
	 */
	private getContentType(ext: string): string {
		const contentTypes: Record<string, string> = {
			png: "image/png",
			jpg: "image/jpeg",
			jpeg: "image/jpeg",
			gif: "image/gif",
			webp: "image/webp",
			bmp: "image/bmp",
			svg: "image/svg+xml",
		};

		return contentTypes[ext.toLowerCase()] || "application/octet-stream";
	}
}

// Export a singleton instance
export const r2Storage = new R2Storage();
