import { NextRequest, NextResponse } from "next/server";

import slugify from "slugify";

import { institutions } from "@/app/data/institutions";

export async function POST(req: NextRequest) {
  const { botToken, chatId } = (await req.json()) as {
    botToken?: string;
    chatId?: string;
  };

  if (!botToken || !chatId) {
    return NextResponse.json({ status: "not ok" });
  }

  const position = Math.floor(Math.random() * (institutions.length + 1));
  const photoSlug = `qr-${slugify(String(institutions[position].name), {
    lower: true,
    strict: true,
  })}.png`;

  // feel free to fork and change this
  const photoUrl = `https://raw.githubusercontent.com/afrieirham/sedekahje-qr-generator/refs/heads/main/QR/${photoSlug}`;
  await fetch(
    `https://api.telegram.org/bot${botToken}/sendPhoto?chat_id=${chatId}&photo=${photoUrl}`
  );

  return NextResponse.json({ status: "ok" });
}
