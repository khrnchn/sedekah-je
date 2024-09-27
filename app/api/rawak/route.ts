import { NextRequest, NextResponse } from "next/server";

import puppeteer from "puppeteer-core";

import { institutions } from "@/app/data/institutions";
import { slugify } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const baseUrl = "http://sedekahje.com";
  const random = Math.floor(Math.random() * (institutions.length + 1));

  const { botToken, chatId } = (await req.json()) as {
    botToken?: string;
    chatId?: string;
  };

  if (!botToken || !chatId) {
    return NextResponse.json({ status: "not ok" });
  }

  // generate screenshot from /qr/:slug
  const browser = await puppeteer.launch({ channel: "chrome" });
  const page = await browser.newPage();
  await page.goto(`${baseUrl}/qr/${slugify(institutions[random].name)}`, {
    waitUntil: "networkidle2",
  });
  const base64Screenshot = await page.screenshot({ encoding: "base64" });
  await browser.close();

  // convert to buffer
  const buffer = Buffer.from(base64Screenshot, "base64");
  const formData = new FormData();
  formData.append("chat_id", chatId);
  formData.append("photo", new Blob([buffer], { type: "image/png" }));

  await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
    method: "POST",
    body: formData,
  });

  return NextResponse.json({ status: "ok" });
}
