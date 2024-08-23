import type { Institution } from "../types/institutions";

export const institutions: Institution[] = [
  {
    // https://www.facebook.com/masjidnegaramalaysia/
    id: 1,
    name: "Masjid Negara",
    category: "mosque",
    state: "W.P. Kuala Lumpur",
    city: "Kuala Lumpur",
    qrImage: "/masjid/masjid-negara.png",
    qrContent:
      "00020201021126420014A000000615000101066033460210MD001295465204939953034585802MY5913MASJID NEGARA6002MY627303251704936237869008996045430052017072988178750084448071617049359619050076304FD9C",
    supportedPayment: ["duitnow", "tng"],
    coords: [3.1419827397613664, 101.69175298700645],
  },
  {
    // https://www.facebook.com/masjidalghufran/
    id: 2,
    name: "Masjid Al-Ghufran",
    category: "mosque",
    state: "W.P. Kuala Lumpur",
    city: "Kuala Lumpur",
    qrImage: "/masjid/masjid-al-ghufran.png",
    qrContent:
      "00020201021126520014A000000615000101068900530220MDN162217666262104305204866153034585802MY5915MASJIDALGHUFRAN6011KUALALUMPUR6304AC7A",
    supportedPayment: ["duitnow", "tng"],
    coords: [3.1578854416571565, 101.61682224883123],
  },
  {
    // https://www.facebook.com/MasjidAlMuhtadinDamansaraDamai/
    id: 3,
    name: "Masjid Al-Muhtadin Damansara Damai",
    category: "mosque",
    state: "Selangor",
    city: "Petaling Jaya",
    qrImage: "/masjid/masjid-al-muhtadin.png",
    qrContent:
      "00020101021126580014A000000615000101065887340212MBBQR124979103100000000000520400005303458540500.005802MY5918MASJID AL MUHTADIN6008SELANGOR630414E7",
    supportedPayment: ["duitnow", "tng"],
    coords: [3.201055431014754, 101.59551490051814],
  },
  {
    // https://www.facebook.com/masjidarrahman.jawi/
    id: 4,
    name: "Masjid Ar-Rahman",
    category: "mosque",
    state: "W.P. Kuala Lumpur",
    city: "Kuala Lumpur",
    qrImage: "/masjid/masjid-ar-rahman.png",
    qrContent: "https://qr.tngdigital.com.my/m/281011056697947085062292043",
    supportedPayment: ["tng"],
    coords: [3.124261867632774, 101.67413567602591],
  },
  {
    // https://www.facebook.com/masjidlamasurafan/
    id: 5,
    name: "Masjid Lama Kampung Sura",
    category: "mosque",
    state: "Terengganu",
    city: "Kuala Dungun",
    qrImage: "/masjid/masjid-lama-kampung-sura-mlks.png",
    // QR not clear
    coords: [4.7383225224584855, 103.42684395703144],
  },
  {
    // https://www.facebook.com/AsSalamKD/
    id: 6,
    name: "Surau As-Salam Seksyen 4",
    category: "surau",
    state: "Selangor",
    city: "Petaling Jaya", // Kota Damansara
    qrImage: "/surau/surau-as-salam-seksyen-4.png",
    qrContent:
      "00020201021126580014A000000615000101065887340212MBBQR2119996031000000000005204729953034585802MY5925SURAU AS SALAM SEKSYEN 4 6008SELANGOR6304B9C3",
    supportedPayment: ["duitnow", "tng"],
    coords: [3.1525404874785603, 101.58173564835822],
  },
  {
    // https://www.facebook.com/masjidsrisendayanofficial/
    id: 7,
    name: "Masjid Sri Sendayan",
    category: "mosque",
    state: "Negeri Sembilan",
    city: "Siliau",
    qrImage: "/masjid/masjid-sri-sendayan.png",
    qrContent:
      "00020201021126580014A000000615000101065641600226125510400006590RHBQR0028055204739953034585802MY5919MASJID SRI SENDAYAN6002MY61057195062240309ROA0030360707mss20198264037ECE3BEE396FD9E7293AE400C6B61FF31B756E8D308F44D79C9CA7FA859E8763047E35",
    supportedPayment: ["duitnow", "tng"],
    coords: [2.685339740395178, 101.84383824857599],
  },
  {
    id: 8,
    name: "Masjid Putra Heights",
    category: "mosque",
    state: "Selangor",
    city: "Subang Jaya",
    qrImage: "/masjid/masjid-putra-heights.png",
    qrContent:
      "00020101021126580014A000000615000101065887340212MBBQR117311803100000000000520400005303458540500.005802MY5920MASJID PUTRA HEIGHTS6008SELANGOR6304C677",
    supportedPayment: ["duitnow"],
    coords: [2.9975987081545536, 101.57625587096338],
  },
  {
    id: 9,
    name: "Masjid Azzubair Ibnul Awwam",
    category: "mosque",
    state: "W.P. Kuala Lumpur",
    city: "Kuala Lumpur",
    qrImage: "/masjid/masjid-azzubair-ibnul-awwam.jpeg",
    qrContent:
      "00020201021126420014A000000615000101066033460210MD000952735204866153034585802MY5925MASJID AZZUBAIR IBNUL AWW6002MY6273032516766078843470026415087370520167767757301000106090716167660762452600963040358",
    supportedPayment: ["duitnow", "tng"],
    coords: [3.1138929331824166, 101.72054132480572],
  },
  {
    // https://www.facebook.com/masjidlestariputraofficial/
    id: 10,
    name: "Masjid Lestari Putra", // or Surau Saidina Abu Bakar
    category: "mosque",
    state: "Selangor",
    city: "Seri Kembangan",
    qrImage: "/masjid/masjid-lestari-putra.jpeg",
    qrContent:
      "00020101021126580014A000000615000101065887340212MBBQR125821103100000000000520400005303458540500.005802MY5920MASJID LESTARI PUTRA6008SELANGOR630496E4",
    supportedPayment: ["duitnow", "tng"],
    coords: [3.0016752615306768, 101.65263657018913],
  },
  {
    id: 11,
    name: "Masjid Bandar Saujana Putra",
    category: "mosque",
    state: "Selangor",
    city: "Jenjarom",
    qrImage: "/masjid/masjid-bandar-saujana-putra.jpeg",
    qrContent:
      "00020201021126420014A000000615000101066033460210MD001297425204866153034585802MY5925MASJID BANDAR SAUJANA PUT6002MY6273032517055541622240053677717220520170555416742900110190716170555380608800463040DF7",
    supportedPayment: ["duitnow", "tng"],
    coords: [2.9519754843607497, 101.57441677984598],
  },
  {
    id: 12,
    name: "Masjid Al Ansar",
    category: "mosque",
    state: "W.P. Kuala Lumpur",
    city: "Kuala Lumpur",
    qrImage: "/masjid/masjid-al-ansar.jpeg",
    qrContent:
      "00020201021126580014A000000615000101065887340212MBBQR2010245031000000000005204000053034585802MY5915MASJID AL ANSAR6015WP KUALA LUMPUR6304F6A0",
    supportedPayment: ["duitnow", "tng"],
    coords: [3.1699124257457867, 101.74403904456969],
  },
  {
    id: 13,
    name: "Masjid Tuminah Hamidi",
    category: "mosque",
    state: "Perak",
    city: "Bagan Datuk",
    qrImage: "/masjid/masjid-tuminah-hamidi.jpeg",
    qrContent:
      "00020201021126900014A0000006150001010642070902240824441100029031J97442000315BSN Merchant QR0411011255099085204000053034585802MY5921MASJID TUMINAH HAMIDI6011BAGAN DATOH6105361006304E5D7",
    supportedPayment: ["duitnow", "tng"],
    coords: [3.9938584986122376, 100.7885218078065],
  },
  {
    id: 14,
    name: "Rumah Bakti Nur Ain",
    category: "others",
    state: "Selangor",
    city: "Bandar Baru Bangi",
    qrImage: "/lain/rumah-bakti-nur-ain.jpeg",
    qrContent:
      "00020201021126580014A000000615000101065887340212MBBQR1959819031000000000005204000053034585802MY5919RUMAH BAKTI NUR AIN6008SELANGOR630416E7",
    supportedPayment: ["duitnow", "tng"],
    coords: [2.9490553412681573, 101.772701949897],
  },
  {
    // https://www.facebook.com/p/Masjid-Al-Manar-Kg-Parit-Sakai-Darat-100086783897014/
    id: 15,
    name: "Masjid Jamek Al Manar",
    category: "mosque",
    state: "Johor",
    city: "Muar",
    qrImage: "/masjid/masjid-jamek-al-manar.jpeg",
    qrContent:
      "00020201021126420014A000000615000101066033460210MD001296155204866153034585802MY5921MASJID JAMEK AL-MANAR6002MY6273032517052918176870018562499830520170529314563500845950716170529140692300163046EAD",
    supportedPayment: ["duitnow", "tng"],
    coords: [2.0331839076325915, 102.58894060000036],
  },
  {
    // https://www.facebook.com/MTAABSMS/
    id: 16,
    name: "Masjid Tengku Ampuan Afzan, Bandar Satelit (MTAABSMS)",
    category: "mosque",
    state: "Pahang",
    city: "Muadzam Shah",
    qrImage: "/masjid/masjid-tengku-ampuan-afzan.jpeg",
    // QR not clear
    coords: [3.067148219132197, 103.06875243657876],
  },
  {
    id: 17,
    name: "Masjid UTM KL",
    category: "mosque",
    state: "W.P. Kuala Lumpur",
    city: "Kuala Lumpur",
    qrImage: "/masjid/masjid-utmkl.jpeg",
    qrContent:
      "00020201021126420014A000000615000101066033460210MD000721595204866153034585802MY5912MASJID UTMKL6002MY62730325165579551440400458665376805201655795602599001013207161655794994299008630426C5",
    supportedPayment: ["duitnow", "tng"],
    coords: [3.171034515253361, 101.72054262420114],
  },
  {
    id: 18,
    name: "Surau Al Ikhlasiah",
    category: "surau",
    state: "Selangor",
    city: "Ampang",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000225031001921366955204866153034585802MY5918SURAU AL-IKHLASIAH6006AMPANG6105680006304ADB9",
    supportedPayment: ["duitnow", "tng"],
    coords: [3.1525994383444234, 101.76554095937011],
  },
  {
    // https://www.facebook.com/MAMTNA/
    id: 19,
    name: "Masjid Al Mustaqim",
    category: "mosque",
    state: "Selangor",
    city: "Ampang",
    qrImage: "",
    qrContent:
      "00020201021126620014A000000615000101065641670215QRMID00000003890311011100924415204866153034585802MY5925MASJID AL MUSTAQIM AMPANG6006AMPANG6105680006304F9D2",
    supportedPayment: ["duitnow", "tng"],
    coords: [3.1498359447807265, 101.75193011307067],
  },
  {
    id: 20,
    name: "Surau Al Umm",
    category: "surau",
    state: "Selangor",
    city: "Bandar Baru Bangi",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000036031001393260725204866153034585802MY5912SURAU AL-UMM6006KAJANG6105430006304CDE7",
    supportedPayment: ["duitnow", "tng"],
    coords: [2.975596138688422, 101.76216814644013],
  },
  {
    id: 21,
    name: "Masjid As Syakirin",
    category: "mosque",
    state: "Selangor",
    city: "Bandar Seri Putra",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000140031001265703345204866153034585802MY5918MASJID AS SYAKIRIN6007DENGKIL61054380063041627",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    id: 22,
    name: "Surau Damai",
    category: "surau",
    state: "Selangor",
    city: "Bandar Baru Bangi",
    qrImage: "",
    qrContent:
      "00020201021126600014A000000615000101065641670215QRMID000000015103090123369895204866153034585802MY5911SURAU DAMAI6005BANGI610543650630409F3",
    supportedPayment: ["duitnow", "tng"],
    coords: [2.944468450861528, 101.77423580267227],
  },
  {
    id: 23,
    name: "Surau Al Kauthar",
    category: "surau",
    state: "Selangor",
    city: "Bandar Baru Bangi",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000197031001328608795204866153034585802MY5916SURAU AL-KAUTHAR6015BANDAR BARU BAN6105436506304DDB5",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    id: 24,
    name: "Surau Ar Raudhah",
    category: "surau",
    state: "Selangor",
    city: "Bandar Baru Bangi",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000220031001933151515204866153034585802MY5916SURAU AR-RAUDHAH6006KAJANG6105430006304980F",
    supportedPayment: ["duitnow", "tng"],
    coords: [2.9370580062654783, 101.77765678167017],
  },
  {
    id: 25,
    name: "Surau Al-Sobah",
    category: "surau",
    state: "Selangor",
    city: "Bandar Baru Bangi",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000292031001739679955204866153034585802MY5914SURAU AL-SOBAH6015BANDAR BARU BAN6105436506304CDF0",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    id: 26,
    name: "Masjid Al Azhar Kolej Universiti Islam Selangor",
    category: "mosque",
    state: "Selangor",
    city: "Bandar Seri Putra",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000277031001337175795204866153034585802MY5915MASJID AL AZHAR6006KAJANG61054300063045B9C",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    id: 27,
    name: "Masjid Al Hasanah",
    category: "mosque",
    state: "Selangor",
    city: "Bandar Baru Bangi",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000320031001964433995204866153034585802MY5925MASJID AL-HASANAH BBBANGI6015BANDAR BARU BAN61054365063047E34",
    supportedPayment: ["duitnow", "tng"],
    coords: [2.9590796271876734, 101.7527277637582],
  },
  {
    id: 28,
    name: "Yayasan Darussyifa Bangi",
    category: "others",
    state: "Selangor",
    city: "Bandar Baru Bangi",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000335031001390507915204866153034585802MY5924YAYASAN DARUSSYIFA BANGI6005BANGI61054365063042858",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    id: 29,
    name: "Surau Al Mujahidin",
    category: "surau",
    state: "Selangor",
    city: "Bandar Baru Bangi",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000378031001292084515204866153034585802MY5918SURAU AL MUJAHIDIN6005BANGI61054365063041927",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    id: 30,
    name: "Tabung Sekolah Rendah Sri Al Amin Bangi",
    category: "others",
    state: "Selangor",
    city: "Bandar Baru Bangi",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000482031001922555695204533153034585802MY5915TABUNG SEK SAAB6006KAJANG6105430006304A92B",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    id: 31,
    name: "Masjid Jamek Kuala Lumpur", // atau Masjid Jamek Sultan Abdul Samad
    category: "mosque",
    state: "W.P. Kuala Lumpur",
    city: "Kuala Lumpur",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000002031001633145685204866153034585802MY5925MASJID JAMEK BANDARAYA KL6012KUALA LUMPUR6105500506304B927",
    supportedPayment: ["duitnow", "tng"],
    coords: [3.148924051444629, 101.6956263112918],
  },
  {
    id: 32,
    name: "Surau Khairiah Kampung Tengah",
    category: "surau",
    state: "Selangor",
    city: "Gombak",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000003022031001938169345204866153034585802MY5924SURAU KHAIRIAH KG TENGAH6008SELANGOR61055310063048223",
    supportedPayment: ["duitnow", "tng"],
    coords: [3.229518790943314, 101.71554352376846],
  },
  {
    // https://www.facebook.com/mardasah.cherasperdanamcp/
    id: 33,
    name: "Madrasah Cheras Perdana",
    category: "surau",
    state: "Selangor",
    city: "Cheras",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000710031001334739915204866153034585802MY5923MADRASAH CHERAS PERDANA6006CHERAS610543200630477B7",
    supportedPayment: ["duitnow", "tng"],
    coords: [3.0420408671659795, 101.76475768356461],
  },
  {
    // https://www.facebook.com/p/Surau-Al-Hijrah-PPR-Pekan-Batu-100090311133470/
    id: 34,
    name: "Surau Al-Hijrah PPR Pekan Batu",
    category: "surau",
    state: "W.P. Kuala Lumpur",
    city: "Kuala Lumpur",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000187031001934644905204866153034585802MY5925SR AL HIJRAH PPR PEKAN BT6013JINJANG UTARA61055200063042A74",
    supportedPayment: ["duitnow", "tng"],
    coords: [3.2042006769016367, 101.67295936935358],
  },
  {
    id: 35,
    name: "Sumbangan Ihya Ramadhan - Jabatan Pendidikan Wilayah Persekutuan",
    category: "others",
    state: "W.P. Kuala Lumpur",
    city: "Kuala Lumpur",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000949031001724397055204866153034585802MY5923SUMBANGAN IHYA RAMADHAN6012KUALA LUMPUR6105506046304C09F",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    id: 36,
    name: "Masjid Al-Muqarrabin Bandar Tasik Selatan",
    category: "mosque",
    state: "W.P. Kuala Lumpur",
    city: "Kuala Lumpur",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000094031001966815035204866153034585802MY5924MASJID AL-MUQARRABIN BTS6012KUALA LUMPUR61055700063044569",
    supportedPayment: ["duitnow", "tng"],
    coords: [3.0741079193830863, 101.7190796433474],
  },
  {
    id: 37,
    name: "Masjid Al-Muhsinin",
    category: "mosque",
    state: "W.P. Kuala Lumpur",
    city: "Kuala Lumpur",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000248031001969154145204866153034585802MY5918MASJID AL MUHSININ6012KUALA LUMPUR610558100630475BB",
    supportedPayment: ["duitnow", "tng"],
    coords: [3.103859950267137, 101.6886747220499],
  },
  {
    id: 38,
    name: "Sekolah Agama Al Fateh",
    category: "others",
    state: "W.P. Kuala Lumpur",
    city: "Kuala Lumpur",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000859031001360657415204829953034585802MY5922SEKOLAH AGAMA AL FATEH6012KUALA LUMPUR61055700063041F6D",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    id: 39,
    name: "Masjid Al-Hidayah Taman Melawati",
    category: "mosque",
    state: "W.P. Kuala Lumpur",
    city: "Kuala Lumpur",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000040031001938121605204866153034585802MY5920MASJID AL-HIDAYAH TM6012KUALA LUMPUR6105531006304AB74",
    supportedPayment: ["duitnow", "tng"],
    coords: [3.2130325027093014, 101.7535894888139],
  },
  {
    id: 40,
    name: "Masjid Al-Ansar Taman Keramat",
    category: "mosque",
    state: "W.P. Kuala Lumpur",
    city: "Kuala Lumpur",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000331031001938554835204866153034585802MY5925MASJID AL-ANSAR T.KERAMAT6012KUALA LUMPUR61055420063045371",
    supportedPayment: ["duitnow", "tng"],
    coords: [3.169913364998503, 101.74403646245656],
  },
  {
    // https://www.facebook.com/faridiyah
    id: 41,
    name: "Maahad Tahfiz Al-Madrasathul Faridiyah",
    category: "others",
    state: "W.P. Kuala Lumpur",
    city: "Kuala Lumpur",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000352031001234333335204866153034585802MY5922M.TAHFIZ AL-MADRASATUL6012KUALA LUMPUR6105533006304ECAE",
    supportedPayment: ["duitnow", "tng"],
    coords: [3.1929096167514777, 101.73210982842211],
  },
  {
    // https://www.facebook.com/musollabaiduriukayperdana/
    id: 42,
    name: "Musolla Sri Baiduri Ukay Perdana",
    category: "surau",
    state: "Selangor",
    city: "Ampang",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000477031001935065925204866153034585802MY5919MUSOLLA SRI BAIDURI6006AMPANG6105680006304F1D1",
    supportedPayment: ["duitnow", "tng"],
    coords: [3.204855139319395, 101.77121629028096],
  },
  {
    id: 43,
    name: "Madrasah Ad-Diniah",
    category: "mosque",
    state: "Selangor",
    city: "Ampang",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000003426031001739478275204866153034585802MY5918MADRASAH ADDINNIAH6006AMPANG610568000630417D7",
    supportedPayment: ["duitnow", "tng"],
    coords: [3.189769843531015, 101.77167954472107],
  },
  {
    id: 44,
    name: "Masjid Al-Mustaqim Ampang",
    category: "mosque",
    state: "Selangor",
    city: "Ampang",
    qrImage: "",
    qrContent:
      "00020201021126620014A000000615000101065641670215QRMID00000003890311011100924415204866153034585802MY5925MASJID AL MUSTAQIM AMPANG6006AMPANG6105680006304F9D2",
    supportedPayment: ["duitnow", "tng"],
    coords: [3.149841822927756, 101.75193007120077],
  },
  {
    id: 45,
    name: "Surau Al-Kauthar",
    category: "surau",
    state: "Selangor",
    city: "Bandar Baru Bangi",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000197031001328608795204866153034585802MY5916SURAU AL-KAUTHAR6015BANDAR BARU BAN6105436506304DDB5",
    supportedPayment: ["duitnow", "tng"],
    coords: [2.958661396464478, 101.77959640897069],
  },
  {
    id: 46,
    name: "Masjid Al-Azhar, UIS",
    category: "mosque",
    state: "Selangor",
    city: "Bandar Seri Putra",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000277031001337175795204866153034585802MY5915MASJID AL AZHAR6006KAJANG61054300063045B9C",
    supportedPayment: ["duitnow", "tng"],
    coords: [2.8917414200390588, 101.78782313755583],
  },
  {
    id: 47,
    name: "Masjid Al-Hasanah Bandar Baru Bangi",
    category: "mosque",
    state: "Selangor",
    city: "Bandar Baru Bangi",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000320031001964433995204866153034585802MY5925MASJID AL-HASANAH BBBANGI6015BANDAR BARU BAN61054365063047E34",
    supportedPayment: ["duitnow", "tng"],
    coords: [2.959081879624419, 101.75272828140423],
  },
  {
    id: 48,
    name: "Surau Al Madani",
    category: "surau",
    state: "Selangor",
    city: "Bandar Baru Bangi",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000901031001935048475204866153034585802MY5915SURAU AL MADANI6015BANDAR BARU BAN6105436506304EDA6",
    supportedPayment: ["duitnow", "tng"],
    coords: [2.941709465325527, 101.77860605415441],
  },
  {
    id: 49,
    name: "Masjid Sungai Ramal Luar",
    category: "mosque",
    state: "Selangor",
    city: "Kajang",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000003043031001926627135204866153034585802MY5924MASJID SUNGAI RAMAL LUAR6006KAJANG61054300063041B03",
    supportedPayment: ["duitnow", "tng"],
    coords: [2.9844155468907636, 101.76397656549568],
  },
  {
    id: 50,
    name: "Masjid Jamek Kampung Nakhoda",
    category: "mosque",
    state: "Selangor",
    city: "Batu Caves",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000202031001928656985204866153034585802MY5923MASJID JAMEK KG NAKHODA6010BATU CAVES6105681006304EFB3",
    supportedPayment: ["duitnow", "tng"],
    coords: [3.249832904370466, 101.67753381909519],
  },
  {
    id: 51,
    name: "Tabung Pembangunan Masjid Jamiatus",
    category: "mosque",
    state: "Selangor",
    city: "Batu Caves",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000369031001965018735204866153034585802MY5923TBG PMBNGUNN M.JAMIATUS6010BATU CAVES610568100630465F6",
    supportedPayment: ["duitnow", "tng"],
    coords: [3.253679883726249, 101.67484559763611],
  },
  {
    id: 52,
    name: "Surau Al-Khairiyah",
    category: "surau",
    state: "Selangor",
    city: "Batu Caves",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000004223031001634135315204866153034585802MY5918SURAU AL KHAIRIYAH6012KUALA LUMPUR61055200063045986",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    id: 53,
    name: "Surau Al-Ehsan Batu Caves",
    category: "surau",
    state: "Selangor",
    city: "Batu Caves",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000004360031001926888395204866153034585802MY5923SURAU AL-EHSAN BT CAVES6010BATU CAVES610568100630475C5",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    id: 54,
    name: "Khairat Kematian Kemsah - Masjid Saidin Hamzah",
    category: "mosque",
    state: "W.P. Kuala Lumpur",
    city: "Kuala Lumpur",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000004490031001352013965204866153034585802MY5923KHAIRAT KEMATIAN KEMSAH6012KUALA LUMPUR61055110063047457",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    id: 55,
    name: "Surau Al-Bukhary Laman Glenmarie",
    category: "surau",
    state: "Selangor",
    city: "Shah Alam",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000934031001929362865204866153034585802MY5925SURAU AL-BUKHARY LMN GLEN6009SHAH ALAM6105401506304D00F",
    supportedPayment: ["duitnow", "tng"],
    coords: [3.100734479837375, 101.56241093073743],
  },
  {
    id: 56,
    name: "Surau At-Taqwa Kajang",
    category: "surau",
    state: "Selangor",
    city: "Kajang",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000317031001362224245204866153034585802MY5914SURAU AT-TAQWA6006KAJANG61054300063044565",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    id: 57,
    name: "Surau Desa Sri Jenaris",
    category: "surau",
    state: "Selangor",
    city: "Kajang",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000481031001697534675204866153034585802MY5922SURAU DESA SRI JENARIS6006KAJANG6105430006304ADC4",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    id: 58,
    name: "Masjid Al Amin Sg Tekali",
    category: "mosque",
    state: "Selangor",
    city: "Hulu Langat",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000783031001339420445204866153034585802MY5924MASJID AL AMIN SG TEKALI6011HULU LANGAT61054310063049DE7",
    supportedPayment: ["duitnow", "tng"],
    coords: [3.1091208428564996, 101.85237345279701],
  },
  {
    id: 59,
    name: "Masjid Al-Ehsan SMAPK",
    category: "mosque",
    state: "Selangor",
    city: "Kajang",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000004026031001390537045204866153034585802MY5921MASJID AL-EHSAN SMAPK6006KAJANG610543000630499A7",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    id: 60,
    name: "Pembinaan Masjid Sg Serai",
    category: "mosque",
    state: "Selangor",
    city: "Hulu Langat",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000004493031001938642125204866153034585802MY5925PEMBINAAN MASJID SG SERAI6011HULU LANGAT6105431006304D3D1",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    // https://www.facebook.com/suraualittihadiyyahs9/
    id: 61,
    name: "Surau Al-Ittihadiyyah Seksyen 9", // or Musalla Al-Ittihadiyyah
    category: "surau",
    state: "Selangor",
    city: "Shah Alam",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000283031001238746885204866153034585802MY5921SURAU AL ITTIHADIYYAH6009SHAH ALAM6105400006304D360",
    supportedPayment: ["duitnow", "tng"],
    coords: [3.080943452917789, 101.52789611928387],
  },
  {
    // https://www.facebook.com/mai13.official/
    id: 62,
    name: "Masjid Al-Ikhlas Seksyen 13",
    category: "mosque",
    state: "Selangor",
    city: "Shah Alam",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000003031001930793065204866153034585802MY5924MASJID AL-IKHLAS SEK. 136009SHAH ALAM6105400006304B186",
    supportedPayment: ["duitnow", "tng"],
    coords: [3.086588976386146, 101.54532636024668],
  },
  {
    // https://www.facebook.com/masjid.kotadamansara/
    id: 63,
    name: "Masjid Kota Damansara",
    category: "mosque",
    state: "Selangor",
    city: "Petaling Jaya",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000003090031001381165705204866153034585802MY5921MASJID KOTA DAMANSARA6013PETALING JAYA61054781063042F93",
    supportedPayment: ["duitnow", "tng"],
    coords: [3.161638907412847, 101.58720095211012],
  },
  {
    // https://www.facebook.com/attaqwabbsa/
    id: 64,
    name: "Surau At-Taqwa Bukit Bandaraya",
    category: "surau",
    state: "Selangor",
    city: "Shah Alam",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000004296031001238871265204866153034585802MY5919SURAU AT TAQWA BBSA6009SHAH ALAM6105401706304951C",
    supportedPayment: ["duitnow", "tng"],
    coords: [3.0966284734980984, 101.48617413524184],
  },
  {
    id: 65,
    name: "Surau Al-Ehsaniah Ahmadiah",
    category: "surau",
    state: "Selangor",
    city: "Petaling Jaya",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000242031001938100885204866153034585802MY5925SURAU ALEHSANIAH AHMADIAH6013PETALING JAYA6105473016304495B",
    supportedPayment: ["duitnow", "tng"],
    coords: [3.095583942312656, 101.60437236603848],
  },
  {
    // https://www.facebook.com/suraualazharsamsml/
    id: 66,
    name: "Surau Al Azhar Sam Sml",
    category: "surau",
    state: "Selangor",
    city: "Kajang",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000353031001239414765204866153034585802MY5921SURAU AL-AZHAR SAMSML6006KAJANG610543000630480DC",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    id: 67,
    name: "Surau Al Muttaqin",
    category: "surau",
    state: "Selangor",
    city: "Rawang",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000510031001663457785204866153034585802MY5917SURAU AL MUTTAQIN6009PUTRAJAYA61056220063046803",
    supportedPayment: ["duitnow", "tng"],
    coords: [3.3094309973153155, 101.55804009630765],
  },
  {
    id: 68,
    name: "Surau SK Sultan Ahmad Shah",
    category: "surau",
    state: "W.P. Putrajaya",
    city: "Putrajaya",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000838031001922427865204866153034585802MY5925SURAU SK SULTAN ALAM SHAH6009PUTRAJAYA6105625206304B2F8",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    id: 69,
    name: "Surau Al-Hidayah",
    category: "surau",
    state: "Selangor",
    city: "Rawang",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000456031001734000255204866153034585802MY5916SURAU AL-HIDAYAH6006RAWANG6105480006304D169",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    // https://www.facebook.com/masjidjumhuriahtamandatoharun/
    id: 70,
    name: "Masjid Jumhuriah",
    category: "mosque",
    state: "Selangor",
    city: "Petaling Jaya",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000170031001334155805204866153034585802MY5916MASJID JUMHURIAH6007PUCHONG6105460006304355D",
    supportedPayment: ["duitnow", "tng"],
    coords: [3.0824099235063502, 101.63723675766376],
  },
  {
    id: 71,
    name: "IIUM Gombak Mosque", // Sultan Haji Ahmad Shah Mosque
    category: "mosque",
    state: "Selangor",
    city: "Gombak",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000362031001320062355204866153034585802MY5918IIUM GOMBAK MOSQUE6012KUALA LUMPUR6105531006304051C",
    supportedPayment: ["duitnow", "tng"],
    coords: [3.251232778049596, 101.73508226243918],
  },
  {
    id: 72,
    name: "JK PBN Masjid At-Taqwa",
    category: "mosque",
    state: "Kelantan",
    city: "Gua Musang",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000086031001298321775204866153034585802MY5922JK PBN MASJID AT-TAQWA6014GUA MUSANG KEL61051830063045A99",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    // https://www.facebook.com/p/Masjid-Sultan-Ahmad-Paloh-2-100090488524753/
    id: 73,
    name: "Masjid Sultan Ahmad Paloh 02",
    category: "mosque",
    state: "Kelantan",
    city: "Gua Musang",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000098031001970076815204866153034585802MY5925MJD SULTAN AHMAD PALOH 026010GUA MUSANG6105183006304CB72",
    supportedPayment: ["duitnow", "tng"],
    coords: [4.995515281049585, 102.23241726538993],
  },
  {
    id: 74,
    name: "Masjid Mukim Limau Kasturi",
    category: "mosque",
    state: "Kelantan",
    city: "Gua Musang",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000101031001481951575204866153034585802MY5923MJD MUKIM LIMAU KASTURI6010GUA MUSANG61051830063042CE8",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    id: 75,
    name: "Masjid Mukim Lubok Bongor",
    category: "mosque",
    state: "Kelantan",
    city: "Kuala Balah",
    qrImage: "",
    qrContent:
      "00020201021126620014A000000615000101065641670215QRMID00000002800311011199774245204866153034585802MY5922MJD MUKIM LUBOK BONGOR6011KUALA BALAH61051761063043597",
    supportedPayment: ["duitnow", "tng"],
    coords: [5.564121887194368, 101.8828163917118],
  },
  {
    id: 76,
    name: "Masjid Legeh",
    category: "mosque",
    state: "Kelantan",
    city: "Ayer Lanas",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000355031001397376305204866153034585802MY5912MASJID LEGEH6004JELI6105177006304C65D",
    supportedPayment: ["duitnow", "tng"],
    coords: [5.750505650202645, 101.89885622327735],
  },
  {
    // https://www.facebook.com/masjidalabrarayerlanas/
    id: 77,
    name: "Masjid Al-Abrar Ayer Lanas",
    category: "mosque",
    state: "Kelantan",
    city: "Ayer Lanas",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000358031001796305805204866153034585802MY5923MJD AL ABRAR AYER LANAS6004JELI61051770063045BBF",
    supportedPayment: ["duitnow", "tng"],
    coords: [5.773839364851387, 101.88866802534353],
  },
  {
    id: 78,
    name: "Masjid Mukim Lakota",
    category: "mosque",
    state: "Kelantan",
    city: "Jeli",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000910031001393254865204866153034585802MY5919MASJID MUKIM LAKOTA6004JELI61051760063047660",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    // https://www.facebook.com/p/Masjid-Mukim-Pantai-Senak-100083119489258/
    id: 79,
    name: "Masjid Al-Munir Mukim Pantai Senok",
    category: "mosque",
    state: "Kelantan",
    city: "Bachok",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000080031001994460255204866153034585802MY5918MASJID MUKIM SENAK6015BACHOK KELANTAN6105163206304DD5F",
    supportedPayment: ["duitnow", "tng"],
    coords: [6.158323002179537, 102.34250748647439],
  },
  {
    id: 80,
    name: "Masjid Taman Desa Orkid",
    category: "mosque",
    state: "Kelantan",
    city: "Kota Bharu", // Pengkalan Chepa
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000330031001995944775204866153034585802MY5923MASJID TAMAN DESA ORKID6010KOTA BHARU61051610063042EAE",
    supportedPayment: ["duitnow", "tng"],
    coords: [6.138366491054416, 102.2953592485237],
  },
  {
    // https://www.facebook.com/PIslamKampusKesihatan/
    id: 81,
    name: "Pusat Islam Kampus Kesihatan USM",
    category: "mosque",
    state: "Kelantan",
    city: "Kota Bharu", // Kubang Kerian
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000666031001991263075204866153034585802MY5922MASJID PUSAT ISLAM USM6010KOTA BHARU61051615063047F24",
    supportedPayment: ["duitnow", "tng"],
    coords: [6.096093798685968, 102.2840412721458],
  },
  {
    id: 82,
    name: "Tabung Masjid Mukim Tunjung",
    category: "mosque",
    state: "Kelantan",
    city: "Kota Bharu",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000803031001926323365204866153034585802MY5924TABUNG MJD MUKIM TUNJUNG6010KOTA BHARU61051601063042678",
    supportedPayment: ["duitnow", "tng"],
    coords: [6.052128699333283, 102.23834045681281],
  },
  {
    // https://www.facebook.com/masjidhidayahtm/
    id: 83,
    name: "Masjid Al-Hidayah Taman Melawati",
    category: "mosque",
    state: "W.P. Kuala Lumpur",
    city: "Kuala Lumpur",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000040031001938121605204866153034585802MY5920MASJID AL-HIDAYAH TM6012KUALA LUMPUR6105531006304AB74",
    supportedPayment: ["duitnow", "tng"],
    coords: [3.2130318818306596, 101.75358968602197],
  },
  {
    id: 84,
    name: "Masjid Kariah Gajah Mati",
    category: "mosque",
    state: "Pahang",
    city: "Mentakab", // Temerloh
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000634031001991903055204866153034585802MY5924MASJID KARIAH GAJAH MATI6008MENTAKAB610528400630486D2",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    // https://www.facebook.com/MasjidIbrahimi/
    id: 85,
    name: "Tabung Naiktaraf Masjid Ibrahimi Pasir Puteh",
    category: "mosque",
    state: "Kelantan",
    city: "Pasir Puteh",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000046031001033013605204866153034585802MY5925TB NAIKTARAF MJD IBRAHIMI6011PASIR PUTEH610516800630430C9",
    supportedPayment: ["duitnow", "tng"],
    coords: [5.8339463970267005, 102.40273835311132],
  },
  {
    id: 86,
    name: "Masjid At Taqwa Pulai Chondong",
    category: "mosque",
    state: "Kelantan",
    city: "Pulai Chondong",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000228031001482637455204866153034585802MY5925MASJID AT TAQWA MCHONDONG6014PULAI CHONDONG6105166006304F459",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    id: 87,
    name: "Masjid Mukim Bukit Merbau",
    category: "mosque",
    state: "Kelantan",
    city: "Selising",
    qrImage: "",
    qrContent:
      "00020201021126620014A000000615000101065641670215QRMID00000002640311011255427655204866153034585802MY5925MASJID MUKIM BUKIT MERBAU6008SELISING61051681063042118",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    id: 88,
    name: "Masjid Tok Kerawat",
    category: "mosque",
    state: "Kelantan",
    city: "Pulai Chondong",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000315031001296498405204866153034585802MY5918MASJID TOK KERAWAT6014PULAI CHONDONG6105166006304B359",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    id: 89,
    name: "Masjid Al-Rahman Kg Galang",
    category: "mosque",
    state: "Kelantan",
    city: "Pulai Chondong",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000349031001482817325204866153034585802MY5923MJD AL-RAHMAN KG.GALANG6014PULAI CHONDONG6105166006304A97F",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    id: 90,
    name: "Masjid Darul Naim",
    category: "mosque",
    state: "Kelantan",
    city: "Rantau Panjang",
    qrImage: "",
    qrContent:
      "00020201021126620014A000000615000101065641670215QRMID00000001980311011105116595204866153034585802MY5917MASJID DARUL NAIM6014RANTAU PANJANG6105172006304CA22",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    // https://www.facebook.com/p/Masjid-Ar-Raudhah-Lundang-100068747751504/
    id: 91,
    name: "Masjid Ar-Raudhah Lundang",
    category: "mosque",
    state: "Kelantan",
    city: "Kota Bharu",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000230031001990652355204866153034585802MY5925MASJID AR RAUDHAH LUNDANG6010KOTA BHARU61051520063048494",
    supportedPayment: ["duitnow", "tng"],
    coords: [6.1034193106993175, 102.26095648113012],
  },
  {
    id: 92,
    name: "JK Masjid Mukim Pintu Gang",
    category: "mosque",
    state: "Kelantan",
    city: "Kota Bharu",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000274031001949407855204866153034585802MY5923JK MJD MUKIM PINTU GANG6010KOTA BHARU61051510063041EA2",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    id: 93,
    name: "Masjid Mukim Panji",
    category: "mosque",
    state: "Kelantan",
    city: "Kota Bharu",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000329031001298514615204866153034585802MY5918MASJID MUKIM PANJI6010KOTA BHARU6105161006304C28B",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    id: 94,
    name: "Masjid Masyarakat Rohingya",
    category: "mosque",
    state: "Kelantan",
    city: "Kota Bharu",
    qrImage: "",
    qrContent:
      "00020201021126620014A000000615000101065641670215QRMID00000003590311011107796715204866153034585802MY5923MD MASYARAKAT ROHINGYA 6010KOTA BHARU6105150006304C460",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    id: 95,
    name: "Sedekah@UMK",
    category: "mosque",
    state: "Kelantan",
    city: "Kota Bharu",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000381031001926140665204866153034585802MY5911SEDEKAH@UMK6010KOTA BHARU6105161006304FCB4",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    id: 96,
    name: "Tabung Masjid Al Fattah",
    category: "mosque",
    state: "Kelantan",
    city: "Kota Bharu",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000444031001295202005204866153034585802MY5923TABUNG MASJID AL FATTAH6010KOTA BHARU61051510063048653",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    id: 97,
    name: "Khairat Kematian Islam",
    category: "mosque",
    state: "Kelantan",
    city: "Kota Bharu",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000660031001797108895204533153034585802MY5922KHAIRAT KEMATIAN ISLAM6010KOTA BHARU61051510063041334",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    // https://www.facebook.com/p/Masjid-Mukim-Pangkal-Meleret-100064302567170/
    id: 98,
    name: "Masjid Mukim Pangkal Meleret",
    category: "mosque",
    state: "Kelantan",
    city: "Machang",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000849031001959904835204866153034585802MY5925MJD MUKIM PANGKAL MELERET6007MACHANG61051850063045B32",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    id: 99,
    name: "Masjid Mukim Tepi Sungai",
    category: "mosque",
    state: "Kelantan",
    city: "Tanah Merah",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000069031001392146725204866153034585802MY5924MASJID MUKIM TEPI SUNGAI6011TANAH MERAH61051750063044CA1",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    id: 100,
    name: "Masjid Mukim Bechah Laut",
    category: "mosque",
    state: "Kelantan",
    city: "Tanah Merah",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000226031001923564295204866153034585802MY5924MASJID MUKIM BECHAH LAUT6011TANAH MERAH6105175006304519E",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    id: 101,
    name: "Masjid Mukim Pasir Sat",
    category: "mosque",
    state: "Kelantan",
    city: "Tanah Merah",
    qrImage: "",
    qrContent:
      "00020201021126620014A000000615000101065641670215QRMID00000003600311011121752315204866153034585802MY5922MASJID MUKIM PASIR SAT6011TANAH MERAH6105175006304F868",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    id: 102,
    name: "JKS Pembangunan Masjid IPTM",
    category: "mosque",
    state: "Kelantan",
    city: "Tanah Merah",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000740031001398601345204866153034585802MY5924JKS PEMBANGUNAN MJD IPTM6011TANAH MERAH6105175006304667B",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    id: 103,
    name: "Pusat Khidmat Khairiyah",
    category: "mosque",
    state: "Kelantan",
    city: "Tanah Merah",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000939031001346720125204866153034585802MY5923PUSAT KHIDMAT KHAIRIYAH6011TANAH MERAH6105175006304A30E",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    // https://www.facebook.com/pages/SRU%20(A)%20DARUL%20ULUM%20DINIAH/553383568011720/
    id: 104,
    name: "Sekolah Rendah Ugama Arab Darul Ulum Diniah",
    category: "others",
    state: "Kelantan",
    city: "Tanah Merah", // Padang Siam
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000001114031001999034425204829953034585802MY5924SRU(A) DARUL ULUM DINIAH6011PADANG SIAM6105175006304A137",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    id: 105,
    name: "Masjid Mukim Kuala Kepok",
    category: "mosque",
    state: "Kelantan",
    city: "Tanah Merah",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000001168031001935862015204866153034585802MY5924MASJID MUKIM KUALA KEPOK6011TANAH MERAH61051750063041CF7",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    // https://www.facebook.com/Masjidmukimlalangpepuyu/
    id: 106,
    name: "Masjid Mukim Lalang Pepuyu",
    category: "mosque",
    state: "Kelantan",
    city: "Tanah Merah",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000001432031001992737465204866153034585802MY5923MJD MUKIM LALANG PEPUYU6011TANAH MERAH6105175006304B636",
    supportedPayment: ["duitnow", "tng"],
    coords: [5.8743115749743415, 101.94907696720873],
  },
  {
    id: 107,
    name: "Madrasah Haji Deraman",
    category: "mosque",
    state: "Kelantan",
    city: "Tanah Merah",
    qrImage: "",
    qrContent:
      "00020201021126620014A000000615000101065641670215QRMID00000015410311011293352455204866153034585802MY5921MADRASAH HAJI DERAMAN6011TANAH MERAH6105175006304083D",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    id: 108,
    name: "Tabung Kebajikan Halaqat",
    category: "mosque",
    state: "Kelantan",
    city: "Tanah Merah",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000002105031001993194505204866153034585802MY5921TAB KEBAJIKAN HALAQAT6011TANAH MERAH61051750063048CF7",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    // https://www.facebook.com/masjidismailpetratanahmerah/
    id: 109,
    name: "Infaq Masjid Ismail Petra",
    category: "mosque",
    state: "Kelantan",
    city: "Tanah Merah",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000002391031001398601345204866153034585802MY5922INFAQ MJD ISMAIL PETRA6011TANAH MERAH61051750063041C74",
    supportedPayment: ["duitnow", "tng"],
    coords: [5.808598613088199, 102.145549492349],
  },
  {
    // https://www.facebook.com/p/Masjid-AsSyakirin-Mukim-Kelewek-Tanah-Merah-100070071895715/
    id: 110,
    name: "Masjid As-Syakirin Mukim Kelewek",
    category: "mosque",
    state: "Kelantan",
    city: "Tanah Merah",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000003599031001936464645204866153034585802MY5920MASJID MUKIM KELEWEK6011TANAH MERAH61051750063043D59",
    supportedPayment: ["duitnow", "tng"],
    coords: [5.8159768616447804, 102.1061361949489],
  },
  {
    id: 111,
    name: "Masjid Taman Balok Makmur",
    category: "mosque",
    state: "Kelantan",
    city: "Balok",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000218031001290982275204866153034585802MY5925MASJID TAMAN BALOK MAKMUR6007BESERAH61052610063042FFF",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    // https://www.facebook.com/masjid.shas.iiumk/
    id: 112,
    name: "Masjid Sultan Haji Ahmad Shah",
    category: "mosque",
    state: "Pahang",
    city: "Kuantan",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000258031001299889905204866153034585802MY5924MJD SULTAN HJ AHMAD SHAH6007KUANTAN610525200630476F7",
    supportedPayment: ["duitnow", "tng"],
    coords: [3.8385737097933164, 103.30394967904168],
  },
  {
    id: 113,
    name: "Surau Warisan",
    category: "surau",
    state: "Pahang",
    city: "Kuantan",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000743031001398324155204866153034585802MY5913SURAU WARISAN6007KUANTAN6105251006304A2A9",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    // https://www.facebook.com/p/Masjid-Taman-Bukit-Bendera-Mentakab-100077104761581/
    id: 114,
    name: "Masjid Taman Bukit Bendera",
    category: "mosque",
    state: "Pahang",
    city: "Mentakab",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000043031001393608095204866153034585802MY5924MASJID TMN BUKIT BENDERA6008MENTAKAB61052840063047D09",
    supportedPayment: ["duitnow", "tng"],
    coords: [3.473067107036416, 102.33942184117251],
  },
  {
    id: 115,
    name: "Masjid Kampung Bongsu",
    category: "mosque",
    state: "Pahang",
    city: "Lanchang",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000077031001398191485204866153034585802MY5916MASJID KG BONGSU6008LANCHANG61052850063042F11",
    supportedPayment: ["duitnow", "tng"],
    coords: [3.4907601912258164, 102.23321172040869],
  },
  {
    id: 116,
    name: "Masjid Kampung Tanjung Medang Hilir",
    category: "mosque",
    state: "Pahang",
    city: "Pekan",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000207031001396453595204866153034585802MY5924MASJID KG TANJUNG MEDANG6005PEKAN610526600630424E8",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    id: 117,
    name: "Masjid Paloh Hinai",
    category: "mosque",
    state: "Pahang",
    city: "Pekan",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000246031001997783135204866153034585802MY5918MASJID PALOH HINAI6005PEKAN61052660063043658",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    id: 118,
    name: "Pusat Pengajian Fardhu Ain Al Azid",
    category: "others",
    state: "Pahang",
    city: "Kuantan",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000865031001298886795204866153034585802MY5925P PENG FARDHU AIN AL AZID6007KUANTAN6105260806304D252",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    // https://www.facebook.com/MasjidTJ/
    id: 119,
    name: "Masjid Tengku Mahkota Tengku Hassanal Ibrahim Alam Shah", // old name, Masjid Taman Temerloh Jaya
    category: "mosque",
    state: "Pahang",
    city: "Temerloh",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000012031001998816105204866153034585802MY5924MASJID TMN TEMERLOH JAYA6008TEMERLOH61052800063041FA5",
    supportedPayment: ["duitnow", "tng"],
    coords: [3.4520103333513505, 102.39309042681262],
  },
  {
    id: 120,
    name: "Maahad Tahfiz Al-Furqan",
    category: "others",
    state: "Pahang",
    city: "Temerloh",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000001138031001344420245204866153034585802MY5923MAAHAD TAHFIZ AL-FURQAN6008TEMERLOH61052800063049750",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    id: 121,
    name: "Masjid Darul Iman Kampung Lahar",
    category: "mosque",
    state: "Terengganu",
    city: "Kampung Raja",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000024031001393774335204866153034585802MY5923MJD DARUL IMAN KG LAHAR6005BESUT6105222006304E2EE",
    supportedPayment: ["duitnow", "tng"],
    coords: [5.782599793392415, 102.54545451426532],
  },
  {
    id: 122,
    name: "Masjid Pak Da Malik",
    category: "mosque",
    state: "Terengganu",
    city: "Jerteh",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000027031001392445415204866153034585802MY5919MASJID PAK DA MALIK6005BESUT61052220063041A1B",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    id: 123,
    name: "Masjid Kampung Paya Rawa",
    category: "mosque",
    state: "Terengganu",
    city: "Kampung Raja",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000056031001298134335204866153034585802MY5924MASJID KAMPUNG PAYA RAWA6012KAMPUNG RAJA6105222006304C3A6",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    // https://www.facebook.com/suraualikhlaskgserimedang/
    id: 124,
    name: "Surau Al-Ikhlas Kampung Seri Medang",
    category: "surau",
    state: "Terengganu",
    city: "Kampung Raja",
    qrImage: "",
    qrContent:
      "00020201021126620014A000000615000101065641670215QRMID00000024140311011206052675204866153034585802MY5924SURAU AL-IKHLAS S/MEDANG6007KG RAJA6105222006304457E",
    supportedPayment: ["duitnow", "tng"],
    coords: [5.749517547186155, 102.60122371794525],
  },
  {
    id: 125,
    name: "Masjid Taman Ilmu",
    category: "mosque",
    state: "Terengganu",
    city: "Kampung Raja",
    qrImage: "",
    qrContent:
      "00020201021126620014A000000615000101065641670215QRMID00000045380311011194238355204866153034585802MY5917MASJID TAMAN ILMU6007KG RAJA61052220063047D6D",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    // https://www.facebook.com/alehsansglabu/
    id: 126,
    name: "Masjid Al Ehsan Kampung Sungai Labu",
    category: "mosque",
    state: "W.P. Labuan",
    city: "Labuan",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000186031001282966775204866153034585802MY5923MJD AL EHSAN KG SG LABU6006LABUAN6105870006304FA80",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    id: 127,
    name: "Masjid Al-Munawwar (Khairat)",
    category: "mosque",
    state: "W.P. Labuan",
    city: "Labuan",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000323031001681738065204866153034585802MY5925MJD AL-MUNAWWAR (KHAIRAT)6006LABUAN61058702263042F7B",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    // https://www.facebook.com/MSMV.Labuan/
    id: 128,
    name: "Masjid Sultan Muhammad V",
    category: "mosque",
    state: "W.P. Labuan",
    city: "Labuan",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000350031001993196165204866153034585802MY5924MASJID SULTAN MUHAMMAD V6006LABUAN610587029630414A5",
    supportedPayment: ["duitnow", "tng"],
    coords: [2.2891242525077584, 102.13812032250256],
  },
  {
    id: 129,
    name: "Surau Nurhidayah Taman Keramat",
    category: "surau",
    state: "Sabah",
    city: "Kota Kinabalu",
    qrImage: "",
    qrContent:
      "00020201021126620014A000000615000101065641670215QRMID00000001640311011209046405204866153034585802MY5925SR NURHIDAYAH TMN KERAMAT6013KOTA KINABALU6105881006304020D",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    id: 130,
    name: "Masjid Bandaraya Kota Kinabalu",
    category: "mosque",
    state: "Sabah",
    city: "Kota Kinabalu",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000210031001789903465204866153034585802MY5919MASJID BANDARAYA KK6013KOTA KINABALU6105880006304417D",
    supportedPayment: ["duitnow", "tng"],
    coords: [5.995496157417058, 116.10821829858426],
  },
  {
    id: 131,
    name: "Madrasah 2 Masjid Bandaraya Kota Kinabalu",
    category: "mosque",
    state: "Sabah",
    city: "Kota Kinabalu",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000211031001789903465204866153034585802MY5925MADRASAH 2 MJD BNDRAYA KK6013KOTA KINABALU610588000630479A8",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    id: 132,
    name: "Masjid Tun Ahmad Shah",
    category: "mosque",
    state: "Sabah",
    city: "Kota Kinabalu",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000003117031001987192485204866153034585802MY5921MASJID TUN AHMAD SHAH6013KOTA KINABALU61058840063049608",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    id: 133,
    name: "Surau Al-Amin KBG",
    category: "surau",
    state: "Sabah",
    city: "Tawau",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000293031001981357625204866153034585802MY5917SURAU AL-AMIN KBG6005TAWAU6105910226304A47A",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    id: 134,
    name: "Surau Al Iman, Taman Megah Jaya",
    category: "surau",
    state: "Sabah",
    city: "Tawau",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000766031001388044355204866153034585802MY5925SURAU AL IMAN TMN MGH JYA6005TAWAU6105910006304852A",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    id: 135,
    name: "Surau Al-Firdaus Al-Hikmah",
    category: "mosque",
    state: "Sabah",
    city: "Tawau",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000001019031001380424235204866153034585802MY5924SUR AL-FIRDAUS AL-HIKMAH6005TAWAU61059100063047934",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    id: 136,
    name: "Surau At Taqwa Apas Permai",
    category: "mosque",
    state: "Sabah",
    city: "Tawau",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000001119031001985378865204866153034585802MY5924SUR AT TAQWA APAS PERMAI6005TAWAU6105910006304A74B",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    id: 137,
    name: "Masjid Ar Rahmah",
    category: "mosque",
    state: "Kelantan",
    city: "Kok Lanas",
    qrImage: "",
    qrContent:
      "00020201021126620014A000000615000101065641670215QRMID00000002630311011263868865204866153034585802MY5916MASJID AR RAHMAH6009KOK LANAS6105164506304A622",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    // https://www.facebook.com/masjidalmuhajirininderasabah/
    id: 138,
    name: "Masjid Al Muhajirin Inderasabah",
    category: "mosque",
    state: "Sabah",
    city: "Tawau",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000004228031001988082975204866153034585802MY5919MASJID AL MUHAJIRIN6005TAWAU6105910306304DEB5",
    supportedPayment: ["duitnow", "tng"],
    coords: [4.299930689886914, 118.17272938790096],
  },
  {
    // https://www.facebook.com/MasjidAnnaimLutongMiri/
    id: 139,
    name: "Masjid An-Naim Lutong",
    category: "mosque",
    state: "Sarawak",
    city: "Lutong",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000185031001687281895204866153034585802MY5921MASJID AN-NAIM LUTONG6014LUTONG SARAWAK6105981006304537A",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    id: 140,
    name: "Surau Nurul Jamilun Subhi",
    category: "surau",
    state: "Sarawak",
    city: "Miri",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000502031001289047455204866153034585802MY5925SURAU NURUL JAMILUN SUBHI6004MIRI61059800063043EF6",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    id: 141,
    name: "Surau Al-Hidayah, Taman Sejoli",
    category: "surau",
    state: "Sarawak",
    city: "Kuching",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000062031001981868005204866153034585802MY5925SURAU AL-HIDAYAH T SEJOLI6007KUCHING61059305063044007",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    id: 142,
    name: "Surau Darul Ilmi PPKS",
    category: "surau",
    state: "Sarawak",
    city: "Kuching",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000073031001981868005204866153034585802MY5921SURAU DARUL ILMI PPKS6012TABUAN JAYA 6105933506304791E",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    id: 143,
    name: "Masjid Darul Muttaqin, Kampung Buntal",
    category: "mosque",
    state: "Sarawak",
    city: "Kuching",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000143031001981740165204866153034585802MY5925MJ DRUL MUTTAQIN KGBUNTAL6007KUCHING61059305063041495",
    supportedPayment: ["duitnow", "tng"],
    coords: [1.701479808480458, 110.3678867107787],
  },
  {
    id: 144,
    name: "Masjid Darus Sakinah",
    category: "mosque",
    state: "Sarawak",
    city: "Kuching",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000162031001988956005204866153034585802MY5920MASJID DARUS SAKINAH6007KUCHING61059325063043B38",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    id: 145,
    name: "Madrasah Tahfiz Al-Faaizun",
    category: "mosque",
    state: "Sarawak",
    city: "Kuching",
    qrImage: "",
    qrContent:
      "00020201021126620014A000000615000101065641670215QRMID00000002690311011105199225204866153034585802MY5925MDRASAH TAHFIZ AL-FAAIZUN6007KUCHING6105930506304DF8E",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    id: 146,
    name: "AJK Surau Darul Istiqamah",
    category: "surau",
    state: "Sarawak",
    city: "Kuching",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000778031001981873455204866153034585802MY5925AJK SURAU DARUL ISTIQAMAH6007KUCHING610593050630405AF",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    id: 147,
    name: "Surau Al Fitrah",
    category: "surau",
    state: "Sarawak",
    city: "Kuching",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000001060031001066841195204866153034585802MY5915SURAU AL FITRAH6007KUCHING61059305063048A86",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    id: 148,
    name: "Masjid Darul Istiqlaal",
    category: "mosque",
    state: "Sarawak",
    city: "Kuching",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000003631031001686287845204866153034585802MY5922MASJID DARUL ISTIQLAAL6007KUCHING61059315063042040",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    id: 149,
    name: "Surau Jabal Nur, Taman Serapi Jaya",
    category: "surau",
    state: "Sarawak",
    city: "Kuching",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000004329031001658946945204866153034585802MY5915SURAU JABAL NUR6007KUCHING610593050630497EA",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    id: 150,
    name: "JK PBN Masjid Baru Kuala Ketil",
    category: "mosque",
    state: "Kedah",
    city: "Kuala Ketil",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000091031001947793585204866153034585802MY5923JK PBN MJD BARU K KETIL6015KUALA KETIL KDH61050930063044A77",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    id: 151,
    name: "Masjid Tok Keling (An-Nur)",
    category: "mosque",
    state: "Kedah",
    city: "Alor Setar",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000134031001644256835204866153034585802MY5924MASJID AN-NUR TOK KELING6010ALOR SETAR610505400630406BC",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    // https://www.facebook.com/jalanputra58/
    id: 152,
    name: "Masjid Kampong Berjaya",
    category: "mosque",
    state: "Kedah",
    city: "Alor Setar",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000135031001348845215204866153034585802MY5922MASJID KAMPONG BERJAYA6010ALOR SETAR610505150630458B8",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    id: 153,
    name: "Masjid Ibrahim, Kariah Penghulu Him",
    category: "mosque",
    state: "Kedah",
    city: "Sungai Petani",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000161031001948033385204866153034585802MY5923MJD KARIAH PENGHULU HIM6013SUNGAI PETANI6105080006304C8F6",
    supportedPayment: ["duitnow", "tng"],
    coords: [5.646779767687788, 100.47985781082296],
  },
  {
    id: 154,
    name: "Masjid Ar Rahman Kerpan",
    category: "mosque",
    state: "Kedah",
    city: "Ayer Hitam",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000201031001946466435204866153034585802MY5923MASJID AR-RAHMAN KERPAN6010ALOR SETAR610506150630420BC",
    supportedPayment: ["duitnow", "tng"],
    coords: [6.260236277604348, 100.22830690369285],
  },
  {
    id: 155,
    name: "Masjid Mohamad Iskandar Wan Tempawan",
    category: "mosque",
    state: "Kedah",
    city: "Alor Setar",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000334031001343537305204866153034585802MY5925MJD M.ISKANDAR W.TEMPAWAN6010ALOR SETAR6105053006304A773",
    supportedPayment: ["duitnow", "tng"],
    coords: [6.12214782156608, 100.39542920676114],
  },
  {
    id: 156,
    name: "Masjid Tunku Puan Habsah",
    category: "mosque",
    state: "Kedah",
    city: "Sungai Petani",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000656031001944457365204866153034585802MY5924MASJID TUNKU PUAN HABSAH6013SUNGAI PETANI61050800063048975",
    supportedPayment: ["duitnow", "tng"],
    coords: [5.604313226425464, 100.47089166589271],
  },
  {
    id: 157,
    name: "Masjid Al-Aziz Tanjung Bendahara",
    category: "mosque",
    state: "Kedah",
    city: "Alor Setar",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000815031001944898665204866153034585802MY5924MASJID TANJUNG BENDAHARA6010ALOR SETAR6105053006304B3DB",
    supportedPayment: ["duitnow", "tng"],
    coords: [6.112458452026402, 100.3748227938539],
  },
  {
    id: 158,
    name: "Pembinaan Surau Sekolah Tawar",
    category: "surau",
    state: "Kedah",
    city: "Kuala Ketil",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000001703031001342446675204866153034585802MY5924PMBINAAN SURAU SEK TAWAR6011KUALA KETIL610509310630420C2",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    // https://www.facebook.com/p/Masjid-Al-Hussain-100064413532530/
    id: 159,
    name: "Masjid Al Hussain",
    category: "mosque",
    state: "Perlis",
    city: "Kuala Perlis",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000203031001255802135204866153034585802MY5925MASJID AL-HUSSAIN KPERLIS6012KUALA PERLIS6105020006304037D",
    supportedPayment: ["duitnow", "tng"],
    coords: [6.3973373757204435, 100.12698125253013],
  },
  {
    // https://www.facebook.com/profile.php?id=100083138536696
    id: 160,
    name: "Masjid Umar Ibnu Al-Khattab",
    category: "mosque",
    state: "Pulau Pinang",
    city: "Bayan Lepas",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000052031001941597945204866153034585802MY5924MJD UMAR IBNU AL KHATTAB6011BAYAN LEPAS610511950630431CF",
    supportedPayment: ["duitnow", "tng"],
    coords: [5.323649335075917, 100.28576359618626],
  },
  {
    // https://www.facebook.com/p/Masjid-Hashim-Yahaya-Jalan-Perak-Pulau-Pinang-100070137350620/
    id: 161,
    name: "Qaryah Masjid Jamek Hashim Yahaya",
    category: "mosque",
    state: "Pulau Pinang",
    city: "George Town",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000065031001748682795204866153034585802MY5924QARYAH MJD HASHIM YAHAYA6010GEORGETOWN6105101506304C4E6",
    supportedPayment: ["duitnow", "tng"],
    coords: [5.406444730313146, 100.31502294962519],
  },
  {
    id: 162,
    name: "Masjid Jamek Al-Munawwar",
    category: "mosque",
    state: "Pulau Pinang",
    city: "George Town",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000131031001249319885204866153034585802MY5924MASJID JAMI' AL MUNAWWAR6012PULAU PINANG6105102506304486A",
    supportedPayment: ["duitnow", "tng"],
    coords: [5.4305531594911365, 100.3163884171746],
  },
  {
    id: 163,
    name: "Masjid Al-Hidayah Bayan Lepas",
    category: "mosque",
    state: "Pulau Pinang",
    city: "Bayan Lepas",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000252031001348100085204866153034585802MY5925MJD ALHIDAYAH BAYAN LEPAS6011BAYAN LEPAS610511900630471F2",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    // https://www.facebook.com/darulmuhajarinpenang/
    id: 164,
    name: "Madrasah Darul Muhajirin",
    category: "mosque",
    state: "Pulau Pinang",
    city: "Tasek Gelugor",
    qrImage: "",
    qrContent:
      "00020201021126620014A000000615000101065641670215QRMID00000004900311011109455815204866153034585802MY5924MADRASAH DARUL MUHAJIRIN6013TASEK GELUGOR610513310630477DA",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    // https://www.facebook.com/masjidpadangibu/
    id: 165,
    name: "Qaryah Masjid Jamek Padang Ibu",
    category: "mosque",
    state: "Pulau Pinang",
    city: "Bukit Mertajam", // Kubang Semang
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000920031001257747715204866153034585802MY5924QARYAH MASJID PADANG IBU6013KUBANG SEMANG61051440063049CBF",
    supportedPayment: ["duitnow", "tng"],
    coords: [5.425164230283627, 100.46746316680736],
  },
  {
    id: 166,
    name: "Surau At-Taqwa SK Mutiara Perdana",
    category: "surau",
    state: "Pulau Pinang",
    city: "Bayan Lepas",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000001403031001350440405204866153034585802MY5925SURAU AT-TAQWA SK MUT PER6011BAYAN LEPAS6105119206304AB56",
    supportedPayment: ["duitnow", "tng"],
    coords: [5.308845999072052, 100.26478043787486], // Coordinates for SK Mutiara Perdana
  },
  {
    id: 167,
    name: "Tabung Masjid Bayan Lepas",
    category: "mosque",
    state: "Pulau Pinang",
    city: "Bayan Lepas",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000001444031001945703555204866153034585802MY5922TABUNG MJD BAYAN LEPAS6011BAYAN LEPAS610511900630406F2",
    supportedPayment: ["duitnow", "tng"],
    // coords: [5.296114513937864, 100.25942012815462], // Might be wrong, mosque name too vague, need to check
  },
  {
    id: 168,
    name: "Tahfiz Manahilil Irfan",
    category: "mosque",
    state: "Pulau Pinang",
    city: "Bayan Lepas",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000003546031001251479815204866153034585802MY5922TAHFIZ MANAHILIL IRFAN6011BAYAN LEPAS6105119606304B73D",
    supportedPayment: ["duitnow", "tng"],
    coords: [5.286756050866698, 100.27957298790938],
  },
  {
    id: 169,
    name: "Masjid Bandar Putra (IOI)",
    category: "mosque",
    state: "Johor",
    city: "Segamat",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000006031001276981245204866153034585802MY5924MASJID BDR PUTRA SEGAMAT6007SEGAMAT6105850006304E974",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    // https://www.facebook.com/masjidalhikmahfeldaairtawar5/
    id: 170,
    name: "Masjid Al-Hikmah Felda Air Tawar 5",
    category: "mosque",
    state: "Johor",
    city: "Kota Tinggi",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000015031001778693685204866153034585802MY5922MASJID AL HIKMAH KFAT56011KOTA TINGGI61058190063043B17",
    supportedPayment: ["duitnow", "tng"],
    coords: [1.6039187182484582, 104.09006345524395],
  },
  {
    // https://www.facebook.com/badanmasjidfsemenchu/
    id: 171,
    name: "Masjid Felda Semenchu",
    category: "mosque",
    state: "Johor",
    city: "Kota Tinggi",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000016031001376433725204866153034585802MY5921MASJID FELDA SEMENCHU6011KOTA TINGGI61058190063047585",
    supportedPayment: ["duitnow", "tng"],
    coords: [1.569809287944585, 104.10139847686452],
  },
  {
    id: 172,
    name: "Tabung Masjid Batu 1 Kt Tinggi",
    category: "mosque",
    state: "Johor",
    city: "Kota Tinggi",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000055031001374790945204866153034585802MY5925TBG MASJID BT 1 KT TINGGI6011KOTA TINGGI61058190063046909",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    id: 173,
    name: "JK Pbn Surau Darul Athiah",
    category: "surau",
    state: "Johor",
    city: "Batu Pahat",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000060031001786662025204866153034585802MY5925JK PBN SURAU DARUL ATHIAH6010BATU PAHAT61058300063044870",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    // https://www.facebook.com/p/Masjid-Assyakirin-Aping-Barat-100072113354988/
    id: 174,
    name: "Masjid As'syakirin Aping Barat",
    category: "mosque",
    state: "Johor",
    city: "Kota Tinggi",
    qrImage: "",
    qrContent:
      "00020201021126620014A000000615000101065641670215QRMID00000001090311011191402405204866153034585802MY5925MJ ASSYAKIRIN APING BARAT6011KOTA TINGGI6105819006304BCC4",
    supportedPayment: ["duitnow", "tng"],
    coords: [1.829789050926298, 103.99130951605407],
  },
  {
    id: 175,
    name: "Masjid An-Nur Kampung Tanjung Buai",
    category: "mosque",
    state: "Johor",
    city: "Kota Tinggi",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000110031001127676595204866153034585802MY5924MASJID AN-NUR KG TG BUAI6011KOTA TINGGI61058190063049729",
    supportedPayment: ["duitnow", "tng"],
    coords: [1.4964204822307026, 104.04447591678588],
  },
  {
    // https://www.facebook.com/surau.alrayyan.tpj/
    id: 176,
    name: "Surau Al-Rayyan, Taman Puteri Jaya",
    category: "surau",
    state: "Johor",
    city: "Batu Pahat",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000119031001378721725204866153034585802MY5925SR ALRAYYAN T PUTERI JAYA6010BATU PAHAT61058300063047C0A",
    supportedPayment: ["duitnow", "tng"],
    coords: [1.8829160120692154, 102.95555538073408],
  },
  {
    // https://www.facebook.com/masjidparitsulong/?locale=ms_MY
    id: 177,
    name: "Masjid Jamek Pekan Parit Sulong",
    category: "mosque",
    state: "Johor",
    city: "Parit Sulong",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000127031001270942455204866153034585802MY5925MJ JAMEK PEKAN PRT SULONG6012PARIT SULONG610583500630455E6",
    supportedPayment: ["duitnow", "tng"],
    coords: [1.9759040189084847, 102.88537731343868],
  },
  {
    // https://www.facebook.com/masjid.terminal.larkin.jb/
    id: 178,
    name: "Masjid An-Nur @ Larkin Sentral",
    category: "mosque",
    state: "Johor",
    city: "Johor Bahru",
    qrImage: "",
    qrContent:
      "00020201021126600014A000000615000101065641670215QRMID000000015403090721951215204866153034585802MY5925MJD AN-NUR LARKIN SENTRAL6011JOHOR BAHRU610580000630485A2",
    supportedPayment: ["duitnow", "tng"],
    coords: [1.4956104088480497, 103.74203342180577],
  },
  {
    // https://www.facebook.com/mtsSAUJANA/
    id: 179,
    name: "TP Masjid Taman Seri Saujana",
    category: "mosque",
    state: "Johor",
    city: "Kota Tinggi",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000179031001979785735204866153034585802MY5922TP MJD TMN SRI SAUJANA6011KOTA TINGGI6105819006304D5CF",
    supportedPayment: ["duitnow", "tng"],
    coords: [1.663632646781114, 103.85305831563403],
  },
  {
    id: 180,
    name: "Masjid Jamek Kampung Simpang",
    category: "mosque",
    state: "Johor",
    city: "Kota Tinggi",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000181031001274195165204866153034585802MY5923MASJID JAMEK KG SIMPANG6011KOTA TINGGI61058190063045CEE",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    // https://www.facebook.com/masjidjamekalmubarak/
    id: 181,
    name: "Masjid Al-Mubarak Bandar Putra",
    category: "mosque",
    state: "Johor",
    city: "Kulai",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000213031001970047375204866153034585802MY5923MASJID JAMEK AL MUBARAK6005KULAI6105810006304554F",
    supportedPayment: ["duitnow", "tng"],
    coords: [1.6573074683250768, 103.62575649368574],
  },
  {
    id: 182,
    name: "Masjid Jamek Al-Ehsan Felda Pasak",
    category: "mosque",
    state: "Johor",
    city: "Kota Tinggi",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000234031001975921205204866153034585802MY5921MASJID JAMEK AL EHSAN6011KOTA TINGGI610581900630474FC",
    supportedPayment: ["duitnow", "tng"],
    coords: [1.710101969265588, 103.95531798313507],
  },
  {
    // https://www.facebook.com/profile.php?id=100057221119534
    id: 183,
    name: "PASTI Kawasan Johor Bahru",
    category: "others",
    state: "Johor",
    city: "Johor Bahru",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000237031001778096795204866153034585802MY5921PASTI KAW JOHOR BAHRU6011JOHOR BAHRU61058035063046979",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    id: 184,
    name: "Masjid Baru FELDA Air Tawar 4",
    category: "mosque",
    state: "Johor",
    city: "Kota Tinggi",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000243031001671652005204866153034585802MY5921MASJID BARU FELDA AT46011KOTA TINGGI6105819006304279D",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    // https://www.suraualtaqwa.my/
    // https://www.facebook.com/suraualtaqwa/
    id: 185,
    name: "Surau Al-Taqwa Pulai Bistari",
    category: "surau",
    state: "Johor",
    city: "Johor Bahru", // Kangkar Pulai
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000261031001374535355204866153034585802MY5925SR AL TAQWA PULAI BISTARI6013KANGKAR PULAI610581110630474F5",
    supportedPayment: ["duitnow", "tng"],
    coords: [1.5658237720271035, 103.59163477321788],
  },
  {
    // https://www.facebook.com/p/Masjid-Bandar-Tun-Hussein-Onn-100064325539673/
    id: 186,
    name: "Masjid Jamek Tun Hussein Onn",
    category: "mosque",
    state: "Johor",
    city: "Johor Bahru",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000275031001977795515204866153034585802MY5922MASJID TUN HUSSEIN ONN6011JOHOR BAHRU6105803506304E577",
    supportedPayment: ["duitnow", "tng"],
    coords: [1.5039161456339258, 103.74087858075654],
  },
  {
    // https://www.facebook.com/SurauAlJauhar/
    id: 187,
    name: "Surau Al Jauhar Taman Sentosa",
    category: "surau",
    state: "Johor",
    city: "Johor Bahru",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000286031001977956655204866153034585802MY5925SURAU AL JAUHAR T.SENTOSA6011JOHOR BAHRU61058015063040C15",
    supportedPayment: ["duitnow", "tng"],
    coords: [1.494897869352992, 103.76926077511648],
  },
  {
    id: 188,
    name: "Masjid Jamek Al-Husna Segamat Baru", // Ada dua masjid jamek segamat, ni yang baru
    category: "mosque",
    state: "Johor",
    city: "Segamat",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000288031001772544695204866153034585802MY5925MASJID JAMEK SEGAMAT BARU6007SEGAMAT6105850006304B9D5",
    supportedPayment: ["duitnow", "tng"],
    coords: [2.495389913979471, 102.85368231492549],
  },
  {
    // https://www.facebook.com/masjid.tamandatoonnlarkin/
    id: 189,
    name: "Masjid Taman Dato Onn Larkin",
    category: "mosque",
    state: "Johor",
    city: "Johor Bahru",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000312031001972619645204866153034585802MY5923MJD TMN DATO'ONN LARKIN6011JOHOR BAHRU61058035063047394",
    supportedPayment: ["duitnow", "tng"],
    coords: [1.4872646593121845, 103.75094604932772],
  },
  {
    // https://www.facebook.com/masjidchaah/
    id: 190,
    name: "Masjid Jamek Chaah",
    category: "mosque",
    state: "Johor",
    city: "Chaah",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000341031001973443005204866153034585802MY5912MASJID CHAAH6005CHAAH6105854006304A34C",
    supportedPayment: ["duitnow", "tng"],
    coords: [2.248216589533912, 103.03979517772844],
  },
  {
    // https://www.facebook.com/masjid.at.taqwa.kulai/
    id: 191,
    name: "Surau At-Taqwa Kulai",
    category: "surau",
    state: "Johor",
    city: "Kulai",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000344031001271484165204866153034585802MY5920SURAU AT-TAQWA KULAI6005KULAI6105810006304385D",
    supportedPayment: ["duitnow", "tng"],
    coords: [1.650176913836318, 103.60524536758835],
  },
  {
    id: 192,
    name: "Pertubuhan Khairat Kematian E.H", // ASK: Meaning of E.H?
    category: "mosque",
    state: "Johor",
    city: "Batu Pahat",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000385031001335750525204866153034585802MY5925PRTBHN KHAIRAT KMTIAN E.H6010BATU PAHAT6105830006304B99A",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    id: 193,
    name: "JK Pembinaan Surau Alpinia Bandar Putra",
    category: "surau",
    state: "Johor",
    city: "Kulai",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000548031001277816935204866153034585802MY5925JK PMBINAAN SURAU ALPINIA6005KULAI6105810006304DB50",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    // https://www.facebook.com/ANWARULMAHABBAHKLUANG/
    id: 194,
    name: "Pengajian Anwarul Mahabbah",
    category: "others",
    state: "Johor",
    city: "Kluang",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000706031001772005455204533153034585802MY5916ANWARUL MAHABBAH6006KLUANG6105860006304DE42",
    supportedPayment: ["duitnow", "tng"],
    coords: [1.970375489111683, 103.24324370129204],
  },
  {
    // https://yayasanhidayah.my/
    id: 195,
    name: "Yayasan Pendidikan Hidayah",
    category: "others",
    state: "Johor",
    city: "Johor Bahru",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000717031001977849795204839853034585802MY5925YAYASAN PNDIDIKAN HIDAYAH6006SKUDAI610581300630438E5",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    // https://www.facebook.com/MSAMuarJohor/
    id: 196,
    name: "Masjid Sungai Abong",
    category: "mosque",
    state: "Johor",
    city: "Muar",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000775031001265197815204866153034585802MY5919MASJID SUNGAI ABONG6004MUAR6105840006304E6C6",
    supportedPayment: ["duitnow", "tng"],
    coords: [2.0592866115891697, 102.59555938672425],
  },
  {
    // https://www.facebook.com/p/Masjid-Tunku-Laksamana-Abdul-Jalil-100064825270284/
    id: 197,
    name: "Masjid Tunku Laksamana Abdul Jalil",
    category: "mosque",
    state: "Johor",
    city: "Johor Bahru",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000830031001956609235204866153034585802MY5922MASJID TUNKU LAKSAMANA6011JOHOR BAHRU610580990630490E4",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    id: 198,
    name: "Surau Jalan Kurniawati",
    category: "surau",
    state: "Johor",
    city: "Johor Bahru",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000909031001972881115204866153034585802MY5917SURAU KURNIAWATI 6011JOHOR BAHRU6105802506304771D",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    // https://www.facebook.com/MSIBP/
    id: 199,
    name: "Masjid Jamek Sultan Ismail",
    category: "mosque",
    state: "Johor",
    city: "Batu Pahat",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000001151031001375298155204866153034585802MY5922MASJID SULTAN IBRAHIM 6010BATU PAHAT61058300063043E7E",
    supportedPayment: ["duitnow", "tng"],
    coords: [1.856047406146543, 102.94620040443927],
  },
  {
    // https://www.facebook.com/jkmbktOfficial/
    id: 200,
    name: "J.K Masjid Bandar Kota Tinggi",
    category: "mosque",
    state: "Johor",
    city: "Kota Tinggi",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000002261031001978652145204866153034585802MY5922J.K MJD BNDAR K.TINGGI6011KOTA TINGGI6105819006304D504",
    supportedPayment: ["duitnow", "tng"],
    coords: [1.7421092169404855, 103.8984277416688],
  },
  {
    // https://www.facebook.com/p/Surau-Taman-Pasak-Indah-kota-Tinggi-100066368724844/
    id: 201,
    name: "Surau Taman Pasak Indah",
    category: "surau",
    state: "Johor",
    city: "Kota Tinggi",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000002273031001374184385204866153034585802MY5923SURAU TAMAN PASAK INDAH6011KOTA TINGGI6105819006304F706",
    supportedPayment: ["duitnow", "tng"],
    coords: [1.7191929811727156, 103.9639904970344],
  },
  {
    id: 202,
    name: "Surau Al Amin Desa Rhu 2",
    category: "surau",
    state: "Negeri Sembilan",
    city: "Seremban",
    qrImage: "",
    qrContent:
      "00020201021126620014A000000615000101065641670215QRMID00000024220311011169202115204866153034585802MY5924SURAU AL AMIN DESA RHU 26008SEREMBAN610570400630435D3",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    id: 203,
    name: "Tabung Khairat Pembinaan Masjid",
    category: "mosque",
    state: "Johor",
    city: "Kulai",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000004184031001975381815204866153034585802MY5924TBG KHAIRAT PMBINAAN MJD6005KULAI6105810006304DB15",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    id: 204,
    name: "Tabung Urusan Kubur Johor",
    category: "others",
    state: "Johor",
    city: "Johor Bahru",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000004809031001975757655204866153034585802MY5925TABUNG URUSAN KUBUR JOHOR6011JOHOR BAHRU61058099063046A78",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    // https://www.facebook.com/SUAAKULAI/ (Unactive, latest post 2020)
    id: 205,
    name: "Surau Umar Abdul Aziz, Bandar Putra",
    category: "surau",
    state: "Johor",
    city: "Kulai",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000004931031001979675575204866153034585802MY5921SURAU UMAR ABDUL AZIZ6005KULAI6105810006304C6D0",
    supportedPayment: ["duitnow", "tng"],
    coords: [1.6630202495800865, 103.64198617799235],
  },
  {
    id: 206,
    name: "Masjid Seremban Jaya",
    category: "mosque",
    state: "Negeri Sembilan",
    city: "Seremban",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000031031001361663255204866153034585802MY5920MASJID SEREMBAN JAYA6008SEREMBAN6105701006304A64F",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    // https://www.facebook.com/masjidhussainofficial/
    id: 207,
    name: "Masjid Hussain",
    category: "mosque",
    state: "Negeri Sembilan",
    city: "Seremban 2",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000034031001361663255204866153034585802MY5925MASJID HUSSAIN SEREMBAN 26008SEREMBAN61057010063044099",
    supportedPayment: ["duitnow", "tng"],
    coords: [2.6882401127514175, 101.9180310852145],
  },
  {
    // https://www.facebook.com/p/Masjid-Assyakirin-Gemencheh-100067832415297/
    id: 208,
    name: "Masjid Assyakirin Gemencheh",
    category: "mosque",
    state: "Negeri Sembilan",
    city: "Gemencheh",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000113031001937171925204866153034585802MY5924MJD ASSYAKIRIN GEMENCHEH6012GEMENCHEH NS610573200630455D9",
    supportedPayment: ["duitnow", "tng"],
    coords: [2.5239963936912186, 102.39572948662175],
  },
  {
    // https://www.facebook.com/masjidattaqwaparoi/
    id: 209,
    name: "Masjid At-Taqwa Kampung Paroi",
    category: "mosque",
    state: "Negeri Sembilan",
    city: "Seremban",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000247031001931348705204866153034585802MY5925M ATTAQWA KARIAH KG PAROI6008SEREMBAN6105704006304C873",
    supportedPayment: ["duitnow", "tng"],
    coords: [2.7220082373899306, 101.99235827270162],
  },
  {
    id: 210,
    name: "Tabung Surau SMK Tuanku Abdul Rahman",
    category: "surau",
    state: "Negeri Sembilan",
    city: "Gemas",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000240031001979581465204866153034585802MY5919TABUNG SURAU SMKTAR6005GEMAS610573400630440A5",
    supportedPayment: ["duitnow", "tng"],
    coords: [2.583615613058011, 102.60773728251492],
  },
  {
    // https://www.facebook.com/mwtkn9/
    // https://www.instagram.com/masjid_warisan_tk/
    id: 211,
    name: "Masjid Warisan Telok Kemang",
    category: "mosque",
    state: "Negeri Sembilan",
    city: "Port Dickson",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000530031001756163305204866153034585802MY5923MJD WRISAN TELOK KEMANG6012PORT DICKSON61057105063042F96",
    supportedPayment: ["duitnow", "tng"],
    coords: [2.4633698162499096, 101.85447690114914],
  },
  {
    // https://www.facebook.com/sbsmpal/
    id: 212,
    name: "Surau Batu Sheikh Muhammad Paiz Al-Linggi",
    category: "surau",
    state: "Negeri Sembilan",
    city: "Port Dickson",
    qrImage: "",
    qrContent:
      "00020201021126620014A000000615000101065641670215QRMID00000006630311011187067385204533153034585802MY5924SR SHEIKH PAIZ AL-LINGGI6012PORT DICKSON6105711506304CE6B",
    supportedPayment: ["duitnow", "tng"],
    coords: [2.491568875504438, 102.00662727842227],
  },
  {
    id: 213,
    name: "Masjid Kariah Felda Palong 3",
    category: "mosque",
    state: "Negeri Sembilan",
    city: "Gemas",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000001126031001330580385204866153034585802MY5923MJD KARIAH (F) PALONG 36005GEMAS61057364063049828",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    id: 214,
    name: "Tabung Anak Yatim Masjid P.Jaya",
    category: "mosque",
    state: "Negeri Sembilan",
    city: "Seremban",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000001377031001265787235204866153034585802MY5925TBG ANAK YATIM MJD P.JAYA6008SEREMBAN6105704006304294B",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    id: 215,
    name: "Masjid Al-Falihin Kampung Alai",
    category: "mosque",
    state: "Melaka",
    city: "Alai",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000106031001767100515204866153034585802MY5922MJD AL-FALIHIN KG ALAI6012ALAI  MELAKA61057546063046098",
    supportedPayment: ["duitnow", "tng"],
    coords: [2.179450977404295, 102.30533465452297],
  },
  {
    id: 216,
    name: "Surau An Nur PIBG SMK Padang Temu",
    category: "surau",
    state: "Melaka",
    city: "Padang Temu",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000001688031001761293945204866153034585802MY5924SURAU AN NUR PIBG SMKPTM6006MELAKA6105754606304F8CD",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    // TODO: Details not quite suffice, remove?
    id: 217,
    name: "Ukhuwah",
    category: "mosque",
    state: "Melaka",
    city: "Melaka",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000005035031001967078795204839853034585802MY5907UKHUWAH6006MELAKA6105764506304ACF2",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    // https://www.facebook.com/profile.php?id=100089861776392
    id: 218,
    name: "Masjid Setia Alam Seksyen U13",
    category: "mosque",
    state: "Selangor",
    city: "Shah Alam",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065018540215000001224037457031000000000005204866153034585802MY5920MASJID SETIA ALAM-QR6009SHAH ALAM6105401706215011110186840000630414C0",
    supportedPayment: ["duitnow", "tng"],
    coords: [3.1030528, 101.4417153],
  },
  {
    // https://www.facebook.com/baitulrahmanamanperdana/
    id: 219,
    name: "Surau Baitul Rahman, Taman Aman Perdana",
    category: "surau",
    state: "Selangor",
    city: "Klang",
    qrImage: "",
    qrContent:
      "00020201021126580014A000000615000101065887340212MBBQR1687780031000000000005204000053034585802MY5919SURAU BAITUL RAHMAN6008SELANGOR630447A5",
    supportedPayment: ["duitnow", "tng"],
    coords: [3.0941948808682422, 101.40919706865623],
  },
  {
    // https://www.facebook.com/masjidalfirdaussegambut/
    id: 220,
    name: "Masjid Al-Firdaus",
    category: "mosque",
    state: "W.P. Kuala Lumpur",
    city: "Segambut", // Segambut Luar
    qrImage: "",
    qrContent:
      "00020201021126580014A000000615000101065887340212MBBQR1384949031000000000005204729953034585802MY5917MASJID AL FIRDAUS6012KUALA LUMPUR630448CA",
    supportedPayment: ["duitnow"],
    coords: [3.188228277568797, 101.66885468893277],
  },
  {
    id: 221,
    name: "Surau Haji Omar, Jalan Genting",
    category: "surau",
    state: "Selangor",
    city: "Klang",
    qrImage: "",
    qrContent:
      "00020201021126420014A000000615000101066033460210MD001301335204866153034585802MY5925Surau Hj Omar Jln Genting6002MY6273032517071030332970090364035730520170710363623000637960716170710184223100163040BE9",
    supportedPayment: ["duitnow", "tng"],
    coords: [3.0705502405615954, 101.40133071533951],
  },
  {
    // https://www.facebook.com/masjidahmadirp/
    id: 222,
    name: "Masjid Ahmadi Rantau Panjang",
    category: "mosque",
    state: "Selangor",
    city: "Klang",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000345031001935771345204866153034585802MY5923MASJID AHMADI R.PANJANG6005KLANG610542100630451B6",
    supportedPayment: ["duitnow", "tng"],
    coords: [3.0584777, 101.4084735],
  },
  {
    // https://www.facebook.com/masjidannurglenmarie/
    id: 223,
    name: "Masjid An-Nur Temasya Glenmarie",
    category: "mosque",
    state: "Selangor",
    city: "Shah Alam",
    qrImage: "",
    qrContent:
      "00020101021126610014A000000615000101065641670215QRMID000000002103100123425951520430005303458540500.005802MY5923MASJID AN-NUR GLENMARIE6009SHAH ALAM6105401506304CF92",
    supportedPayment: ["duitnow", "tng"],
    coords: [3.0904867, 101.5771061],
  },
  {
    id: 224,
    name: "Masjid Al Aziz Al Hadi Mukim Kota Warisan",
    category: "mosque",
    state: "Kelantan",
    city: "Kota Bharu",
    qrImage: "",
    qrContent:
      "00020201021126420014A000000615000101066033460210MD001351855204866153034585802MY5922Masjid Al Aziz Al Hadi6002MY6273032517185452588090027722341210520171854529821600280160716171854410260400163043A93",
    supportedPayment: ["duitnow", "tng"],
    coords: [6.156211316956017, 102.20206961957389],
  },
  {
    id: 225,
    name: "Surau Ar-Raudhah, Taman Pantai Sepang Utara",
    category: "surau",
    state: "Selangor",
    city: "Sungai Pelek",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000007399041001655728855204866153034585802MY5918MUSOLLA AR-RAUDHAH6006SEPANG61054390063043931",
    supportedPayment: ["duitnow"],
    coords: [2.6262634074357485, 101.70727055288329],
  },
  {
    // https://www.facebook.com/MasjidArRahahKualaLumpur/
    id: 226,
    name: "Masjid Ar-Rahah",
    category: "mosque",
    state: "W.P. Kuala Lumpur",
    city: "Kuala Lumpur",
    qrImage: "",
    qrContent: "https://qr.tngdigital.com.my/m/281011056461095422624256135",
    supportedPayment: ["tng"],
    coords: [3.1138839387692325, 101.66876285084557],
  },
  {
    // https://www.facebook.com/maebk5/
    id: 227,
    name: "Masjid Al-Ehsan, Bandar Kinrara",
    category: "mosque",
    state: "Selangor",
    city: "Puchong",
    qrImage: "",
    qrContent:
      "00020201021126560014A0000006150001010689006102246022b89b11a4a9ef9c5dce705204599953034585802MY5915MASJID AL-EHSAN6002MY82403c10e7b548543bc94628906e095bd79f39cef91b6304404B",
    supportedPayment: ["duitnow"],
    coords: [3.0455435411318748, 101.64529926429225],
  },
  {
    // https://www.facebook.com/masjidhusna/
    id: 228,
    name: "Masjid Al-Husna, Bandar Sunway",
    category: "mosque",
    state: "Selangor",
    city: "Petaling Jaya",
    qrImage: "",
    qrContent:
      "00020201021126580014A000000615000101065887340212MBBQR1643608031000000000005204000053034585802MY5915MASJID AL-HUSNA6008SELANGOR6304298E",
    supportedPayment: ["duitnow"],
    coords: [3.074910431713615, 101.60710459604896],
  },
  {
    id: 229,
    name: "Surau Ibnu Sina UITM Puncak Alam",
    category: "surau",
    state: "Selangor",
    city: "Puncak Alam",
    qrImage: "",
    qrContent:
      "00020201021126420014A000000615000101066033460210MD000107365204829953034585802MY5925UNIVERSITI TEKNOLOGI MARA6002MY627303251673926826765007940334875052016762633690920014323071616762632433440096304BC32",
    supportedPayment: ["duitnow"],
    coords: [3.1987214028503774, 101.45287150981959],
  },
  {
    // https://www.facebook.com/masjidbbr/
    id: 230,
    name: "Masjid Bandar Bukit Raja",
    category: "mosque",
    state: "Selangor",
    city: "Klang",
    qrImage: "",
    qrContent:
      "00020201021126520014A000000615000101068900530220MDN165667779814771485204866153034585802MY5921MASJIDBANDARBUKITRAJA6005KLANG630496CB",
    supportedPayment: ["duitnow"],
    coords: [3.090211966850386, 101.42970473009046],
  },
  {
    id: 231,
    name: "Masjid Asy-Syakirin, KLCC",
    category: "mosque",
    state: "W.P. Kuala Lumpur",
    city: "Kuala Lumpur",
    qrImage: "",
    qrContent:
      "00020201021126420014A000000615000101066033460210MD000007835204866153034585802MY5924Masjid Asy-Syakirin KLCC6002MY62530325162883612792300732003419405201628836167342002723063045E07",
    supportedPayment: ["duitnow"],
    coords: [3.1573232097845083, 101.71703391351849],
  },
  {
    /* TODO: There are two Surau Nurul Hidayah in Selangor, need to be more specific
    Surau Nurul Hidayah, Prima Selayang
    Surau Nurul Hidayah, Taman Kemacahaya
    */
    id: 232,
    name: "Surau Nurul Hidayah",
    category: "surau",
    state: "Selangor",
    city: "",
    qrImage: "",
    qrContent:
      "00020201021126580014A000000615000101065641600226126209000027950RHBQR0345635204739953034585802MY5919Surau Nurul Hidayah6002MY61054320062250309ROA0699410708SNHQR2538264ABA0D0725C918EF294C850B9BF88E836A9F0999D1E1204AB857F64764E80662B6304E439",
    supportedPayment: ["duitnow"],
  },
  {
    // https://www.facebook.com/masjid.abu.ubaidah/
    id: 233,
    name: "Masjid Abu Ubaidah Al Jarrah",
    category: "mosque",
    state: "W.P. Kuala Lumpur",
    city: "Kuala Lumpur",
    qrImage: "",
    qrContent:
      "00020201021126420014A000000615000101066033460210MD000025405204866153034585802MY5925MASJID ABU UBAIDAH AL JAR6002MY6273032516330783723630049414272730520172137330156900795620716163307769676500463043FDB",
    supportedPayment: ["duitnow"],
    coords: [3.1937375498404372, 101.72870676988711],
  },
  {
    // https://www.masjidwilayah.gov.my/
    // https://www.facebook.com/masjidwilayahpersekutuan/
    id: 234,
    name: "Masjid Wilayah Persekutuan",
    category: "mosque",
    state: "W.P. Kuala Lumpur",
    city: "Kuala Lumpur",
    qrImage: "",
    qrContent:
      "00020201021126420014A000000615000101066033460210MD000011395204866153034585802MY5929MASJID WILAYAH PERSEKUTUAN KL6002MY6253032516297759221400042396012760520162977593414100357106304CB9C",
    supportedPayment: ["duitnow"],
    coords: [3.17218843155993, 101.67160440797008],
  },
  {
    // https://www.facebook.com/masjidseven/
    id: 235,
    name: "Masjid Seksyen 7 Shah Alam",
    category: "mosque",
    state: "Selangor",
    city: "Shah Alam",
    qrImage: "",
    qrContent:
      "00020101021126580014A000000615000101065887340212MBBQR129369103100000000000520400005303458540500.005802MY5916MASJID SEKSYEN 76008SELANGOR6304799C",
    supportedPayment: ["duitnow", "tng"],
    coords: [3.071487332534143, 101.48189133495627],
  },
  {
    // https://www.mssaas.gov.my/
    // https://www.facebook.com/masjidnegeriselangor/
    id: 236,
    name: "Masjid Sultan Salahuddin Abdul Aziz Shah",
    category: "mosque",
    state: "Selangor",
    city: "Shah Alam",
    qrImage: "",
    qrContent:
      "00020201021126420014A000000615000101066033460210MD000002755204866153034585802MY5922MASJID NEGERI SELANGOR6002MY627303251620111366044008752000885052016747112716590010126071616201107832770076304A961",
    supportedPayment: ["duitnow"],
    coords: [3.079201865570446, 101.52064542402636],
  },
  {
    // https://mtajbj.gov.my/
    // https://www.facebook.com/MTAJBJ/
    id: 237,
    name: "Masjid Tengku Ampuan Jemaah Bukit Jelutong",
    category: "mosque",
    state: "Selangor",
    city: "Shah Alam",
    qrImage: "",
    qrContent:
      "00020201021126420014A000000615000101066033460210MD000021125204866153034585802MY5927MASJID TENGKU AMPUAN JEMAAH6002MY6253032516322926602800010665964820520163229279016800842816304B6E8",
    supportedPayment: ["duitnow"],
    coords: [3.0995722494486113, 101.53908664659981],
  },
  {
    // https://www.facebook.com/masjidcyberjaya10/
    // https://www.instagram.com/masjidcyberjaya10/
    id: 238,
    name: "Masjid Cyberjaya 10",
    category: "mosque",
    state: "Selangor",
    city: "Cyberjaya",
    qrImage: "",
    qrContent:
      "00020201021126580014A000000615000101065887340212MBBQR1634314031000000000005204000053034585802MY5919MASJID CYBERJAYA 106015WP KUALA LUMPUR62270723MBBQR1634314INFAQONLINE630401DB",
    supportedPayment: ["duitnow", "tng"],
    coords: [2.9004262, 101.6288741],
  },
  {
    // https://www.facebook.com/mai13.official/
    // https://www.instagram.com/mai13.official/
    id: 239,
    name: "Masjid Al-Ikhlas Seksyen 13 Shah Alam",
    category: "mosque",
    state: "Selangor",
    city: "Shah Alam",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000003031001930793065204866153034585802MY5924MASJID AL-IKHLAS SEK. 136009SHAH ALAM6105400006304B186",
    supportedPayment: ["duitnow", "tng"],
    coords: [3.0865926, 101.5427397],
  },
  {
    // https://www.facebook.com/masjidkotakemuning/
    id: 240,
    name: "Masjid Kota Kemuning",
    category: "mosque",
    state: "Selangor",
    city: "Shah Alam",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065018540215000001234001816031000000000005204866153034585802MY5923MASJID KOTA KEMUNING-QR6009SHAH ALAM61054046062150111102286000006304D60C",
    supportedPayment: ["duitnow", "tng"],
    coords: [3.0026341, 101.5351182],
  },
  {
    // https://www.facebook.com/MasjidDarulEhsanSubangJaya/
    id: 241,
    name: "Masjid Darul Ehsan SS15 Subang Jaya",
    category: "mosque",
    state: "Selangor",
    city: "Subang Jaya",
    qrImage: "",
    qrContent:
      "00020101021126580014A000000615000101065887340212MBBQR129928603100000000000520400005303458540500.005802MY5918MASJID DARUL EHSAN6008SELANGOR63044A00",
    supportedPayment: ["duitnow", "tng"],
    coords: [3.101386, 101.4345701],
  },
  {
    id: 242,
    name: "Masjid Syed Alwi Batu Anam",
    category: "mosque",
    state: "Johor",
    city: "Batu Anam",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000278031001372358515204866153034585802MY5916MASJID SYED ALWI6009BATU ANAM6105851006304F1EE",
    supportedPayment: ["duitnow", "tng"],
    coords: [2.5711614, 102.7086086],
  },
  {
    // https://www.facebook.com/masjidrajahajifisabilillah/
    id: 243,
    name: "Masjid Raja Haji Fi Sabilillah Cyberjaya",
    category: "mosque",
    state: "Selangor",
    city: "Cyberjaya",
    qrImage: "",
    qrContent:
      "00020201021126420014A000000615000101066033460210MD000023045204866153034585802MY5930MASJID RAJA HAJI FI SABILILLAH6002MY6253032516327093926000030197246580520163270983900800704486304F4F5",
    supportedPayment: ["duitnow", "tng"],
    coords: [2.9324933, 101.6453831],
  },
  {
    id: 244,
    name: "Masjid Nurul Iman Sg Bertek, Teluk Gadong",
    category: "mosque",
    state: "Selangor",
    city: "Klang",
    qrImage: "",
    qrContent:
      "00020201021126420014A000000615000101066033460210MD001015535204866153034585802MY5917MASJID NURUL IMAN6002MY62730325167886296094100630989091205201678862964570007352507161678862768391001630498F1",
    supportedPayment: ["duitnow", "tng"],
    coords: [3.0319172269355716, 101.42426483009802],
  },
  {
    // https://masjidalfalah.com/
    // https://www.facebook.com/masjidalfalahusj9/
    id: 245,
    name: "Masjid Al-Falah USJ 9",
    category: "mosque",
    state: "Selangor",
    city: "Subang Jaya",
    qrImage: "",
    qrContent:
      "00020201021126420014A000000615000101066033460210MD000063555204866153034585802MY5921MASJID AL FALAH USJ 96002MY6273032516397133474820091719896110520167652249808100195170716163971301865000563048B15",
    supportedPayment: ["duitnow", "tng"],
    coords: [3.0440697, 101.5846234],
  },
  {
    // https://www.facebook.com/msasperak/
    id: 246,
    name: "Masjid Sultan Azlan Shah",
    category: "mosque",
    state: "Perak",
    city: "Ipoh",
    qrImage: "",
    qrContent:
      "00020201021126420014A000000615000101066033460210MD000134995204866153034585802MY5924MASJID SULTAN AZLAN SHAH6002MY6273032516490601380230053489219590520164906066401300985010716164905636766500663048885",
    supportedPayment: ["duitnow", "tng"],
    coords: [4.589270441026612, 101.12681956062723],
  },
  {
    // https://www.facebook.com/masjiddamansaraperdana/
    id: 247,
    name: "Masjid Damansara Perdana",
    category: "mosque",
    state: "Selangor",
    city: "Petaling Jaya",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065018540215000001234025435031000000000005204866153034585802MY5925MASJID DAMANSARAPERDA-QR6013PETALING JAYA610547820621501111025371000063048D84",
    supportedPayment: ["duitnow", "tng"],
    coords: [3.1731733, 101.6156173],
  },
  {
    id: 248,
    name: "Masjid At-Taqwa Felda Triang 3",
    category: "mosque",
    state: "Pahang",
    city: "Teriang",
    qrImage: "",
    qrContent:
      "00020201021126790014A000000615000101065893730209MTRI003130319Agrobank's Merchant041+60924697665204866153034585802MY5925MASJID AL-TAQWA F.TRIANG36011BANDAR BERA610528300630496B7",
    supportedPayment: ["duitnow", "tng"],
    coords: [3.253478, 102.5470493],
  },
  {
    // https://www.masjidtuankumizan.gov.my/v3/
    // https://www.facebook.com/masjidtuankumizanzainalabidin/
    id: 249,
    name: "Masjid Tuanku Mizan Zainal Abidin",
    category: "mosque",
    state: "W.P. Putrajaya",
    city: "Putrajaya",
    qrImage: "",
    qrContent:
      "00020201021126420014A000000615000101066033460210MD001302275204940253034585802MY5925MASJID TUANKU MIZAN ZAINA6002MY6273032517079878068880011426813310520170978076079900976070716170798716340500163045F6C",
    supportedPayment: ["duitnow", "tng"],
    coords: [2.9191710871320597, 101.68116713044142],
  },
  {
    // https://www.facebook.com/masjidhijausubangairport/
    id: 250,
    name: "Masjid Lapangan Terbang Sultan Abdul Aziz Shah Subang",
    category: "mosque",
    state: "Selangor",
    city: "Subang",
    qrImage: "",
    qrContent:
      "00020201021126420014A000000615000101066033460210MD000003645204866153034585802MY5946MASJID LAPANGAN TERBANG SULTAN ABDUL AZIZ SHAH6002MY6253032516261476078090019051892750520162614765683600342816304A341",
    supportedPayment: ["duitnow", "tng"],
    coords: [3.1199533504385784, 101.56448522427296],
  },
  {
    // https://www.facebook.com/SurauAlManarKomunitiPresint14Putrajaya/
    id: 251,
    name: "Surau Al-Manar",
    category: "surau",
    state: "W.P. Putrajaya",
    city: "Putrajaya",
    qrImage: "",
    qrContent:
      "00020201021126580014A000000615000101065641600226126601600007194RHBQR0412445204739953034585802MY5925surau al manar presint 146002MY61056205062230309ROA08525807061857298264704CE22CAFE5D9E54B4612148A8731ECD405BF9F8B45272C19D03182B4DF9CF5630442B0",
    supportedPayment: ["duitnow", "tng"],
    coords: [2.948369051480827, 101.71718015316215],
  },
  {
    id: 252,
    name: "Masjid Ibn Khaldun",
    category: "mosque",
    state: "W.P. Kuala Lumpur",
    city: "Kuala Lumpur",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065641670215QRMID0000000387041001661737565204866153034585802MY5918MASJID IBN KHALDUN6012KUALA LUMPUR6105570006304805E",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    id: 253,
    name: "Masjid Cina Negeri Melaka",
    category: "mosque",
    state: "Melaka",
    city: "Krubong",
    qrImage: "",
    qrContent:
      "00020201021126580014A000000615000101065887340212MBBQR1965581031000000000005204000053034585802MY5925MASJID CINA NEGERI MELAKA6006MELAKA63044B08",
    supportedPayment: ["duitnow", "tng"],
    coords: [2.3309925454887264, 102.22752025154026],
  },
  {
    id: 254,
    name: "Masjid Al-Taqwa Gelong Machang",
    category: "mosque",
    state: "Kelantan",
    city: "Machang",
    qrImage: "",
    qrContent:
      "00020201021126420014A000000615000101066033460210MD001307155204866153034585802MY5925MASJID AL-TAQWA GELONG MA6002MY6273032517092049937960047434271820520170921276499900953660716170920431501700163045DBC",
    supportedPayment: ["duitnow", "tng"],
    coords: [6.225364489670574, 102.34014190570367],
  },
  {
    // https://www.facebook.com/p/Surau-Nur-baiduri-100064363312323/
    id: 255,
    name: "Surau Nur Baiduri, Bandar Bukit Puchong",
    category: "surau",
    state: "Selangor",
    city: "Puchong",
    qrImage: "",
    qrContent:
      "00020201021126580014A000000615000101065887340212MBBQR2075652031000000000005204000053034585802MY5917SURAU NUR BAIDURI6008SELANGOR6304E5FA",
    supportedPayment: ["duitnow", "tng"],
    coords: [2.9835377985885634, 101.62801688936486],
  },
  {
    id: 256,
    name: "Masjid Selayang Mutiara",
    category: "mosque",
    state: "Selangor",
    city: "Selayang",
    qrImage: "",
    qrContent:
      "00020201021126580014A000000615000101065887340212MBBQR2157030031000000000005204729953034585802MY5923MASJID SELAYANG MUTIARA6015WP KUALA LUMPUR6304BB95",
    supportedPayment: ["duitnow", "tng"],
  },
  {
    id: 257,
    name: "Masjid Jamek Abdullah Hukum @ KL Eco City",
    category: "mosque",
    state: "W.P. Kuala Lumpur",
    city: "Kuala Lumpur",
    qrImage: "",
    qrContent: "https://qr.tngdigital.com.my/m/281011055105183318942282243",
    supportedPayment: ["tng"],
    coords: [3.1224998923328267, 101.67512871187822],
  },
  {
    id: 258,
    name: "Surau Al-Mukmin PPR Wangsa Maju",
    category: "surau",
    state: "W.P. Kuala Lumpur",
    city: "Kuala Lumpur",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065018540215000001244014338031000000000005204866153034585802MY5918SURAU AL MUKMIN-QR6012KUALA LUMPUR61055310062150111101635300006304D099",
    supportedPayment: ["duitnow", "tng"],
    coords: [3.117958, 101.673981],
  },
  {
    id: 259,
    name: "Masjid An-Nur KMJ",
    category: "mosque",
    state: "Johor",
    city: "Tangkak",
    qrImage: "",
    qrContent:
      "00020201021126580014A000000615000101065887340212MBBQR2004736031000000000005204000053034585802MY5917MASJID AN NUR KMJ6005JOHOR6304BFE3",
    supportedPayment: ["duitnow", "tng"],
    coords: [2.287209, 102.5635944],
  },
  {
    id: 260,
    name: "Surau Ar-Rahmah Cempakapuri",
    category: "surau",
    state: "Negeri Sembilan",
    city: "Nilai",
    qrImage: "",
    qrContent:
      "00020201021126420014A000000615000101066033460210MD000048725204866153034585802MY5926SURAU ARRAHMAH CEMPAKAPURI6002MY6253032516373107252290011462184580520163731073888200807956304EBD5",
    supportedPayment: ["duitnow", "tng"],
    coords: [2.7980786, 101.7643757],
  },
  {
    id: 261,
    name: "Masjid Al-Khasyi'in",
    category: "mosque",
    state: "W.P. Kuala Lumpur",
    city: "Kuala Lumpur",
    qrImage: "",
    qrContent:
      "00020201021126520014A000000615000101068900530220MDN162245583328130615204866153034585802MY5918MASJIDAL-KHASYI'IN6011KUALALUMPUR63049DD0",
    supportedPayment: ["duitnow", "tng"],
    coords: [3.0837002, 101.7066497],
  },
  {
    // https://www.facebook.com/masjidalfaizin28/
    id: 262,
    name: "Masjid Al Faizin",
    category: "mosque",
    state: "Selangor",
    city: "Shah Alam",
    qrImage: "",
    qrContent:
      "00020201021126420014A000000615000101066033460210MD001285465204866153034585802MY5916MASJID AL FAIZIN6002MY62730325170166033644100961358658305201701660739080003707907161701659742675009630495BA",
    supportedPayment: ["duitnow", "tng"],
    coords: [3.0077261, 101.5607074],
  },
  {
    id: 263,
    name: "Masjid Puncak Alam",
    category: "mosque",
    state: "Selangor",
    city: "Puncak Alam",
    qrImage: "",
    qrContent:
      "00020201021126420014A000000615000101066033460210MD000702455204866153034585802MY5918MASJID PUNCAK ALAM6002MY6273032516530301431840010815755520520167245801239500530940716165302974725300463047073",
    supportedPayment: ["duitnow", "tng"],
    coords: [3.2289209, 101.4304386],
  },
  {
    id: 264,
    name: "Masjid Jenjarom",
    category: "mosque",
    state: "Selangor",
    city: "Jenjarom",
    qrImage: "",
    qrContent:
      "00020201021126580014A000000615000101065641600226126241000006433RHBQR0272785204739953034585802MY5915masjid jenjarom6002MY61054260062250309ROA0571210708A143348782647C1D66ACFC29CC01C987B39A0E0D5B59EF28F334709B54836DED8FB0D042CC1A6304BD5E",
    supportedPayment: ["duitnow"],
    coords: [2.8843392, 101.5196352],
  },
  {
    id: 265,
    name: "Masjid Jamek Sabak Bernam",
    category: "mosque",
    state: "Selangor",
    city: "Sabak Bernam",
    qrImage: "",
    qrContent:
      "00020201021126580014A000000615000101065887340212MBBQR1145580031000000000005204729953034585802MY5925MASJID JAMIK SABAK BERNAM6008SELANGOR63041A77",
    supportedPayment: ["duitnow"],
    coords: [3.7703992, 100.9854913],
  },
  {
    id: 266,
    name: "Masjid Bukit Rahman Putra",
    category: "mosque",
    state: "Selangor",
    city: "Sungai Buloh",
    qrImage: "",
    qrContent:
      "00020201021126580014A000000615000101065641600226126208100019780RHBQR0104445204739953034585802MY5910Masjid BRP6002MY61054700062260309ROA0148410709masjidbrp82646A3D5DB510869682F0CB431B6B7B4BEBC68EC5BC7735838E30150982780173C56304B8FC",
    supportedPayment: ["duitnow"],
    coords: [3.2244976244066974, 101.55741687256993],
  },
  {
    id: 267,
    name: "Masjid At-Taqwa (Masjid Mukim Bunut Susu)",
    category: "mosque",
    state: "Kelantan",
    city: "Pasir Mas",
    qrImage: "",
    qrContent:
      "00020201021126580014A000000615000101065641600226125305200011605RHBQR0035245204829953034585802MY5915Masjid at TAQWA6002MY61051707062240309ROA0038310707pld449982644FC5DA85347EF1DFFD586790695816D2699647AB80C95BC0E3C3926460097C3863046361",
    supportedPayment: ["duitnow"],
    coords: [6.091714054243558, 102.17818412155441],
  },
  {
    id: 268,
    name: "Maahad Tahfiz Al-Furqan",
    category: "mosque",
    state: "Pahang",
    city: "Temerloh",
    qrImage: "",
    qrContent:
      "00020201021126580014A000000615000101065641600226125605300004642RHBQR0031005204739953034585802MY5908Outlet 16002MY61052800062250309ROA0033610708135791ss8264679CA0D88F8B59A362D680F22BC271D153A427F13E4B77AFB20CD4B102977F0C63048868",
    supportedPayment: ["duitnow"],
    coords: [3.4578024361000623, 102.48218055038069],
  },
  {
    id: 269,
    name: "Maahad Tahfiz Al-Istiqamah",
    category: "others",
    state: "Pahang",
    city: "Temerloh",
    qrImage: "",
    qrContent:
      "00020201021126580014A000000615000101065641600226125605300007730RHBQR0029765204739953034585802MY5908Outlet 16002MY61052800062290309ROA0032210712maahadtahfiz8264439F7DEB9F5B202DE45139E17E177C1201D17D5B4859E56879E505E65B5B108F6304C642",
    supportedPayment: ["duitnow"],
    coords: [3.4709179704910977, 102.48490610990378],
  },
  {
    id: 270,
    name: "Maahad Ibnu Umar",
    category: "others",
    state: "Kedah",
    city: "Padang Serai",
    qrImage: "",
    qrContent:
      "00020201021126580014A000000615000101065641600226125210300009173RHBQR0062055204829953034585802MY5916MAAHAD IBNU UMAR6002MY61050940062230309ROA0093250706MAAHAD8264556135EA3A473FC803E828C6C64CA4086E5D9F39DE4E98A7786F4D9DE2CE14C9630487ED",
    supportedPayment: ["duitnow"],
    coords: [5.546543973520225, 100.53682035038734],
  },
  {
    id: 271,
    name: "Masjid Nurul Hidayah (Kampung Cemerlang)",
    category: "mosque",
    state: "Sarawak",
    city: "Kuching",
    qrImage: "",
    qrContent:
      "00020201021126580014A000000615000101065641600226121125460011826RHBQR0052535204739953034585802MY5919Surau Nurul Hidayah6002MY61059325062230309ROA0056640706hamzah8264016B9C822E3126B6952FFD12EF7BB564EBCB27E9EE1ABF51626D05290A1FF2EA63047BFC",
    supportedPayment: ["duitnow"],
    coords: [1.5006841585002741, 110.3516103539692],
  },
  {
    id: 272,
    name: "Surau Infiniti 3",
    category: "surau",
    state: "Kuala Lumpur",
    city: "Wangsa Maju",
    qrImage: "",
    qrContent:
      "00020201021126580014A000000615000101065641600226126233500040281RHBQR0084095204739953034585802MY5916Surau Infiniti 36002MY61055330062310309ROA0125990714Surauinfiniti38264FA327C832D6B53B5A242AA407490E09AA8CE9DE8DF12CC9F0CC890953132CA10630494D0",
    supportedPayment: ["duitnow"],
    coords: [3.194545329543199, 101.73758336911077],
  },
  {
    id: 273,
    name: "Pertubuhan Pondok Thurat",
    category: "others",
    state: "Penang",
    city: "Bukit Mertajam",
    qrImage: "",
    qrContent:
      "00020201021126580014A000000615000101065641600226120714560003636RHBQR0088345204829953034585802MY5919Wakaf Pondok Turath6002MY61051400062230309ROA01307007066602018264F6240B8E29C73D3B6A16B16E373B4216710CD44E343382FB2A58419051F55D62630418F7",
    supportedPayment: ["duitnow"],
  },
  {
    id: 274,
    name: "Masjid As-Syakirin BMC",
    category: "mosque",
    state: "Selangor",
    city: "Cheras",
    qrImage: "",
    qrContent:
      "00020201021126580014A000000615000101065641600226126223200003243RHBQR0088805204739953034585802MY5922Masjid As-Syakirin BMC6002MY61054320062260309ROA0131170709masjidbmc82648B3E30E49D8752BB6B66A4050C75639F839D7824AC2E08699841D95B508AAF076304349C",
    supportedPayment: ["duitnow"],
    coords: [3.04902366182911, 101.786341433882],
  },
  {
    id: 275,
    name: "Surau Al Azim",
    category: "surau",
    state: "Perak",
    city: "Sitiawan",
    qrImage: "",
    qrContent:
      "00020201021126580014A000000615000101065641600226125821700001041RHBQR0046415204739953034585802MY5908Outlet 16002MY61053200062250309ROA0050100708zuhari708264C66D0DCCAE489EBA1665B7C085215DE06AB8173222221AF4E0ADADAFD827462663049C7A",
    supportedPayment: ["duitnow"],
    coords: [4.232186085721263, 100.69196003689001],
  },
  {
    // https://www.facebook.com/mastaaf.im/
    id: 276,
    name: "Masjid Tengku Ampuan Afzan, Indera Mahkota (MASTAAF)",
    category: "mosque",
    state: "Pahang",
    city: "Kuantan",
    qrImage: "",
    qrContent:
      "00020201021126610014A000000615000101065018540215000001248405631031000000000005204866153034585802MY5923MASJID T A AFZAN KTN-QR6007KUANTAN61052520062150111102057100006304EAFB",
    supportedPayment: ["duitnow"],
    coords: [3.824054319022322, 103.3055692802235],
  },
  {
    // https://www.facebook.com/p/Masjid-Al-Taqwa-Kariah-Kisap-100064860304444/
    id: 277,
    name: "Masjid Al-Taqwa Kariah Kisap",
    category: "mosque",
    state: "Kedah",
    city: "Langkawi",
    qrImage: "",
    qrContent:
      "00020201021126600014A000000615000101065892670228BRQR658d7901b16709469f2ef3be5204866153034585802MY5921MASJID AL-TAQWA KISAP6008Langkawi61050700062420310M000001253052465ceb7c7aa48bf00056300b96304117A",
    supportedPayment: ["duitnow", "tng"],
    coords: [6.37105987339039, 99.86510883207451],
  },
  {
    // https://www.facebook.com/masjidassopiah/
    id: 278,
    name: "Masjid As-Sopiah, Keda Wang Tok Rendong",
    category: "mosque",
    state: "Kedah",
    city: "Langkawi",
    qrImage: "",
    qrContent:
      "00020201021126600014A000000615000101065892670228BRQR65d54f6e481cbd226738622f5204866153034585802MY5920MASJID ASSOFIAH KEDA6004kuah61050700062420310M000002093052465d54f6faa48bf0005637557630478DA",
    supportedPayment: ["duitnow", "tng"],
    coords: [6.352203154708551, 99.88020500425073],
  },
];
