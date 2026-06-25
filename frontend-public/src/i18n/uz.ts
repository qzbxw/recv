const uz = {
  hero: {
    title: "Komissiyasiz (0%) to'g'ridan-to'g'ri hamyonlaringizga kripto to'lovlarni qabul qiling.",
    body:
      "USDT, Gram va TRON uchun nokastodial kripto to'lov shlyuzi. Bizning yuqori samarali to'lov API-mizni yoki aqlli chekautimizni Telegram botlari, SaaS platformalari va global elektron tijorat loyihalariga aylanma komissiyalarisiz integratsiya qiling.",
    subcopy:
      "Telegram do'konlari, SaaS billing va raqamli tijorat uchun ishlab chiqilgan.",
    primary: "Konsolni ishga tushirish",
    secondary: "Hujjatlarni ko'rish",
    badges: ["To'g'ridan-to'g'ri hamyonga", "0% aylanma komissiyasi", "Nokastodial API", "Imzolangan vebhuklar"],
  },
  heroPanel: {
    eyebrow: "Infrastruktura",
    title: "Birinchi navbatda unumdorlik",
    body: "Bizning optimallashtirilgan blokcheyn monitoringi protokolimiz bilan maksimal samaradorlikni his eting.",
    amount: "149.00 USDT",
    invoice: "RECV-INFRA-99",
    status: "Tasdiqlandi",
    primary: "Demo chekaut",
    secondary: "Konsol",
    helper: "Fiksatsiyalangan obuna. Cheksiz hajm.",
    chips: ["GRAM", "TRON", "SOL", "BASE"],
  },
  bento: {
    kicker: "INFRASTRUKTURA",
    title: "Keyingi milliard tranzaksiyalar uchun qurilgan.",
    items: [
      {
        id: "api",
        title: "Yagona API v1",
        body: "Barcha likvid tarmoqlar uchun yuqori samarali shlyuz. Bitta integratsiya, cheksiz imkoniyatlar.",
        kicker: "INTEGRATSIYA",
        size: "large"
      },
      {
        id: "checkout",
        title: "Aqlli chekaut",
        body: "Har qanday qurilma va platforma uchun optimallashtirilgan, yuqori konversiyali toza to'lov interfeysi.",
        kicker: "UX",
        size: "medium"
      },
      {
        id: "direct",
        title: "To'g'ridan-to'g'ri to'lovlar",
        body: "Daromad to'g'ridan-to'g'ri hamyonlaringizga tushadi. Biz mablag'laringizga hech qachon tegmaymiz, saqlamaymiz va vositachilik qilmaymiz.",
        kicker: "ISHONCH",
        size: "small"
      },
      {
        id: "monitoring",
        title: "Real vaqtdagi vatcherlar",
        body: "Kam to'lovlarni aqlli aniqlash tizimiga ega past kechikishli blokcheyn monitoringi.",
        kicker: "BARQARORLIK",
        size: "small"
      },
      {
        id: "tg",
        title: "Telegram uchun native",
        body: "Daromad oqimi va infrastrukturangizni bizning rasmiy Telegram botimiz orqali boshqaring.",
        kicker: "NATIVE",
        size: "small"
      }
    ]
  },
  useCases: {
    kicker: "FOYDALANISH HOLATLARI",
    title: "Kripto bizneslar aslida qanday haq olishi uchun mo'ljallangan.",
    tabs: [
      { id: "tg-shops", title: "TG do'konlar", body: "Telegram ichida tovarlar va raqamli mahsulotlar savdosini lahzali yetkazib berish bilan avtomatlashtiring.", cta: "TG tijoratni o'rganish" },
      { id: "saas", title: "SaaS billing", body: "Dasturiy ta'minot platformalari uchun ishonchli infrastruktura. Ruxsat etilgan tariflar biznesingiz uchun yuqori rentabellikni anglatadi.", cta: "Marjani optimallashtirish" },
      { id: "digital", title: "Raqamli tovarlar", body: "Blokcheyn tasdiqlanganidan so'ng darhol kalitlar va akkauntlarni lahzali yetkazib berish.", cta: "Avtomatlashtirishni kengaytirish" },
      { id: "communities", title: "Hamjamiyatlar", body: "Obuna logikasi bilan yopiq kanal va guruhlarga kirishni avtomatlashtirilgan boshqarish.", cta: "A'zolarni boshqarish" },
    ]
  },
  mcp: {
    kicker: "AI va MCP",
    title: "AI agentlariga siz uchun kripto qabul qilishga ruxsat bering.",
    body: "recv loyihasi Model Context Protocol serverini taqdim etadi, shuning uchun Claude va Cursor kabi agentlar hisob-fakturalarni yaratishi, to'lov holatini tekshirishi va vebhuklarni avtonom tarzda tasdiqlashi mumkin — hech qanday qo'shimcha kod shart emas.",
    tools: [
      { name: "create_invoice", body: "Istalgan qo'llab-quvvatlanadigan tarmoqda to'lov so'rovlarini yaratish." },
      { name: "get_invoice", body: "Real vaqtdagi holat va tasdiqlarni tekshirish." },
      { name: "list_invoices", body: "Yaqindagi to'lov faolligini ko'rib chiqish." },
      { name: "simulate_payment", body: "Jonli efirga chiqishdan oldin Sandbox interfeysida to'liq jarayonni sinab ko'rish." },
      { name: "verify_webhook", body: "Kiruvchi bildirishnomalarni xavfsiz tasdiqlash." },
      { name: "list_supported_networks", body: "Mavjud tarmoqlar va aktivlarni aniqlash." },
    ],
    cta: "MCP yo'riqnomasini o'qish",
  },
  networks: {
    kicker: "TARMOQLAR",
    title: "Global ulanish imkoniyati.",
    list: [
      { slug: "ton", label: "TON" },
      { slug: "ton_usdt", label: "TON tarmog'idagi USDT" },
      { slug: "tron", label: "TRON" },
      { slug: "solana", label: "Solana" },
      { slug: "base", label: "Base" },
      { slug: "arbitrum", label: "Arbitrum" },
      { slug: "bsc", label: "BSC" },
    ],
    rails: [
      { name: "GRAM", body: "Telegram-ga asoslangan tijorat va rivojlanayotgan TON ekotizimi uchun native Gram to'lovlari." },
      { name: "TON tarmog'idagi USDT", body: "TON ekotizimidagi steyblkoin to'lovlari uchun TON tarmog'idagi USDT." },
      { name: "TRON", body: "Yuqori o'tkazuvchanlik va past xarajatlar bilan USDT hisob-kitoblari bo'yicha global standart." },
      { name: "BASE", body: "Ishonchli EVM-mos steyblkoin to'lovlari uchun Coinbase-ning L2 tarmog'i." },
      { name: "BSC", body: "Faol foydalanuvchilarning eng yirik ekotizimlaridan biriga ega yuqori samarali tarmoq." }
    ]
  },
  compare: {
    kicker: "EVOLYUTSIYA",
    title: "recv ustunligi.",
    rows: [
      {
        legacy: "Qo'lda tekshirish va skrinshotlarni qidirish.",
        recv: "Avtomatlashtirilgan blokcheyn vatcherlari va tezkor bildirishnomalar.",
      },
      {
        legacy: "Foydangizni yeb bitiradigan shlyuz komissiyalari (1-5%).",
        recv: "0% aylanma komissiyasi. Topganingizning 100% o'zingizda qoladi.",
      },
      {
        legacy: "Kastodial xavf va yechib olishdagi kechikishlar.",
        recv: "Nokastodial. To'g'ridan-to'g'ri hamyonga. Lahzali likvidlik.",
      },
    ],
  },
  pricing: {
    kicker: "KIRISH",
    title: "Barcha tariflarda 0% komissiya.",
    popular: "Ommabop",
    trial: {
      name: "Trial",
      price: "0",
      features: ["Jami 15 ta faol hisob-faktura", "API-ga kirish imkoni yo'q (faqat qo'lda)", "1 ta vebhuk yakuniy nuqtasi", "Telegram bot bildirishnomalari", "1 ta ishchi joy / 1 ta a'zo", "Hamjamiyat yordami"],
      cta: "Tekin sinab ko'rishni boshlash"
    },
    merchant: {
      name: "Merchant",
      price: "9",
      trial: "To'lov havolalari",
      features: ["To'lov havolalari", "Telegram-oqim", "Qo'lda ko'rib chiqish", "API limiti"],
      cta: "Merchant-ni faollashtirish"
    },
    developer: {
      name: "Developer",
      price: "29",
      features: ["To'liq API", "Vebhuklar", "Idempotentlik", "MCP vositalari"],
      cta: "Developer-ni faollashtirish"
    },
    business: {
      name: "Business",
      price: "79",
      features: ["Jamoalar", "Audit jurnallari", "Kompaniya brendingi", "Oyiga 200k so'rovlar"],
      cta: "Business-ni faollashtirish"
    }
  },
  faq: {
    kicker: "FAQ",
    title: "Protokol tafsilotlari.",
    body: "Aktivlar xavfsizligi, to'lov mexanikasi va platforma integratsiyasi bo'yicha muhim ma'lumotlar.",
    items: [
      {
        question: "recv mening mablag'larim xavfsizligini qanday ta'minlaydi?",
        answer: "Biz nokastodial arxitekturadan foydalanamiz. Bu shuni anglatadiki, sizning shaxsiy kalitlaringiz hech qachon qurilmangizni tark etmaydi va mablag'lar mijozdan to'g'ridan-to'g'ri manzilingizga yuboriladi. recv faqat blokcheynni kuzatadi va tranzaksiya bildirishnomalarini taqdim etadi.",
      },
      {
        question: "Hozirda qaysi tarmoqlar va aktivlar qo'llab-quvvatlanadi?",
        answer: "Biz hozirda TON (Gram va USDT), TRON, Solana, Base, Arbitrum va BSC tarmoqlarini qo'llab-quvvatlaymiz. Biz biznes darajasidagi talablardan kelib chiqib, yangi likvid protokollarni doimiy ravishda qo'shib bormoqdamiz.",
      },
      {
        question: "Raqamli tovarlarni yetkazib berishni avtomatlashtira olamanmi?",
        answer: "Albatta. Bizning Vebhuk tizimimiz to'lov tasdiqlanishi bilanoq serveringizga tezkor bildirishnomalarni yuboradi, bu esa kirish, obunalar yoki raqamli yetkazib berishni to'liq avtomatlashtirish imkonini beradi.",
      },
      {
        question: "Kam to'lovlar yoki noto'g'ri summalar qanday hal qilinadi?",
        answer: "recv kutilgan summadan har qanday og'ishlarni aqlli ravishda aniqlaydi. Agar kam to'lov yuz bersa, tranzaksiya 'Kam to'langan' deb belgilanadi, bu esa balansni so'rash yoki buyurtmani qo'lda tasdiqlash imkonini beradi.",
      },
      {
        question: "recv-dan foydalanishni boshlash uchun KYC-dan o'tishim kerakmi?",
        answer: "Yo'q. Biz faqat nokastodial vositachi dastur sifatida ishlaganimiz va fiat valyutasini saqlamaganimiz yoki qayta ishlamaganimiz sababli, biz sotuvchilardan KYC tasdiqlashni talab qilmaymiz. Kripto qabul qilishni darhol boshlashingiz mumkin.",
      },
      {
        question: "Yaratishim mumkin bo'lgan hisob-fakturalar soniga cheklov bormi?",
        answer: "Pullik obuna rejalarida hisob-fakturalarni qo'lda yaratish bo'yicha mutlaqo cheklovlar yo'q. Biroq, bepul Trial rejasida umrbod 15 ta faol hisob-faktura limiti mavjud. Cheksiz hisob-fakturalarni ochish uchun istalgan pullik tarifga o'tishingiz mumkin.",
      },
      {
        question: "Agar tarmoq (masalan, TRON) ishlamay qolsa nima bo'ladi?",
        answer: "Bizning vatcherlarimiz bir nechta global RPC provayderlari bo'ylab taqsimlangan. Agar tarmoq to'xtab qolsa, recv monitoring vazifalarini navbatga qo'yadi. Blokcheyn blok ishlab chiqarishni tiklagandan so'ng, barcha kutilayotgan tranzaksiyalar avtomatlashtirilgan tarzda tekshiriladi va vebhuklar ishga tushiriladi.",
      },
    ],
  },
  final: {
    kicker: "ISHNI BOSHLASH",
    title: "recv bilan biznesingizni kengaytiring.",
    body:
      "Kripto to'lovlarini avtomatlashtirgan va qo'lda bajariladigan xarajatlarni yo'q qilgan soha yetakchilariga qo'shiling.",
    primary: "Hozir boshlash",
    secondary: "Hujjatlar",
  },
  footer: {
    title: "recv",
    body: "To'g'ridan-to'g'ri hamyonga to'lovlar bilan avtomatlashtirilgan kripto to'lovlari. Halol, tezkor, professional.",
    product: "Mahsulot",
    privacy: "Maxfiylik",
    terms: "Shartlar",
    console: "Konsol",
    status: "Holat",
    api: "API",
    b2b: "B2B",
    company: "Kompaniya",
    resources: "Resurslar",
    solutions: "Yechimlar",
    social: "Ijtimoiy tarmoqlar",
  },
  nav: {
    products: {
      title: "Mahsulotlar",
      checkout: { title: "Chekaut", desc: "Yuqori konversiyali to'lov UI" },
      api: { title: "API", desc: "Dasturchilar uchun infrastruktura" },
      invoicing: { title: "Invoyslar", desc: "Professional billing vositalari" },
      mcp: { title: "MCP agenti", desc: "Muxtor AI agenti vositalari" },
    },
    useCases: {
      title: "Foydalanish holatlari",
      tgShops: "Telegram do'konlar",
      saas: "SaaS billing",
      digital: "Raqamli tovarlar",
      communities: "Pullik hamjamiyatlar",
    },
    networks: {
      title: "Tarmoqlar",
      ton: "TON",
      ton_usdt: "TON tarmog'idagi USDT",
      tron: "TRON",
      solana: "Solana",
      base: "Base",
      bsc: "BSC",
      arbitrum: "Arbitrum",
    },
    pricing: {
      title: "Tariflar",
      merchant: "Merchant",
      developer: "Developer",
      business: "Business",
    },
    docs: "Hujjatlar",
    blog: "Blog",
    console: "Konsol",
  },
  marketing: {
    activate: "Boshlash",
    activateVerb: "Faollashtirish",
    seamlessFlow: "Uzluksiz oqim",
    useCases: "FOYDALANISH HOLATLARI",
    startIntegration: "Integratsiyani boshlash",
    docs: "Hujjatlar",
    networks: "TARMOQLAR",
    accept: "Qabul qilish",
    technicalDocs: "Texnik hujjatlar",
    tryDemo: "Demonstratsiyani sinash",
    common: {
      whyChoose: "Nima uchun tanlashadi",
      engineered: "GRAM, TON tarmog'idagi USDT, TRON, Base va BSC bo'ylab to'g'ridan-to'g'ri hamyonga hisob-kitoblar, imzolangan vebhuklar va 0% aylanma komissiyasi.",
      implementation: "INTEGRATSIYA",
      readyInMinutes: "Bir necha daqiqada ishlab chiqarishga tayyor",
      integrateEase: "Bizning yuqori samarali API-mizni mavjud tizimingizga osongina integratsiya qiling.",
      management: "BOSHQARISH",
      workflow: "ISH JARAYONI",
      intelligence: "INTELLEKT",
      readyToScale: "Kengayishga tayyormisiz?",
      joinMerchants: "recv yordamida daromad oqimini optimallashtirgan yuzlab sotuvchilarga qo'shiling.",
      benefits: "AFZALLIKLAR",
    },
    ogSubtitle: "Yangi avlod kripto to'lovlari infrastrukturasi",
    checkoutProduct: {
      metadata: {
        title: "Kripto to'lovlarni qabul qilish | GRAM, TRC-20, TON tarmog'idagi USDT uchun nokastodial chekaut",
        description: "Eng yuqori konversiyali kripto chekaut bilan biznesingizni kengaytiring. USDT (TRC-20, TON, Base, BSC) to'lovlarini 0% aylanma komissiyasi bilan qo'llab-quvvatlang. Nokastodial, xavfsiz va Telegram-ga tayyor.",
        keywords: "kripto to'lovlarni qabul qilish, kripto chekaut shlyuzi, GRAM to'lovlari, TON to'lovlari, TRON USDT shlyuzi, TON tarmog'idagi USDT chekauti, nokastodial kripto to'lov, telegram to'lov boti api, usdt trc20 chekaut"
      },
      kicker: "KONVERSIYA DVIGATELI",
      title: "Chekaut: Kripto UX bo'yicha oltin standart",
      description: "Nega oddiy to'lov havolalari bilan cheklanish kerak? Nusxalash va joylashtirishdan charchashni yo'qotish va kam to'lov xatolarini kamaytirish uchun ishlab chiqilgan yuqori darajadagi nokastodial chekaut tajribasini taklif qiling.",
      hero: {
        title: "Maksimal konversiya. Minimal ishqalanish.",
        body: "recv Checkout — tashlab ketilgan savatchalarni tasdiqlangan tranzaksiyalarga aylantirish uchun mo'ljallangan eng so'nggi nokastodial interfeys. Uzluksiz integratsiyalangan, standart bo'yicha ko'p tarmoqli va har bir qurilma uchun optimallashtirilgan.",
        cta: "Jonli demoni sinab ko'ring"
      },
      comparison: {
        title: "recv evolyutsiyasi",
        items: [
          {
            legacy: "Hamyon manzilini qo'lda nusxalash xatolarga va mablag'larning yo'qolishiga olib keladi.",
            recv: "QR-native oqimi va hamyonning deep link havolalari manzil nusxalash xatolarini kamaytiradi."
          },
          {
            legacy: "Mijozlar daqiqalar davomida 'kutilmoqda' ekranlarida qolib ketishadi.",
            recv: "Hisob-fakturaning jonli holati qo'llab-quvvatlanadigan tarmoqlar kuzatilganda fikr-mulohazani taqdim etadi."
          },
          {
            legacy: "Kam to'lovlar qo'llab-quvvatlash jamoasining kabusi va buyurtmalarning yo'qolishiga sabab bo'ladi.",
            recv: "Kam to'lovlarni aqlli hal qilish tizimi qolgan aniq balansni kiritishni so'raydi."
          }
        ]
      },
      bento: {
        title: "Mikro-funksiyalar, makro ta'sir",
        items: [
          { title: "Telegram-ga tayyor", body: "Telegram veb-ilovalarida (Web Apps) va mobil brauzerlarda uzluksiz ishlaydi." },
          { title: "Deep Link-ga tayyor", body: "Tonkeeper, Phantom va boshqa hamyonlarda to'lov ekranlarini darhol ochadi." },
          { title: "Real vaqtdagi deltalarni hisoblash", body: "Valyuta kurslari va tarmoq komissiyalarini avtomatik hisoblash." },
          { title: "Ikki tilli interfeys", body: "Ingliz va rus tillarida to'liq mahalliylashtirilgan to'lov interfeysi." },
          { title: "UI-ga e'tibor", body: "Tezkor konversiya uchun optimallashtirilgan, ortiqcha narsalardan xoli toza to'lov sahifasi." },
          { title: "Tarmoq xavfsizligi", body: "Noto'g'ri tarmoq tanlanganda ogohlantiruvchi o'rnatilgan tizim." }
        ]
      },
      deepDive: [
        {
          title: "Kam to'lovlarni aqlli hal qilish",
          body: "recv kam to'lovlarni tasniflaydi va mijoz yangi buyurtma yaratmasdan to'lovni yakunlashi uchun qolgan balansni ko'rsatishi mumkin. Buyurtmani bajarish va qaytarish qoidalari baribir sotuvchining siyosati bilan belgilanadi."
        },
        {
          title: "Native Telegram integratsiyasi",
          body: "Bizning chekaut interfeysimiz mobil brauzerlar va Telegram Mini ilovalari uchun mo'ljallangan. Hamyonning deep link havolalari xaridorlarni mos keladigan hamyonga yo'naltirishi mumkin, tasdiqlash vaqti ise tanlangan tarmoqqa bog'liq bo'lib qoladi."
        },
        {
          title: "Tarmoqlararo yagona interfeys",
          body: "Bu TON-dagi USDT jetton o'tkazmalari bo'ladimi yoki GRAM-ning o'ziga xos memo talablari bo'ladimi, recv murakkablikni bartaraf etadi. Mijozlaringiz blokcheyn texnologiyasidan qat'i nazar, bir xil va mukammal tajribaga ega bo'lishadi, bu esa kognitiv yukni kamaytiradi va ishonchni oshiradi."
        }
      ],
      stats: [
        { value: "5", label: "Asosiy tarmoqlar" },
        { value: "0%", label: "Aylanma komissiyasi" },
        { value: "2", label: "Tillar" },
        { value: "HMAC", label: "Vebhukni imzolash" }
      ],
      finalTitle: "Chekaut konversiyasini optimallashtirishga tayyormisiz?",
      seo: "recv Checkout — yuqori konversiyali kriptovalyuta tranzaksiyalari uchun mo'ljallangan nokastodial to'lov shlyuzi. Raqamli tijoratda to'siqlarni bartaraf etish uchun mo'ljallangan ushbu interfeys TON, TRON (TRC-20), Base va BSC-ga mos keladigan tarmoqlar bo'ylab to'g'ridan-to'g'ri hamyonga tranzaksiyalarni qo'llab-quvvatlaydi. Asosiy funksional imkoniyatlar dinamik valyuta kursini hisoblash, yirik mobil hamyonlarga deep link havolalarini taqdim etish va qisman tranzaksiyalarni tiklash uchun kam to'lovlarni aqlli hal qilishni o'z ichiga oladi. Vositachi kastodianlarsiz ishlash orqali sotuvchilar o'z likvidligini to'liq nazorat qilishadi va mijozlarga aylanma komissiyalarisiz uzluksiz, ko'p tarmoqli to'lov tajribasini taqdim etishadi."
    },
    apiProduct: {
      metadata: {
        title: "Birlashtirilgan blokcheyn API-si | TON, TRON, EVM uchun vebhuklar va monitoring",
        description: "Dasturchilar uchun kripto to'lovlar infrastrukturasi. Avtomatik takrorlanadigan vebhuklar va HMAC imzolarga ega TON, TRC-20, Base va BSC uchun yagona API.",
        keywords: "kripto to'lov api, blokcheyn monitoring api, kripto uchun vebhuklar, TON dasturchi api, TRON trc20 api, avtomatlashtirilgan kripto to'lovlar, birlashtirilgan blokcheyn api"
      },
      kicker: "AVVALO DASTURCHI",
      title: "Kengaytirish uchun API va infrastruktura",
      description: "Ishonchlilik — bu yagona muhim ko'rsatkich. recv API sizga ishlab chiqarish darajasidagi to'lov oqimlarini yaratish uchun zarur bo'lgan yuqori samarali ibtidoiy vositalarni taqdim etadi.",
      hero: {
        title: "Dasturchilar tomonidan dasturchilar uchun yaratilgan.",
        body: "Bizning mustahkam API va yuqori samarali blokcheyn monitoringi dvigatelimiz bilan daromad oqimingizni avtomatlashtiring. Idempotent so'rovlardan tortib HMAC-imzolangan vebhuklargacha.",
        cta: "Hujjatlarni o'qish"
      },
      comparison: {
        title: "Muhandislik mukammalligi",
        items: [
          {
            legacy: "Bir nechta RPC tugunlari va mo'rt brauzerlarni boshqarish.",
            recv: "Qo'llab-quvvatlanadigan tarmoqlar uchun standartlashtirilgan JSON bilan bitta birlashtirilgan API."
          },
          {
            legacy: "Takrorlash logikasi yoki imzolarsiz muvaffaqiyatsiz bo'ladigan vebhuklar.",
            recv: "Tarifga xos limitlar va HMAC imzolarga ega navbatli takroriy urinishlar."
          },
          {
            legacy: "Bitta tranzaksiyani ikki marta qayta ishlash.",
            recv: "Idempotentlik nazorati dublikat qayta ishlashning oldini olishga yordam beradi."
          }
        ]
      },
      bento: {
        title: "Mustahkam infrastruktura",
        items: [
          { title: "HMAC imzolari", body: "Maksimal xavfsizlik uchun har bir vebhuk SHA-256 bilan imzolanadi." },
          { title: "Idempotentlik", body: "Native kalitlar bilan ma'lumotlar bazangizni ikki marta yozishdan himoya qiling." },
          { title: "Tezlikni cheklash", body: "Yuqori o'tkazuvchanlikka ega ilovalar uchun mo'ljallangan darajali kirish." },
          { title: "SDK va hujjatlar", body: "Tezkor integratsiya uchun zamonaviy OpenAPI spetsifikatsiyalari va kutubxonalari." },
          { title: "Jurnallarni saqlash", body: "Har bir so'rov va vebhuk urinishining batafsil tarixi." },
          { title: "Holat kodlari", body: "Taxmin qilinadigan xatolarni qayta ishlash uchun standartlashtirilgan HTTP javoblari." }
        ]
      },
      deepDive: [
        {
          title: "Takrorlanadigan vebhuklarni yetkazib berish",
          body: "Bizning vebhuk dvigatelimiz doimiy navbat va tarifga xos takrorlash byudjetidan foydalanadi. Har bir ma'lumot HMAC bilan imzolanadi; backend tizimingiz imzo va vaqt belgisini tekshirishi, tezda tasdiqlashi va hodisalarni idempotent ravishda qayta ishlashi kerak."
        },
        {
          title: "Birlashtirilgan zanjir abstraksiyasi",
          body: "TON, TRON va EVM-ni integratsiya qilish odatda uch xil kutubxona va mantiqiy oqimlarni talab qiladi. recv barcha tarmoqlar uchun bitta sxemani taqdim etadi. TRC-20 USDT uchun xuddi GRAM yoki TON tarmog'idagi USDT kabi hisob-faktura yarating."
        },
        {
          title: "Yuqori unumdorlikka ega vatcherlar",
          body: "recv qo'llab-quvvatlanadigan tarmoqlarni kuzatib boradi va aniqlash va zarur tasdiqlashlardan so'ng hisob-faktura holatini yangilaydi. Vaqt tanlangan tarmoqqa va uning RPC infrastrukturasining mavjudligiga bog'liq."
        }
      ],
      stats: [
        { value: "REST", label: "API protokoli" },
        { value: "HMAC", label: "Vebhukni imzolash" },
        { value: "Retry", label: "Yetkazib berish navbati" },
        { value: "Keys", label: "Idempotentlik" }
      ],
      finalTitle: "Yangi avlod to'lov oqimini bugun quring.",
      seo: "recv Unified API B2B dasturiy ta'minot, o'yin platformalari va biznes ilovalariga blokcheyn to'lovlarini integratsiya qilish uchun infrastruktura taqdim etadi. Ishlab chiqish jamoalari qo'llab-quvvatlanadigan tarmoqlar uchun bitta REST interfeysidan, dublikat qayta ishlashni oldini olish vaqtidagi idempotentlik nazoratidan va HMAC-SHA256 imzolari bilan takrorlanadigan vebhuk yetkazib berishdan foydalanadilar."
    },
    invoicingProduct: {
      metadata: {
        title: "Professional kripto hisob-fakturalari | 0% komissiyali B2B billing yechimi",
        description: "Professional kripto hisob-fakturalarini chiqaring, kuzating va boshqaring. USDT va native Gram-ni qo'llab-quvvatlash. Nokastodial, avtomatlashtirilgan kuzatish va buxgalteriya hisobi uchun CSV hisobotlari.",
        keywords: "biznes uchun kripto invoysing, b2b kripto billing, frilans kripto invoyslari, professional usdt billing, kripto to'lovlarni kuzatish, 0 komissiyali kripto invoysing"
      },
      kicker: "BIZNES DARAJASI",
      title: "Invoysing: Zamonaviy tijorat uchun professional billing",
      description: "Jadvallardan foydalanishni to'xtating. recv Invoicing kripto to'lovlarini nol aylanma komissiyasi bilan chiqarish, kuzatish va boshqarishning professional usulini taqdim etadi.",
      hero: {
        title: "Kriptoni yaxshi biladiganlar uchun professional billing.",
        body: "Hamyon skrinshotlarini qo'lda tekshirish va jadvallar orqali kuzatishdan voz keching. Mijozlaringiz hurmat qiladigan UI bilan hisob-fakturalarni chiqaring, kuzating va boshqaring.",
        cta: "Birinchi invoysni yaratish"
      },
      comparison: {
        title: "Ish jarayoningizni yangilang",
        items: [
          {
            legacy: "Telegram DM-larida 'menga ishoning' deb hamyon manzillarini yuborish.",
            recv: "Real vaqtdagi holatge ega brendli hosted hisob-faktura sahifalari."
          },
          {
            legacy: "Mijoz to'lovlarini tekshirish uchun blokcheyn brauzerlarini qo'lda ko'rish.",
            recv: "To'lov amalga oshirilganda tezkor Telegram va Email bildirishnomalari."
          },
          {
            legacy: "Oylik buxgalteriya hisobi uchun chalkash jadvallar.",
            recv: "CSV/JSON eksport imkoniyatlariga ega markazlashtirilgan konsol."
          }
        ]
      },
      bento: {
        title: "To'liq nazorat, nol komissiya",
        items: [
          { title: "Sotuvchi konsoli", body: "Har bir hisob-faktura va mijozni boshqarish uchun markazlashtirilgan markaz." },
          { title: "Telegram bildirishnomalari", body: "To'lov aniqlangan soniyada xabar oling." },
          { title: "Qo'lda boshqarish", body: "Zarurat tug'ilganda tranzaksiyalarni qo'lda tasdiqlash moslashuvchanligi." },
          { title: "Mijozlar katalogi", body: "Tez-tez to'laydigan mijozlarning manzillari va tafsilotlarini saqlang va boshqaring." },
          { title: "CSV eksportlari", body: "Soliq va buxgalteriya maqsadlari uchun bir marta bosish orqali hisobot yaratish." },
          { title: "Brendli havolalar", body: "Har bir billing so'rovi uchun shaxsiy nomlar va tavsiflar." }
        ]
      },
      deepDive: [
        {
          title: "B2B ish jarayonini avtomatlashtirish",
          body: "recv Invoicing shunchaki to'lov havolasidan ko'proq narsaga muhtoj bo'lgan bizneslar uchun mo'ljallangan. Loyihadan tortib hisob-kitobgacha bo'lgan butun hayotiy tsiklni boshqaring. 'Muddati o'tgan' yoki 'Kam to'langan' holatlarini kuzating va har bir bosqichda hamkorlaringiz bilan professional tarzda muloqot qiling."
        },
        {
          title: "To'g'ridan-to'g'ri hamyonga xavfsizligi",
          body: "Kastodial raqobatchilardan farqli o'laroq, recv never touches the funds in your invoices. Your clients pay you directly on-chain. Our service acts as a professional monitoring layer, ensuring you get notified without having to watch the ledger yourself."
        },
        {
          title: "Global ko'p valyutali qo'llab-quvvatlash",
          body: "Bill in USD or any supported stablecoin. recv handles the real-time conversion rates, ensuring that the amount of USDT, GRAM, or SOL requested matches your desired fiat value at the moment the invoice is generated."
        }
      ],
      stats: [
        { value: "0%", label: "Eskrou xavfi" },
        { value: "24/7", label: "Monitoring" },
        { value: "<1daq", label: "Yaratish" },
        { value: "100%", label: "Nokastodial" }
      ],
      finalTitle: "B2B billing tizimingizni hozir professional darajaga ko'taring.",
      seo: "Streamline corporate financial operations with recv Invoicing, a specialized billing solution tailored for B2B crypto transactions and freelance accounting. The platform enables businesses to generate branded, multi-currency invoices with automated fiat-to-crypto pegging at the time of creation. Administrative features include real-time payment tracking via dedicated Telegram and email notifications, centralized client management, and comprehensive CSV export capabilities to simplify tax reporting and reconciliation. Operating on a zero-fee, direct-transfer model, it modernizes accounts receivable without introducing third-party holding risks."
    },
    breadcrumbs: {
      home: "Bosh sahifa",
      blog: "Blog",
      compare: "Taqqoslash",
      useCases: "Foydalanish holatlari",
      networks: "Tarmoqlar",
      products: "Mahsulotlar",
      invoicing: "Invoysing",
      mcp: "MCP agenti",
    },
    mcpProduct: {
      metadata: {
        title: "MCP agent integratsiyasi | Model Context Protocol orqali AI-Native kripto to'lovlari",
        description: "AI agentlarini Model Context Protocol orqali recv platformasiga ulang. Avtonom ish maydonini sozlash, tarif sotib olish, hisob-faktura yaratish va vebhuklarni boshqarish — barchasi LLM orqali.",
        keywords: "mcp kripto to'lovlari, model context protocol to'lovlari, ai agenti to'lovlari, llm invoys yaratish, avtonom kripto billing, claude mcp recv"
      },
      kicker: "AI-NATIVE",
      title: "Agentlar davri uchun to'lovlar",
      description: "AI agentlari uchun qurilgan birinchi kripto to'lovlari infrastrukturasi. recv MCP har qanday Claude, GPT yoki shaxsiy LLM agentiga ish maydonini yaratish, tarif sotib olish va to'lovlarni qabul qilishni boshlash imkonini beradi — inson aralashuvi talab etilmaydi.",
      hero: {
        title: "Sizning AI agentingiz endi kripto sotuvchisi.",
        body: "recv — native Model Context Protocol serveriga ega birinchi to'lov platformasi. Har qanday MCP-mos keladigan agent boshqaruv paneliga tegmasdan tizimga kirishi, obuna bo'lishi, hisob-fakturalar yaratishi va vebhuklarni tekshirishi mumkin.",
        cta: "MCP hujjatlarini ko'rish"
      },
      comparison: {
        title: "Agentlik farqi",
        items: [
          {
            legacy: "Agentlar insonsiz ro'yxatdan o'tolmaydi, tarif sotib olmaydi yoki API kalitlarini ololmaydi.",
            recv: "bootstrap_agent_workspace bitta so'rovda ish maydonini yaratadi va kirish tokenini qaytaradi."
          },
          {
            legacy: "LLM-larda to'lov hisob-fakturalarini yaratish yoki ularni tasdiqlashning native usuli yo'q.",
            recv: "create_invoice va get_invoice — agentingiz to'g'ridan-to'g'ri chaqirishi mumkin bo'lgan birinchi darajali MCP vositalaridir."
          },
          {
            legacy: "Vebhuk imzosini tekshirish uchun backend kodi va maxfiy kalitlar talab qilinadi.",
            recv: "verify_webhook MCP serverida lokal ravishda ishlaydi — tarmoq so'rovisiz va maxfiy kalitlarni oshkor qilmasdan."
          }
        ]
      },
      bento: {
        title: "Agentingiz qutidan chiqishi bilanoq oladigan vositalar",
        items: [
          { title: "bootstrap_agent_workspace", body: "Sinov ish maydonini yarating va kirish tokenini oling — bu agentning boshlang'ich nuqtaski." },
          { title: "create_invoice", body: "Istalgan qo'llab-quvvatlanadigan tarmoqda hosted to'lov hisob-fakturasini yarating." },
          { title: "get_invoice / list_invoices", body: "Holatni so'rash va invoyslar tarixini dasturiy ravishda sahifalarga ajratish." },
          { title: "create_api_key", body: "Tarif faollashtirilgandan so'ng tegishli ruxsatlarga ega API kalitlarini yaratish." },
          { title: "create_webhook_endpoint", body: "Imzolangan hodisalarni qabul qilish uchun HTTPS nuqtalarini ro'yxatdan o'tkazish." },
          { title: "verify_webhook", body: "Tarmoq bo'ylab aylanmasdan lokal ravishda HMAC-SHA256 imzolarini tasdiqlash." }
        ]
      },
      deepDive: [
        {
          title: "Inson aralashuvisiz agentlarni ro'yxatdan o'tkazish",
          body: "AI agenti inson ishtirokisiz recv-da to'liq ro'yxatdan o'tishi mumkin. U bootstrap_agent_workspace-ni chaqiradi, kirish tokenini oladi, create_subscription_checkout orqali Developer yoki Business obunasini sotib oladi, to'langunga qadar get_checkout_invoice-ni so'raydi, so'ngra o'zining API kalitini yaratadi. Butun jarayon MCP vositalarini ketma-ket chaqirish sifatida ifodalanishi mumkin."
        },
        {
          title: "Istalgan MCP-mos keladigan ish vaqti",
          body: "recv MCP serveri stdio orqali ishlaydi va Claude Desktop, Claude Code, Cursor, Cline, Continue va Model Context Protocol spetsifikatsiyasini amalga oshiradigan har qanday boshqa xost bilan ishlaydi. Uni RECV_API_KEY va RECV_ACCESS_TOKEN bilan mcp.json-ga qo'shing va agentingiz darhol to'lov imkoniyatlariga ega bo'ladi."
        },
        {
          title: "Dizayn bo'yicha xavfsiz",
          body: "Vebhukni tasdiqlash MCP jarayoni ichida sodir bo'ladi — sizning so'rov tanangiz va maxfiy kalitingiz hech qachon lokal ish vaqtini tark etmaydi. API kalitlari invoices:read va invoices:write ruxsatlari bilan cheklangan. Agent faqat o'ziga kerak bo'lgan narsani ko'radi va har bir to'lov hodisasi yuborilishidan oldin kriptografik tarzda imzolanadi."
        }
      ],
      stats: [
        { value: "12", label: "MCP vositalari" },
        { value: "stdio", label: "Transport" },
        { value: "7+", label: "Tarmoqlar" },
        { value: "0", label: "Inson qadamlari" }
      ],
      finalTitle: "Agentingizga daromad olish huquqini bering.",
      seo: "recv MCP (Model Context Protocol) integratsiyasi AI agentlari va LLM-ga asoslangan ilovalarga kripto to'lovlarining to'liq jarayonini avtonom boshqarish imkonini beradi. Claude Desktop, Claude Code, Cursor yoki har qanday MCP-mos xostda ishlaydigan agentlar bootstrap_agent_workspace-ni chaqirib, o'zlarini ro'yxatdan o'tkazishlari, obuna rejasini sotib olishlari, API kalitlarini yaratishlari, TON, TRON, Solana, Base, Arbitrum va BSC tarmoqlari bo'ylab to'lov hisob-fakturalarini yaratishlari va kuzatishlari hamda hodisalarga asoslangan to'lov oqimlari uchun vebhuk nuqtalarini ro'yxatdan o'tkazishlari mumkin. verify_webhook vositasi tarmoqqa sirlarni oshkor qilmasdan lokal HMAC-SHA256 imzosini tekshirishni amalga oshiradi. Bu recv platformasini avtonom dasturiy ta'minotning agentlik davri uchun mo'ljallangan birinchi to'lov infratuzilmasiga aylantiradi."
    },
    productsHub: {
      title: "Har bir biznes ko'lami uchun yechimlar",
      description: "Oddiy to'lov havolalaridan tortib biznes darajasidagi infratuzilmagacha. Hozirgi rivojlanish bosqichingizga mos keladigan mahsulotni tanlang.",
      kicker: "MAHSULOTLAR",
      checkout: {
        title: "Chekaut",
        desc: "Barcha asosiy tarmoqlarni qo'llab-quvvatlaydigan tayyor, yuqori konversiyali to'lov interfeysi. Raqamli tovarlar va xizmatlarni sotish uchun juda mos keladi.",
        link: "Batafsil ma'lumot",
      },
      api: {
        title: "API va vebhuklar",
        desc: "Dasturchilar uchun to'liq xususiyatli infrastruktura. To'lovlarni avtomatsinlar, tranzaksiyalarni real vaqtda kuzating va ishonch bilan kengaytiring.",
        link: "Batafsil ma'lumot",
      },
      invoicing: {
        title: "Invoysing",
        desc: "B2B va frilanserlar uchun professional billing vositalari. Invoyslar chiqaring, holatni kuzating va mijozlaringizni bir joyda boshqaring.",
        link: "Batafsil ma'lumot",
      },
      mcp: {
        title: "MCP agenti",
        desc: "AI agentlariga to'lovlarni avtonom tarzda qabul qilishiga ruxsat bering. Native Model Context Protocol integratsiyasi — sizning AI inson aralashuvisiz ish joylarini sozlaydi, tariflarni sotib oladi va hisob-fakturalarni yaratadi.",
        link: "Batafsil ma'lumot",
      }
    },
    networksHub: {
      title: "Universal blokcheyn ulanishi",
      description: "Biz biznes va markazlashtirilmagan likvidlik o'rtasidagi tafovutni bartaraf etamiz. recv bitta integratsiya orqali barcha asosiy protokollarni qo'llab-quvvatlaydi.",
      kicker: "TARMOQLAR",
      explanation: "Barcha qo'llab-quvvatlanadigan tarmoqlar to'g'ridan-to'g'ri hamyon asosida ishlaydi. recv sotuvchi mablag'larini saqlamaydi; sotuvchilar hamyon xavfsizligi va operatsiyalari uchun javobgar bo'lib qoladilar."
    },
    networkPages: {
      ton: {
        name: "TON",
        fullName: "The Open Network",
        metadata: {
          title: "Telegram tijorat uchun TON to'lovlarini qabul qilish",
          description: "Hosted Checkout, API invoyslari, to'lov sharhlari va to'g'ridan-to'g'ri hamyonga hisob-kitoblar bilan TON va qo'llab-quvvatlanadigan Jetton to'lovlarini qabul qilish uchun recv-dan foydalaning.",
        },
        kicker: "TON TARMOQ",
        hero: {
          title: "Telegram-native tijorat uchun qurilgan GRAM to'lovlari.",
          body: "recv TON tarmog'idagi GRAM o'tkazmalarini Telegram do'konlari, pullik hamjamiyatlar va mobil xaridorlar uchun toza chekaut holatlariga aylantiradi, shu bilan birga mablag'larni to'g'ridan-to'g'ri hamyoningizga yo'naltiradi.",
        },
        snapshot: {
          kicker: "TARMOQ INVOYSI",
          title: "checkout.network.ton",
          amount: "79.00 USDT",
          items: [
            { label: "Yo'nalish", value: "TON" },
            { label: "Moslashtirish", value: "Sharh" },
            { label: "To'lov", value: "To'g'ridan-to'g'ri" },
          ],
        },
        assets: {
          kicker: "QO'LLAB-QUVVATLANADIGAN AKTIVLAR",
          title: "Xaridorga yo'naltirilgan chekaut uchun TON-native aktivlari.",
          body: "Telegram-native to'lov oqimlari uchun TON-dan va ishchi joyingizda faollashtirilganda qo'llab-quvvatlanadigan Jetton-lardan foydalaning.",
          items: [
            { name: "GRAM", body: "Oddiy Telegram va hamyon-native to'lovlar uchun native Gram o'tkazmalari." },
            { name: "Jettonlar", body: "Qo'llab-quvvatlanadigan TON Jettonlari mos keladigan hamyonlar uchun chekaut variantlari sifatida ko'rsatilishi mumkin." },
            { name: "TON tarmog'idagi USDT", body: "Sotuvchi sozlamalaringizda aktiv faollashtirilgan TON tarmog'ida steyblkoin chekautidan foydalaning." },
          ],
        },
        why: {
          kicker: "NIMA UCHUN TON",
          title: "Telegram xaridorlari uchun tabiiy to'lov yo'nalishi.",
          body: "Mijozlaringiz allaqachon Telegram-da yashasa, TON hamyonlaridan foydalansa yoki mobil chatlardan kirish va raqamli tovarlarni sotib olsa, TON to'siqlarni kamaytiradi.",
        },
        mechanics: {
          kicker: "CHEKAUT VA API MEXANIKASI",
          title: "To'lov sharhlari TON mos kelishini ishonchli qiladi.",
          steps: [
            { title: "Invoys yaratish", body: "Chekaut yoki API to'g'ri miqdor, aktiv, manzil va kerakli sharh bilan Gram to'lov so'rovini yaratadi." },
            { title: "To'lovni ko'rsatish", body: "Xaridor QR, nusxa ko'chirilishi mumkin bo'lgan manzil, miqdor va aniq sharh ko'rsatmalari mavjud bo'lgan sahifani ko'radi." },
            { title: "O'tkazmani aniqlash", body: "recv vatcherlari kiruvchi o'tkazmani miqdor va kerakli to'lov sharhi bo'yicha moslashtiradi." },
            { title: "Hodisani yuborish", body: "Boshqaruv panelingiz yoki vebhukingiz buyurtmani bajarish, kirish yoki buyurtma yangilanishi uchun to'langanlik holatini qabul qiladi." },
          ],
        },
        limitations: {
          kicker: "CHEKLOVLAR VA ESLATMALAR",
          title: "To'lov sharhi o'zgarishsiz qolishi kerak.",
          body: "TON mos kelishi kerakli sharhga bog'liq. Yo'qolgan yoki tahrirlangan sharhlar, noto'g'ri aktivlar yoki noto'g'ri tarmoq to'lovlari avtomatik tasdiqlash o'rniga qo'lda ko'rib chiqishni talab qilishi mumkin.",
        },
        useCases: {
          kicker: "TEGISHLI FOYDALANISH HOLATLARI",
          title: "Telegram orqali olib boriladigan daromad uchun eng yaxshisi.",
          body: "TON xaridor sayohati chatda yoki Telegram Mini ilovasida boshlanganda eng kuchli hisoblanadi.",
          items: [
            { name: "Telegram do'konlari", body: "Buyurtmalar uchun chekaut havolalarini yarating va xaridorlardan skrinshot so'rashni to'xtating." },
            { name: "Pullik hamjamiyatlar", body: "A'zolik to'lovlarini yopiq kanallar va guruhlarga kirish qarorlari bilan bog'lang." },
            { name: "Raqamli tovarlar", body: "Telegram-native do'konlardan fayllar, kalitlar va kirish huquqini soting." },
          ],
        },
        related: {
          kicker: "TEGISHLI",
          title: "GRAM to'lov oqimini quring.",
          links: [
            { kicker: "Foydalanish holati", label: "Telegram Shops", body: "Chekaut havolalari va jonli to'lov holatlari bilan Telegram tijorat oqimlari.", href: "/use-cases/telegram-shops" },
            { kicker: "Mahsulot", label: "Checkout", body: "TON-da GRAM buyurtmalari uchun hosted to'lov ekranlari.", href: "/products/checkout" },
            { kicker: "Plan", label: "Merchant", body: "Sotuvchilar va operatorlar uchun boshqaruv paneli ish jarayoni.", href: "/merchant" },
          ],
        },
        cta: {
          title: "To'g'ridan-to'g'ri hisob-kitob bilan Gram chekautini ishga tushiring.",
          body: "Gram to'lovlarini qabul qilish, o'tkazmalarni avtomatik aniqlash va mijozlar to'lovlarini to'g'ridan-to'g'ri hamyoningizga yo'naltirish uchun recv-dan foydalaning.",
          primary: { label: "Gram-ni qabul qilishni boshlash", href: "/app/auth" },
          secondary: { label: "Checkout-ni o'rganish", href: "/products/checkout" },
        },
        seoLabel: "TON tarmog'i to'lov tafsilotlari",
        seo: "recv buyurtma yoki kirish avtomatizatsiyasi uchun hosted Chekaut, API invoyslarini yaratish, to'lov sharhlari, blokcheyn vatcherlari, to'g'ridan-to'g'ri hamyonga hisob-kitoblar va vebhuklar bilan Gram to'lovlarini qo'llab-quvvatlaydi.",
      },
      tron: {
        name: "TRON",
        fullName: "TRON Network",
        metadata: {
          title: "SaaS va biznes uchun TRON USDT to'lovlarini qabul qilish",
          description: "Steyblkoin-mos keladigan invoyslar, vatcher mosligi, imzolangan vebhuklar va to'g'ridan-to'g'ri to'lovlar bilan recv Checkout va API orqali USDT TRC-20 qabul qiling.",
        },
        kicker: "TRON TARMOQ",
        hero: {
          title: "Global steyblkoin xaridorlari uchun TRON USDT to'lovlari.",
          body: "recv foizli komissiyalarsiz yoki kastodial hisob-kitoblarsiz SaaS, invoyslar va biznes chekaut oqimlari uchun TRC-20 USDT-ni amaliy qiladi.",
        },
        snapshot: {
          kicker: "STEYBLKOIN INVOYSI",
          title: "invoice.network.tron",
          amount: "199.00 USDT",
          items: [
            { label: "Aktiv", value: "USDT TRC-20" },
            { label: "Moslashtirish", value: "Miqdor" },
            { label: "Vebhuk", value: "Imzolangan" },
          ],
        },
        assets: {
          kicker: "QO'LLAB-QUVVATLANADIGAN AKTIVLAR",
          title: "Birinchi navbatda USDT steyblkoinini qabul qilish.",
          body: "TRON odatda prognoz qilinadigan USD nominatsiyasidagi to'lovlar va allaqachon TRC-20 o'tkazmalardan foydalanadigan mijozlar uchun tanlanadi.",
          items: [
            { name: "USDT TRC-20", body: "Chekaut, SaaS billing va B2B invoys to'lovlari uchun asosiy steyblkoin yo'nalishi." },
            { name: "TRX", body: "Tranzaksiya xarajatlari va operatsion balanslar uchun hamyonlar tomonidan ishlatiladigan native TRON aktivi." },
            { name: "Sozlangan tokenlar", body: "Ishchi joyingizda faollashtirilgan joyda qo'shimcha TRC-20 aktivlari bilan ishlash mumkin." },
          ],
        },
        why: {
          kicker: "NIMA UCHUN TRON",
          title: "Steyblkoin tanishligi konversiya uchun muhim.",
          body: "Ko'plab global mijozlar allaqachon TRON-da USDT saqlashadi. Uni qo'llab-quvvatlash biznesga xaridorlarni yangi yo'nalishga o'tkazmasdan prognoz qilinadigan to'lovlarni yig'ish imkonini beradi.",
        },
        mechanics: {
          kicker: "CHEKOUT VA API MEXANIKASI",
          title: "TRC-20 o'tkazmalari uchun aniq invoys mosligi.",
          steps: [
            { title: "Invoys yaratish", body: "Chekaut yoki API aniq USDT miqdori va maqsadli hamyon uchun TRON invoysini yaratadi." },
            { title: "Xaridorni yo'naltirish", body: "Chekaut TRC-20 tarmog'i ko'rsatmalari, QR, manzil va jonli to'lov holatini ko'rsatadi." },
            { title: "O'tkazmani kuzatish", body: "recv vatcherlari kiruvchi TRC-20 o'tkazmasini aniqlaydi va uni invoysga moslashtiradi." },
            { title: "To'lovni tasdiqlash", body: "Imzolangan vebhuklar va boshqaruv paneli hodisalari buyurtma, invoys yoki obunangizni to'langan holatga o'tkazadi." },
          ],
        },
        limitations: {
          kicker: "CHEKLOVLAR VA ESLATMALAR",
          title: "TRC-20 boshqa USDT yo'nalishlari bilan almashtirilishi mumkin emas.",
          body: "Xaridorlar ERC-20, BEP-20 yoki boshqa tarmoqni emas, balki TRON-da USDT yuborishlari kerak. Hamyonlarda o'tkazmani yakunlash uchun etarli TRX yoki energiya bo'lishi kerak.",
        },
        useCases: {
          kicker: "TEGISHLI FOYDALANISH HOLATLARI",
          title: "Steyblkoin ko'p ishlatiladigan mahsulotlar uchun eng yaxshisi.",
          body: "Narxlar USD nominatsiyasida bo'lsa va xaridorlar USDT bilan to'lashni kutishsa, TRON-dan foydalaning.",
          items: [
            { name: "SaaS billing", body: "Prognoz qilinadigan steyblkoin miqdori bilan obuna to'lovlari va yangilanishlarini yig'ing." },
            { name: "Biznes invoyslari", body: "Mijozlar TRC-20 USDT-ni afzal ko'radigan joyda to'lov so'rovlarini yuboring." },
            { name: "Raqamli tovarlar", body: "Kalitlar, fayllar va akkauntlarga kirish uchun tanish steyblkoin variantini taklif qiling." },
          ],
        },
        related: {
          kicker: "TEGISHLI",
          title: "USDT talabi atrofida quring.",
          links: [
            { kicker: "Steyblkoin", label: "USDT Checkout", body: "USDT nominatsiyasidagi buyurtmalar uchun hosted to'lov sahifalaridan foydalaning.", href: "/products/checkout" },
            { kicker: "Foydalanish holati", label: "SaaS Billing", body: "Obuna to'lov oqimlari uchun API va vebhuklar.", href: "/use-cases/saas-billing" },
            { kicker: "Plan", label: "Business", body: "To'lov operatsiyalari uchun yuqori limitlar va jamoaviy ish jarayoni.", href: "/business" },
          ],
        },
        cta: {
          title: "Qo'lda solishtirmasdan TRON USDT-ni qabul qiling.",
          body: "TRC-20 invoyslarini chiqarish, o'tkazmalarni real vaqtda kuzatish va steyblkoin to'lovlarini biznes tizimlaringizga ulash uchun recv-dan foydalaning.",
          primary: { label: "USDT bilan boshlash", href: "/app/auth" },
          secondary: { label: "Business-ni ko'rish", href: "/business" },
        },
        seoLabel: "TRON USDT to'lov tafsilotlari",
        seo: "recv Checkout, API invoyslari, TRC-20 vatcher aniqlashi, imzolangan vebhuklar, to'g'ridan-to'g'ri hamyonga hisob-kitoblar va SaaS hamda biznes foydalanish holatlari uchun steyblkoin to'lov oqimlari orqali TRON USDT to'lovlarini amalga oshirish imkonini beradi.",
      },
      ton_usdt: {
        name: "TON tarmog'idagi USDT",
        fullName: "Tether USDT on TON",
        metadata: {
          title: "TON tarmog'ida USDT to'lovlarini qabul qilish | TON-da steyblkoin chekauti",
          description: "recv bilan The Open Network (TON) tarmog'ida USDT steyblkoinini qabul qiling. Hosted Checkout, API invoyslari, sharhlar bo'yicha avtomatlashtirilgan moslashtirish va to'g'ridan-to'g'ri hamyonga to'lovlar.",
        },
        kicker: "TON TARMOG'IDAGI USDT",
        hero: {
          title: "To'g'ridan-to'g'ri hisob-kitob bilan TON-da USDT-ni qabul qiling.",
          body: "Tether (USDT)-ni TON tarmog'ida uzluksiz qabul qiling. recv to'lovlarni aniqlash va sharhlarga asoslangan moslashtirishni amalga oshiradi va mablag'larni to'g'ridan-to'g'ri sizning nokastodial hamyoningizga yuboradi.",
        },
        snapshot: {
          kicker: "STEYBLKOIN CHEKAUTI",
          title: "checkout.network.ton_usdt",
          amount: "49.00 USDT",
          items: [
            { label: "Aktiv", value: "USDT (Jetton)" },
            { label: "Tarmoq", value: "TON" },
            { label: "Moslashtirish", value: "Sharh" },
          ],
        },
        assets: {
          kicker: "QO'LLAB-QUVVATLANADIGAN STEYBLKOINLAR",
          title: "USDT native TON Jettoni sifatida.",
          body: "Telegram-ning native ekotizimidan foydalangan holda xaridorlarni narx o'zgaruvchanligiga duchor qilmasdan, The Open Network tarmog'ida USD-ga bog'langan steyblkoin to'lovlarini yig'ing.",
          items: [
            { name: "TON tarmog'idagi USDT", body: "Telegram Wallet va Tonkeeper-da keng qo'llaniladigan TON blokcheynidagi rasmiy USD₮ Jettoni." },
            { name: "GRAM", body: "Jetton yuborishda tranzaksiya komissiyalari (gaz) uchun ishlatiladigan native TON tarmog'i aktivi." },
            { name: "To'g'ridan-to'g'ri to'lovlar", body: "USDT saqlash muddatlarisiz va vositachilarsiz to'g'ridan-to'g'ri sizning nokastodial TON hamyoningizga tushadi." },
          ],
        },
        why: {
          kicker: "NIMA UCHUN TON TARMOG'IDAGI USDT",
          title: "Telegram-native tezligi bilan steyblkoin barqarorligi.",
          body: "TON-dagi USDT Telegram tijorati uchun mukammal yechimdir. U tezkor tranzaksiya tezligi, past komissiyalar va Telegram chatlari bilan chuqur integratsiyani saqlab qolgan holda GRAM narxining o'zgaruvchanligini yo'q qiladi.",
        },
        mechanics: {
          kicker: "AVTOMATLASHTIRILGAN DETEKTOR",
          title: "Maxsus sharhlar bilan Jetton o'tkazmalari monitoringi.",
          steps: [
            { title: "Invoys yaratish", body: "Aniq USDT miqdori va kerakli to'lov sharhini ko'rsatuvchi TON tarmog'idagi USDT invoysini yarating." },
            { title: "Tafsilotlarni taqdim etish", body: "Chekaut qabul qiluvchi TON manzili, QR kodi va kerakli to'lov sharhini ko'rsatadi." },
            { title: "Blokcheynni kuzatish", body: "recv to'g'ri sharhga ega mos keladigan USDT Jetton o'tkazmalarini aniqlash uchun TON blokcheyn tranzaksiyalarini kuzatib boradi." },
            { title: "Backend-ni ishga tushirish", body: "Avtomatlashtirilgan vebhuk to'lov tasdiqlanganda ilovangizni xabardor qiladi, darhol kirishni ochadi yoki buyurtmalarni yakunlaydi." },
          ],
        },
        limitations: {
          kicker: "CHEKLOVLAR VA ESLATMALAR",
          title: "Memo-ga asoslangan moslashtirish va tranzaksiya komissiyalari.",
          body: "Xuddi GRAM to'lovlari kabi, TON-dagi USDT mosligi ham kerakli sharhga bog'liq. Xaridorlar bu sharhni o'zgartirmasliklari kerak. Bundan tashqari, xaridorlar yoki hamyonlarda blokcheyn tranzaksiya komissiyalarini (gaz) qoplash uchun GRAM bo'lishi kerak.",
        },
        useCases: {
          kicker: "FOYDALANISH HOLATLARI",
          title: "Telegram tijorat va botlari uchun mo'ljallangan.",
          body: "TON-dagi USDT dollar-pegged narx belgilashni xohlaydigan, lekin mahsulotlarni Telegram ekotizimida sotadigan bizneslar uchun ideal.",
          items: [
            { name: "Telegram Mini Apps", body: "Ilovangiz yoki botingiz ichida bir marta bosish orqali TON-dagi USDT to'lovlarini faollashtiring." },
            { name: "Raqamli obunalar", body: "Muntazam a'zolik, kurslar yoki yopiq guruhlarga kirishni barqaror dollar qiymatlarida hisob-faktura qiling." },
            { name: "E-Commerce", body: "Telegram va TON-mos keladigan hamyonlardan foydalangan holda global mijozlarga jismoniy yoki raqamli tovarlarni soting." },
          ],
        },
        related: {
          kicker: "TEGISHLI",
          title: "TON-da USDT to'lov oqimini quring.",
          links: [
            { kicker: "Foydalanish holati", label: "Telegram Shops", body: "Telegram-da do'kon to'lovlari va buyurtmalarini avtomatlashtiring.", href: "/use-cases/telegram-shops" },
            { kicker: "Mahsulot", label: "Checkout", body: "Ko'p tarmoqli qo'llab-quvvatlashga ega hosted to'lov sahifalari.", href: "/products/checkout" },
            { kicker: "Mahsulot", label: "API", body: "recv-ni shaxsiy backend ilovangizga to'g'ridan-to'g'ri integratsiya qiling.", href: "/products/api" },
          ],
        },
        cta: {
          title: "Bugun TON-da USDT qabul qilishni boshlang.",
          body: "TON-da steyblkoin chekautlarini sozlang, sharhlar orqali invoys mos kelishini avtomatlashtiring va to'lovlarni to'g'ridan-to'g'ri o'z hamyoningizga qabul qiling.",
          primary: { label: "Boshlash", href: "/app/auth" },
          secondary: { label: "API hujjatlarini ko'rish", href: "/docs" },
        },
        seoLabel: "TON-dagi USDT to'lov shlyuzi tafsilotlari",
        seo: "recv Telegram botlari va Mini ilovalari uchun hosted Checkout, API invoysini yaratish, kerakli sharhlar bo'yicha moslashtirish, blokcheyn vatcherlari va to'g'ridan-to'g'ri hamyonga hisob-kitoblar bilan TON-da USDT to'lovlarini qo'llab-quvvatlaydi.",
      },
      solana: {
        name: "Solana",
        fullName: "Solana Blockchain",
        metadata: {
          title: "API va Chekaut orqali Solana to'lovlarini qabul qilish",
          description: "Tezkor chekaut oqimlari, API invoyslari, vatcher aniqlashi va imzolangan vebhuklar bilan SOL va qo'llab-quvvatlanadigan SPL aktivlarini qabul qilish uchun recv-dan foydalaning.",
        },
        kicker: "SOLANA TARMOQ",
        hero: {
          title: "Dasturchiga tegishli tezkor chekaut uchun Solana to'lovlari.",
          body: "recv SOL va qo'llab-quvvatlanadigan SPL aktivlarini bitta to'lov API-siga birlashtiradi, shuning uchun web3 mahsulotlari maxsus vatcher logikasisiz invoyslar yaratishi va tasdiqlangan o'tkazmalarga javob qaytarishi mumkin.",
        },
        snapshot: {
          kicker: "API HODISASI",
          title: "payment.network.solana",
          amount: "49.00 USDT",
          items: [
            { label: "Aktivlar", value: "SPL USDT" },
            { label: "Oqim", value: "API" },
            { label: "Holat", value: "Aniqlangan" },
          ],
        },
        assets: {
          kicker: "QO'LLAB-QUVVATLANADIGAN AKTIVLAR",
          title: "Solana-da USDT SPL to'lovlari.",
          body: "Solana qo'llab-quvvatlashi Solana tarmog'ida tezkor steyblkoin to'lovlariga muhtoj bo'lgan jamoalarga mos keladi.",
          items: [
            { name: "SPL USDT", body: "Maksimal tezlik va past komissiyalarga ega USD nominatsiyasidagi to'lovlar uchun Solana-dagi standart steyblkoin." },
          ],
        },
        why: {
          kicker: "NIMA UCHUN SOLANA",
          title: "web3 foydalanuvchilari uchun tezkor to'lov fikr-mulohazasi.",
          body: "Sizning xaridorlaringiz allaqachon Solana hamyonlaridan foydalansa va dasturchi vositalari, ilovalar yoki raqamli tovarlar oqimlarida tezkor tasdiqlashni kutishsa, Solana juda mos keladi.",
        },
        mechanics: {
          kicker: "CHEKOUT VA API MEXANIKASI",
          title: "SOL va SPL aktivlari uchun yagona invoys oqimi.",
          steps: [
            { title: "Invoys yaratish", body: "Sizning backend-ingiz recv API orqali Solana invoysini yaratadi yoki hosted Checkout-dan foydalanadi." },
            { title: "Hamyon ma'lumotlarini ko'rsatish", body: "Chekaut tarmoq, aktiv, miqdor, manzil va QR-ni xaridorga qulay ekranda ko'rsatadi." },
            { title: "O'tkazmani kuzatish", body: "recv native yoki SPL o'tkazmalarini kuzatib boradi va to'lovni invoysga moslashtiradi." },
            { title: "Backend-ni ishga tushirish", body: "Imzolangan vebhuk mahsulotingizga kirishni ochish, tovarlarni yetkazib berish yoki holatni yangilash kerakligini aytadi." },
          ],
        },
        limitations: {
          kicker: "CHEKLOVLAR VA ESLATMALAR",
          title: "Aktiv va hamyon tanlovi aniq bo'lishi kerak.",
          body: "Xaridorlar Solana-da sozlangan Solana aktivini yuborishlari kerak. Token akkauntining xatti-harakati, hamyonni qo'llab-quvvatlash va vaqtinchalik tarmoq bandligi to'lov tajribasiga ta'sir qilishi mumkin.",
        },
        useCases: {
          kicker: "TEGISHLI FOYDALANISH HOLATLARI",
          title: "web3-native mahsulotlar uchun eng yaxshisi.",
          body: "To'lovlar allaqachon dasturchilar, ijodkorlar yoki kripto-native xaridorlar bilan muloqot qiladigan mahsulotning bir qismi bo'lsa, Solana foydali bo'ladi.",
          items: [
            { name: "Dasturchi vositalari", body: "Backend-dan invoyslar yarating va avtomatlashtirilgan kirish uchun vebhuklardan foydalaning." },
            { name: "Raqamli tovarlar", body: "Solana hamyon foydalanuvchilariga kalitlar, yuklamalar yoki litsenziyalarni soting." },
            { name: "Web3 ilovalar", body: "Solana ekotizimida faol bo'lgan foydalanuvchilar uchun tezkor to'lov variantini qo'shing." },
          ],
        },
        related: {
          kicker: "TEGISHLI",
          title: "Solana-ni backend-ga ulang.",
          links: [
            { kicker: "Mahsulot", label: "API", body: "Invoyslar yarating va normallashtirilgan to'lov hodisalarini qabul qiling.", href: "/products/api" },
            { kicker: "Plan", label: "Developer", body: "Ishlab chiqarish integratsiyasi uchun API va vebhuklar.", href: "/dev" },
            { kicker: "Docs", label: "Integration", body: "To'lovlarni avtomatlashtirish bo'yicha dasturchi hujjatlarini o'qing.", href: "/docs" },
          ],
        },
        cta: {
          title: "Mahsulotingizga Solana to'lovlarini qo'shing.",
          body: "Solana aktivlarini qabul qilish va imzolangan hodisalar orqali to'lov holatini boshqarish uchun recv API va Checkout-dan foydalaning.",
          primary: { label: "Integratsiyani boshlash", href: "/app/auth" },
          secondary: { label: "API-ni o'rganish", href: "/products/api" },
        },
        seoLabel: "Solana tarmog'i to'lov tafsilotlari",
        seo: "recv SOL va sozlangan SPL aktivlari bilan Solana to'lovlarini, hosted Checkout, API invoysini yaratish, blokcheyn vatcherlari, imzolangan vebhuklar va dasturchilarga yo'naltirilgan to'lov avtomatizatsiyasini qo'llab-quvvatlaydi.",
      },
      base: {
        name: "Base",
        fullName: "Base L2",
        metadata: {
          title: "Yagona API orqali Base to'lovlarini qabul qilish",
          description: "recv Checkout, API invoyslari, vatcher monitoringi va biznesga tayyor vebhuklar bilan Base-da ETH va qo'llab-quvvatlanadigan ERC-20 aktivlarini qabul qiling.",
        },
        kicker: "BASE TARMOQ",
        hero: {
          title: "EVM xaridorlari uchun Base to'lovlari va past xarajatli chekaut.",
          body: "recv jamoalarga to'g'ridan-to'g'ri hisob-kitoblar va normallashtirilgan to'lov hodisalari bilan boshqa tarmoqlar uchun ishlatadigan chekaut va API oqimiga Base-ni qo'shish imkonini beradi.",
        },
        snapshot: {
          kicker: "L2 INVOYSI",
          title: "payment.network.base",
          amount: "99.00 USDT",
          items: [
            { label: "Yo'nalish", value: "Base" },
            { label: "Aktivlar", value: "ERC-20 USDT" },
            { label: "API", value: "Yagona" },
          ],
        },
        assets: {
          kicker: "QO'LLAB-QUVVATLANADIGAN AKTIVLAR",
          title: "Base-da USDT.",
          body: "Coinbase-ga mos keladigan yoki EVM-mos keladigan L2 yo'nalishlarida ishlaydigan xaridorlar uchun Base-dan foydalaning.",
          items: [
            { name: "Base-dagi USDT", body: "Tezkor va arzon tranzaksiyalar uchun Coinbase-ning L2 tarmog'ida USDT steyblkoin o'tkazmasi." },
          ],
        },
        why: {
          kicker: "NIMA UCHUN BASE",
          title: "Kamroq chekaut ishqalanishi bilan EVM mosligi.",
          body: "Base tanish EVM hamyonlarini, asosiy tarmoqqa qaraganda pastroq komissiyalarni va steyblkoin-friendly to'lov variantlarini xohlaydigan onchain foydalanuvchilariga xizmat ko'rsatadigan bizneslarga mos keladi.",
        },
        mechanics: {
          kicker: "CHEKOUT VA API MEXANIKASI",
          title: "Base-ga xos vatcher bilan bir xil recv oqimi.",
          steps: [
            { title: "Invoys yaratish", body: "Chekaut yoki API-dan to'lanadigan tarmoq sifatida Base va sozlangan aktiv bilan foydalaning." },
            { title: "To'lovni taqdim etish", body: "Xaridor Base tarmog'i ko'rsatmalari, miqdor, manzil va QR-ni ko'radi." },
            { title: "Tarmoqni kuzatish", body: "recv Base tarmog'idagi native va ERC-20 o'tkazmalarini kuzatadi va ularni invoyslarga moslashtiradi." },
            { title: "Vebhuk chiqarish", body: "Sizning backend-ingiz boshqa qo'llab-quvvatlanadigan tarmoqlar bo'ylab ishlatiladigan normallashtirilgan to'lov holatini qabul qiladi." },
          ],
        },
        limitations: {
          kicker: "CHEKLOVLAR VA ESLATMALAR",
          title: "Base aktivlari Base tarmog'ida yuborilishi kerak.",
          body: "Base, TRON, BSC va boshqa EVM o'tkazmalari alohida tarmoqlardir. Noto'g'ri tarmoq depozitlari avtomatik ravishda Base to'lovlari bilan almashtirilmaydi.",
        },
        useCases: {
          kicker: "TEGISHLI FOYDALANISH HOLATLARI",
          title: "EVM-ga yo'naltirilgan chekaut uchun eng yaxshisi.",
          body: "Mijozlaringiz allaqachon EVM hamyonlaridan yoki Coinbase-ga mos keladigan onchain mahsulotlaridan foydalanganda Base yaxshi ishlaydi.",
          items: [
            { name: "Biznes chekauti", body: "Yuqori hajmli to'lov oqimlari uchun arzonroq EVM variantini taklif qiling." },
            { name: "API integratsiyalari", body: "Alohida invoys va vebhuk logikasini yaratmasdan Base-ni qo'shing." },
            { name: "Raqamli mahsulotlar", body: "Base hamyonlari va steyblkoinlarini afzal ko'radigan web3 xaridorlariga xizmat ko'rsatige." },
          ],
        },
        related: {
          kicker: "TEGISHLI",
          title: "Biznes to'lovlariga Base-ni qo'shing.",
          links: [
            { kicker: "Mahsulot", label: "API", body: "Yagona invoys yaratish va vebhuk hodisalari.", href: "/products/api" },
            { kicker: "Plan", label: "Business", body: "Kengaytirish uchun yuqori limitlar va jamoaviy operatsiyalar.", href: "/business" },
            { kicker: "Plan", label: "Developer", body: "Backend integratsiyalari uchun ishlab chiqarish API kirish imkoni.", href: "/dev" },
          ],
        },
        cta: {
          title: "Bitta integratsiya orqali Base to'lovlarini qabul qiling.",
          body: "Base chekautini qo'shish, o'tkazmalarni kuzatish va backend to'lov logikangizni tarmoqlar bo'ylab barqaror saqlash uchun recv-dan foydalaning.",
          primary: { label: "Integratsiyani boshlash", href: "/app/auth" },
          secondary: { label: "API-ni o'rganish", href: "/products/api" },
        },
        seoLabel: "Base tarmog'i to'lov tafsilotlari",
        seo: "recv ETH va sozlangan ERC-20 aktivlari bilan Base to'lovlarini, hosted Checkout, API invoyslarini, Base vatcherlarini, normallashtirilgan vebhuklarni, to'g'ridan-to'g'ri hamyonga hisob-kitoblarni va biznes to'lov jarayonlarini qo'llab-quvvatlaydi.",
      },
      bsc: {
        name: "BSC",
        fullName: "BNB Smart Chain",
        metadata: {
          title: "Chekaut va API orqali BSC to'lovlarini qabul qilish",
          description: "recv to'lov havolalari, API invoyslari, vatcher aniqlashi va to'g'ridan-to'g'ri hamyonga hisob-kitoblar bilan BSC-da BNB va qo'llab-quvvatlanadigan BEP-20 aktivlarini qabul qiling.",
        },
        kicker: "BSC TARMOQ",
        hero: {
          title: "Keng chakana steyblkoin qamrovi uchun BSC to'lovlari.",
          body: "recv bizneslarga to'g'ridan-to'g'ri hisob-kitob qilish uchun yaratilgan toza chekaut va yagona API oqimi orqali BNB Smart Chain to'lovlarini qabul qilishga yordam beradi.",
        },
        snapshot: {
          kicker: "BEP-20 INVOYSI",
          title: "payment.network.bsc",
          amount: "149.00 USDT",
          items: [
            { label: "Yo'nalish", value: "BSC" },
            { label: "Aktivlar", value: "BEP-20 USDT" },
            { label: "Holat", value: "Faol" },
          ],
        },
        assets: {
          kicker: "QO'LLAB-QUVVATLANADIGAN AKTIVLAR",
          title: "BEP-20 USDT chekaut variantlari.",
          body: "BSC mijozlarga token o'tkazmalari uchun tanish bo'lgan past komissiyali to'lov tarmog'ini taqdim etadi.",
          items: [
            { name: "BEP-20 USDT", body: "BNB Smart Chain-da USDT saqlaydigan xaridorlar uchun steyblkoin chekauti." },
          ],
        },
        why: {
          kicker: "NIMA UCHUN BSC",
          title: "Past komissiyalar va keng chakana tanishlik.",
          body: "BSC allaqachon BEP-20 steyblkoinlaridan foydalanadigan va arzon o'tkazmalarni kutayotgan mijozlarga xizmat ko'rsatadigan bizneslar uchun foydalidir.",
        },
        mechanics: {
          kicker: "CHEKOUT VA API MEXANIKASI",
          title: "Alohida biznes logikasisiz BEP-20 monitoringi.",
          steps: [
            { title: "Invoys yaratish", body: "Hosted Checkout yoki recv API orqali BSC va to'lanadigan aktivni tanlang." },
            { title: "Ko'rsatmalarni ko'rsatish", body: "Chekaut BSC tarmog'i tafsilotlarini, QR, manzil, miqdor va to'lov holatini ko'rsatadi." },
            { title: "O'tkazmani aniqlash", body: "recv vatcherlari invoys uchun native BNB va BEP-20 o'tkazmalarini kuzatib boradi." },
            { title: "Tizimni yangilash", body: "Boshqaruv paneli va vebhuklar tasdiqlangandan keyin buyurtma, invoys yoki akkaunt holatingizni yangilaydi." },
          ],
        },
        limitations: {
          kicker: "CHEKLOVLAR VA ESLATMALAR",
          title: "Faqat BEP-20 faqat BSC deganidir.",
          body: "Xaridorlar tanlangan aktivni BSC-da yuborishlari kerak. Boshqa zanjirda yuborilgan USDT avtomatik BSC moslashuvidan tashqarida qoladi.",
        },
        useCases: {
          kicker: "TEGISHLI FOYDALANISH HOLATLARI",
          title: "Chakana va biznes chekauti uchun eng yaxshisi.",
          body: "Xaridorlaringiz bazasi allaqachon BEP-20 aktivlariga ega bo'lsa yoki arzon EVM-mos variantni xohlasa, BSC-dan foydalaning.",
          items: [
            { name: "Biznes to'lovlari", body: "Allaqachon BSC hamyonlaridan foydalanadigan mijozlardan steyblkoinlarni qabul qiling." },
            { name: "Chekaut havolalari", body: "Har bir buyurtma uchun aniq BSC ko'rsatmalari bilan to'lov sahifalarini yarating." },
            { name: "API avtomatizatsiyasi", body: "BEP-20 to'lov hodisalarini backend ish jarayoningizga yo'naltiring." },
          ],
        },
        related: {
          kicker: "TEGISHLI",
          title: "BSC-ni operatsiyalarga ulang.",
          links: [
            { kicker: "Mahsulot", label: "API", body: "BSC to'lovlari uchun yagona invoyslar va vebhuklar.", href: "/products/api" },
            { kicker: "Plan", label: "Business", body: "Rivojlanayotgan to'lov hajmi uchun jamoa va limit tuzilishi.", href: "/business" },
            { kicker: "Mahsulot", label: "Checkout", body: "Buyurtmalar va invoyslar uchun hosted BSC to'lov sahifalari.", href: "/products/checkout" },
          ],
        },
        cta: {
          title: "Qo'shimcha solishtirmasdan BSC to'lovlarini qo'shing.",
          body: "Checkout, API invoyslari and real vaqtdagi to'lov hodisalari orqali BNB Smart Chain o'tkazmalarini qabul qilish uchun recv-dan foydalaning.",
          primary: { label: "BSC-ni qabul qilishni boshlash", href: "/app/auth" },
          secondary: { label: "Business-ni ko'rish", href: "/business" },
        },
        seoLabel: "BSC tarmog'i to'lov tafsilotlari",
        seo: "recv BNB va sozlangan BEP-20 aktivlari bilan BSC to'lovlarini, hosted Checkout, API invoysini yaratish, blokcheyn vatcherlari, vebhuklar va biznes to'lov oqimlari uchun to'g'ridan-to'g'ri hamyonga hisob-kitobni qo'llab-quvvatlaydi.",
      },
      arbitrum: {
        name: "Base",
        fullName: "Base One",
        metadata: {
          title: "recv API orqali Base to'lovlarini qabul qilish",
          description: "Chekaut, API invoyslari, vatcher monitoringi, vebhuklar va to'g'ridan-to'g'ri hisob-kitoblar bilan Base One-da ETH va qo'llab-quvvatlanadigan ERC-20 aktivlarini qabul qiling.",
        },
        kicker: "BASE TARMOQ",
        hero: {
          title: "Base-ga mos keladigan xaridorlar uchun Base to'lovlari.",
          body: "recv qo'llab-quvvatlanadigan tarmoqlar bo'ylab qo'llaniladigan bir xil chekaut, invoys va vebhuk modeli bilan to'lov stekingizga Base One-ni qo'shadi.",
        },
        snapshot: {
          kicker: "L2 TO'LOVI",
          title: "payment.network.arbitrum",
          amount: "249.00 USDT",
          items: [
            { label: "Yo'nalish", value: "Base One" },
            { label: "Aktivlar", value: "ERC-20 USDT" },
            { label: "Hisob-kitob", value: "To'g'ridan-to'g'ri" },
          ],
        },
        assets: {
          kicker: "QO'LLAB-QUVVATLANADIGAN AKTIVLAR",
          title: "Base-native USDT to'lovlari.",
          body: "Asosiy tarmoqqa qaraganda pastroq tranzaksiya xarajatlariga ega Base-mos keladigan aktivlarni xohlaydigan mijozlar uchun Base-dan foydalaning.",
          items: [
            { name: "Base-dagi USDT", body: "Yuqori darajada kengaytiriladigan USD nominatsiyasidagi to'lovlar uchun Base One layer 2 tarmog'ida USDT steyblkoin o'tkazmasi." },
          ],
        },
        why: {
          kicker: "NIMA UCHUN BASE",
          title: "Asosiy tarmoq xarajatlarisiz Base mosligi.",
          body: "Base — Base vositalarini afzal ko'radigan, ammo muntazam to'lovlar uchun pastroq komissiyalarga muhtoj bo'lgan EVM-native mijozlar uchun amaliy variantdir.",
        },
        mechanics: {
          kicker: "CHEKOUT VA API MEXANIKASI",
          title: "Base o'tkazmalari uchun normallashtirilgan hodisalar.",
          steps: [
            { title: "Invoys yaratish", body: "To'lanadigan tarmoq sifatida Base One bilan recv Checkout yoki API-dan foydalaning." },
            { title: "To'lovni yo'naltirish", body: "Xaridor Base-ga xos manzil, miqdor, aktiv va QR ko'rsatmalarini ko'radi." },
            { title: "O'tkazmani kuzatish", body: "recv vatcherlari Base One tarmog'ida native va ERC-20 o'tkazmalarini aniqlaydi." },
            { title: "Backend-ni sinxronlashtirish", body: "Imzolangan vebhuklar sizning buyurtmangiz yoki billing tizimingizni boshqa tarmoqlar bilan bir xil hodisa ko'rinishida yangilaydi." },
          ],
        },
        limitations: {
          kicker: "CHEKLOVLAR VA ESLATMALAR",
          title: "Base One asosiy tarmoq va boshqa L2-lardan alohidadir.",
          body: "To'lovlar Base One-da yuborilishi kerak. Base, Base, BSC yoki boshqa EVM o'tkazmalari har xil zanjirlar bo'lib, avtomatik ravishda bir xil to'lov sifatida ko'rilmaydi.",
        },
        useCases: {
          kicker: "TEGISHLI FOYDALANISH HOLATLARI",
          title: "EVM-native bizneslar uchun eng yaxshisi.",
          body: "Base xaridorlaringiz Base L2 muhitlarida ishlayotgan jamoalar uchun yaxshi ishlaydi.",
          items: [
            { name: "API to'lovlari", body: "Backend orqali boshqariladigan invoys va vebhuk oqimlariga Base-ni qo'shing." },
            { name: "Biznes billingi", body: "Base-mos xaridorlardan steyblkoin invoyslarini yig'ing." },
            { name: "Web3 xizmatlari", body: "Muntazam yoki bir martalik xizmatlar uchun L2 hisob-kitoblarini afzal ko'radigan xaridorlarni qo'llab-quvvatlang." },
          ],
        },
        related: {
          kicker: "TEGISHLI",
          title: "Base-dan ishlab chiqarish oqimlarida foydalaning.",
          links: [
            { kicker: "Mahsulot", label: "API", body: "Base invoyslarini yarating va imzolangan to'lov hodisalarini qayta ishlang.", href: "/products/api" },
            { kicker: "Plan", label: "Business", body: "Jamoa funksiyalari bilan EVM to'lov operatsiyalarini kengaytiring.", href: "/business" },
            { kicker: "Plan", label: "Developer", body: "Ishlab chiqarish jamoalari uchun backend integratsiyasiga kirish imkoni.", href: "/dev" },
          ],
        },
        cta: {
          title: "Chekaut stekingizga Base to'lovlarini qo'shing.",
          body: "Base One to'lovlarini qabul qilish, o'tkazmalarni kuzatish va hisob-kitobni to'g'ridan-to'g'ri hamyoningizda saqlash uchun recv-dan foydalaning.",
          primary: { label: "Integratsiyani boshlash", href: "/app/auth" },
          secondary: { label: "API-ni o'rganish", href: "/products/api" },
        },
        seoLabel: "Base tarmog'i to'lov tafsilotlari",
        seo: "recv ETH va sozlangan ERC-20 aktivlari bilan Base One to'lovlarini, hosted Checkout, API invoyslarini, blokcheyn vatcherlarini, imzolangan vebhuklarni va EVM biznes ish jarayonlari uchun to'g'ridan-to'g'ri hamyonga hisob-kitobni qo'llab-quvvatlaydi.",
      },
    },
    useCasesHub: {
      title: "Har bir biznes ko'lami uchun yechimlar",
      description: "Turli sohalar o'zlarining kripto operatsiyalarini avtomatlashtirish va qo'lda bajariladigan xarajatlarni yo'qotish uchun recv-dan qanday foydalanishini o'rganing.",
      kicker: "FOYDALANISH HOLATLARI",
      customUseCase: {
        title: "Sizda o'ziga xos foydalanish holati bormi?",
        body: "Bizning API-miz har qanday to'lov oqimini quvvatlantirish uchun etarlicha moslashuvchan. recv sizning maxsus biznesingizga qanday yordam berishi mumkinligini muhokama qilaylik.",
      }
    },
    useCasePages: {
      "telegram-shops": {
        name: "Telegram do'konlar",
        metadata: {
          title: "Telegram botlari va Mini ilovalarida kripto to'lovlarni qabul qilish",
          description: "TON tarmog'ida GRAM-first chekaut havolalari, to'g'ridan-to'g'ri hamyonga hisob-kitoblar va tezkor buyurtma signallari bilan Telegram do'kon to'lovlarini avtomatlashtiring.",
        },
        kicker: "TELEGRAM TIJORAT",
        hero: {
          title: "Telegram botlari va Mini ilovalarida kripto to'lovlarni qabul qilish",
          body: "recv Telegram-native tijorat uchun yuqori samarali chekaut oqimini, real vaqtdagi blokcheyn monitoringini va to'g'ridan-to'g'ri hamyonga hisob-kitobni taqdim etadi.",
        },
        snapshot: {
          kicker: "JONLI BUYURTMA",
          title: "Telegram buyurtmasi #4821",
          amount: "79.00 USDT",
          items: [
            { label: "Tarmoq", value: "TON" },
            { label: "Holat", value: "Aniqlangan" },
            { label: "To'lov", value: "To'g'ridan-to'g'ri" },
          ],
        },
        problem: {
          kicker: "MUAMMO",
          title: "To'lovlarni qo'lda tekshirish kengayishni cheklaydi.",
          body: "Hamyon skrinshotlarini solishtirish va blokcheyn brauzeridan holatni qo'lda tekshirish xatolarga yo'l qo'yadi. Qisman to'lovlar va noto'g'ri tarmoq o'tkazmalari oddiy buyurtmalarni murakkab qo'llab-quvvatlash suhbatlariga aylantiradi.",
        },
        solution: {
          kicker: "RECV OQIMI",
          title: "Avtomatlashtirilgan chekaut havolalari qo'lda tekshirishni almashtiradi.",
          body: "Har bir buyurtma uchun xavfsiz to'lov havolalarini yarating. recv vatcherlari blokcheynni 24/7 kuzatib boradi va o'tkazma tasdiqlanishi bilanoq buyurtmalarni avtomatik ravishda 'to'langan' holatiga o'tkazadi.",
        },
        productPlan: {
          kicker: "MAHSULOT VA PLAN",
          title: "Sotuvchi konsoli va chekaut",
          body: "Professional to'lov interfeysi va avtomatlashtirish imkoniyatlariga ega qo'lda nazoratga muhtoj bo'lgan do'kon egalari uchun juda mos keladi.",
          product: {
            label: "Mahsulot",
            title: "Checkout",
            body: "Ko'p tarmoqli qo'llab-quvvatlash, QR kodlari va uzluksiz xaridor tajribasi uchun jonli holat yangilanishlariga ega hosted to'lov sahifalari.",
            href: "/products/checkout",
            linkLabel: "Checkout-ni o'rganish",
          },
          plan: {
            label: "Plan",
            title: "Merchant",
            body: "Biznes egalari uchun boshlang'ich nuqta. Qo'lda havola yaratish, tranzaksiyalar tarixi va real vaqtdagi bildirishnomalarni o'z ichiga oladi.",
            href: "/merchant",
            linkLabel: "Merchant-ni ko'rish",
          },
        },
        networks: {
          kicker: "TARMOQLAR",
          title: "GRAM va steyblkoinlar uchun optimallashtirilgan",
          body: "Telegram-native xaridorlar uchun TON tarmog'idagi GRAM-dan foydalaning yoki global steyblkoin foydalanuvchilari uchun USDT (TRC-20) to'lovlarini qo'llab-quvvatlang.",
          items: [
            { name: "GRAM", body: "Telegram-ga asoslangan tijorat va rivojlanayotgan TON ekotizimi uchun native valyuta." },
            { name: "TRON USDT", body: "Yuqori o'tkazuvchanlik va past xarajatlar bilan USDT hisob-kitoblari bo'yicha global standart." },
            { name: "Solana / Base", body: "web3-native auditoriyalar uchun yuqori samarali L1/L2 muqobillari." },
          ],
        },
        flow: {
          kicker: "INTEGRATSIYA OQIMI",
          title: "Chatdan to yetkazib berishgacha",
          steps: [
            { title: "Invoys yaratildi", body: "Sotuvchi yoki bot ma'lum bir Telegram buyurtmasi uchun to'lov so'rovini yaratadi." },
            { title: "Chekaut ochildi", body: "Xaridor aniq miqdor, manzil va QR ko'rsatilgan hosted havolani ochadi." },
            { title: "O'tkazma aniqlandi", body: "recv vatcherlari on-chain o'tkazmani aniqlaydi va miqdorni darhol tekshiradi." },
            { title: "Buyurtma tasdiqlandi", body: "Boshqaruv paneli buyurtmani darhol bajarish imkonini beruvchi to'langanlik holatini bildiradi." },
          ],
        },
        related: {
          kicker: "TEGISHLI",
          title: "Telegram stekingizni quring.",
          links: [
            { kicker: "Tarmoq", label: "GRAM on TON", body: "Telegram Mini ilovalari uchun native to'lov yo'nalishlari.", href: "/networks/ton" },
            { kicker: "Mahsulot", label: "Checkout Engine", body: "Har bir savdo oqimi uchun hosted ekranlar.", href: "/products/checkout" },
            { kicker: "Plan", label: "Merchant Tier", body: "Qo'lda to'lov operatsiyalari uchun boshqaruv paneli.", href: "/merchant" },
          ],
        },
        cta: {
          title: "Telegram tijoratingizni avtomatlashtirishga tayyormisiz?",
          body: "Skrinshotlarni tekshirishni to'xtating. Siz biznesingizni kengaytirishga e'tibor qaratayotganingizda, blokcheyn monitoringini recv-ga topshiring.",
          primary: { label: "To'lovlarni qabul qilishni boshlash", href: "/app/auth" },
          secondary: { label: "Checkout-ni o'rganish", href: "/products/checkout" },
        },
        features: ["GRAM va Jetton-larni qo'llab-quvvatlash", "Real vaqtdagi buyurtma holati", "To'g'ridan-to'g'ri hamyonga to'lovlar", "Telegram Mini ilovalariga moslashtirilgan"],
        seoLabel: "Telegram do'koni kripto to'lovlari hujjatlari",
        seo: "recv Telegram do'konlariga hosted chekaut havolalari, TON qo'llab-quvvatlashi, steyblkoin tarmoqlari, to'g'ridan-to'g'ri hamyonga hisob-kitob va buyurtmalarni bajarish uchun real vaqtda to'lovlarni aniqlash bilan kripto to'lovlarini qabul qilish imkonini beradi.",
      },
      "saas-billing": {
        name: "SaaS billing",
        metadata: {
          title: "SaaS platformalari uchun kripto billing infrastrukturasi",
          description: "TON, TRON va EVM to'lov variantlari, takrorlanadigan vebhuklar va HMAC imzolarga ega SaaS obunalari uchun kripto billingini integratsiya qiling.",
        },
        kicker: "SAAS INFRASTRUKTURASI",
        hero: {
          title: "SaaS uchun biznes darajasidagi kripto billing",
          body: "Foizli komissiyalarni yo'q qiling. recv idempotent invoys yaratish va kafolatlangan vebhuk yetkazib berish uchun API ibtidoiylarini taqdim etadi.",
        },
        snapshot: {
          kicker: "BILLING HODISASI",
          title: "subscription.renewal.paid",
          amount: "199.00 USDT",
          items: [
            { label: "API", value: "Idempotent" },
            { label: "Vebhuk", value: "HMAC" },
            { label: "Plan", value: "Developer" },
          ],
        },
        problem: {
          kicker: "MUAMMO",
          title: "Mo'rt billing oqimlari mijozlarning ketishiga olib keladi.",
          body: "Muntazam to'lovlar va yangilanishlarni qayta ishlash 100% ishlash vaqtini va dublikat-safe logikani talab qiladi. Turli blokcheyn tugunlarini boshqarish keraksiz muhandislik xarajatlarini qo'shadi.",
        },
        solution: {
          kicker: "RECV OQIMI",
          title: "Yagona API va imzolangan vebhuklar",
          body: "Bitta REST interfeysi orqali invoyslar yarating. Obuna yangilanishlarini faqat kriptografik tasdiqlashdan keyin ishga tushirish uchun bizning HMAC-imzolangan vebhuklarimizdan foydalaning.",
        },
        productPlan: {
          kicker: "MAHSULOT VA PLAN",
          title: "API va Developer/Business tariflari",
          body: "To'liq dasturiy nazorat va yuqori so'rov o'tkazuvchanligiga muhtoj bo'lgan jamoalar uchun ishlab chiqilgan.",
          product: {
            label: "Mahsulot",
            title: "API & Webhooks",
            body: "Idempotent invoys yaratish va billing tizimi hodisalari uchun takrorlash navbati.",
            href: "/products/api",
            linkLabel: "API hujjatlarini o'qish",
          },
          plan: {
            label: "Plan",
            title: "Developer / Business",
            body: "Kengaytirilayotgan dasturiy platformalar uchun to'liq API kirish imkoni, HMAC imzolari va yuqori tezlik cheklovlarini o'z ichiga oladi.",
            href: "/dev",
            linkLabel: "Tariflarni ko'rish",
          },
        },
        networks: {
          kicker: "TARMOQLAR",
          title: "Universal tarmoqlarni qo'llab-quvvatlash",
          body: "Biznes barqarorligi uchun standart ravishda USDT (TRC-20)-ni qo'shing yoki pastroq EVM tranzaksiyalari uchun Base va Base-ni qo'shing.",
          items: [
            { name: "TRON USDT", body: "USD nominatsiyasidagi steyblkoin billingi uchun soha standarti." },
            { name: "Base / Base", body: "Past komissiyali Base ekotizimi to'lovlari uchun optimallashtirilgan L2 tarmoqlari." },
            { name: "GRAM / USDT on TON", body: "web3-native foydalanuvchilar bazasi uchun yuqori samarali variantlar." },
          ],
        },
        flow: {
          kicker: "INTEGRATSIYA OQIMI",
          title: "Avtomatlashtirilgan yangilanish davri",
          steps: [
            { title: "Invoys chiqarildi", body: "Sizning billing xizmatingiz idempotentlik kaliti bilan recv invoysini yaratadi." },
            { title: "Xaridor xabardor qilindi", body: "Mijoz sizning shaxsiy UI yoki bizning hosted chekautimiz orqali to'laydi." },
            { title: "Hodisa tasdiqlandi", body: "Sizning backend-ingiz HMAC imzosini tekshiradi va 'to'langan' hodisasini qayta ishlaydi." },
            { title: "Kirish uzaytirildi", body: "Obuna holati qo'lda aralashuvsiz ma'lumotlar bazangizda yangilanadi." },
          ],
        },
        related: {
          kicker: "TEGISHLI",
          title: "Billing dvigatelini integratsiya qiling.",
          links: [
            { kicker: "Mahsulot", label: "Unified API", body: "To'lovlarni avtomatlashtirish uchun RESTful ibtidoiylari.", href: "/products/api" },
            { kicker: "Docs", label: "Webhooks Guide", body: "Imzolangan to'lov callback-larini qanday boshqarish kerak.", href: "/docs/webhooks" },
            { kicker: "Plan", label: "Business Tier", body: "Jamoa kirish imkoni va yuqori so'rov limitlari.", href: "/business" },
          ],
        },
        cta: {
          title: "Ishonchli kripto billing bilan SaaS-ni kengaytiring.",
          body: "Kastodial shlyuzlarga 5% to'lashni to'xtating. Unumdorlik va xavfsizlik uchun ishlab chiqilgan fiksatsiyalangan tarifli infratuzilmaga o'ting.",
          primary: { label: "Hozir boshlash", href: "/app/auth" },
          secondary: { label: "API hujjatlarini o'qish", href: "/products/api" },
        },
        features: ["Idempotent API so'rovlari", "HMAC-SHA256 vebhuklari", "Obunalarni boshqarish", "Ko'p tarmoqli vaqtinchalik yondashuv"],
        seoLabel: "SaaS kripto billing infrastrukturasi tafsilotlari",
        seo: "recv SaaS platformalariga idempotent API chaqiruvlari, HMAC-imzolangan vebhuklar va 0% aylanma komissiyasi bilan TON, TRON va EVM tarmoqlarini universal qo'llab-quvvatlashga ega mustahkam kripto billing infratuzilmasini taqdim etadi.",
      },
      "digital-goods": {
        name: "Raqamli tovarlar",
        metadata: {
          title: "Raqamli mahsulotlar va litsenziyalar uchun kripto chekaut",
          description: "Avtomatlashtirilgan kripto chekaut bilan litsenziya kalitlari, fayllar va raqamli kirish huquqini soting. Vebhuklar orqali lahzali bajarish va 0% komissiya.",
        },
        kicker: "RAQAMLI TIJORAT",
        hero: {
          title: "Raqamli tovarlar uchun lahzali yetkazib berish",
          body: "Litsenziyalar, kalitlar va yuklamalarni yetkazib berishni avtomatlashtiring. recv blokcheyn tasdiqlanishi bilanoq bajarilish hodisalarini ishga tushiradi.",
        },
        snapshot: {
          kicker: "BAJARILISH",
          title: "license.delivery.ready",
          amount: "49.00 USDT",
          items: [
            { label: "Mahsulot", value: "Checkout" },
            { label: "Vebhuk", value: "Paid" },
            { label: "Xavf", value: "Qaytarib olish yo'q" },
          ],
        },
        problem: {
          kicker: "MUAMMO",
          title: "Qo'lda yetkazib berish katta miqyosda imkonsiz.",
          body: "Raqamli mahsulotlar tezda yetkazilishi kerak. Tranzaksiyalarni qo'lda tasdiqlashni kutish yomon UX-ga va qo'llab-quvvatlash xarajatlarining oshishiga olib keladi.",
        },
        solution: {
          kicker: "RECV OQIMI",
          title: "Chekautdan yetkazib berishgacha avtomatlashtirish",
          body: "Bizning yuqori konversiyali chekautimizni avtomatlashtirilgan yetkazib berish logikasi bilan birlashtiring. recv to'lov monitoringini amalga oshiradi; serveringiz esa yetkazib berishni boshqaradi.",
        },
        productPlan: {
          kicker: "MAHSULOT VA PLAN",
          title: "Checkout va API integratsiyasi",
          body: "To'lovlar uchun hosted UI va avtomatlashtirilgan litsenziya yetkazib berish uchun API-dan foydalanadigan gibrid yondashuv.",
          product: {
            label: "Mahsulot",
            title: "Checkout & API",
            body: "Yetkazib berishni avtomatlashtirish uchun backend hodisalari bilan birlashtirilgan tayyor to'lov interfeysi.",
            href: "/products/checkout",
            linkLabel: "Yechimlarni o'rganish",
          },
          plan: {
            label: "Plan",
            title: "Merchant / Developer",
            body: "Kam hajmlar uchun Merchant; vebhuk orqali to'liq yetkazib berishga muhtoj jamoalar uchun Developer rejalari.",
            href: "/dev",
            linkLabel: "Tariflarni ko'rish",
          },
        },
        networks: {
          kicker: "TARMOQLAR",
          title: "Global steyblkoin talabini qo'llab-quvvatlang",
          body: "Xaridorlaringiz allaqachon saqlaydigan aktivlarni qo'llab-quvvatlang. Dasturlar uchun TRON USDT standart bo'lsa, Telegram orqali tarqatish uchun TON va TON-dagi USDT juda mos keladi.",
          items: [
            { name: "TRON USDT", body: "Dasturiy ta'minot va o'yin xaridorlari afzal ko'radigan past komissiyali steyblkoin o'tkazmalari." },
            { name: "GRAM", body: "Telegram ekotizimida sotiladigan raqamli aktivlar uchun native tanlov." },
            { name: "USDT on TON", body: "Tezkor raqamli savdo uchun tezkor, tasdiqlashdan xabardor monitoring." },
          ],
        },
        flow: {
          kicker: "INTEGRATSIYA OQIMI",
          title: "To'lovdan yuklab olishgacha",
          steps: [
            { title: "Buyurtma yaratildi", body: "Sizning do'koningiz raqamli tovar uchun noyob recv chekaut havolasini yaratadi." },
            { title: "To'lov tasdiqlandi", body: "recv vatcherlari tranzaksiyani aniqlaydi va uni buyurtma bilan solishtiradi." },
            { title: "Vebhuk qabul qilindi", body: "Sizning yetkazib berish xizmati to'lovni tasdiqlovchi imzolangan hodisani qabul qiladi." },
            { title: "Kirish huquqi berildi", body: "Litsenziya kaliti yoki yuklab olish havolasi mijozga avtomatik ravishda yuboriladi." },
          ],
        },
        related: {
          kicker: "TEGISHLI",
          title: "Raqamli yetkazib berishni avtomatlashtiring.",
          links: [
            { kicker: "Mahsulot", label: "Checkout UI", body: "Tayyor to'lov ekranlari.", href: "/products/checkout" },
            { kicker: "Mahsulot", label: "Unified API", body: "Invoyslarni dasturiy ravishda yarating.", href: "/products/api" },
            { kicker: "Docs", label: "Webhooks", body: "To'lov hodisalarida yetkazib berishni ishga tushiring.", href: "/docs/webhooks" },
          ],
        },
        cta: {
          title: "Raqamli do'koningizni avtomatlashtirishga tayyormisiz?",
          body: "0% aylanma komissiyasi va lahzali on-chain yetkazib berish signallari uchun recv-ga o'ting.",
          primary: { label: "Hozir sotishni boshlash", href: "/app/auth" },
          secondary: { label: "API-ni o'rganish", href: "/products/api" },
        },
        features: ["Tezkor to'lovni aniqlash", "Avtomatlashtirilgan vebhuklar", "Past komissiyali tarmoqlar", "Qaytarib olish xavfi yo'q"],
        seoLabel: "Raqamli tovarlar kripto to'lovlarini avtomatlashtirish tafsilotlari",
        seo: "recv raqamli mahsulotlar uchun avtomatlashtirilgan kripto chekautini taqdim etadi, imzolangan vebhuklar, ko'p tarmoqli monitoring va 0% komissiyali to'g'ridan-to'g'ri hamyonga to'lovlar orqali lahzali yetkazib berishni qo'llab-quvvatlaydi.",
      },
      "paid-communities": {
        name: "Pullik hamjamiyatlar",
        metadata: {
          title: "Xususiy hamjamiyatlar va kanallar uchun kripto qabul qilish",
          description: "Avtomatlashtirilgan kripto to'lovlari bilan Telegram kanallari va yopiq guruhlar uchun a'zolik huquqini boshqaring. TON va TON-dagi USDT-ni qo'llab-quvvatlash.",
        },
        kicker: "A'ZOLIK IQTISODIYOTI",
        hero: {
          title: "Pullik hamjamiyatlar uchun avtomatlashtirilgan kirish",
          body: "On-chain to'lovlarni hamjamiyatga kirish bilan bog'lang. recv a'zoliklarni kuzatish va kirish hodisalarini avtomatik ravishda ishga tushirish infratuzilmasini taqdim etadi.",
        },
        snapshot: {
          kicker: "KIRISH HODISASI",
          title: "member.access.granted",
          amount: "29.00 USDT",
          items: [
            { label: "Tarmoq", value: "TON" },
            { label: "Kanal", value: "Yopiq" },
            { label: "Plan", value: "Merchant" },
          ],
        },
        problem: {
          kicker: "MUAMMO",
          title: "A'zolarni qo'lda boshqarish kengaymaydi.",
          body: "Foydalanuvchi nomlarini hamyon o'tkazmalari bilan solishtirish ko'p vaqt talab qiladi va firibgarlikka yo'l qo'yadi. Yangilanishlar va muddatlarni qo'lda boshqarish daromad yo'qotilishiga olib keladi.",
        },
        solution: {
          kicker: "RECV OQIMI",
          title: "To'lov holatlari kirish signallari sifatida",
          body: "A'zolik to'lovlarini darhol tekshirish uchun recv-dan foydalaning. Bizning hodisalarimiz real on-chain ma'lumotlar asosida a'zolarni taklif qilish yoki olib tashlash uchun botingizni yoki boshqaruv vositangizni ishga tushirishi mumkin.",
        },
        productPlan: {
          kicker: "MAHSULOT VA PLAN",
          title: "Checkout va Merchant boshqaruv paneli",
          body: "Professional to'lov havolasi va o'z hamjamiyati holatini kuzatish uchun markaziy boshqaruv paneliga muhtoj ijodkorlar uchun juda mos keladi.",
          product: {
            label: "Mahsulot",
            title: "Checkout UI",
            body: "A'zolik ruxsatnomalari va obunalar uchun mobil qurilmalar uchun optimallashtirilgan toza to'lov interfeysi.",
            href: "/products/checkout",
            linkLabel: "Checkout-ni o'rganish",
          },
          plan: {
            label: "Plan",
            title: "Merchant",
            body: "Qo'lda invoyslarni kuzatish, real vaqtdagi Telegram bildirishnomalari va ijodkorlar uchun 0% aylanma komissiyasini o'z ichiga oladi.",
            href: "/merchant",
            linkLabel: "Merchant-ni ko'rish",
          },
        },
        networks: {
          kicker: "TARMOQLAR",
          title: "Telegram hamjamiyatlari uchun GRAM-first",
          body: "GRAM on TON Telegram a'zolari uchun native tanlov bo'lsa, TRON USDT global obunachilar uchun barqaror zaxira hisoblanadi.",
          items: [
            { name: "GRAM", body: "Telegram-native hamjamiyatlari uchun eng kam to'siqli tajriba." },
            { name: "TRON USDT", body: "USD nominatsiyasidagi a'zolik uchun ishonchli steyblkoin varianti." },
            { name: "Base / Base", body: "web3-native guruhlar va markazlashtirilmagan tashkilotlar uchun juda mos keladi." },
          ],
        },
        flow: {
          kicker: "INTEGRATSIYA OQIMI",
          title: "To'lovdan hamjamiyatga kirishgacha",
          steps: [
            { title: "Ruxsatnoma tanlandi", body: "Foydalanuvchi a'zolik darajasini yoki yangilash muddatini tanlaydi." },
            { title: "Chekaut ochildi", body: "recv aniq tarmoq/aktiv ma'lumotlari bilan noyob to'lov so'rovini yaratadi." },
            { title: "To'lov tasdiqlandi", body: "Bizning vatcherlarimiz real vaqt rejimida blokcheyndagi o'tkazmani tasdiqlaydi." },
            { title: "Kirish ishga tushdi", body: "Sizning boshqaruv botingiz 'to'langan' hodisasi yuborilgandan so'ng foydalanuvchini taklif qiladi." },
          ],
        },
        related: {
          kicker: "TEGISHLI",
          title: "Hamjamiyat to'lovlarini ulang.",
          links: [
            { kicker: "Tarmoq", label: "GRAM on TON", body: "Telegram a'zoliklari uchun native to'lov zanjirlari.", href: "/networks/ton" },
            { kicker: "Use Case", label: "Telegram Shops", body: "Commerce flows for physical/digital goods.", href: "/use-cases/telegram-shops" },
            { kicker: "Plan", label: "Merchant Tier", body: "Dashboard for community operators.", href: "/merchant" },
          ],
        },
        cta: {
          title: "Bugun pullik hamjamiyatingizni professional darajaga olib chiqing.",
          body: "Avtomatlashtirilgan to'lov oqimiga o'ting va shaxsiy xabarlarda skrinshot so'rashni to'xtating. Direct-to-wallet, 0% fees.",
          primary: { label: "To'lovlarni qabul qilishni boshlash", href: "/app/auth" },
          secondary: { label: "Merchant-ni ko'rish", href: "/merchant" },
        },
        features: ["GRAM va Jetton Native", "Avtomatlashtirilgan kirish signallari", "A'zolikni yangilashni kuzatish", "Foizli komissiyalar yo'q"],
        seoLabel: "Pullik hamjamiyat kripto to'lovi tafsilotlari",
        seo: "recv pullik hamjamiyatlarga Telegram kanallari va yopiq guruhlar uchun kriptovalyuta qabul qilish imkonini beradi, TON qo'llab-quvvatlashi, vebhuklar orqali avtomatlashtirilgan kirish signallari va 0% aylanma komissiyasini o'z ichiga oladi.",
      },
    },
    compareHub: {
      title: "Kriptoni qayta ishlashning aqlli yo'li",
      description: "recv-ni qo'lda tekshirish va kastodial shlyuzlar bilan solishtiring: to'g'ridan-to'g'ri hamyonga hisob-kitoblar, nol aylanma komissiyalari, imzolangan vebhuklar va qo'llab-quvvatlanadigan to'lov tarmoqlari.",
      kicker: "TAQQOSLASH",
      items: [
        { title: "recv va Qo'lda tekshirish solishtiruvi", slug: "recv-vs-manual", body: "Avtomatlashtirish inson xatolarini qanday yo'q qilishini va operatsiyalarni kengaytirishini bilib oling." },
        { title: "recv va Kastodial shlyuzlar solishtiruvi", slug: "recv-vs-custodial", body: "Nega nokastodial infrastruktura biznesingiz uchun xavfsizroq va tejamkorroq ekanligi haqibe." },
        { title: "recv va NowPayments solishtiruvi", slug: "nowpayments", body: "Komissiyalar, nazorat va integratsiya moslashuvchanligining to'g'ridan-to'g'ri solishtiruvi." },
        { title: "recv va Coinbase Commerce solishtiruvi", slug: "coinbase-commerce", body: "Nokastodial to'g'ridan-to'g'ri to'lovlar va Coinbase-ning hosted balans modeli solishtiruvi." },
        { title: "recv va BitPay solishtiruvi", slug: "bitpay", body: "Fiksatsiyalangan obunalar va BitPay-ning foizli to'lov tuzilmasi solishtiruvi." },
        { title: "recv va CoinGate solishtiruvi", slug: "coingate", body: "Dasturchilar uchun mo'ljallangan protokol va CoinGate-ning sotuvchiga yo'naltirilgan platformasi solishtiruvi." },
        { title: "recv va Cryptomus solishtiruvi", slug: "cryptomus", body: "Atomar on-chain to'lovlar va Cryptomus-ning ichki hamyon boshqaruvi solishtiruvi." },
      ]
    },
    comparePages: {
      "recv-vs-manual": {
        name: "Qo'lda to'lovlar",
        title: "recv va Qo'lda to'lovlar solishtiruvi: Nega avtomatlashtirish kerak?",
        description: "Avtomatlashtirilgan nokastodial qayta ishlashni qo'lda hamyon kuzatish bilan solishtirish. recv inson xatolarini qanday yo'q qilishini va kripto operatsiyalaringizni qanday kengaytirishini bilib oling.",
        kicker: "AUTOMATION",
        points: [
          {
            title: "Kengaytiriluvchanlik",
            competitor: "Kengaytirish imkonsiz. Every transaction requires manual verification and manual accounting.",
            recv: "Avtomatlashtirilgan invoys kuzatish va vebhuklar har bir to'lov uchun qo'lda bajariladigan ishlarni kamaytiradi."
          },
          {
            title: "Aniqlik",
            competitor: "Inson xatolarining yuqori xavfi. Hamyon manzillaridagi xatolar, o'tkazib yuborilgan to'lovlar yoki noto'g'ri tarmoq o'tkazmalari.",
            recv: "Avtomatlashtirilgan moslashtirish qo'lda kiritish xatolarini kamaytiradi, istisno holatlar esa baribir ko'rib chiqilishi mumkin bo'lib qoladi."
          },
          {
            title: "Mijoz UX",
            competitor: "Sekin va asabiy. Mijozlar qo'lda tasdiqlash va mahsulot yetkazib berishni soatlab kutishadi.",
            recv: "Tasdiqlangan invoys holati sotuvchi siyosatiga muvofiq avtomatlashtirilgan yetkazib berishni ishga tushirishi mumkin."
          }
        ]
      },
      "recv-vs-custodial": {
        name: "Kastodial shlyuzlar",
        title: "recv va Kastodial shlyuzlar solishtiruvi: Nokastodial afzallik",
        description: "recv-ning to'g'ridan-to'g'ri hamyon infratuzilmasini va fiksatsiyalangan tarifli narxlarini kastodial to'lov protsessorlari bilan solishtiring.",
        kicker: "SOVEREIGNTY",
        points: [
          {
            title: "Mablag'larni nazorat qilish",
            competitor: "Uchinchi tomon vasiyligi. Akkauntlarning muzlatilishi, pul yechishdagi kechikishlar va platforma bankrotligi xavfi.",
            recv: "100% Nokastodial. Mablag'lar to'g'ridan-to'g'ri hamyoningizga tushadi. Biz pulingizga hech qachon tegmaymiz va saqlamaymiz."
          },
          {
            title: "Komissiya tuzilishi",
            competitor: "Narxlar foizga asoslangan, hisob-kitob yoki konversiya to'lovlarini o'z ichiga olishi mumkin; joriy shartlar provayder bilan tekshirilishi kerak.",
            recv: "Fiksatsiyalangan obuna. Aylanma komissiyasi 0%. Sizning hajmingizdan qat'i nazar, prognoz qilinadigan xarajatlar."
          },
          {
            title: "Muvofiqlik va Maxfiylik",
            competitor: "Qattiq KYC/KYB talablari va ma'lumotlarni almashish. Uchinchi tomon siyosati o'zgarishlariga bog'liqlik.",
            recv: "Avvalo maxfiylik infratuzilmasi. Foydalanuvchilaringiz bilan munosabatlarni o'zingiz saqlab qolasiz."
          }
        ]
      },
      "nowpayments": {
        name: "NowPayments",
        title: "recv va NowPayments solishtiruvi: Nazorat va Qulaylik",
        description: "Ikkita ma'lumotli kripto to'lov yechimining batafsil solishtiruvi. Choose the one that fits your scaling needs.",
        kicker: "TAQQOSLASH",
        points: [
          {
            title: "To'lov modeli",
            competitor: "Ichki balans tizimi. Siz pulni qo'lda yechib olishingiz yoki avtomatlashtirilgan to'lov davrlarini kutishingiz kerak.",
            recv: "Atomar to'lovlar. Har bir tranzaksiya blokcheynda tasdiqlanishi bilanoq hamyoningizga kelib tushadi."
          },
          {
            title: "Komissiya",
            competitor: "Narxlar va tarmoq xarajatlari provayderning joriy e'lon qilingan shartlariga muvofiq belgilanadi.",
            recv: "0% komissiya. Faqat fiksatsiyalangan obunangizni va standart tarmoq gaz komissiyalarini to'lang."
          },
          {
            title: "Integratsiya",
            competitor: "Xususiy API va standart plaginlar. Umumiy elektron tijorat platformalariga e'tibor qaratilgan.",
            recv: "Avvalo dasturchi protokoli. Yuqori unumdorlikka ega SaaS, Telegram Mini ilovalari va shaxsiy loyihalar uchun optimallashtirilgan."
          }
        ]
      },
      "coinbase-commerce": {
        name: "Coinbase Commerce",
        title: "recv va Coinbase Commerce solishtiruvi: Nokastodial va Hosted balans",
        description: "recv-ning to'g'ridan-to'g'ri hamyon oqimini Coinbase Commerce bilan provayderlarning joriy vasiylik, hisob-kitob, tarmoq va narxlash hujjatlari yordamida solishtiring.",
        kicker: "VASIYLIK",
        points: [
          {
            title: "Mablag'lar vasiyligi",
            competitor: "Vasiylik va hisob-kitob xatti-harakati joriy Coinbase Commerce mahsulot sozlamalari va shartlariga muvofiq amalga oshiriladi.",
            recv: "Sof nokastodial. Har bir tasdiqlangan to'lov to'g'ridan-to'g'ri hamyoningiz manziliga tushadi. recv hech qachon mablag'laringizga tegmaydi."
          },
          {
            title: "Komissiya modeli",
            competitor: "Tranzaksiya narxlari Coinbase Commerce-ning joriy e'lon qilingan shartlariga muvofiq belgilanadi.",
            recv: "0% aylanma komissiyasi. Faqat oylik fiksatsiyalangan obuna. To'lov hajmidan qat'i nazar, yalpi marjangiz o'zgarishsiz qoladi."
          },
          {
            title: "Tarmoq moslashuvchanligi",
            competitor: "Mavjud tarmoqlar va aktivlar joriy Coinbase Commerce hujjatlariga muvofiq amalga oshiriladi.",
            recv: "recv qo'llab-quvvatlanadigan tarmoq va aktiv kombinatsiyalarini hujjatlashtiradi va Telegram Mini ilovalari uchun mos chekautni taqdim etadi."
          }
        ]
      },
      "bitpay": {
        name: "BitPay",
        title: "recv va BitPay solishtiruvi: Fiksatsiyalangan obuna va foizli komissiyalar",
        description: "recv-ning obuna narxlarini va to'g'ridan-to'g'ri hisob-kitoblarini BitPay bilan joriy rasmiy narxlash va hisob-kitob hujjatlari yordamida solishtiring.",
        kicker: "KOMISSIYALAR",
        points: [
          {
            title: "Xarajatlar tuzilishi",
            competitor: "Tranzaksiya va hisob-kitob narxlari BitPay-ning joriy e'lon qilingan shartlariga muvofiq belgilanadi.",
            recv: "Fiksatsiyalangan oylik obuna. Foizli komissiyalar nolga teng. Xarajatlar tranzaksiya hajmidan to'liq mustaqil."
          },
          {
            title: "Hisob-kitob tezligi",
            competitor: "Hisob-kitob usullari va vaqti sotuvchining BitPay sozlamalari va joriy shartlariga muvofiq amalga oshiriladi.",
            recv: "Atomar on-chain hisob-kitob. Mablag'lar hamyoningizga mijoz to'lovi dengan bir xil blokda kelib tushadi."
          },
          {
            title: "Dasturchi tajribasi",
            competitor: "Qattiq muvofiqlik talablari, KYB jarayonlari va cheklangan API kirish darajalariga ega korporativ yo'naltirilgan API.",
            recv: "API kirish imkoni, imzolangan vebhuklar va dasturiy invoys boshqaruvi; sotuvchilar amaldagi muvofiqlik talablari uchun o'zlari javobgar bo'lib qoladilar."
          }
        ]
      },
      "coingate": {
        name: "CoinGate",
        title: "recv va CoinGate solishtiruvi: To'g'ridan-to'g'ri to'lovlar va birinchi navbatda konversiya modeli",
        description: "CoinGate hisob-kitobdan oldin kriptovalyutani fiatga aylantiradi. recv mijozingiz to'lagan kripto aktivni to'g'ridan-to'g'ri hamyoningizga nol konversiya yo'qotishi bilan yetkazib beradi.",
        kicker: "HISOB-KITOB",
        points: [
          {
            title: "Hisob-kitob aktivi",
            competitor: "CoinGate sukut bo'yicha fiat konversiyasini amalga oshiradi, bu esa mablag'larni olishdan oldin valyuta xavfi va qo'shimcha ishlov berish bosqichlarini keltirib chiqaradi.",
            recv: "Native kripto hisob-kitob. Siz to'langan aktivni aynan qabul qilasiz — USDT USDTligicha, GRAM GRAMligicha hamyoningizda qoladi."
          },
          {
            title: "Komissiya",
            competitor: "1% tranzaksiya komissiyasi va konversiya spredi. Konversiya kurslari qo'shilganda haqiqiy xarajat 2% dan oshishi mumkin.",
            recv: "Tranzaksiyalar uchun 0% komissiya. Qancha ishlashingizdan qat'i nazar, faqat oylik fiksatsiyalangan obuna."
          },
          {
            title: "Moslashtirish",
            competitor: "Standart hosted chekaut sahifalari. To'lov interfeysi, brending va mijozlar oqimi ustidan cheklangan nazorat.",
            recv: "To'liq API kirish, brendingizga ega hosted chekaut yoki vebhuk orqali boshqariladigan oqimlar — har bir qadamda tanlov o'zingizda."
          }
        ]
      },
      "cryptomus": {
        name: "Cryptomus",
        title: "recv va Cryptomus solishtiruvi: On-Chain to'lovlar va ichki hamyon",
        description: "Cryptomus to'lovdan oldin to'lovlarni ichki balans orqali yo'naltiradi. recv dizayn bo'yicha nokastodialdir — hamyoningiz to'g'ridan-to'g'ri on-chain mablag'larni qabul qiladi, ichki balans ishlatilmaydi.",
        kicker: "ARXITEKTURA",
        points: [
          {
            title: "To'lov arxitekturasi",
            competitor: "Cryptomus ichki hamyonni saqlaydi. Siz pul yechib olishni so'rashingiz kerak, bu esa kechikish va uchinchi tomonga bog'liqlikni keltirib chiqaradi.",
            recv: "Ichki hamyon yo'q. Har bir tasdiqlangan to'lov to'g'ridan-to'g'ri manzilingizga on-chain tasdiqlanadi. recv pul oqimida ko'rinmaydi."
          },
          {
            title: "Komissiya shaffofligi",
            competitor: "Tarifga qarab 0.4–1% tranzaksiya komissiyalari. Komissiyalar yuqori hajmda to'planadi va mablag'lar sizga yetib borguncha ushlab qolinadi.",
            recv: "Tranzaksiya komissiyalari nolga teng. Fiksatsiyalangan obuna. Mijoz yuborgan narsani faqat tarmoq gaz komissiyasini chegirib ko'rasiz."
          },
          {
            title: "Telegram integratsiyasi",
            competitor: "Basic Telegram bot integrations. Not designed for Telegram Mini App payment flows or high-frequency bot-driven commerce.",
            recv: "Telegram uchun qurilgan. GRAM va TON tarmog'idagi USDT-ni qo'llab-quvvatlash, Mini ilovalar bilan mos keladigan chekaut va Telegram bildirishnomalari qutidan chiqishi bilanoq mavjud."
          }
        ]
      }
    },
    statusHub: {
      title: "Tizim holati",
      description: "recv infratuzilmasi va tarmoq ulanishini real vaqtda monitoring qilish.",
      kicker: "HOLAT",
      allSystemsOperational: "Barcha tizimlar normal ishlamoqda",
      operational: "Ishlamoqda",
      services: "Asosiy xizmatlar",
      networks: "Tarmoq ulanishi",
      coreApi: "Asosiy API",
      watchers: "Blokcheyn vatcherlari",
      checkout: "Chekaut interfeysi",
    },
  },
  plan: {
    back: "Bosh sahifaga qaytish",
    auth: "Konsol",
    discuss: "Shartlarni muhokama qilish",
    compareTitle: "Protokol",
    flowTitle: "Integratsiya",
    priceTitle: "Kirish",
    priceSubtitle: "Cheksiz hajm. Fiksatsiyalangan oylik to'lov.",
    codeTitle: "Integratsiya",
    codeSubtitle: "Bir necha daqiqada ishlab chiqarishga tayyor.",
    codeBody: "Bizning protokolimizni mavjud ish jarayoningizga uzluksiz integratsiya qiling.",
    processingNote: "Nokastodial arxitektura. Barcha tranzaksiyalar to'g'ridan-to'g'ri hamyonlaringizga tushadi.",
    compareSectionTitle: "To'g'ridan-to'g'ri kirish arxitekturasi",
    compareSectionBody: "recv shaffof vositachilik dasturi sifatida ishlaydi. Tranzaksiyalar vositachi hisoblarni aylanib o'tib, mijozdan sotuvchiga to'g'ridan-to'g'ri o'tadi.",
    merchant: {
      badge: "recv Merchant",
      title: "Kripto qabul qiling. 0% aylanma komissiyasi.",
      body: "Qo'lda va yarim avtomatlashtirilgan to'lovlarni qabul qilish uchun professional boshqaruv paneli. Hamyonlaringizga to'g'ridan-to'g'ri to'lovlar va to'liq nazorat.",
      priceLabel: "$9",
      period: "oyiga",
      stats: [
        { value: "0%", label: "Komissiya" },
        { value: "100%", label: "Nokastodial" },
        { value: "Jonli", label: "Dashboard" },
        { value: "Oddiy", label: "Analitika" },
      ],
      features: [
        { title: "Cheksiz invoyslar", body: "Qo'shimcha komissiyalarsiz har qanday summa uchun cheksiz to'lov havolalarini yarating." },
        { title: "Qo'lda boshqarish", body: "Kam to'lovlar yoki mijozlar xatosi bo'lganda to'lovlarni qo'lda tasdiqlang." },
        { title: "To'g'ridan-to'g'ri hamyonga", body: "Mablag'lar mijozdan to'g'ridan-to'g'ri manzilingizga o'tadi. Biz pulingizga hech qachon tegmaymiz." },
        { title: "Tezkor bildirishnomalar", body: "Har bir tranzaksiya uchun real vaqtde Telegram orqali xabar oling." },
      ],
      flow: [
        { title: "Profilni sozlash", body: "Tezkor Telegram ro'yxatdan o'tishi va TON, TRON yoki EVM to'lov tafsilotlarini qo'shish." },
        { title: "Invoys yaratish", body: "Bizning tushunarli boshqaruv panelimiz orqali bir necha marta bosishda to'lov havolalarini yarating." },
        { title: "Real vaqtda kuzatish", body: "Jonli blokcheyn monitoringi. Biz tranzaksiyalarni avtomatik ravishda tasdiqlaymiz." },
      ],
      code: `// Qo'lda invoys havolasi
// https://recv.money/app/checkout/demo
// Merchant tarifi uchun kod talab qilinmaydi.
// Shunchaki havolani ulashing va to'lovni qabul qiling.`
    },
    developer: {
      badge: "recv Developer",
      title: "Kripto to'lovlari infrastrukturasi. Nazorat sizning qo'lingizda.",
      body: "To'liq biznes avtomatizatsiyasi uchun professional API va vebhuklar. To'g'ridan-to'g'ri to'lovlar va nol aylanma komissiyasi.",
      priceLabel: "$29",
      period: "oyiga",
      stats: [
        { value: "50k", label: "So'rovlar/oy" },
        { value: "3", label: "A'zolar" },
        { value: "3", label: "Ish joylari" },
        { value: "Standart", label: "Yordam" },
      ],
      features: [
        { title: "Vebhuk yetkazib berish", body: "Avtomatlashtirilgan takrorlashlar va HMAC imzolarga ega navbatli yetkazib berish." },
        { title: "Real vaqtda monitoring", body: "Tranzaksiyalarni kuzatish qo'llab-quvvatlanadigan tarmoqlar tasdiqlanishi bilan invoys holatini yangilaydi." },
        { title: "Yagona API v1", body: "GRAM, TON tarmog'idagi USDT, TRON, Base va BSC uchun yagona interfeys." },
        { title: "Idempotentlik", body: "API darajaside dublikat tranzaksiyalardan o'rnatilgan himoya." },
      ],
      flow: [
        { title: "API kalitlarini olish", body: "Jonli live_ kalitlarini yarating. Xavfsiz backend integratsiyasi uchun ruxsatlarni boshqaring." },
        { title: "Vebhukni sozlash", body: "Tezkor bildirishnomalar uchun HMAC-SHA256 imzoli callback-larni sozlang." },
        { title: "Avtomatlashtirilgan ishlov berish", body: "Bizning vatcherlarimiz tranzaksiyalarni 24/7 kuzatib, to'lovlarni avtonom tasdiqlaydi." },
      ],
      code: `// recv API orqali invoys yaratish
const res = await fetch("https://api.recv.money/v1/invoices", {
  method: "POST",
  headers: { "X-API-Key": "live_..." },
  body: JSON.stringify({
    title: "Order #99",
    base_amount_usd: "29.00",
    payable_network: "TON"
  })
});
const inv = await res.json();`
    },
    business: {
      badge: "recv Business",
      title: "Kengaytiriladigan qayta ishlash. O'sayotgan jamoalar uchun.",
      body: "Kattaroq to'lov hajmiga ega bizneslar uchun kengaytirilgan API limitlari, jamoa kirishi va ustuvor yordam.",
      priceLabel: "$79",
      period: "oyiga",
      stats: [
        { value: "200k", label: "So'rovlar/oy" },
        { value: "10", label: "A'zolar" },
        { value: "10", label: "Ish joylari" },
        { value: "Ustuvor", label: "Yordam" },
      ],
      features: [
        { title: "Kengaytirilgan analitika", body: "Ishchi joylar bo'ylab to'lovlar, konversiya va mijozlarni saqlab qolish bo'yicha batafsil ma'lumotlar." },
        { title: "Jamoaviy hamkorlik", body: "Ruxsatlarni aniq boshqarish bilan jamoangizga 10 tagacha a'zolarni qo'shing." },
        { title: "Ko'p ish joylari", body: "Bitta obuna ostida 10 tagacha mustaqil loyihalarni boshqaring." },
        { title: "Kengaytirilgan limitlar", body: "Yuqori API kvotalari va faol vebhuk limitlarining oshirilishi." },
      ],
      flow: [
        { title: "Jamoani ro'yxatdan o'tkazish", body: "Jamoa a'zolarini taklif qiling va loyihalaringizni boshqarish uchun rollarni tayinlang." },
        { title: "Ish joylarini ajratish", body: "Turli biznes yo'nalishlari uchun mustaqil muhitlarni sozlang." },
        { title: "Ustuvorlik bilan kengayish", body: "Maxsus monitoring navbatlari va 24/7 ustuvor yordam bilan ishlang." },
      ],
      code: `// Multi-Workspace Management
// Manage up to 10 workspaces
// Isolated API keys and team seats
// Advanced Analytics enabled`
    },
  },
  legal: {
    privacy: {
      kicker: "MAXFIYLIK SIYOSATI",
      title: "MAXFIYLIK SIYOSATI",
      summary:
        "USHBU HUJJATNI DIQQAT BILAN O'QING. RECV DASTURIY TA'MINOTI, BOSHQARUV PANELI, API YOKI OMMAVIY CHEKAUT SAHIFALARIGA KIRISH ORQALI SIZ USHBU HUJJATDA TAVSIFLANGAN MA'LUMOTLARNI QAYTA ISHLASHGA O'ZINGIZNING ROZILIGINGIZNI BILDIRASIZ. AGAR ROZI BO'LMASANGIZ, XIZMATDAN FOYDALANISHNI DARHOL TO'XTATISHINGIZ KERAK.",
      updatedLabel: "Oxirgi yangilanish",
      operatorLabel: "Kuchga kirish sanasi",
      metaItems: ["Oxirgi yangilanish: 14-iyun, 2026-yil", "Kuchga kirish sanasi: 14-iyun, 2026-yil"],
      draftTitle: "Xizmat ko'rsatuvchi va ma'lumotlar nazoratchisi",
      draftBody:
        "Xizmat recv.money veb-sayti operatorlari (“recv”, “Kompaniya”, “biz”) tomonidan boshqariladi. Bildirishnomalar va so'rovlar quyidagi aloqa kanallariga yuborilishi mumkin:",
      draftItems: [
        "Yuridik bildirishnomalar: legal@recv.money",
        "Maxfiylik bo'yicha so'rovlar: privacy@recv.money",
        "Qo'llab-quvvatlash: support@recv.money",
      ],
      sections: [
        {
          title: "1. MUQADDIMA VA QAMROV",
          paragraphs: [
            'Ushbu Maxfiylik siyosati ("Siyosat") siz ("Sotuvchi", "Foydalanuvchi") yoki sizning oxirgi foydalanuvchilaringiz ("Mijozlar") bizning dasturiy ta\'minot xizmatimiz, Telegram botlarimiz, API nuqtalarimiz va ommaviy chekaut interfeyslarimiz (birgalikda "Xizmat") bilan o\'zaro aloqada bo\'lganda recv ("Kompaniya", "biz", "bizning") ma\'lumotlarni qanday to\'plashi, qayta ishlashi, ishlatishi va himoya qilishini belgilaydi.',
            "Ushbu Siyosat global ma'lumotlarni himoya qilish tamoyillariga muvofiq ishlab chiqilgan bo'lib, kriptografik blokcheyn texnologiyasining ommaviy, o'zgarmas va markazlashtirilmagan tabiatini aniq tan oladi.",
          ],
        },
        {
          title: "2. BLOKCHEYN MA'LUMOTLARINING ASOSIY HAQIQATI (MUHIM BILDIRISHNOMA)",
          paragraphs: [
            "2.1. Ommaviy reyestrlar: Siz va mijozlaringiz blokcheyn tarmoqlari (jumladan, TON, TRON, Solana, Base, Arbitrum va BSC) markazlashtirilmagan, ommaviy reyestrlar ekanligini aniq tan olasiz.",
            "2.2. Maxfiylik kutilmasining yo'qligi: Hamyon manzillari, tranzaksiya xeshlari (TXID), vaqt belgilari, o'tkazma summalari va zanjirdagi memo/sharhlar doimiy ravishda qayd etiladi va butun dunyo bo'ylab har kim kirishi mumkin. Kompaniya ushbu tarmoqlarni nazorat qilmaydi va zanjirdagi ma'lumotlarni o'chira olmaydi, yashira olmaydi yoki o'zgartira olmaydi.",
            "2.3. Ma'lumotlarni o'chirish: Ommaviy blokcheynda qayd etilgan ma'lumotlarni recv tomonidan o'zgartirish yoki o'chirish mumkin emas. Ushbu cheklov faqat blokcheyn yozuvining o'ziga tegishli. recv tomonidan nazorat qilinadigan tizimlarda saqlanadigan shaxsiy ma'lumotlarga kirish, ularni tuzatish, cheklash yoki o'chirish bo'yicha so'rovlar qonuniy istisnolar, jumladan, xavfsizlik, firibgarlikning preventiv choralari, buxgalteriya hisobi, nizolar va qonuniy saqlash talablariga muvofiq amal qiladi.",
          ],
        },
        {
          title: "3. BIZ TO'PLAYDIGAN MA'LUMOTLAR TOIFALARI",
          paragraphs: [
            '"Direct-to-Wallet" yo\'naltirish va bildirishnoma arxitekturasini ta\'minlash uchun biz ma\'lumotlarni to\'plashni qat\'iy ravishda quyidagi toifalar bilan cheklaymiz:',
            "3.1. Sotuvchi akkaunti ma'lumotlari: Sotuvchi Telegram Mini ilovasi yoki Boti orqali tizimga kirganda, biz avtomatik ravishda Telegram foydalanuvchi identifikatori, Telegram foydalanuvchi nomi va elektron pochta manzilini (agar ixtiyoriy ravishda taqdim etilsa yoki ma'lum billing tariflari uchun talab qilinsa) to'playmiz va saqlaymiz.",
            "3.2. Operatsion infratuzilma ma'lumotlari: Xizmat ko'rsatishni osonlashtirish uchun Sotuvchi ommaviy blokcheyn to'lov hamyon manzillarini, afzal ko'rilgan standart tarmoqlarni, vebhuk URL nuqtalarini va tegishli kriptografik sirlarni sozlashi kerak.",
            "3.3. Mijoz va tranzaksiyaga oid metadata: Mijoz ommaviy ravishda yaratilgan chekaut URL-ga kirganda, biz hisob-faktura metadatalarini (Nom, Asosiy miqdor, Amal qilish muddati), vaqtinchalik HTTP so'rov ma'lumotlarini (IP manzillar, User-Agent satrlari) va vatcherlarimiz orqali blokcheyndan olingan hodisalarni (TX Hash, Miqdor, Qabul qiluvchi, Kuzatilgan vaqt) qayta ishlaymiz.",
            "ESLATMA: Biz mijozlar ismlarini, mijozlar elektron pochta manzillarini, mijozlarning jismoniy manzillarini yoki har qanday an'anaviy KYC/AML hujjatlarini to'plamaymiz.",
          ],
        },
        {
          title: "4. HISOB-FAKTURA METADATALARI UCHUN QAT'IY JAVOBGARLIK",
          paragraphs: [
            '4.1. Sotuvchi tomonidan ma\'lumotlarni kiritish: Xizmat Sotuvchilarga hisob-fakturalarga shaxsiy "Nomlar" berishga ruxsat beradi. Sotuvchi hisob-faktura nomiga, to\'lov sharhiga yoki vebhuk ma\'lumotlariga o\'z mijozlarining Shaxsiy ma\'lumotlarini (PII) kiritmaslikka rozi bo\'ladi.',
            "4.2. Ommaviy chekautning ochiqligi: Sotuvchi chekaut URL-manzili havolaga ega bo'lgan har qanday shaxs uchun ochiq ekanligini tan oladi. Ushbu sahifada ommaviy invoys ID, invoys nomi, to'lanishi kerak bo'lgan summa va qabul qiluvchi manzil ko'rinadi. Kompaniya Sotuvchi tomonidan invoys metadatalarini anonimlashtirmaslik natijasida oshkor bo'lgan shaxsiy ma'lumotlar uchun javobgar emas.",
          ],
        },
        {
          title: "5. COOKIE-LAR, LOKAL SAQLASH VA ANALITIKA",
          paragraphs: [
            "Biz autentifikatsiya, xavfsizlik, til va interfeys sozlamalarini saqlab qolish uchun qat'iy zarur bo'lgan xotiradan foydalanamiz. Bunga localStorage-da saqlanadigan kirish tokenlari va Xavfsiz, HttpOnly cookie-larida saqlanadigan yangilanish tokenlari kiradi.",
            "Biz shuningdek, “recv_attr” deb nomlangan birinchi tomon atribut cookie-dan foydalanamiz. Unda atribut identifikatori, kampaniya parametrlari, referal kod, kirish sahifasi va yo'naltiruvchi veb-sayt bo'lishi mumkin. Uning maksimal muddati 90 kun.",
            "Faollashtirilganda, Google Tag Manager va Yandex Metrica o'zlarining maxfiylik shartlariga muvofiq qurilma, brauzer, sahifani ko'rish, o'zaro aloqa, tarmoq va taxminiy joylashuv ma'lumotlarini olishi mumkin. Ushbu texnologiyalar foydalanuvchi rozilik bergunga qadar rozilik talab qilinadigan foydalanuvchilar uchun faollashtirilmaydi.",
            "Biz veb-sayt ish faoliyatining umumiy o'lchovlarini, jumladan sahifa yo'li, til, navigatsiya turi, LCP, INP va CLS qiymatlarini to'playmiz.",
            "Foydalanuvchilar har qanday vaqtda bizning Cookie sozlamalarimiz orqali ixtiyoriy analitika roziligini qaytarib olishlari mumkin. Rozilikni qaytarib olish qat'iy zarur bo'lgan xotiraga ta'sir qilmaydi.",
          ],
        },
        {
          title: "6. QAYTA ISHLASHNING ROLLI VA QONUNIY ASOSLARI",
          paragraphs: [
            "Biz Sotuvchi bilan shartnomamizni bajarish uchun akkaunt, autentifikatsiya, ish maydoni, hisob-faktura, hamyon, API, vebhuk va obuna ma'lumotlarini qayta ishlaymiz.",
            "Biz Xizmatni himoya qilish, saqlash va yaxshilash bo'yicha qonuniy manfaatlarimiz asosida xavfsizlik jurnallarini, seans ma'lumotlarini, IP manzillarini, user-agent ma'lumotlarini, audit hodisalarini, firibgarlik ko'rsatkichlarini va xizmat diagnostikasini qayta ishlaymiz.",
            "Biz shartnomani bajarish va amaldagi buxgalteriya, soliq, sanksiyalar va huquqiy majburiyatlarga rioya qilish uchun billing va tranzaksiya yozuvlarini qayta ishlaymiz.",
            "Biz qonun hujjatlarida rozilik talab qilinadigan hollarda rozilik asosida va boshqa hollarda amaldagi qonunchilikda ruxsat etilgan litsenziya doirasida ixtiyoriy analitika va reklama atributlari ma'lumotlarini qayta ishlaymiz.",
            "Sotuvchi tomonidan o'z mijozlariga tegishli taqdim etilgan hisob-faktura va chekaut ma'lumotlari uchun Sotuvchi odatda qayta ishlash maqsadini belgilaydi va Nazoratchi sifatida ishlaydi. recv ushbu ma'lumotlarni Sotuvchining ko'rsatmalari asosida qayta ishlash darajasida Protsessor sifatida ishlaydi. recv xavfsizlik, suiiste'mollikning oldini olish, xizmat ko'rsatish billingi va muvofiqlik yozuvlari uchun mustaqil Nazoratchi sifatida ishlaydi.",
          ],
        },
        {
          title: "7. MA'LUMOTLARNI SAQLASH MUDDATI",
          paragraphs: [
            "Biz shaxsiy ma'lumotlarni quyidagi saqlash jadvaliga muvofiq saqlaymiz:",
            "• Akkaunt va ish maydoni ma'lumotlari: hisob faol bo'lgan vaqtda va yopilgandan keyin 24 oygacha.",
            "• Autentifikatsiya kodlari: foydalanilgunga qadar yoki muddati tugagunga qadar, keyin esa 30 kun ichida o'chiriladi.",
            "• Faol yangilanish seanslari: muddati tugaguncha yoki bekor qilinguncha; seans xavfsizligi yozuvlari 12 oygacha saqlanishi mumkin.",
            "• Hisob-faktura, obuna va blokcheyn solishtirish yozuvlari: buxgalteriya hisobi, soliq, nizolar yoki firibgarlikning oldini olish maqsadlari uchun zarur bo'lgan hollarda 7 yilgacha.",
            "• Vebhuk yetkazib berish va API so'rov jurnallari: 12 oygacha.",
            "• Mahsulot analitikasi, UTM atributlari va Web Vitals: 24 oygacha.",
            "• Zaxira nusxalari: zaxira nusxalarini aylantirish jadvaliga muvofiq qayta yozilgunga qadar, odatda 30 kun ichida.",
            "Biz huquqiy da'volarni aniqlash, amalga oshirish yoki himoya qilish yoki qonun hujjatlariga rioya qilish uchun zarur bo'lgan hollarda ma'lum yozuvlarni uzoqroq saqlashimiz mumkin.",
          ],
        },
        {
          title: "8. XAVFSIZLIK",
          paragraphs: [
            "API kalit qiymatlari dastlabki chiqarilgandan keyin bir tomonlama xeshlar yordamida saqlanadi. Kirish va yangilanish tokenlari kriptografik tarzda imzolanadi yoki token xeshlari sifatida saqlanadi. Vebhuklarni imzolash sirlari yetkazib berishni imzolash uchun Xizmat uchun ochiq bo'lishi kerak va shuning uchun kirish nazorati bilan himoyalangan maxfiy ma'lumotlar sifatida saqlanadi. Hech qanday saqlash yoki uzatish usuli to'liq xavfsiz emas.",
          ],
        },
        {
          title: "9. PRIVACY HUQUQLARINGIZ",
          paragraphs: [
            "Amaldagi qonunchilikka qarab, siz recv tomonidan qayta ishlanadigan shaxsiy ma'lumotlarga kirish, ularni tuzatish, o'chirish, cheklash, e'tiroz bildirish yoki ko'chirishni so'rashingiz mumkin. Shuningdek, qayta ishlash rozilikka asoslangan hollarda rozilikni qaytarib olishingiz va vakolatli nazorat organiga shikoyat qilishingiz mumkin.",
            "So'rovlarni privacy@recv.money manziliga yuboring. Biz so'rovni bajarishdan oldin shaxsingizni va vakolatingizni tekshirishimiz mumkin. Biz amaldagi qonunchilikda belgilangan muddat ichida javob beramiz.",
            "KLAIFORNIYA REZIDENTLARI UCHUN (CCPA/CPRA): O'tgan 12 oy ichida biz ushbu Siyosatning 3-bo'limida ko'rsatilgan toifadagi shaxsiy ma'lumotlarni to'pladik. Biz shaxsiy ma'lumotlarni sotmaymiz va ulashmaymiz (tizimlararo xulq-atvor reklamasi uchun). Kaliforniya rezidentlari o'z huquqlarini bilish, o'chirish, to'g'rilash, sotish/ulashishni rad etish, nozik shaxsiy ma'lumotlardan foydalanishni cheklash va ushbu huquqlarni amalga oshirgani uchun kamsitilmaslik huquqiga ega. So'rov yuborish uchun privacy@recv.money bilan bog'laning.",
          ],
        },
        {
          title: "10. USHBU SIYOSATGA O'ZGARTIRISHLAR",
          paragraphs: [
            "Biz istalgan vaqtda ushbu Maxfiylik siyosatini bir tomonlama yangilash huquqini saqlab qolamiz. Yangilangan Siyosat e'lon qilingandan keyin Xizmatdan foydalanishni davom ettirishingiz o'zgarishlarni qabul qilganingizni anglatadi.",
          ],
        },
      ],
      footerNote: "Ushbu Maxfiylik siyosati global standartlarga muvofiqlikni ta'minlash uchun ishlab chiqilgan.",
    },
    terms: {
      kicker: "XIZMAT KO'RSATISH SHARTLARI",
      title: "XIZMAT KO'RSATISH SHARTLARI",
      summary:
        "USHBU KENG QAMROVLI SHARTNOMANI DIQQAT BILAN O'QING. UNDA MAJBURIY ARBITRAJ SHARTI, GURUHVIY DA'VOLARDAN VOZ KECHISH VA HUQUQLARINGIZGA MODDIY TA'SIR QILUVCHI JAVOBGARLIKNI CHEKLASH BAXSLARI MAVJUD. RECV DASTURIY TA'MINOTI, API YOKI VEBHUKLARIGA KIRISH ORQALI SIZ USHBU SHARTLAR BILAN BOG'LANISHGA ROZILIK BILDIRASIZ.",
      updatedLabel: "Oxirgi yangilanish",
      operatorLabel: "Kuchga kirish sanasi",
      metaItems: ["Oxirgi yangilanish: 14-iyun, 2026-yil", "Kuchga kirish sanasi: 14-iyun, 2026-yil"],
      draftTitle: "Shartnoma tuzuvchi tomon",
      draftBody:
        "Ushbu Shartnoma Sotuvchi va recv.money veb-sayti operatorlari (“recv”, “Kompaniya”, “biz”) o'rtasida tuzilgan.",
      draftItems: [
        "Qamrov: dasturiy ta'minot, API, vebhuklar, blokcheyn monitoringi",
        "Model: nokastodial, to'g'ridan-to'g'ri hamyonga",
        "Nizolarni hal qilish: Kiprdagi arbitraj",
      ],
      sections: [
        {
          title: "1. MUQADDIMA VA SHARTLARNI QABUL QILISH",
          paragraphs: [
            '1.1. Shartnoma tomonlari: Ushbu Xizmat ko\'rsatish shartnomasi ("Shartnoma") siz (shaxsiy yoki yuridik shaxs nomidan, keyingi o\'rinlarda "Sotuvchi", "siz" yoki "sizning") va recv (keyingi o\'rinlarda "Kompaniya", "biz", "bizning" yoki "Xizmat ko\'rsatuvchi") o\'rtasidagi yuridik majburiy shartnomadir.',
            "1.2. Shartnoma tuzish huquqi: Telegram autentifikatsiyasi yoki bizning API orqali Xizmatdan foydalanish orqali siz kamida o'n sakkiz (18) yoshda ekanligingizni, ushbu Shartnomani tuzish uchun huquqiy layoqatga ega ekanligingizni va agar yuridik shaxs nomidan ish yuritsangiz, ushbu tashkilotni bog'lash uchun zarur vakolatlarga ega ekanligingizni kafolatlaysiz.",
            "1.3. O'zgartirishlar: Biz istalgan vaqtda ushbu Shartnomaga o'zgartirish kiritish huquqini saqlab qolamiz. Har qanday o'zgartirishlar e'lon qilingandan so'ng Xizmatdan foydalanishni davom ettirishingiz o'zgartirilgan shartlarni qabul qilganingizni anglatadi.",
          ],
        },
        {
          title: "2. XIZMATNING TA'RIFI",
          paragraphs: [
            '2.1. Dasturiy ta\'minot xizmat sifatida (SaaS): "Xizmat" faqat Kompaniya tomonidan taqdim etiladigan xususiy, nokastodial dasturiy ta\'minot vositachiligini anglatadi. Bunga boshqaruv paneli, chekaut sahifasi generatorlari, aqlli moslashtirish algoritmlari, API nuqtalari, vebhuk yetkazib berish tizimlari va blokcheyn monitoringi logikasi ("Vatcherlar") kiradi.',
            "2.2. Nokastodial ma'lumotlar qatlami: Siz Xizmat faqat axborot ma'lumotlar qatlami va vizual interfeys sifatida ishlashini tan olasiz. Xizmat ommaviy, markazlashtirilmagan blokcheyn reyestrlarini (masalan, TON, TRON, Solana, Base, BSC tarmoqlari) tahlil qiladi va ushbu ma'lumotlarni vizuallashtiradi.",
            "2.3. Moliyaviy vositachilikning yo'qligi: Kompaniya to'lov protsessori, to'lov shlyuzi, pul o'tkazuvchisi, kliring palatasi, depozitariy, ishonchli vakil yoki moliyaviy muassasa emas. Texnik arxitekturaning hech bir nuqtasida Kompaniya Sotuvchi yoki Sotuvchining oxirgi foydalanuvchilariga (\"Mijozlar\") tegishli fiat valyutasini, raqamli aktivlarini yoki kriptografik shaxsiy kalitlarini qabul qilmaydi, ushlab turmaydi, nazorat qilmaydi yoki egalik qilmaydi.",
            "2.4. Hamyonga to'g'ridan-to'g'ri o'tkazish: Raqamli aktivlarning barcha o'tkazmalari ommaviy blokcheynda faqat va to'g'ridan-to'g'ri Mijozning shaxsiy yoki kastodial hamyonidan Sotuvchining belgilangan hamyon manziliga amalga oshiriladi.",
          ],
        },
        {
          title: "3. TARTIBGA SOLISH VA SANKSİYALARGA RIOYA QILISH",
          paragraphs: [
            "3.1. Sotuvchining to'liq javobgarligi: Sotuvchi o'z Mijozlariga nisbatan Sotuvchining faoliyat yuritayotgan yurisdiksiyasi talab qilgan har qanday zarur shaxsni tasdiqlash, qonuniy muvofiqlik va soliq hisobotini yuritish bo'yicha barcha javobgarlikni o'z zimmasiga oladi.",
            "3.2. Sanksiyalar bo'yicha kafolatlar: Sotuvchi Birlashgan Millatlar Tashkiloti, Yevropa Ittifoqi yoki AQSh Xorijiy aktivlarni nazorat qilish boshqarmasi (OFAC) tomonidan har tomonlama iqtisodiy sanksiyalar qo'llanilgan mamlakat yoki hududda joylashmaganligini, uning nazorati ostida emasligini yoki fuqarosi yoki rezidenti emasligini kafolatlaydi.",
            "3.3. Soliq majburiyatlari: Kompaniya Sotuvchining tranzaksiyalaridan kelib chiqadigan har qanday savdo, qo'shilgan qiymat (QQS), daromad yoki boshqa soliqlarni hisoblamaydi, yig'maydi, o'tkazmaydi yoki hisobot bermaydi. Soliq majburiyatlari uchun faqat Sotuvchi javobgardir.",
          ],
        },
        {
          title: "4. TAQIQLANGAN XULQ-ATVOR VA AKKAUNTNI YOPISH",
          paragraphs: [
            "4.1. Qat'iyan taqiqlangan foydalanish: Sotuvchi Xizmatdan, chekaut havolalaridan yoki API infratuzilmasidan noqonuniy giyohvand moddalar, qurol-yarog'lar, noqonuniy kattalar uchun mo'ljallangan kontent, litsenziyasiz qimor o'yinlari, kontrafakt mahsulotlar yoki firibgarlik investitsiya tuzilmalarini sotish, tarqatish yoki targ'ib qilish uchun foydalanmaslikka rozi bo'ladi.",
            "4.2. Bekor qilish: Kompaniya har qanday Sotuvchi akkauntini to'xtatib turish, cheklash yoki butunlay yopish, API kalitlarini bekor qilish va vebhuk funksiyasini darhol o'chirib qo'yish huquqini saqlab qoladi, agar 4.1-bo'lim buzilgan deb gumon qilinsa yoki Sotuvchining faoliyati Kompaniyani qonuniy, tartibga soluvchi yoki obro'li xavf-xatarlarga duchor qiladi deb hisoblansa.",
          ],
        },
        {
          title: "5. TEXNIK MEXANIKA VA TRANZAKSIYALARNI MOSLASHTIRISH",
          paragraphs: [
            "5.1. Moslashtirish usullari: Qo'llab-quvvatlanadigan steyblkoin to'lov variantlari uchun recv zanjirdagi o'tkazmani hisob-fakturaga moslashtirish uchun so'ralgan summaga noyob kasrli qo'shimcha qo'shishi mumkin. TON tarmog'idagi native GRAM to'lovlari uchun recv noyob to'lov sharhidan foydalanadi. Qo'llab-quvvatlanadigan moslashtirish usullari tarmoq va aktivga qarab farq qilishi mumkin va chekaut sahifasida ko'rsatiladi.",
            "5.2. Foydalanuvchi xatolari uchun javobgarlikdan voz kechish: Kompaniya Mijozning aniq summani (jumladan, mos keluvchi qo'shimchani) yoki to'g'ri sharhni yubormaganligi yoki noto'g'ri yoki qo'llab-quvvatlanmaydigan blokcheyn tarmog'idan foydalanganligi sababli yuzaga kelgan har qanday moliyaviy zarar, raqamli tovarlarga kechiktirilgan kirish yoki bajarilmagan invoyslar uchun javobgarlikni o'z zimmasiga olmaydi.",
            "5.3. Tranzaksiyalarning qaytmasligi: Sotuvchi blokcheyn tranzaksiyalari matematik jihatdan o'zgarmas ekanligini tan oladi. Kompaniya zanjirdagi o'tkazmalarni bekor qila olmaydi, qaytara olmaydi yoki o'zgartira olmaydi.",
            "5.4. Uchinchi tomon RPC tugunlariga bog'liqlik: Xizmatning blokcheyn monitoringi imkoniyatlari uchinchi tomon Remote Procedure Call (RPC) tugun provayderlari va tashqi oracle API-larining barqarorligi, ishlash vaqti va aniqligiga to'liq bog'liq. Kompaniya uchinchi tomon RPC uzilishlari natijasida yuzaga kelgan Xizmat sifati pasayishi, vebhuklarning kechikishi yoki failed mempool monitoringi uchun javobgar emas.",
          ],
        },
        {
          title: "6. API, VEBHUKLAR VA INTEGRATSIYA",
          paragraphs: [
            "6.1. API litsenziyasi: Ushbu Shartlar va faol obuna holatiga rioya qilingan holda, Kompaniya Sotuvchiga recv API (v1) dan foydalanish uchun cheklangan, eksklyuziv bo'lmagan, o'tkazilmaydigan va bekor qilinadigan litsenziyani taqdim etadi.",
            "6.2. Vebhuklarni yetkazib berish va idempotentlik: Vebhuk bildirishnomalari 'kamida bir marta' yetkazib berish tamoyili asosida amalga oshiriladi. Sotuvchi buyurtmalarning takroriy bajarilishini oldini olish uchun o'z serverlarida Idempotentlik nazoratini joriy qilishi shart.",
            "6.3. Vebhuklarni tasdiqlash: Har bir vebhuk tarkibida X-recv-Event, X-recv-Timestamp va X-recv-Signature sarlavhalari mavjud. Imzo timestamp + '.' + raw request body ustidan hisoblangan HMAC-SHA256 xeshi ko'rinishida yuboriladi. Sotuvchi ushbu imzoni unmodified raw body bilan tekshirishi, eski timestamp-larni rad etishi va hodisalarni idempotent ravishda qayta ishlashi kerak.",
          ],
        },
        {
          title: "7. OBUNALAR, TO'LOVLAR VA CHEKLOVLAR",
          paragraphs: [
            "7.1. Pullik rejalar: Hozirgi pullik rejalarga Merchant, Developer va Business kiradi. Amaldagi narxlar, kiritilgan funksiyalar, kvotalar va billing davrlari chekaut sahifasida ko'rsatiladi va sotib olish vaqtida ushbu Shartnomaning bir qismini tashkil qiladi.",
            "7.2. Obuna muddati: Obuna to'lovi chekautda ko'rsatilgan fiksatsiyalangan davr uchun (hozirda 30 kun) kirish huquqini sotib oladi. Obunalar avtomatik ravishda yangilanmaydi, agar recv buni aniq joriy qilmasa va Sotuvchi alohida avtomatik yangilanishga ruxsat bermasa.",
            "7.3. Cheklovlar: Reja cheklovlari invoys, API so'rovlari, API kalitlari, vebhuk yakuniy nuqtalari, qayta urinishlar, ish joylari va jamoa a'zolari soni bo'yicha cheklovlarni o'z ichiga olishi mumkin. Amaldagi limitga erishilganda so'rovlar rad etilishi yoki funksiyalar cheklanishi mumkin.",
          ],
        },
        {
          title: "8. QAYTARISH SIYOSATI",
          paragraphs: [
            "8.1. Qaytmaslik: Blokcheyn o'tkazmalari qaytarib bo'lmaydigan tabiatga ega bo'lganligi sababli, obuna to'lovlari avtomatik ravishda qaytarilishi mumkin emas. Amaldagi qonunchilikda boshqacha tartib nazarda tutilgan hollardan tashqari, pullik reja faollashtirilgandan so'ng obuna to'lovlari qaytarilmaydi.",
            "8.2. Tasdiqlangan qaytarishlar: Agar recv sotib olingan rejani faollashtira olmasa, to'lovni takrorlasa yoki xizmatni noto'g'ri ta'riflagan bo'lsa, Sotuvchi 14 kun ichida support@recv.money bilan bog'lanishi mumkin. Har qanday tasdiqlangan qaytarish miqdori recv-ning tekshirish jarayoni orqali aniqlangan hamyon manziliga yuboriladi, bunda qochib bo'lmaydigan blokcheyn tarmoq komissiyalari chegirib tashlanadi.",
          ],
        },
        {
          title: "9. INTELLEKTUAL MULK",
          paragraphs: [
            "Xizmatga, Dasturiy ta'minotga, API-ga, dizayniga, arxitekturasiga va kodlar bazasiga bo'lgan barcha huquqlar, egalik va manfaatlar faqat Kompaniyaning eksklyuziv intellektual mulki bo'lib qoladi. Siz Xizmat kodini dekompilyatsiya qilishingiz, teskari muhandislik qilishingiz, qismlarga ajratishingiz yoki manba kodini olishga urinishingiz mumkin emas.",
          ],
        },
        {
          title: "10. KAFOLATLARNING YO'QLIGI",
          paragraphs: [
            'XIZMAT, API VA BARCHA TEGISHLI INFRATUZILMA "XUDDI SHUNDAY" VA "MAVJUD BO\'LGANIDAGI" ASOSIDA TAQDIM ETILADI. KOMPANIYA HAR QANDAY KAFOLATLARNI, JUMLADAN SOTILISHI, MA\'LUM MAQSADLARGA MUVOFIQLIGI VA BUZILMASLIK KAFOLATLARINI RAD ETADI.',
          ],
        },
        {
          title: "11. JAVOBGARLIKNI CHEKLASH",
          paragraphs: [
            "KOMPANIYA, UNING TA'SISCHILARI, ASOSIY DASTURCHI JAMOASI YOKI HAMKORLARI FOYDA YO'QOTILISHI, DAROMAD YO'QOTILISHI, RAQAMLI AKTIVLARNING YO'QOTILISHI YOKI MA'LUMOTLARNING BUZILISHI KABI BILVOSTA, TASODIFIY YOKI CONTEXTUAL ZARARLAR UCHUN JAVOBGAR BO'LMAYDI.",
            "HECH QANDAY SHAROITDA KOMPANIYANING SIZNING OLDINGIZDAGI JAMI JAVOBGARLIGI DA'VO KELTIRIB CHIQARGAN VOQEADAN OLDINGI UCH (3) OY DAVOMIDA SIZ TOMONIDAN KOMPANIYAGA TO'LANGAN JAMI OBUNA TO'LOVLARI MIQDORIDAN OSHIB KETMAYDI. AGAR SIZ BEPUL TARIFFDA BO'LSANGIZ, JAMI JAVOBGARLIK QAT'IYAN NOL DOLLAR ($0.00) BILAN CHEKLANADI.",
          ],
        },
        {
          title: "12. ZARARNI QOPLASH",
          paragraphs: [
            "Siz Kompaniyani va uning sho'ba korxonalarini ushbu Shartnomani buzishingiz, qonun hujjatlarini buzishingiz yoki siz va Mijozlaringiz o'rtasidagi har qanday nizolar natijasida yuzaga keladigan har qanday da'volar, harakatlar, talablar, zarar va xarajatlardan himoya qilishga va zararni qoplashga rozi bo'lasiz.",
          ],
        },
        {
          title: "13. QONUNCHILIK VA NIZOLARNI HAL QILISH",
          paragraphs: [
            "13.1. Ushbu Shartnoma Kipr qonunlari bilan tartibga solinadi.",
            "13.2. Rasmiy da'vo boshlashdan oldin, tomon legal@recv.money manziliga nizoning batafsil tavsifini yuborishi kerak. Tomonlar nizoni o'ttiz (30) kun ichida tinch yo'l bilan hal qilishga harakat qilishadi.",
            "13.3. 13.2-bo'limga muvofiq hal etilmagan har qanday nizo Kiprning Nikosiya shahridagi vakolatli sudlar tomonidan, ingliz tilida hal qilinadi.",
            "13.4. Ushbu bo'limdagi hech bir qoida tomonlarga vaqtinchalik choralarni ko'rish yoki qonuniy ravishda voz kechib bo'lmaydigan huquqlarni amalga oshirishga to'sqinlik qilmaydi.",
          ],
        },
        {
          title: "14. SHARTNOMANING YAXLITLIGI VA MUSTAQILLIGI",
          paragraphs: [
            "Agar ushbu Shartnomaning biron bir qoidasi haqiqiy emas yoki bajarib bo'lmaydigan deb topilsa, ushbu qoida zarur bo'lgan minimal darajada cheklanadi yoki o'chiriladi, Shartnomaning qolgan qismi esa to'liq kuchda qoladi. Ushbu Shartnoma tomonlar o'rtasidagi kelishuvning to'liqligini tashkil qiladi.",
          ],
        },
        {
          title: "15. TIL VA TARCJIMALAR",
          paragraphs: [
            "15.1. Ushbu Shartnoma ingliz va rus tillarida tuzilgan. Inglizcha versiya va ruscha tarjima o'rtasida har qanday nomuvofiqlik yuzaga kelgan taqdirda, inglizcha versiya ustuvor hisoblanadi va yuridik kuchga ega bo'ladi.",
          ],
        },
      ],
      footerNote: "Yuqoridagi shartlar sizning xizmatdan foydalanishingizni belgilaydigan to'liq shartnomani tashkil qiladi.",
    },
    dpa: {
      kicker: "MA'LUMOTLARNI QAYTA ISHLASH ILOVASI",
      title: "MA'LUMOTLARNI QAYTA ISHLASH ILOVASI",
      summary:
        "Ushbu Ma'lumotlarni qayta ishlash ilovasi (“DPA”) Xizmat ko'rsatish doirasida recv tomonidan Sotuvchi nomidan Mijoz Shaxsiy ma'lumotlarini qayta ishlashni tartibga soladi.",
      updatedLabel: "Oxirgi yangilanish",
      operatorLabel: "Kuchga kirish sanasi",
      metaItems: ["Oxirgi yangilanish: 14-iyun, 2026-yil", "Kuchga kirish sanasi: 14-iyun, 2026-yil"],
      draftTitle: "Qayta ishlash doirasi",
      draftBody:
        "Ushbu DPA recv faqat Sotuvchi nomidan Mijoz Shaxsiy ma'lumotlarini qayta ishlagan taqdirda amal qiladi. Ushbu kontekstda Sotuvchi Nazoratchi, recv esa Protsessor sifatida ishlaydi.",
      draftItems: [
        "Nazoratchi: Sotuvchi",
        "Protsessor: recv",
        "Standartlar: GDPR, global ma'lumotlarni himoya qilish qonunlari",
      ],
      sections: [
        {
          title: "1. ROLLAR VA RIOYA QILISH",
          paragraphs: [
            "1.1. Doirasi: recv faqat Sotuvchi nomidan Mijoz Shaxsiy ma'lumotlarini qayta ishlaganda, Sotuvchi Ma'lumotlar Nazoratchisi, recv esa Ma'lumotlar Protsessori sifatida ishlaydi.",
            "1.2. Yo'riqnomalar: recv ushbu ma'lumotlarni faqat Sotuvchining hujjatlashtirilgan ko'rsatmalari, jumladan Shartnoma shartlari asosida qayta ishlaydi, qonun hujjatlarida boshqacha tartib nazarda tutilgan hollar bundan mustasno.",
          ],
        },
        {
          title: "2. PROTSESSORNING MAJBURIYATLARI",
          paragraphs: [
            "2.1. Maxfiylik: recv Mijoz Shaxsiy ma'lumotlarini qayta ishlashga vakolatli shaxslarning maxfiylik majburiyatlarini olishini yoki tegishli qonuniy maxfiylik majburiyatlari ostida bo'lishini ta'minlaydi.",
            "2.2. Xavfsizlik choralari: recv Mijoz Shaxsiy ma'lumotlarini qayta ishlash xavfi darajasiga mos keladigan xavfsizlikni ta'minlash uchun tegishli texnik va tashkiliy choralarni ko'radi.",
            "2.3. Yordamchi protsessorlar: recv o'zi jalb qilgan har qanday yordamchi protsessorga ekvivalent ma'lumotlarni himoya qilish majburiyatlarini yuklaydi va ular uchun Sotuvchi oldida javobgar bo'lib qoladi.",
            "2.4. Ma'lumotlar subyektlarining so'rovlari: recv qayta ishlash xususiyatini hisobga olgan holda, Sotuvchiga ma'lumotlar subyektlarining huquqlarini amalga oshirish bo'yicha so'rovlariga javob berish majburiyatini bajarishda tegishli texnik va tashkiliy choralar orqali yordam beradi.",
            "2.5. Buzilishlar to'g'risida xabardor qilish: recv Mijoz Shaxsiy ma'lumotlariga ta'sir qiluvchi tasdiqlangan shaxsiy ma'lumotlar xavfsizligi buzilishini aniqlagandan so'ng, asossiz kechikishlarsiz Sotuvchini xabardor qiladi.",
            "2.6. O'chirish yoki qaytarish: recv xizmatlar ko'rsatish tugagandan so'ng Sotuvchining tanloviga ko'ra barcha Mijoz Shaxsiy ma'lumotlarini o'chirib tashlaydi yoki qaytaradi, qonunchilikda ushbu ma'lumotlarni saqlash talab qilingan hollar bundan mustasno.",
            "2.7. Auditlar: recv ushbu majburiyatlarga rioya qilinishini isbotlash uchun zarur bo'lgan barcha ma'lumotlarni Sotuvchiga taqdim etadi va Sotuvchi yoki u tayinlagan auditor tomonidan o'tkaziladigan tekshirishlarga imkon beradi va hissa qo'shadi.",
          ],
        },
        {
          title: "3. DPA ILOVALARI",
          paragraphs: [
            "3.1. Predmeti va muddati: Blokcheyn tranzaksiyalarini yo'naltirish, holatni tasdiqlash va tegishli bildirishnoma metadatalarini qayta ishlash. Davomiyligi Shartnoma muddatiga mos keladi.",
            "3.2. Ma'lumotlar toifalari: Tranzaksiya xeshlari (TXID), maqsadli hamyon manzillari, to'lanadigan summalar, vaqt belgilari, IP manzillar, brauzer User-Agent satrlari va Sotuvchi taqdim etgan ixtiyoriy metadata.",
            "3.3. Ma'lumotlar subyektlarining toifalari: recv chekaut havolalari orqali kriptovalyuta to'lovlarini amalga oshiradigan Sotuvchining mijozlari (oxirgi foydalanuvchilar).",
            "3.4. Texnik va tashkiliy xavfsizlik choralari: Ma'lumotlar bazasi hisob ma'lumotlarini shifrlash, seans tokenlari uchun kriptografik imzolar, API kalitlari uchun bir tomonlama xeshlar, kirishni nazorat qilish va rate-limiting.",
            "3.5. Tasdiqlangan yordamchi protsessorlar: Tasdiqlangan yordamchi protsessorlar ro'yxati maxsus sahifada keltirilgan.",
            "3.6. Xalqaro ma'lumotlar uzatish: Ma'lumotlarni Yevropa Ittifoqi/Yevropa iqtisodiy hududi/Birlashgan Qirollikdan tashqariga uzatish talab etilganda, recv standart shartnomaviy shartlar (SCC) yoki vakolatli organlar tomonidan tasdiqlangan ekvivalent mexanizmlardan foydalanadi.",
          ],
        },
      ],
      footerNote: "Ushbu DPA Xizmat ko'rsatish shartlarining ajralmas qismi hisoblanadi.",
    },
    subprocessors: {
      kicker: "TASDIQLANGAN YORDAMCHI PROTSESSORLAR",
      title: "TASDIQLANGAN YORDAMCHI PROTSESSORLAR RO'YXATI",
      summary:
        "Quyida recv nomidan xizmat infratuzilmamizni yetkazib berish uchun ma'lumotlarni qayta ishlashga vakolatli uchinchi tomon yordamchi protsessorlarining faol ro'yxati keltirilgan.",
      updatedLabel: "Oxirgi yangilanish",
      operatorLabel: "Kuchga kirish sanasi",
      metaItems: ["Oxirgi yangilanish: 14-iyun, 2026-yil", "Kuchga kirish sanasi: 14-iyun, 2026-yil"],
      draftTitle: "Ruxsat berish",
      draftBody:
        "Sotuvchi quyida ko'rsatilgan uchinchi tomon infratuzilma va xizmat ko'rsatuvchi provayderlarining jalb qilinishiga ruxsat beradi. Ro'yxatdagi barcha yordamchi protsessorlar teng darajadagi xavfsizlik standartlariga ega ma'lumotlarni qayta ishlash shartnomalarini imzolaganlar.",
      draftItems: [
        "Infratuzilma xostingi",
        "Blokcheyn RPC xizmatlari",
        "Bildirishnomalar va narxlar",
      ],
      sections: [
        {
          title: "1. TELEGRAM MESSENGER INC.",
          paragraphs: [
            "• Maqsad: Foydalanuvchi autentifikatsiyasi, bot buyruqlari, Telegram Mini App xostingi va sotuvchiga to'lov bildirishnomalarini yuborish.",
            "• Joylashuv: Global miqyosda tarqatilgan.",
          ],
        },
        {
          title: "2. REMOTE PROCEDURE CALL (RPC) TUGUN PROVAYDERLARI",
          paragraphs: [
            "• Maqsad: Blokcheyn blok sarlavhalarini so'rash, maqsadli hamyonlarni kuzatish va mempoollarni o'qish (masalan, TonCenter, TronGrid va standart ommaviy tugunlar).",
            "• Joylashuv: Global miqyosda tarqatilgan.",
          ],
        },
        {
          title: "3. BULUTLI PLATFORMALAR VA EDGE TARMOQLARI",
          paragraphs: [
            "• Maqsad: Server hisoblash muhitlari, xavfsiz ma'lumotlar bazasi xostingi va global edge so'rovlarni yo'naltirish.",
            "• Joylashuv: Yevropa Ittifoqi / Amerika Qo'shma Shtatlari.",
          ],
        },
        {
          title: "4. VALYUTA KURSI API-LARI VA ORACLE-LAR",
          paragraphs: [
            "• Maqsad: Real vaqt rejimidagi kriptovalyuta kurslarini olish (masalan, CoinGecko API) va invoys qiymatlarini USD ekvivalentida hisoblash.",
            "• Joylashuv: Global.",
          ],
        },
      ],
      footerNote: "Ushbu yordamchi protsessorlar ro'yxatiga kiritilgan har qanday o'zgarishlar ushbu sahifada e'lon qilinadi.",
    },
  },
} as const;

export default uz;
