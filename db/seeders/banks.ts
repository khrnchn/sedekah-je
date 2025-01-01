import { banks } from "../schema";
import { db } from "..";
import { PoolClient } from "pg";

export async function seedBanks(client: PoolClient) {
  const bankData = [
    { code: "ABB0232", name: "Affin Bank Berhad" },
    { code: "ABB0233", name: "Affin Bank Berhad B2C" },
    { code: "ABMB0212", name: "Alliance Bank Malaysian Berhad B2C" },
    { code: "ABMB0213", name: "Alliance Bank Malaysian Berhad B2B" },
    { code: "AMBB0208", name: "AmBank Malaysia Berhad B2B" },
    { code: "AMBB0209", name: "AmBank Malaysia Berhad B2C" },
    { code: "BCBB0235", name: "CIMB Bank Berhad" },
    { code: "BIMB0340", name: "Bank Islam Malaysia Berhad" },
    { code: "BMMB0341", name: "Bank Muamalat Malaysia Berhad" },
    { code: "BMMB0342", name: "Bank Muamalat Malaysia Berhad B2B" },
    { code: "BKRM0602", name: "Bank Kerjasama Rakyat Malaysia B2C" },
    { code: "BSN0601", name: "Bank Simpanan Nasional" },
    { code: "DBB0199", name: "Deutsche Bank (Malaysia) Berhad" },
    { code: "HLB0224", name: "Hong Leong Bank Berhad" },
    { code: "HLB0225", name: "Hong Leong Bank Berhad B2B2" },
    { code: "HSBC0223", name: "HSBC Bank Berhad FPX" },
    { code: "KFH0346", name: "Kuwait Finance House" },
    { code: "MB2U0227", name: "Malayan Banking Berhad (M2U)" },
    { code: "MBB0227", name: "Malayan Banking Berhad (M2E)" },
    { code: "MBB0228", name: "Malayan Banking Berhad B2B" },
    { code: "OCBC0229", name: "OCBC Bank Malaysia Berhad" },
    { code: "PBB0233", name: "Public Bank Berhad" },
    { code: "RHB0218", name: "RHB Bank Berhad" },
    { code: "SCB0215", name: "Standard Chartered Bank Malaysia Berhad B2B" },
    { code: "SCB0216", name: "Standard Chartered Bank Malaysia Berhad B2C" },
    { code: "TPAGHL", name: "GHL CardPay Sdn Bhd" },
    { code: "TPAIPAY88", name: "Mobile88.com Sdn Bhd" },
    { code: "TPAMOLPAY", name: "MOL Pay Sdn Bhd" },
    { code: "TPAREVENUE", name: "Revenue Harvest Sdn Bhd" },
    { code: "UOB0226", name: "United Overseas Bank B2C" },
    { code: "UOB0227", name: "United Overseas Bank B2B1" },
    { code: "UOB0228", name: "United Overseas Bank B2B1 Regional" },
  ];

  await db.insert(banks).values(bankData);
  console.log("✅ Banks seeding completed successfully");
}


