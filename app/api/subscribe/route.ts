import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
	const { email } = await req.json();
	if (!email) {
		return NextResponse.json({ error: "Email is required" }, { status: 400 });
	}

	try {
		const transporter = nodemailer.createTransport({
			service: "gmail",
			auth: {
				user: process.env.SMTP_USER,
				pass: process.env.SMTP_PASS,
			},
		});

		//

		await transporter.sendMail({
			from: `"Sedekah.je" <${process.env.SMTP_USER}>`,
			to: email,
			subject: "Welcome to Sedekah.je 🕌",
			html: `
        <h2>Assalamualaikum!</h2>
        <p>Thank you for subscribing to Sedekah.je.</p>
        <p>We'll send you weekly Masjid QR updates soon 🌙</p>
      `,
		});

		console.log("✅ Email sent and saved:", email);

		// can add to database

		return NextResponse.json({ success: true });
	} catch (err) {
		console.error("Email error:", err);
		return NextResponse.json(
			{ error: "Failed to send or save email" },
			{ status: 500 },
		);
	}
}
