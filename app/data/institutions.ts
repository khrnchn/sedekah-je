import { Institution } from "../types/institutions";

export const institutions: Institution[] = [
  {
    id: 1,
    name: "Masjid Negara",
    category: "mosque",
    location: "Kuala Lumpur",
    image: "/masjid/masjid-negara.png",
    qrContent:
      "00020201021126420014A000000615000101066033460210MD001295465204939953034585802MY5913MASJID NEGARA6002MY627303251704936237869008996045430052017072988178750084448071617049359619050076304FD9C",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    id: 2,
    name: "Masjid Al Ghufran",
    category: "mosque",
    location: "Kuala Lumpur",
    image: "/masjid/masjid-al-ghufran.png",
    qrContent:
      "00020201021126520014A000000615000101068900530220MDN162217666262104305204866153034585802MY5915MASJIDALGHUFRAN6011KUALALUMPUR6304AC7A",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    id: 3,
    name: "Masjid Al Muhtadin",
    category: "mosque",
    location: "Selangor",
    image: "/masjid/masjid-al-muhtadin.png",
    qrContent:
      "00020101021126580014A000000615000101065887340212MBBQR124979103100000000000520400005303458540500.005802MY5918MASJID AL MUHTADIN6008SELANGOR630414E7",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    id: 4,
    name: "Masjid Ar Rahman",
    category: "mosque",
    location: "Kuala Lumpur",
    image: "/masjid/masjid-ar-rahman.png",
    qrContent: "https://qr.tngdigital.com.my/m/281011056697947085062292043",
    supportedPayment: ["tng"],
  },
  {
    id: 5,
    name: "Masjid Lama Kampung Sura",
    category: "mosque",
    location: "Terengganu",
    image: "/masjid/masjid-lama-kampung-sura-mlks.png",
    // QR not clear
  },
  {
    id: 6,
    name: "Surau As Salam Seksyen 4",
    category: "surau",
    location: "Selangor",
    image: "/surau/surau-as-salam-seksyen-4.png",
    qrContent:
      "00020201021126580014A000000615000101065887340212MBBQR2119996031000000000005204729953034585802MY5925SURAU AS SALAM SEKSYEN 4 6008SELANGOR6304B9C3",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    id: 7,
    name: "Masjid Sri Sendayan",
    category: "mosque",
    location: "Negeri Sembilan",
    image: "/masjid/masjid-sri-sendayan.png",
    qrContent:
      "00020201021126580014A000000615000101065641600226125510400006590RHBQR0028055204739953034585802MY5919MASJID SRI SENDAYAN6002MY61057195062240309ROA0030360707mss20198264037ECE3BEE396FD9E7293AE400C6B61FF31B756E8D308F44D79C9CA7FA859E8763047E35",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    id: 8,
    name: "Masjid Putra Heights",
    category: "mosque",
    location: "Selangor",
    image: "/masjid/masjid-putra-heights.png",
    qrContent:
      "00020101021126580014A000000615000101065887340212MBBQR117311803100000000000520400005303458540500.005802MY5920MASJID PUTRA HEIGHTS6008SELANGOR6304C677",
    supportedPayment: ["duitnow"],
  },
  {
    id: 9,
    name: "Masjid Azzubair Ibnul Awwam",
    category: "mosque",
    location: "Kuala Lumpur",
    image: "/masjid/masjid-azzubair-ibnul-awwam.jpeg",
    qrContent:
      "00020201021126420014A000000615000101066033460210MD000952735204866153034585802MY5925MASJID AZZUBAIR IBNUL AWW6002MY6273032516766078843470026415087370520167767757301000106090716167660762452600963040358",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    id: 10,
    name: "Masjid Lestari Putra",
    category: "mosque",
    location: "Selangor",
    image: "/masjid/masjid-lestari-putra.jpeg",
    qrContent:
      "00020101021126580014A000000615000101065887340212MBBQR125821103100000000000520400005303458540500.005802MY5920MASJID LESTARI PUTRA6008SELANGOR630496E4",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    id: 11,
    name: "Masjid Bandar Saujana Putra",
    category: "mosque",
    location: "Selangor",
    image: "/masjid/masjid-bandar-saujana-putra.jpeg",
    qrContent:
      "00020201021126420014A000000615000101066033460210MD001297425204866153034585802MY5925MASJID BANDAR SAUJANA PUT6002MY6273032517055541622240053677717220520170555416742900110190716170555380608800463040DF7",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    id: 12,
    name: "Masjid Al Ansar",
    category: "mosque",
    location: "Kuala Lumpur",
    image: "/masjid/masjid-al-ansar.jpeg",
    qrContent:
      "00020201021126580014A000000615000101065887340212MBBQR2010245031000000000005204000053034585802MY5915MASJID AL ANSAR6015WP KUALA LUMPUR6304F6A0",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    id: 13,
    name: "Masjid Tuminah Hamidi",
    category: "mosque",
    location: "Perak",
    image: "/masjid/masjid-tuminah-hamidi.jpeg",
    qrContent:
      "00020201021126900014A0000006150001010642070902240824441100029031J97442000315BSN Merchant QR0411011255099085204000053034585802MY5921MASJID TUMINAH HAMIDI6011BAGAN DATOH6105361006304E5D7",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    id: 14,
    name: "Rumah Bakti Nur Ain",
    category: "others",
    location: "Selangor",
    image: "/lain/rumah-bakti-nur-ain.jpeg",
    qrContent:
      "00020201021126580014A000000615000101065887340212MBBQR1959819031000000000005204000053034585802MY5919RUMAH BAKTI NUR AIN6008SELANGOR630416E7",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    id: 15,
    name: "Masjid Jamek Al Manar",
    category: "mosque",
    location: "Johor",
    image: "/masjid/masjid-jamek-al-manar.jpeg",
    // QR not clear
  },
  {
    id: 16,
    name: "Masjid Tengku Ampuan Afzan",
    category: "mosque",
    location: "Pahang",
    image: "/masjid/masjid-tengku-ampuan-afzan.jpeg",
    // QR not clear
  },
  {
    id: 17,
    name: "Masjid UTM KL",
    category: "mosque",
    location: "Kuala Lumpur",
    image: "/masjid/masjid-utmkl.jpeg",
    qrContent:
      "00020201021126420014A000000615000101066033460210MD000721595204866153034585802MY5912MASJID UTMKL6002MY62730325165579551440400458665376805201655795602599001013207161655794994299008630426C5",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    id: 18,
    name: "Surau Al Ikhlasiah",
    category: "surau",
    location: "Selangor",
    image: "/placeholder.png",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000225031001921366955204866153034585802MY5918SURAU AL-IKHLASIAH6006AMPANG6105680006304ADB9",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    id: 19,
    name: "Masjid Al Mustaqim",
    category: "mosque",
    location: "Selangor",
    image: "/placeholder.png",
    qrContent:
      "00020201021126620014A000000615000101065641670215QRMID00000003890311011100924415204866153034585802MY5925MASJID AL MUSTAQIM AMPANG6006AMPANG6105680006304F9D2",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    id: 20,
    name: "Surau Al Umm",
    category: "surau",
    location: "Selangor",
    image: "/placeholder.png",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000036031001393260725204866153034585802MY5912SURAU AL-UMM6006KAJANG6105430006304CDE7",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    id: 21,
    name: "Masjid As Syakirin",
    category: "mosque",
    location: "Selangor",
    image: "/placeholder.png",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000140031001265703345204866153034585802MY5918MASJID AS SYAKIRIN6007DENGKIL61054380063041627",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    id: 22,
    name: "Surau Damai",
    category: "surau",
    location: "Selangor",
    image: "/placeholder.png",
    qrContent:
      "00020201021126600014A000000615000101065641670215QRMID000000015103090123369895204866153034585802MY5911SURAU DAMAI6005BANGI610543650630409F3",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    id: 23,
    name: "Surau Al Kauthar",
    category: "surau",
    location: "Selangor",
    image: "/placeholder.png",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000197031001328608795204866153034585802MY5916SURAU AL-KAUTHAR6015BANDAR BARU BAN6105436506304DDB5",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    id: 24,
    name: "Surau Ar Raudhah",
    category: "surau",
    location: "Selangor",
    image: "/placeholder.png",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000220031001933151515204866153034585802MY5916SURAU AR-RAUDHAH6006KAJANG6105430006304980F",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    id: 25,
    name: "Surau As Sobah",
    category: "surau",
    location: "Selangor",
    image: "/placeholder.png",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000292031001739679955204866153034585802MY5914SURAU AL-SOBAH6015BANDAR BARU BAN6105436506304CDF0",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    id: 26,
    name: "Masjid Al Azhar Kolej Universiti Islam Selangor",
    category: "mosque",
    location: "Selangor",
    image: "/placeholder.png",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000277031001337175795204866153034585802MY5915MASJID AL AZHAR6006KAJANG61054300063045B9C",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    id: 27,
    name: "Masjid Al Hasanah",
    category: "mosque",
    location: "Selangor",
    image: "/placeholder.png",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000320031001964433995204866153034585802MY5925MASJID AL-HASANAH BBBANGI6015BANDAR BARU BAN61054365063047E34",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    id: 28,
    name: "Yayasan Darussyifa Bangi",
    category: "others",
    location: "Selangor",
    image: "/placeholder.png",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000335031001390507915204866153034585802MY5924YAYASAN DARUSSYIFA BANGI6005BANGI61054365063042858",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    id: 29,
    name: "Surau Al Mujahidin",
    category: "surau",
    location: "Selangor",
    image: "/placeholder.png",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000378031001292084515204866153034585802MY5918SURAU AL MUJAHIDIN6005BANGI61054365063041927",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    id: 30,
    name: "Tabung Sekolah Rendah Sri Al Amin Bangi",
    category: "others",
    location: "Selangor",
    image: "/placeholder.png",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000482031001922555695204533153034585802MY5915TABUNG SEK SAAB6006KAJANG6105430006304A92B",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    id: 31,
    name: "Surau Al Madani",
    category: "surau",
    location: "Selangor",
    image: "/placeholder.png",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000901031001935048475204866153034585802MY5915SURAU AL MADANI6015BANDAR BARU BAN6105436506304EDA6",
    supportedPayment: ["duitnow", "tng"],
  },
];
