import { institutions } from "@/app/data/institutions";
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import QRCode from "qrcode";

//fetch email from database, rn hardcoded
const subscribers = ["umarsyakir16@gmail.com"];

export async function GET() {
	try {
		// SMTP transporter
		const transporter = nodemailer.createTransport({
			service: "gmail",
			auth: {
				user: process.env.SMTP_USER,
				pass: process.env.SMTP_PASS,
			},
		});

		// Pick a random institution
		const randomInstitution =
			institutions[Math.floor(Math.random() * institutions.length)];

		if (!randomInstitution.qrContent) {
			console.error(
				"❌ QR content missing for institution:",
				randomInstitution.name,
			);
			return NextResponse.json(
				{ error: "QR content missing for institution" },
				{ status: 500 },
			);
		}

		const qrBase64 = await QRCode.toDataURL(randomInstitution.qrContent);
		const base64Data = qrBase64.replace(/^data:image\/png;base64,/, "");

		const paymentInfo: Record<string, { name: string; color: string }> = {
			duitnow: { name: "DuitNow", color: "#ED2C67" },
			tng: { name: "Touch 'n Go", color: "#015ABF" },
			boost: { name: "Boost", color: "#FF3333" },
		};

		const paymentType = randomInstitution.supportedPayment?.[0];
		const paymentLabel = paymentType
			? (paymentInfo[paymentType]?.name ?? "N/A")
			: "N/A";
		const cardColor = paymentType
			? (paymentInfo[paymentType]?.color ?? "#ffffff")
			: "#ffffff";

		// Send emails to subscribers
		for (const to of subscribers) {
			await transporter.sendMail({
				from: `"Sedekah.je" <${process.env.SMTP_USER}>`,
				to,
				subject: "Weekly Masjid QR Update 🕌",
				html: `
<div style="font-family: 'Poppins', Arial, sans-serif; background-color: #62f84b; padding: 40px 20px; text-align: center;">
  <div style="margin-bottom: 30px;">
    <h1 style="margin:0; font-size:36px; color:#1a202c;">SedekahJe</h1>
    <p style="margin:5px 0 0 0; font-size:16px; color:#555;">Here’s your weekly random Masjid QR.</p>
  </div>
  <div style="display: inline-block; background-color: ${cardColor}; padding: 25px 20px; border-radius: 16px; box-shadow: 0 6px 18px rgba(0,0,0,0.1); text-align: center; margin-bottom: 20px; color: #fff;">
    <h3 style="margin:0 0 10px 0; font-size:20px;">${randomInstitution.name}</h3>
    <p style="display: inline-block; margin:0 0 15px 0; font-size:16px; font-weight:600;">${paymentLabel}</p>
    <br/>
    <img src="cid:qrimage" width="200" height="200" alt="QR Code" style="border-radius:12px; background-color:#fff; padding:5px;" />
  </div>
  <div style="font-size: 14px; color: #222; background-color: #e6f4ea; padding: 15px 20px; border-radius: 12px; line-height: 1.6;">
    <p style="margin:0;">Dalam sebuah hadis yang diriwayatkan daripada Abu Hurairah R.A, bahawa Rasulullah SAW telah bersabda:</p>
    <p style="margin:10px 0; font-style:italic;">إِذَا مَاتَ الإِنْسَانُ انْقَطَعَ عَنْهُ عَمَلُهُ إِلاَّ مِنْ ثَلاَثَةٍ إِلاَّ مِنْ صَدَقَةٍ جَارِيَةٍ أَوْ عِلْمٍ يُنْتَفَعُ بِهِ أَوْ وَلَدٍ صَالِحٍ يَدْعُو لَهُ ‏</p>
    <p style="margin:0;">Maksudnya: “Apabila mati seorang manusia, terputuslah daripadanya amalannya kecuali tiga perkara: Sedekah jariah atau ilmu yang dimanfaatkan dengannya atau anak yang soleh yang mendoakan baginya." </p>
    <p style="margin:5px 0 0 0; font-size:12px; color:#555;">Riwayat Muslim (1631), al-Nasa’i (3651), al-Tirmizi (1376) dan Abu Daud (2880)</p>
  </div>
</div>
        `,
				attachments: [
					{
						filename: "qr.png",
						content: Buffer.from(base64Data, "base64"),
						cid: "qrimage",
					},
				],
			});
		}

		console.log("✅ Weekly emails sent at", new Date());
		return NextResponse.json({ success: true });
	} catch (error) {
		console.error(error);
		return NextResponse.json({ error }, { status: 500 });
	}
}
