export type FaqItem = { q: string; a: string };

// Visible FAQ content rendered on each /compare/[competitor] page and mirrored
// into FAQPage JSON-LD. Keyed by the competitor slug used in comparePages.
export const COMPARE_FAQ: Record<string, { en: FaqItem[]; ru: FaqItem[] }> = {
  "recv-vs-manual": {
    en: [
      {
        q: "Why use recv instead of tracking crypto payments manually?",
        a: "Manual tracking does not scale: every payment needs to be matched to an order by hand, which is slow and error-prone. recv automates detection across TON, TON_USDT, TRON, Base, and BSC, matches exact amounts to invoices, and fires signed webhooks so fulfillment happens instantly.",
      },
      {
        q: "How does recv prevent missed or misattributed payments?",
        a: "Each invoice gets a unique payable amount and destination, and recv confirms the transaction on-chain before marking it paid. Underpayments, overpayments, and late payments are classified automatically instead of being missed in a spreadsheet.",
      },
      {
        q: "Does automating crypto payments mean giving up custody of funds?",
        a: "No. recv is fully non-custodial — payments settle directly to your own wallets. You get automation and reconciliation without handing funds to a third party.",
      },
    ],
    ru: [
      {
        q: "Зачем использовать recv вместо ручного отслеживания криптоплатежей?",
        a: "Ручное отслеживание не масштабируется: каждый платёж нужно вручную сопоставлять с заказом — это медленно и чревато ошибками. recv автоматически детектит платежи в TON, TON_USDT, TRON, Base и BSC, сопоставляет точные суммы с инвойсами и отправляет подписанные вебхуки для мгновенной выдачи.",
      },
      {
        q: "Как recv предотвращает пропущенные и неверно зачисленные платежи?",
        a: "Каждый инвойс получает уникальную сумму к оплате и адрес, а recv подтверждает транзакцию в сети, прежде чем пометить её оплаченной. Недоплаты, переплаты и поздние платежи классифицируются автоматически, а не теряются в таблице.",
      },
      {
        q: "Автоматизация криптоплатежей означает потерю контроля над средствами?",
        a: "Нет. recv полностью non-custodial — платежи приходят напрямую на ваши кошельки. Вы получаете автоматизацию и сверку, не передавая средства третьей стороне.",
      },
    ],
  },
  "recv-vs-custodial": {
    en: [
      {
        q: "Is recv non-custodial?",
        a: "Yes. Payments settle directly to merchant-controlled wallets and recv never holds your funds. There is no platform balance to freeze, delay, or lose in a breach — unlike custodial gateways.",
      },
      {
        q: "How do recv's fees compare to custodial gateways?",
        a: "Custodial gateways typically charge 1–3% of turnover, so your costs grow with your revenue. recv uses a fixed subscription with zero turnover fees, which keeps costs predictable as you scale.",
      },
      {
        q: "Does recv require KYC like custodial processors?",
        a: "recv is privacy-first infrastructure: you keep your own relationship with your customers and your funds, instead of depending on a third party's KYC policy and withdrawal rules.",
      },
    ],
    ru: [
      {
        q: "recv действительно non-custodial?",
        a: "Да. Платежи зачисляются напрямую на кошельки продавца, и recv никогда не хранит ваши средства. Нет платформенного баланса, который можно заморозить, задержать или потерять при взломе — в отличие от кастодиальных шлюзов.",
      },
      {
        q: "Как комиссии recv соотносятся с кастодиальными шлюзами?",
        a: "Кастодиальные шлюзы обычно берут 1–3% с оборота, и ваши расходы растут вместе с выручкой. recv использует фиксированную подписку с нулевой комиссией с оборота — расходы предсказуемы при любом объёме.",
      },
      {
        q: "Требует ли recv KYC, как кастодиальные процессоры?",
        a: "recv — это privacy-first инфраструктура: вы сохраняете собственные отношения с клиентами и контроль над средствами, не завися от KYC-политики и правил вывода третьей стороны.",
      },
    ],
  },
  nowpayments: {
    en: [
      {
        q: "What is the main difference between recv and NowPayments?",
        a: "NowPayments uses an internal balance model where you withdraw or wait for payout cycles. recv is non-custodial: every confirmed transaction lands directly in your own wallet on-chain, with no platform balance in between.",
      },
      {
        q: "Does recv charge turnover fees like NowPayments?",
        a: "recv uses a fixed subscription with zero turnover fees, so costs stay predictable as volume grows instead of scaling with every transaction.",
      },
      {
        q: "Which networks does recv support?",
        a: "recv supports TON, TRON (TRC-20 USDT), TON_USDT, Base, and BSC, with a single API, signed webhooks, and hosted checkout across all of them.",
      },
    ],
    ru: [
      {
        q: "В чём главное отличие recv от NowPayments?",
        a: "NowPayments использует модель внутреннего баланса, откуда нужно выводить средства или ждать циклов выплат. recv — non-custodial: каждая подтверждённая транзакция сразу попадает на ваш кошелёк в сети, без промежуточного баланса платформы.",
      },
      {
        q: "Берёт ли recv комиссию с оборота, как NowPayments?",
        a: "recv использует фиксированную подписку с нулевой комиссией с оборота — расходы остаются предсказуемыми при росте объёма, а не растут с каждой транзакцией.",
      },
      {
        q: "Какие сети поддерживает recv?",
        a: "recv поддерживает TON, TRON (TRC-20 USDT), TON_USDT, Base и BSC — единый API, подписанные вебхуки и hosted checkout для всех сетей.",
      },
    ],
  },
};
