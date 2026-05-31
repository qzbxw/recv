export type FaqItem = { q: string; a: string };

// Visible FAQ content rendered on each /compare/[competitor] page and mirrored
// into FAQPage JSON-LD. Keyed by the competitor slug used in comparePages.
export const COMPARE_FAQ: Record<string, { en: FaqItem[]; ru: FaqItem[] }> = {
  "reqst-vs-manual": {
    en: [
      {
        q: "Why use Reqst instead of tracking crypto payments manually?",
        a: "Manual tracking does not scale: every payment needs to be matched to an order by hand, which is slow and error-prone. Reqst automates detection across TON, TRON, Solana, and EVM, matches exact amounts to invoices, and fires signed webhooks so fulfillment happens instantly.",
      },
      {
        q: "How does Reqst prevent missed or misattributed payments?",
        a: "Each invoice gets a unique payable amount and destination, and Reqst confirms the transaction on-chain before marking it paid. Underpayments, overpayments, and late payments are classified automatically instead of being missed in a spreadsheet.",
      },
      {
        q: "Does automating crypto payments mean giving up custody of funds?",
        a: "No. Reqst is fully non-custodial — payments settle directly to your own wallets. You get automation and reconciliation without handing funds to a third party.",
      },
    ],
    ru: [
      {
        q: "Зачем использовать Reqst вместо ручного отслеживания криптоплатежей?",
        a: "Ручное отслеживание не масштабируется: каждый платёж нужно вручную сопоставлять с заказом — это медленно и чревато ошибками. Reqst автоматически детектит платежи в TON, TRON, Solana и EVM, сопоставляет точные суммы с инвойсами и отправляет подписанные вебхуки для мгновенной выдачи.",
      },
      {
        q: "Как Reqst предотвращает пропущенные и неверно зачисленные платежи?",
        a: "Каждый инвойс получает уникальную сумму к оплате и адрес, а Reqst подтверждает транзакцию в сети, прежде чем пометить её оплаченной. Недоплаты, переплаты и поздние платежи классифицируются автоматически, а не теряются в таблице.",
      },
      {
        q: "Автоматизация криптоплатежей означает потерю контроля над средствами?",
        a: "Нет. Reqst полностью non-custodial — платежи приходят напрямую на ваши кошельки. Вы получаете автоматизацию и сверку, не передавая средства третьей стороне.",
      },
    ],
  },
  "reqst-vs-custodial": {
    en: [
      {
        q: "Is Reqst non-custodial?",
        a: "Yes. Payments settle directly to merchant-controlled wallets and Reqst never holds your funds. There is no platform balance to freeze, delay, or lose in a breach — unlike custodial gateways.",
      },
      {
        q: "How do Reqst's fees compare to custodial gateways?",
        a: "Custodial gateways typically charge 1–3% of turnover, so your costs grow with your revenue. Reqst uses a fixed subscription with zero turnover fees, which keeps costs predictable as you scale.",
      },
      {
        q: "Does Reqst require KYC like custodial processors?",
        a: "Reqst is privacy-first infrastructure: you keep your own relationship with your customers and your funds, instead of depending on a third party's KYC policy and withdrawal rules.",
      },
    ],
    ru: [
      {
        q: "Reqst действительно non-custodial?",
        a: "Да. Платежи зачисляются напрямую на кошельки продавца, и Reqst никогда не хранит ваши средства. Нет платформенного баланса, который можно заморозить, задержать или потерять при взломе — в отличие от кастодиальных шлюзов.",
      },
      {
        q: "Как комиссии Reqst соотносятся с кастодиальными шлюзами?",
        a: "Кастодиальные шлюзы обычно берут 1–3% с оборота, и ваши расходы растут вместе с выручкой. Reqst использует фиксированную подписку с нулевой комиссией с оборота — расходы предсказуемы при любом объёме.",
      },
      {
        q: "Требует ли Reqst KYC, как кастодиальные процессоры?",
        a: "Reqst — это privacy-first инфраструктура: вы сохраняете собственные отношения с клиентами и контроль над средствами, не завися от KYC-политики и правил вывода третьей стороны.",
      },
    ],
  },
  nowpayments: {
    en: [
      {
        q: "What is the main difference between Reqst and NowPayments?",
        a: "NowPayments uses an internal balance model where you withdraw or wait for payout cycles. Reqst is non-custodial: every confirmed transaction lands directly in your own wallet on-chain, with no platform balance in between.",
      },
      {
        q: "Does Reqst charge turnover fees like NowPayments?",
        a: "Reqst uses a fixed subscription with zero turnover fees, so costs stay predictable as volume grows instead of scaling with every transaction.",
      },
      {
        q: "Which networks does Reqst support?",
        a: "Reqst supports TON, TRON (TRC-20 USDT), Solana, Base, Arbitrum, BSC, and Ethereum, with a single API, signed webhooks, and hosted checkout across all of them.",
      },
    ],
    ru: [
      {
        q: "В чём главное отличие Reqst от NowPayments?",
        a: "NowPayments использует модель внутреннего баланса, откуда нужно выводить средства или ждать циклов выплат. Reqst — non-custodial: каждая подтверждённая транзакция сразу попадает на ваш кошелёк в сети, без промежуточного баланса платформы.",
      },
      {
        q: "Берёт ли Reqst комиссию с оборота, как NowPayments?",
        a: "Reqst использует фиксированную подписку с нулевой комиссией с оборота — расходы остаются предсказуемыми при росте объёма, а не растут с каждой транзакцией.",
      },
      {
        q: "Какие сети поддерживает Reqst?",
        a: "Reqst поддерживает TON, TRON (TRC-20 USDT), Solana, Base, Arbitrum, BSC и Ethereum — единый API, подписанные вебхуки и hosted checkout для всех сетей.",
      },
    ],
  },
};
