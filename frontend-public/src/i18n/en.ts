const en = {
    hero: {
      title: "The Protocol for Digital Revenue.",
      body:
        "Non-custodial infrastructure for scale. Direct-to-wallet payouts, 0% turnover fees, and native multi-chain support in one unified engine.",
      subcopy:
        "Engineered for Telegram, SaaS, and Global Commerce.",
      primary: "Launch Console",
      secondary: "View Docs",
      badges: ["Direct-to-Wallet", "0% Fees", "Non-Custodial", "High-Throughput"],
    },
    heroPanel: {
      eyebrow: "Infrastructure",
      title: "Performance First",
      body: "Experience raw efficiency with our optimized blockchain monitoring protocol.",
      amount: "149.00 USDT",
      invoice: "REQST-INFRA-99",
      status: "Confirmed",
      primary: "Demo Checkout",
      secondary: "Console",
      helper: "Flat subscription. Unlimited volume.",
      chips: ["TON", "TRON", "SOL", "BASE"],
    },
    bento: {
      kicker: "INFRASTRUCTURE",
      title: "Built for the next billion transactions.",
      items: [
        {
          id: "api",
          title: "Unified API v1",
          body: "A high-performance gateway for all liquid networks. One integration, infinite reach.",
          kicker: "INTEGRATION",
          size: "large"
        },
        {
          id: "checkout",
          title: "Smart Checkout",
          body: "A clean, high-conversion payment interface optimized for every device and platform.",
          kicker: "UX",
          size: "medium"
        },
        {
          id: "direct",
          title: "Direct Payouts",
          body: "Revenue flows directly to your wallets. We never touch, hold, or middle-man your funds.",
          kicker: "TRUST",
          size: "small"
        },
        {
          id: "monitoring",
          title: "Real-time Watchers",
          body: "Low-latency blockchain monitoring with intelligent underpayment detection.",
          kicker: "STABILITY",
          size: "small"
        },
        {
          id: "tg",
          title: "Telegram Native",
          body: "Manage your revenue flow and infrastructure via our official Telegram bot.",
          kicker: "NATIVE",
          size: "small"
        }
      ]
    },
    useCases: {
      kicker: "USE CASES",
      title: "Proven in the most demanding environments.",
      tabs: [
        { id: "tg-shops", title: "TG Shops", body: "Automate physical and digital goods sales inside Telegram with instant delivery.", cta: "Explore TG Commerce" },
        { id: "saas", title: "SaaS Billing", body: "Reliable infrastructure for software platforms. Flat fees mean higher margins for your business.", cta: "Optimize Margins" },
        { id: "digital", title: "Digital Goods", body: "Instant fulfillment for keys and accounts immediately after blockchain confirmation.", cta: "Scale Automation" },
        { id: "communities", title: "Communities", body: "Automated access management for private channels and groups with recurring logic.", cta: "Manage Members" },
      ]
    },
    networks: {
      kicker: "NETWORKS",
      title: "Global Connectivity.",
      list: ["TON", "TRON", "SOLANA", "BASE", "ARBITRUM", "BSC", "ETHEREUM"],
      rails: [
        {
          name: "TON",
          body: "The native choice for Telegram-based commerce and the growing TON ecosystem.",
        },
        {
          name: "TRON",
          body: "The global standard for USDT settlement with high throughput and low costs.",
        },
        {
          name: "SOL",
          body: "Fast, confirmation-aware monitoring for businesses that need predictable payment operations.",
        },
        {
          name: "EVM",
          body: "Base, Arbitrum, BSC — support the EVM networks available in the current checkout flow.",
        },
        {
          name: "BASE",
          body: "Optimistic L2 by Coinbase, offering low fees and Ethereum security.",
        },
        {
          name: "BSC",
          body: "High-performance network with one of the largest ecosystem of active users.",
        },
        {
          name: "ARBITRUM",
          body: "The leading layer-2 for Ethereum, providing professional-grade scalability.",
        }
      ]
    },
    compare: {
      kicker: "EVOLUTION",
      title: "The Reqst Advantage.",
      rows: [
        {
          legacy: "Manual verification and screenshot chasing.",
          reqst: "Automated blockchain watchers & instant alerts.",
        },
        {
          legacy: "Gateway fees (1-5%) eating your profit.",
          reqst: "0% turnover fees. Keep 100% of what you earn.",
        },
        {
          legacy: "Custodial risk & withdrawal delays.",
          reqst: "Non-custodial. Direct-to-wallet. Instant liquidity.",
        },
      ],
    },
    pricing: {
      kicker: "ACCESS",
      title: "Transparent pricing. No fees.",
      popular: "Popular",
      merchant: {
        name: "Merchant",
        price: "39",
        trial: "Free in Test Mode",
        features: ["Direct-to-Wallet Payouts", "Manual Invoice Management", "0% Turnover Fees", "Standard Analytics"],
        cta: "Activate Merchant"
      },
      developer: {
        name: "Developer",
        price: "199",
        features: ["Full API & Webhooks", "50k Monthly Requests", "3 Seats / Workspaces", "Priority Support"],
        cta: "Activate Developer"
      },
      business: {
        name: "Business",
        price: "499",
        features: ["200k Monthly Requests", "10 Seats / Workspaces", "Advanced Reporting", "Dedicated Support"],
        cta: "Activate Business"
      },
      enterprise: {
        name: "Enterprise",
        price: "Custom",
        features: ["Unlimited Requests", "Unlimited Seats", "Custom SLA / B2B", "Direct Dev Channel"],
        cta: "Contact Sales"
      }
    },
    faq: {
      kicker: "FAQ",
      title: "Protocol Details.",
      body: "Essential insights on asset security, payment mechanics, and platform integration.",
      items: [
        {
          question: "How does Reqst ensure the security of my funds?",
          answer: "We utilize a non-custodial architecture. This means your private keys never leave your device, and funds are sent directly from the client to your address. Reqst only monitors the blockchain and provides transaction notifications.",
        },
        {
          question: "Which networks and assets are currently supported?",
          answer: "We currently support TON, TRON (USDT), Solana, and major EVM chains (Base, BSC, Arbitrum). We are continuously adding new liquid protocols based on enterprise-tier demands.",
        },
        {
          question: "Can I automate the delivery of digital goods?",
          answer: "Absolutely. Our Webhook system provides instantaneous notifications to your server upon payment confirmation, enabling full automation of access, subscriptions, or digital delivery.",
        },
        {
          question: "How are underpayments or incorrect amounts handled?",
          answer: "Reqst intelligently detects any deviations from the expected amount. If an underpayment occurs, the transaction is flagged as 'Underpaid,' allowing you to either request the balance or manually approve the order.",
        },
        {
          question: "Do I need to pass KYC to start using Reqst?",
          answer: "No. Since we operate strictly as non-custodial middleware and do not hold or process fiat currency, we do not require KYC verification from merchants. You can start accepting crypto immediately.",
        },
        {
          question: "Is there a limit on how many invoices I can create?",
          answer: "There are absolutely no limits on invoice creation. You can generate millions of payment links. Our subscription tiers only restrict the number of API requests to our monitoring nodes.",
        },
        {
          question: "What happens if a network (e.g., Solana) goes down?",
          answer: "Our watchers are distributed across multiple global RPC providers. If a network halts, Reqst queues the monitoring tasks. Once the blockchain resumes block production, all pending transactions will be automatically verified and webhooks fired.",
        },
      ],
    },
    final: {
      kicker: "GET STARTED",
      title: "Scale Your Business with Reqst.",
      body:
        "Join industry leaders who have already automated their crypto processing and eliminated manual overhead.",
      primary: "Get Started Now",
      secondary: "Documentation",
    },
    footer: {
      title: "reqst",
      body: "Automated crypto payments with direct-to-wallet payouts. Fair, fast, professional.",
      product: "Product",
      privacy: "Privacy",
      terms: "Terms",
      console: "Console",
      status: "Status",
      api: "API",
      b2b: "B2B",
      company: "Company",
      resources: "Resources",
      solutions: "Solutions",
      social: "Social",
    },
    nav: {
      products: {
        title: "Products",
        checkout: { title: "Checkout", desc: "High-converting payment UI" },
        api: { title: "API", desc: "Infrastructure for developers" },
        invoicing: { title: "Invoicing", desc: "Professional billing tools" },
      },
      useCases: {
        title: "Use Cases",
        tgShops: "Telegram Shops",
        saas: "SaaS Billing",
        digital: "Digital Goods",
        communities: "Paid Communities",
      },
      networks: {
        title: "Networks",
        ton: "TON",
        tron: "TRON",
        solana: "Solana",
        base: "Base",
        bsc: "BSC",
        arbitrum: "Arbitrum",
      },
      pricing: {
        title: "Pricing",
        merchant: "Merchant",
        developer: "Developer",
        business: "Business",
        enterprise: "Enterprise",
      },
      docs: "Docs",
      blog: "Blog",
      console: "Console",
    },
  marketing: {
    activate: "Get Started",
    activateVerb: "Activate",
    seamlessFlow: "Seamless Flow",
    useCases: "USE CASES",
    startIntegration: "Start Integration",
    docs: "Documentation",
    networks: "NETWORKS",
    accept: "Accept",
    technicalDocs: "Technical Docs",
    tryDemo: "Try Demo",
    common: {
      whyChoose: "Why choose",
      engineered: "Engineered for maximum efficiency and security in the decentralized economy.",
      implementation: "IMPLEMENTATION",
      readyInMinutes: "Production-ready in minutes",
      integrateEase: "Integrate our high-performance API into your existing stack with ease.",
      management: "MANAGEMENT",
      workflow: "WORKFLOW",
      intelligence: "INTELLIGENCE",
      readyToScale: "Ready to Scale?",
      joinMerchants: "Join hundreds of merchants who have already optimized their revenue flow with Reqst.",
      benefits: "BENEFITS",
    },
    ogSubtitle: "Next-generation crypto payments infrastructure",
    checkoutProduct: {
      metadata: {
        title: "Accept Crypto Payments | Non-Custodial Checkout for TON, TRC-20, Solana",
        description: "Scale your business with the highest-converting crypto checkout. Support USDT (TRC-20, TON, Solana, EVM) with 0% turnover fees. Non-custodial, secure, and Telegram-ready.",
        keywords: "accept crypto payments, crypto checkout gateway, TON payments, TRON USDT gateway, Solana checkout, non-custodial crypto payment, telegram payment bot api, usdt trc20 checkout"
      },
      kicker: "CONVERSION ENGINE",
      title: "Checkout: The Gold Standard of Crypto UX",
      description: "Why settle for generic payment links? Offer a premium, non-custodial checkout experience engineered to eliminate 'copy-paste' fatigue and reduce underpayment errors.",
      hero: {
        title: "Maximum Conversion. Minimum Friction.",
        body: "Reqst Checkout is the ultimate non-custodial interface designed to turn abandoned carts into confirmed transactions. Seamlessly integrated, multi-chain by default, and optimized for every device.",
        cta: "Try Live Demo"
      },
      comparison: {
        title: "The Reqst Evolution",
        items: [
          {
            legacy: "Manual wallet address copying leads to errors and lost funds.",
            reqst: "QR-native flow and one-tap deep linking ensures 100% accuracy."
          },
          {
            legacy: "Customers get stuck on 'waiting' screens for minutes.",
            reqst: "Sub-second mempool monitoring provides instant visual feedback."
          },
          {
            legacy: "Underpayments cause support nightmares and order loss.",
            reqst: "Intelligent resolution prompts for the exact remaining balance."
          }
        ]
      },
      bento: {
        title: "Micro-Features, Macro Impact",
        items: [
          { title: "TWA Optimized", body: "Seamless integration for Telegram Mini Apps with Haptic Feedback." },
          { title: "Biometric Ready", body: "Works with FaceID/TouchID via supported mobile wallets." },
          { title: "Real-Time Deltas", body: "Automatic calculation of exchange rates and network fees." },
          { title: "Global Reach", body: "Localized interface for 20+ regions and counting." },
          { title: "Custom Branding", body: "Inject your logo and brand colors for a native look." },
          { title: "Network Safety", body: "Built-in alerts for incorrect network selection." }
        ]
      },
      deepDive: [
        {
          title: "Intelligent Underpayment Resolution",
          body: "Underpayments are the #1 cause of support tickets in crypto. Reqst solves this by detecting the partial amount, instantly updating the checkout UI with the remaining balance, and allowing the customer to complete the transaction without starting over. No more lost orders, no more manual refunds."
        },
        {
          title: "Native Telegram Integration",
          body: "Our checkout UI is precision-engineered for the Telegram ecosystem. When running as a Telegram Web App (TWA), Reqst utilizes native haptics, theme-aware styling, and deep-link acceleration to provide a payment experience that feels like a core part of the app, not a third-party popup."
        },
        {
          title: "Cross-Chain Unified UI",
          body: "Whether it's the 10-decimal precision of Solana or the unique memo requirements of TON, Reqst abstracts the complexity. Your customers get a consistent, polished experience regardless of the underlying blockchain technology, reducing cognitive load and increasing trust."
        }
      ],
      stats: [
        { value: "1.2s", label: "Avg Detection" },
        { value: "0%", label: "Turnover Fee" },
        { value: "99.9%", label: "Node Uptime" },
        { value: "<5ms", label: "UI Latency" }
      ],
      finalTitle: "Ready to optimize your checkout conversion?",
      seo: "Reqst Checkout is a non-custodial payment gateway engineered for high-conversion cryptocurrency processing. Designed to eliminate friction in digital commerce, the UI supports direct-to-wallet transactions across TON, TRON (TRC-20), Solana, and EVM-compatible networks. Core functionality includes dynamic exchange rate calculation, native integration for Telegram Mini Apps (TWA), and intelligent underpayment resolution to recover partial transactions. By bypassing intermediary custodians, merchants retain full control of their liquidity while providing customers with a seamless, multi-chain payment experience without turnover fees."
    },
    apiProduct: {
      metadata: {
        title: "Unified Blockchain API | Webhooks & Monitoring for TON, TRON, EVM",
        description: "High-performance crypto infrastructure for developers. One API for TON, TRC-20, Solana and EVM with 100% webhook delivery and HMAC security.",
        keywords: "crypto payment api, blockchain monitoring api, webhooks for crypto, TON developer api, TRON trc20 api, automated crypto payments, unified blockchain api"
      },
      kicker: "DEVELOPER FIRST",
      title: "API & Infrastructure for Scale",
      description: "Reliability is the only metric that matters. Reqst API provides the high-performance primitives you need to build production-grade payment flows.",
      hero: {
        title: "Built by Developers, for Developers.",
        body: "Automate your revenue flow with our robust API and high-performance blockchain monitoring engine. From idempotent requests to HMAC-signed webhooks.",
        cta: "Read Documentation"
      },
      comparison: {
        title: "Engineering Excellence",
        items: [
          {
            legacy: "Managing multiple RPC nodes and brittle explorers.",
            reqst: "One unified API for 7+ chains with standardized JSON."
          },
          {
            legacy: "Webhooks that fail without retry logic or signatures.",
            reqst: "Guaranteed delivery with exponential backoff and HMAC."
          },
          {
            legacy: "Duplicate processing of the same transaction.",
            reqst: "Built-in idempotency keys for exactly-once execution."
          }
        ]
      },
      bento: {
        title: "Hardened Infrastructure",
        items: [
          { title: "HMAC Signatures", body: "Every webhook is signed with SHA-256 for maximum security." },
          { title: "Idempotency", body: "Protect your database from double-writes with native keys." },
          { title: "Rate Limiting", body: "Tiered access designed for high-throughput applications." },
          { title: "SDKs & Docs", body: "Modern OpenAPI specs and libraries for rapid integration." },
          { title: "Log Retention", body: "Detailed history of every request and webhook attempt." },
          { title: "Status Codes", body: "Standardized HTTP responses for predictable error handling." }
        ]
      },
      deepDive: [
        {
          title: "Guaranteed Webhook Delivery",
          body: "Our webhook engine uses a persistent queue. If your server is down, we retry with exponential backoff for up to 24 hours. Every payload is cryptographically signed, ensuring that your backend only processes verified events and never misses a confirmation."
        },
        {
          title: "Unified Chain Abstraction",
          body: "Integrating TON, TRON, and EVM usually requires three different libraries and logic flows. Reqst provides a single schema for all networks. Create an invoice for TRC-20 USDT the same way you create one for TON Jettons or Solana assets."
        },
        {
          title: "High-Performance Watchers",
          body: "Our infrastructure bypasses public RPC bottlenecks by utilizing a private cluster of dedicated nodes. This allows us to detect mempool events faster than 95% of standard block explorers, giving your application a truly real-time, reactive feel."
        }
      ],
      stats: [
        { value: "50ms", label: "API Response" },
        { value: "100%", label: "Webhook Delivery" },
        { value: "7+", label: "Chains" },
        { value: "128-bit", label: "Encryption" }
      ],
      finalTitle: "Build your next-gen payment flow today.",
      seo: "The Reqst Unified API provides robust infrastructure for developers integrating blockchain payments into B2B software, gaming platforms, and enterprise applications. Instead of managing disparate RPC nodes, development teams utilize a single RESTful interface to interact with multiple protocols including TRON, TON, and Ethereum. The system prioritizes transactional integrity via native idempotency keys to prevent duplicate processing, while the webhook engine ensures guaranteed delivery utilizing exponential backoff and HMAC-SHA256 payload signatures for secure, asynchronous event monitoring."
    },
    invoicingProduct: {
      metadata: {
        title: "Professional Crypto Invoicing | B2B Billing Solution with 0% Fees",
        description: "Issue, track, and manage professional crypto invoices. Support for USDT, TON, and Solana. Non-custodial, automated tracking, and CSV reports for accounting.",
        keywords: "crypto invoicing for business, b2b crypto billing, freelance crypto invoices, professional usdt billing, crypto payment tracking, 0 fee crypto invoicing"
      },
      kicker: "BUSINESS GRADE",
      title: "Invoicing: Professional Billing for Modern Commerce",
      description: "Stop using spreadsheets. Reqst Invoicing provides a professional way to issue, track, and manage crypto payments with zero turnover fees.",
      hero: {
        title: "Professional Billing for the Crypto Native.",
        body: "Move beyond manual wallet screenshots and spreadsheet tracking. Issue, track, and manage invoices with a UI that commands respect from your clients.",
        cta: "Create First Invoice"
      },
      comparison: {
        title: "Upgrade Your Workflow",
        items: [
          {
            legacy: "Sending 'trust me' wallet addresses in Telegram DMs.",
            reqst: "Branded hosted invoice pages with real-time status."
          },
          {
            legacy: "Manually checking explorers for client payments.",
            reqst: "Instant Telegram and Email alerts when settled."
          },
          {
            legacy: "Cluttered spreadsheets for monthly accounting.",
            reqst: "Centralized console with CSV/JSON export capabilities."
          }
        ]
      },
      bento: {
        title: "Full Control, Zero Fees",
        items: [
          { title: "Merchant Console", body: "A centralized hub to manage every invoice and client." },
          { title: "Telegram Alerts", body: "Get notified the second a payment is detected." },
          { title: "Manual Overrides", body: "Flexibility to approve transactions manually if needed." },
          { title: "Client Directory", body: "Store and manage frequent payer addresses and details." },
          { title: "CSV Exports", body: "One-click reporting for tax and accounting purposes." },
          { title: "Branded Links", body: "Custom titles and descriptions for every billing request." }
        ]
      },
      deepDive: [
        {
          title: "B2B Workflow Automation",
          body: "Reqst Invoicing is designed for businesses that need more than just a payment link. Manage the entire lifecycle from draft to settlement. Track 'Overdue' or 'Underpaid' states and communicate professionally with your partners at every step."
        },
        {
          title: "Direct-to-Wallet Security",
          body: "Unlike custodial competitors, Reqst never touches the funds in your invoices. Your clients pay you directly on-chain. Our service acts as a professional monitoring layer, ensuring you get notified without having to watch the ledger yourself."
        },
        {
          title: "Global Multi-Currency Support",
          body: "Bill in USD or any supported stablecoin. Reqst handles the real-time conversion rates, ensuring that the amount of USDT, TON, or SOL requested matches your desired fiat value at the moment the invoice is generated."
        }
      ],
      stats: [
        { value: "0%", label: "Escrow Risk" },
        { value: "24/7", label: "Monitoring" },
        { value: "<1min", label: "Creation" },
        { value: "100%", label: "Non-Custodial" }
      ],
      finalTitle: "Professionalize your B2B billing now.",
      seo: "Streamline corporate financial operations with Reqst Invoicing, a specialized billing solution tailored for B2B crypto transactions and freelance accounting. The platform enables businesses to generate branded, multi-currency invoices with automated fiat-to-crypto pegging at the time of creation. Administrative features include real-time payment tracking via dedicated Telegram and email notifications, centralized client management, and comprehensive CSV export capabilities to simplify tax reporting and reconciliation. Operating on a zero-fee, direct-transfer model, it modernizes accounts receivable without introducing third-party holding risks."
    },
    breadcrumbs: {
      home: "Home",
      blog: "Blog",
      compare: "Compare",
      useCases: "Use Cases",
      networks: "Networks",
      products: "Products",
      invoicing: "Invoicing",
    },
    productsHub: {
      title: "Solutions for Every Business Scale",
      description: "From simple payment links to enterprise-grade infrastructure. Choose the product that fits your current growth stage.",
      kicker: "PRODUCTS",
      checkout: {
        title: "Checkout",
        desc: "A ready-to-use, high-converting payment UI that supports all major networks. Perfect for selling digital goods and services.",
        link: "Learn more",
      },
      api: {
        title: "API & Webhooks",
        desc: "Full-featured infrastructure for developers. Automate payments, track transactions in real-time, and scale with confidence.",
        link: "Learn more",
      },
      invoicing: {
        title: "Invoicing",
        desc: "Professional billing tools for B2B and freelancers. Issue invoices, track status, and manage your clients in one place.",
        link: "Learn more",
      }
    },
    networksHub: {
      title: "Universal Blockchain Connectivity",
      description: "We bridge the gap between businesses and decentralized liquidity. Reqst supports all major protocols with a single integration.",
      kicker: "NETWORKS",
      explanation: "All networks operate on a direct-to-wallet basis. We never touch your funds, ensuring maximum security and zero counterparty risk."
    },
    networkPages: {
      ton: {
        name: "TON",
        fullName: "The Open Network",
        metadata: {
          title: "Accept TON Payments for Telegram Commerce",
          description: "Use Reqst to accept TON and supported Jetton payments with hosted Checkout, API invoices, payment comments, and direct-to-wallet settlement.",
        },
        kicker: "TON NETWORK",
        hero: {
          title: "TON payments built for Telegram-native commerce.",
          body: "Reqst turns TON transfers into clean checkout states for Telegram shops, paid communities, and mobile-first buyers while keeping funds direct to your wallet.",
        },
        snapshot: {
          kicker: "NETWORK INVOICE",
          title: "checkout.network.ton",
          amount: "79.00 USDT",
          items: [
            { label: "Rail", value: "TON" },
            { label: "Matching", value: "Comment" },
            { label: "Payout", value: "Direct" },
          ],
        },
        assets: {
          kicker: "SUPPORTED ASSETS",
          title: "TON-native assets for buyer-facing checkout.",
          body: "Use TON for Telegram-native payment flows and supported Jettons when your workspace enables them.",
          items: [
            { name: "TON", body: "Native TON transfers for simple Telegram and wallet-native payments." },
            { name: "Jettons", body: "Supported TON Jettons can be exposed as checkout options for compatible wallets." },
            { name: "TON USDT", body: "Use stablecoin checkout on TON where the asset is enabled for your merchant setup." },
          ],
        },
        why: {
          kicker: "WHY TON",
          title: "A natural payment rail for Telegram buyers.",
          body: "TON reduces friction when your customers already live in Telegram, use TON wallets, or buy access and digital goods from mobile chats.",
        },
        mechanics: {
          kicker: "CHECKOUT AND API MECHANICS",
          title: "Payment comments make TON matching reliable.",
          steps: [
            { title: "Create invoice", body: "Checkout or API creates a TON payment request with the exact amount, asset, address, and required comment." },
            { title: "Show payment", body: "The buyer sees a hosted page with QR, copyable address, amount, and clear comment instructions." },
            { title: "Detect transfer", body: "Reqst watchers match the incoming transfer by amount and required payment comment." },
            { title: "Send event", body: "Your dashboard or webhook receives the paid state for fulfillment, access, or order updates." },
          ],
        },
        limitations: {
          kicker: "LIMITATIONS AND NOTES",
          title: "The payment comment must stay intact.",
          body: "TON matching depends on the required comment. Missing or edited comments, wrong assets, or wrong network payments may need manual review instead of automatic confirmation.",
        },
        useCases: {
          kicker: "RELEVANT USE CASES",
          title: "Best for Telegram-led revenue.",
          body: "TON is strongest when the buyer journey starts in chat or a Telegram Mini App.",
          items: [
            { name: "Telegram shops", body: "Create checkout links for orders and stop asking buyers for screenshots." },
            { name: "Paid communities", body: "Connect membership payments to access decisions for private channels and groups." },
            { name: "Digital goods", body: "Sell files, keys, and access from Telegram-native storefronts." },
          ],
        },
        related: {
          kicker: "RELATED",
          title: "Build the TON payment flow.",
          links: [
            { kicker: "Use Case", label: "Telegram Shops", body: "Telegram commerce flows with checkout links and live payment states.", href: "/use-cases/telegram-shops" },
            { kicker: "Product", label: "Checkout", body: "Hosted payment screens for TON orders.", href: "/products/checkout" },
            { kicker: "Plan", label: "Merchant", body: "Dashboard workflow for sellers and operators.", href: "/merchant" },
          ],
        },
        cta: {
          title: "Launch TON checkout with direct settlement.",
          body: "Use Reqst to accept TON payments, detect transfers automatically, and keep customer payments flowing directly to your wallet.",
          primary: { label: "Start accepting TON", href: "/app/auth" },
          secondary: { label: "Explore Checkout", href: "/products/checkout" },
        },
        seoLabel: "TON network payment details",
        seo: "Reqst supports TON payments for Telegram commerce with hosted Checkout, API invoice creation, required payment comments, blockchain watchers, direct-to-wallet settlement, and webhooks for order or access automation.",
      },
      tron: {
        name: "TRON",
        fullName: "TRON Network",
        metadata: {
          title: "Accept TRON USDT Payments for SaaS and Business",
          description: "Accept USDT TRC-20 through Reqst Checkout and API with stablecoin-friendly invoices, watcher matching, signed webhooks, and direct payouts.",
        },
        kicker: "TRON NETWORK",
        hero: {
          title: "TRON USDT payments for global stablecoin buyers.",
          body: "Reqst makes TRC-20 USDT practical for SaaS, invoices, and business checkout flows without percentage fees or custodial settlement accounts.",
        },
        snapshot: {
          kicker: "STABLECOIN INVOICE",
          title: "invoice.network.tron",
          amount: "199.00 USDT",
          items: [
            { label: "Asset", value: "USDT TRC-20" },
            { label: "Matching", value: "Amount" },
            { label: "Webhook", value: "Signed" },
          ],
        },
        assets: {
          kicker: "SUPPORTED ASSETS",
          title: "USDT-first stablecoin acceptance.",
          body: "TRON is usually selected for predictable USD-denominated payments and customers who already use TRC-20 transfers.",
          items: [
            { name: "USDT TRC-20", body: "Primary stablecoin rail for checkout, SaaS billing, and B2B invoice payments." },
            { name: "TRX", body: "Native TRON asset used by wallets for transaction costs and operational balances." },
            { name: "Configured tokens", body: "Additional TRC-20 assets can be handled where they are enabled for the workspace." },
          ],
        },
        why: {
          kicker: "WHY TRON",
          title: "Stablecoin familiarity matters for conversion.",
          body: "Many global customers already hold USDT on TRON. Supporting it lets businesses collect predictable payments without pushing buyers into a new rail.",
        },
        mechanics: {
          kicker: "CHECKOUT AND API MECHANICS",
          title: "Exact invoice matching for TRC-20 transfers.",
          steps: [
            { title: "Create invoice", body: "Checkout or API creates a TRON invoice for the exact USDT amount and destination wallet." },
            { title: "Guide buyer", body: "Checkout shows TRC-20 network instructions, QR, address, and a live payment state." },
            { title: "Track transfer", body: "Reqst watchers detect the incoming TRC-20 transfer and match it to the invoice." },
            { title: "Confirm payment", body: "Signed webhooks and dashboard events move your order, invoice, or subscription to paid." },
          ],
        },
        limitations: {
          kicker: "LIMITATIONS AND NOTES",
          title: "TRC-20 is not interchangeable with other USDT rails.",
          body: "Buyers must send USDT on TRON, not ERC-20, BEP-20, or another network. Wallets also need enough TRX or energy to complete the transfer.",
        },
        useCases: {
          kicker: "RELEVANT USE CASES",
          title: "Best for stablecoin-heavy products.",
          body: "Use TRON when pricing is USD-denominated and buyers expect to pay with USDT.",
          items: [
            { name: "SaaS billing", body: "Collect subscription payments and renewals with predictable stablecoin amounts." },
            { name: "Business invoices", body: "Send payment requests where clients already prefer TRC-20 USDT." },
            { name: "Digital goods", body: "Offer a familiar stablecoin option for keys, files, and account access." },
          ],
        },
        related: {
          kicker: "RELATED",
          title: "Build around USDT demand.",
          links: [
            { kicker: "Stablecoin", label: "USDT Checkout", body: "Use hosted payment pages for USDT-denominated orders.", href: "/products/checkout" },
            { kicker: "Use Case", label: "SaaS Billing", body: "API and webhooks for subscription payment flows.", href: "/use-cases/saas-billing" },
            { kicker: "Plan", label: "Business", body: "Higher limits and team workflow for payment operations.", href: "/business" },
          ],
        },
        cta: {
          title: "Accept TRON USDT without manual reconciliation.",
          body: "Use Reqst to issue TRC-20 invoices, track transfers in real time, and connect stablecoin payments to your business systems.",
          primary: { label: "Start with USDT", href: "/app/auth" },
          secondary: { label: "View Business", href: "/business" },
        },
        seoLabel: "TRON USDT payment details",
        seo: "Reqst enables TRON USDT payments through Checkout, API invoices, TRC-20 watcher detection, signed webhooks, direct-to-wallet settlement, and stablecoin payment flows for SaaS and business use cases.",
      },
      solana: {
        name: "Solana",
        fullName: "Solana Blockchain",
        metadata: {
          title: "Accept Solana Payments with API and Checkout",
          description: "Use Reqst to accept SOL and supported SPL assets with fast checkout flows, API invoices, watcher detection, and signed webhooks.",
        },
        kicker: "SOLANA NETWORK",
        hero: {
          title: "Solana payments for fast developer-owned checkout.",
          body: "Reqst brings SOL and supported SPL assets into one payment API, so web3 products can create invoices and react to confirmed transfers without custom watcher logic.",
        },
        snapshot: {
          kicker: "API EVENT",
          title: "payment.network.solana",
          amount: "49.00 USDC",
          items: [
            { label: "Assets", value: "SOL / SPL" },
            { label: "Flow", value: "API" },
            { label: "Status", value: "Detected" },
          ],
        },
        assets: {
          kicker: "SUPPORTED ASSETS",
          title: "Native and SPL payments where enabled.",
          body: "Solana support fits teams that need fast wallet-native payments for web3 audiences.",
          items: [
            { name: "SOL", body: "Native Solana transfers for wallet-native checkout and balances." },
            { name: "SPL USDC", body: "Stablecoin payments for products that price in USD." },
            { name: "SPL USDT", body: "Alternative SPL stablecoin support where configured for the merchant." },
          ],
        },
        why: {
          kicker: "WHY SOLANA",
          title: "Fast payment feedback for web3 users.",
          body: "Solana is a strong fit when your buyers already use Solana wallets and expect quick confirmation in developer tools, apps, or digital goods flows.",
        },
        mechanics: {
          kicker: "CHECKOUT AND API MECHANICS",
          title: "One invoice flow for SOL and SPL assets.",
          steps: [
            { title: "Create invoice", body: "Your backend creates a Solana invoice through Reqst API or uses hosted Checkout." },
            { title: "Show wallet data", body: "Checkout displays network, asset, amount, address, and QR in a buyer-friendly screen." },
            { title: "Watch transfer", body: "Reqst tracks native or SPL transfers and matches the payment to the invoice." },
            { title: "Trigger backend", body: "A signed webhook tells your product when to unlock access, deliver goods, or update status." },
          ],
        },
        limitations: {
          kicker: "LIMITATIONS AND NOTES",
          title: "Asset and wallet selection must be precise.",
          body: "Buyers need to send the configured Solana asset on Solana. Token account behavior, wallet support, and temporary network congestion can affect the payment experience.",
        },
        useCases: {
          kicker: "RELEVANT USE CASES",
          title: "Best for web3-native products.",
          body: "Solana is useful when payments are part of a product that already speaks to developers, creators, or crypto-native buyers.",
          items: [
            { name: "Developer tools", body: "Create invoices from your backend and use webhooks for automated access." },
            { name: "Digital goods", body: "Sell keys, downloads, or licenses to Solana wallet users." },
            { name: "Web3 apps", body: "Add a fast payment option for users already active in the Solana ecosystem." },
          ],
        },
        related: {
          kicker: "RELATED",
          title: "Connect Solana to your backend.",
          links: [
            { kicker: "Product", label: "API", body: "Create invoices and receive normalized payment events.", href: "/products/api" },
            { kicker: "Plan", label: "Developer", body: "API and webhooks for production integrations.", href: "/dev" },
            { kicker: "Docs", label: "Integration", body: "Read the developer documentation for payment automation.", href: "/docs" },
          ],
        },
        cta: {
          title: "Add Solana payments to your product.",
          body: "Use Reqst API and Checkout to accept Solana assets and let signed events drive your payment state.",
          primary: { label: "Start integration", href: "/app/auth" },
          secondary: { label: "Explore API", href: "/products/api" },
        },
        seoLabel: "Solana network payment details",
        seo: "Reqst supports Solana payments with SOL and configured SPL assets, hosted Checkout, API invoice creation, blockchain watchers, signed webhooks, and developer-focused payment automation.",
      },
      base: {
        name: "Base",
        fullName: "Base L2",
        metadata: {
          title: "Accept Base Payments with Unified API",
          description: "Accept ETH and supported ERC-20 assets on Base with Reqst Checkout, API invoices, watcher monitoring, and business-ready webhooks.",
        },
        kicker: "BASE NETWORK",
        hero: {
          title: "Base payments for EVM buyers and low-cost checkout.",
          body: "Reqst lets teams add Base to the same checkout and API flow they use for other networks, with direct settlement and normalized payment events.",
        },
        snapshot: {
          kicker: "L2 INVOICE",
          title: "payment.network.base",
          amount: "99.00 USDC",
          items: [
            { label: "Rail", value: "Base" },
            { label: "Assets", value: "ETH / ERC-20" },
            { label: "API", value: "Unified" },
          ],
        },
        assets: {
          kicker: "SUPPORTED ASSETS",
          title: "Base-native EVM payments.",
          body: "Use Base for buyers who already operate on Coinbase-aligned or EVM-compatible L2 rails.",
          items: [
            { name: "ETH on Base", body: "Native gas and payment asset for Base wallets." },
            { name: "USDC on Base", body: "Common stablecoin option for USD-priced checkout." },
            { name: "Configured ERC-20", body: "Additional Base tokens can be accepted where enabled for the workspace." },
          ],
        },
        why: {
          kicker: "WHY BASE",
          title: "EVM compatibility with lower checkout friction.",
          body: "Base fits businesses serving onchain users who want familiar EVM wallets, lower fees than mainnet, and stablecoin-friendly payment options.",
        },
        mechanics: {
          kicker: "CHECKOUT AND API MECHANICS",
          title: "Same Reqst flow, Base-specific watcher.",
          steps: [
            { title: "Create invoice", body: "Use Checkout or API with Base as the payable network and the configured asset." },
            { title: "Present payment", body: "The buyer sees Base network instructions, amount, address, and QR." },
            { title: "Monitor chain", body: "Reqst watches native and ERC-20 transfers on Base and matches them to invoices." },
            { title: "Emit webhook", body: "Your backend receives the same normalized payment state used across other supported networks." },
          ],
        },
        limitations: {
          kicker: "LIMITATIONS AND NOTES",
          title: "Base assets must be sent on Base.",
          body: "Ethereum mainnet, Arbitrum, BSC, and other EVM transfers are separate networks. Wrong-chain deposits are not automatically interchangeable with Base payments.",
        },
        useCases: {
          kicker: "RELEVANT USE CASES",
          title: "Best for EVM-oriented checkout.",
          body: "Base works well when your customers already use EVM wallets or Coinbase-aligned onchain products.",
          items: [
            { name: "Business checkout", body: "Offer a lower-cost EVM option for high-volume payment flows." },
            { name: "API integrations", body: "Add Base without creating separate invoice and webhook logic." },
            { name: "Digital products", body: "Serve web3 buyers who prefer Base wallets and stablecoins." },
          ],
        },
        related: {
          kicker: "RELATED",
          title: "Add Base to business payments.",
          links: [
            { kicker: "Product", label: "API", body: "Unified invoice creation and webhook events.", href: "/products/api" },
            { kicker: "Plan", label: "Business", body: "Higher limits and team operations for scale.", href: "/business" },
            { kicker: "Plan", label: "Developer", body: "Production API access for backend integrations.", href: "/dev" },
          ],
        },
        cta: {
          title: "Accept Base payments through one integration.",
          body: "Use Reqst to add Base checkout, monitor transfers, and keep your backend payment logic consistent across networks.",
          primary: { label: "Start integration", href: "/app/auth" },
          secondary: { label: "Explore API", href: "/products/api" },
        },
        seoLabel: "Base network payment details",
        seo: "Reqst supports Base payments with ETH and configured ERC-20 assets, hosted Checkout, API invoices, Base watchers, normalized webhooks, direct-to-wallet settlement, and business payment workflows.",
      },
      bsc: {
        name: "BSC",
        fullName: "BNB Smart Chain",
        metadata: {
          title: "Accept BSC Payments with Checkout and API",
          description: "Accept BNB and supported BEP-20 assets on BSC with Reqst payment links, API invoices, watcher detection, and direct-to-wallet settlement.",
        },
        kicker: "BSC NETWORK",
        hero: {
          title: "BSC payments for broad retail stablecoin reach.",
          body: "Reqst helps businesses accept BNB Smart Chain payments through a clean checkout and unified API flow built for direct settlement.",
        },
        snapshot: {
          kicker: "BEP-20 INVOICE",
          title: "payment.network.bsc",
          amount: "149.00 USDT",
          items: [
            { label: "Rail", value: "BSC" },
            { label: "Assets", value: "BNB / BEP-20" },
            { label: "Status", value: "Live" },
          ],
        },
        assets: {
          kicker: "SUPPORTED ASSETS",
          title: "BNB and BEP-20 checkout options.",
          body: "BSC gives customers a familiar low-fee payment network for native and token transfers.",
          items: [
            { name: "BNB", body: "Native asset for BSC payments and wallet gas." },
            { name: "BEP-20 USDT", body: "Stablecoin checkout for buyers who hold USDT on BNB Smart Chain." },
            { name: "BEP-20 USDC", body: "USD-priced payments where USDC on BSC is configured." },
          ],
        },
        why: {
          kicker: "WHY BSC",
          title: "Low fees and wide retail familiarity.",
          body: "BSC is useful for businesses serving customers who already use BEP-20 stablecoins and expect inexpensive transfers.",
        },
        mechanics: {
          kicker: "CHECKOUT AND API MECHANICS",
          title: "BEP-20 monitoring without separate business logic.",
          steps: [
            { title: "Create invoice", body: "Choose BSC and the payable asset through hosted Checkout or the Reqst API." },
            { title: "Show instructions", body: "Checkout shows BSC network details, QR, address, amount, and payment state." },
            { title: "Detect transfer", body: "Reqst watchers track native BNB and BEP-20 transfers for the invoice." },
            { title: "Update system", body: "Dashboard and webhooks update your order, invoice, or account state after confirmation." },
          ],
        },
        limitations: {
          kicker: "LIMITATIONS AND NOTES",
          title: "BEP-20 only means BSC only.",
          body: "Buyers must send the selected asset on BSC and keep enough BNB for gas. USDT or USDC sent on another chain is outside automatic BSC matching.",
        },
        useCases: {
          kicker: "RELEVANT USE CASES",
          title: "Best for retail and business checkout.",
          body: "Use BSC when your buyer base already holds BEP-20 assets or wants a low-cost EVM-compatible option.",
          items: [
            { name: "Business payments", body: "Accept stablecoins from customers who already use BSC wallets." },
            { name: "Checkout links", body: "Create payment pages with clear BSC instructions for every order." },
            { name: "API automation", body: "Route BEP-20 payment events into your backend workflow." },
          ],
        },
        related: {
          kicker: "RELATED",
          title: "Connect BSC to operations.",
          links: [
            { kicker: "Product", label: "API", body: "Unified invoices and webhooks for BSC payments.", href: "/products/api" },
            { kicker: "Plan", label: "Business", body: "Team and limit structure for growing payment volume.", href: "/business" },
            { kicker: "Product", label: "Checkout", body: "Hosted BSC payment pages for orders and invoices.", href: "/products/checkout" },
          ],
        },
        cta: {
          title: "Add BSC payments without extra reconciliation.",
          body: "Use Reqst to accept BNB Smart Chain transfers through Checkout, API invoices, and real-time payment events.",
          primary: { label: "Start accepting BSC", href: "/app/auth" },
          secondary: { label: "View Business", href: "/business" },
        },
        seoLabel: "BSC network payment details",
        seo: "Reqst supports BSC payments with BNB and configured BEP-20 assets, hosted Checkout, API invoice creation, blockchain watchers, webhooks, and direct-to-wallet settlement for business payment flows.",
      },
      arbitrum: {
        name: "Arbitrum",
        fullName: "Arbitrum One",
        metadata: {
          title: "Accept Arbitrum Payments with Reqst API",
          description: "Accept ETH and supported ERC-20 assets on Arbitrum One with Checkout, API invoices, watcher monitoring, webhooks, and direct settlement.",
        },
        kicker: "ARBITRUM NETWORK",
        hero: {
          title: "Arbitrum payments for Ethereum-aligned buyers.",
          body: "Reqst adds Arbitrum One to your payment stack with the same checkout, invoice, and webhook model used across supported networks.",
        },
        snapshot: {
          kicker: "L2 PAYMENT",
          title: "payment.network.arbitrum",
          amount: "249.00 USDC",
          items: [
            { label: "Rail", value: "Arbitrum One" },
            { label: "Assets", value: "ETH / ERC-20" },
            { label: "Settlement", value: "Direct" },
          ],
        },
        assets: {
          kicker: "SUPPORTED ASSETS",
          title: "Arbitrum-native ETH and ERC-20 payments.",
          body: "Use Arbitrum for customers who want Ethereum-compatible assets with lower transaction costs than mainnet.",
          items: [
            { name: "ETH on Arbitrum", body: "Native Arbitrum ETH payments and wallet gas." },
            { name: "USDC on Arbitrum", body: "Stablecoin checkout for USD-priced invoices and services." },
            { name: "Configured ERC-20", body: "Additional Arbitrum One tokens can be accepted where enabled." },
          ],
        },
        why: {
          kicker: "WHY ARBITRUM",
          title: "Ethereum alignment without mainnet costs.",
          body: "Arbitrum is a practical option for EVM-native customers who prefer Ethereum tooling but need lower fees for routine payments.",
        },
        mechanics: {
          kicker: "CHECKOUT AND API MECHANICS",
          title: "Normalized events for Arbitrum transfers.",
          steps: [
            { title: "Create invoice", body: "Use Reqst Checkout or API with Arbitrum One as the payable network." },
            { title: "Guide payment", body: "The buyer sees Arbitrum-specific address, amount, asset, and QR instructions." },
            { title: "Monitor transfer", body: "Reqst watchers detect native and ERC-20 transfers on Arbitrum One." },
            { title: "Sync backend", body: "Signed webhooks update your order or billing system with the same event shape as other networks." },
          ],
        },
        limitations: {
          kicker: "LIMITATIONS AND NOTES",
          title: "Arbitrum One is separate from mainnet and other L2s.",
          body: "Payments must be sent on Arbitrum One. Ethereum mainnet, Base, BSC, or other EVM transfers are different rails and will not be treated as the same payment automatically.",
        },
        useCases: {
          kicker: "RELEVANT USE CASES",
          title: "Best for EVM-native businesses.",
          body: "Arbitrum works well for teams whose buyers already operate in Ethereum L2 environments.",
          items: [
            { name: "API payments", body: "Add Arbitrum to backend-driven invoice and webhook flows." },
            { name: "Business billing", body: "Collect stablecoin invoices from Ethereum-aligned customers." },
            { name: "Web3 services", body: "Support buyers who prefer L2 settlement for recurring or one-time services." },
          ],
        },
        related: {
          kicker: "RELATED",
          title: "Use Arbitrum in production flows.",
          links: [
            { kicker: "Product", label: "API", body: "Create Arbitrum invoices and process signed payment events.", href: "/products/api" },
            { kicker: "Plan", label: "Business", body: "Scale EVM payment operations with team features.", href: "/business" },
            { kicker: "Plan", label: "Developer", body: "Backend integration access for production teams.", href: "/dev" },
          ],
        },
        cta: {
          title: "Add Arbitrum payments to your checkout stack.",
          body: "Use Reqst to accept Arbitrum One payments, monitor transfers, and keep settlement direct to your wallet.",
          primary: { label: "Start integration", href: "/app/auth" },
          secondary: { label: "Explore API", href: "/products/api" },
        },
        seoLabel: "Arbitrum network payment details",
        seo: "Reqst supports Arbitrum One payments with ETH and configured ERC-20 assets, hosted Checkout, API invoices, blockchain watchers, signed webhooks, and direct-to-wallet settlement for EVM business workflows.",
      },
    },
    useCasesHub: {
      title: "Solutions for Every Business Scale",
      description: "Explore how different industries use Reqst to automate their crypto operations and eliminate manual overhead.",
      kicker: "USE CASES",
      customUseCase: {
        title: "Have a unique use case?",
        body: "Our API is flexible enough to power any payment flow. Let's discuss how Reqst can help your specific business.",
      }
    },
    useCasePages: {
      "telegram-shops": {
        name: "Telegram Shops",
        metadata: {
          title: "Accept Crypto Payments in Telegram Bots & Mini Apps",
          description: "Automate Telegram shop payments with TON-first checkout links, direct-to-wallet settlement, and instant order signals.",
        },
        kicker: "TELEGRAM COMMERCE",
        hero: {
          title: "Accept Crypto Payments in Telegram Bots & Mini Apps",
          body: "Reqst provides a high-performance checkout flow, real-time blockchain monitoring, and direct-to-wallet settlement for Telegram-native commerce.",
        },
        snapshot: {
          kicker: "LIVE ORDER",
          title: "Telegram order #4821",
          amount: "79.00 USDT",
          items: [
            { label: "Network", value: "TON" },
            { label: "Status", value: "Detected" },
            { label: "Payout", value: "Direct" },
          ],
        },
        problem: {
          kicker: "PROBLEM",
          title: "Manual payment verification limits scale.",
          body: "Comparing wallet screenshots and checking explorer statuses by hand is prone to error. Partial payments and incorrect network transfers turn simple orders into complex support threads.",
        },
        solution: {
          kicker: "REQST FLOW",
          title: "Automated Checkout Links replace manual checks.",
          body: "Generate secure payment links for every order. Reqst watchers monitor the blockchain 24/7, moving orders to 'paid' state automatically as soon as the transfer is confirmed.",
        },
        productPlan: {
          kicker: "PRODUCT AND PLAN",
          title: "Merchant Console & Checkout",
          body: "Ideal for shop owners who need a professional payment surface and manual oversight with automation capabilities.",
          product: {
            label: "Product",
            title: "Checkout",
            body: "Hosted payment pages with multi-network support, QR codes, and live status updates for a seamless buyer experience.",
            href: "/products/checkout",
            linkLabel: "Explore Checkout",
          },
          plan: {
            label: "Plan",
            title: "Merchant",
            body: "The starting point for business owners. Includes manual link generation, transaction history, and real-time alerts.",
            href: "/merchant",
            linkLabel: "View Merchant",
          },
        },
        networks: {
          kicker: "NETWORKS",
          title: "Optimized for TON & Stablecoins",
          body: "Leverage the TON network for Telegram-native buyers or support USDT (TRC-20) for global stablecoin users.",
          items: [
            { name: "TON", body: "The native choice for Telegram-based commerce and the growing TON ecosystem." },
            { name: "TRON USDT", body: "The global standard for USDT settlement with high throughput and low costs." },
            { name: "Solana / Base", body: "High-performance L1/L2 alternatives for web3-native audiences." },
          ],
        },
        flow: {
          kicker: "INTEGRATION FLOW",
          title: "From Chat to Fulfillment",
          steps: [
            { title: "Invoice Created", body: "The seller or bot generates a payment request for a specific Telegram order." },
            { title: "Checkout Opened", body: "The buyer opens a hosted link showing exact amount, address, and QR." },
            { title: "Transfer Detected", body: "Reqst watchers detect the on-chain transfer and verify the amount instantly." },
            { title: "Order Confirmed", body: "The dashboard signals a paid state, enabling immediate order fulfillment." },
          ],
        },
        related: {
          kicker: "RELATED",
          title: "Build your Telegram stack.",
          links: [
            { kicker: "Network", label: "TON Support", body: "Native payment rails for Telegram Mini Apps.", href: "/networks/ton" },
            { kicker: "Product", label: "Checkout Engine", body: "Hosted screens for every commerce flow.", href: "/products/checkout" },
            { kicker: "Plan", label: "Merchant Tier", body: "The dashboard for manual payment ops.", href: "/merchant" },
          ],
        },
        cta: {
          title: "Ready to automate your Telegram commerce?",
          body: "Stop checking screenshots. Let Reqst handle the blockchain monitoring while you focus on scaling your business.",
          primary: { label: "Start Accepting Payments", href: "/app/auth" },
          secondary: { label: "Explore Checkout", href: "/products/checkout" },
        },
        features: ["TON & Jetton Support", "Real-time Order Status", "Direct-to-Wallet Payouts", "Telegram Mini App Optimized"],
        seoLabel: "Telegram shop crypto payments documentation",
        seo: "Reqst enables Telegram shops to accept crypto payments with hosted checkout links, TON support, stablecoin networks, direct-to-wallet settlement, and real-time payment detection for order fulfillment.",
      },
      "saas-billing": {
        name: "SaaS Billing",
        metadata: {
          title: "Crypto Billing Infrastructure for SaaS Platforms",
          description: "Integrate reliable crypto billing for SaaS subscriptions. Support for TON, TRON, and EVM with 100% webhook delivery and HMAC security.",
        },
        kicker: "SAAS INFRASTRUCTURE",
        hero: {
          title: "Enterprise-Grade Crypto Billing for SaaS",
          body: "Eliminate percentage-based fees. Reqst provides the API primitives for idempotent invoice creation and guaranteed webhook delivery.",
        },
        snapshot: {
          kicker: "BILLING EVENT",
          title: "subscription.renewal.paid",
          amount: "199.00 USDT",
          items: [
            { label: "API", value: "Idempotent" },
            { label: "Webhook", value: "HMAC" },
            { label: "Plan", value: "Developer" },
          ],
        },
        problem: {
          kicker: "PROBLEM",
          title: "Brittle billing flows lead to churn.",
          body: "Handling recurring payments and renewals requires 100% uptime and duplicate-safe logic. Managing disparate blockchain nodes adds unnecessary engineering overhead.",
        },
        solution: {
          kicker: "REQST FLOW",
          title: "Unified API & Signed Webhooks",
          body: "Create invoices via a single REST interface. Use our HMAC-signed webhooks to trigger subscription updates only after cryptographic confirmation.",
        },
        productPlan: {
          kicker: "PRODUCT AND PLAN",
          title: "API & Developer/Business Tiers",
          body: "Engineered for teams that need full programmatic control and high request throughput.",
          product: {
            label: "Product",
            title: "API & Webhooks",
            body: "Idempotent invoice creation and guaranteed event delivery for production-grade billing systems.",
            href: "/products/api",
            linkLabel: "Read API Docs",
          },
          plan: {
            label: "Plan",
            title: "Developer / Business",
            body: "Includes full API access, HMAC signatures, and higher rate limits for scaling software platforms.",
            href: "/dev",
            linkLabel: "View Plans",
          },
        },
        networks: {
          kicker: "NETWORKS",
          title: "Universal Network Support",
          body: "Default to USDT (TRC-20) for business stability or add Base and Arbitrum for lower-cost EVM transactions.",
          items: [
            { name: "TRON USDT", body: "The industry standard for USD-denominated stablecoin billing." },
            { name: "Base / Arbitrum", body: "Optimized L2 networks for low-fee Ethereum ecosystem payments." },
            { name: "TON / Solana", body: "High-performance options for web3-native user bases." },
          ],
        },
        flow: {
          kicker: "INTEGRATION FLOW",
          title: "Automated Renewal Cycle",
          steps: [
            { title: "Invoice Issued", body: "Your billing service creates a Reqst invoice with an idempotency key." },
            { title: "Buyer Notified", body: "The customer pays through your custom UI or our hosted checkout." },
            { title: "Event Verified", body: "Your backend verifies the HMAC signature and processes the 'paid' event." },
            { title: "Access Extended", body: "Subscription state is updated in your DB without manual intervention." },
          ],
        },
        related: {
          kicker: "RELATED",
          title: "Integrate the billing engine.",
          links: [
            { kicker: "Product", label: "Unified API", body: "RESTful primitives for payment automation.", href: "/products/api" },
            { kicker: "Docs", label: "Webhooks Guide", body: "How to handle signed payment callbacks.", href: "/docs/webhooks" },
            { kicker: "Plan", label: "Business Tier", body: "Team access and higher request limits.", href: "/business" },
          ],
        },
        cta: {
          title: "Scale your SaaS with reliable crypto billing.",
          body: "Stop paying 5% to custodial gateways. Switch to a flat-fee infrastructure engineered for performance and security.",
          primary: { label: "Get Started Now", href: "/app/auth" },
          secondary: { label: "Read API Docs", href: "/products/api" },
        },
        features: ["Idempotent API Requests", "HMAC-SHA256 Webhooks", "Subscription Management", "Multi-Chain Abstraction"],
        seoLabel: "SaaS crypto billing infrastructure details",
        seo: "Reqst provides SaaS platforms with robust crypto billing infrastructure, featuring idempotent API calls, HMAC-signed webhooks, and universal support for TON, TRON, and EVM networks with 0% turnover fees.",
      },
      "digital-goods": {
        name: "Digital Goods",
        metadata: {
          title: "Crypto Checkout for Digital Products & Licenses",
          description: "Sell license keys, files, and digital access with automated crypto checkout. Instant fulfillment via webhooks and 0% commission.",
        },
        kicker: "DIGITAL COMMERCE",
        hero: {
          title: "Instant Fulfillment for Digital Goods",
          body: "Automate the delivery of licenses, keys, and downloads. Reqst triggers fulfillment events immediately upon blockchain confirmation.",
        },
        snapshot: {
          kicker: "FULFILLMENT",
          title: "license.delivery.ready",
          amount: "49.00 USDT",
          items: [
            { label: "Product", value: "Checkout" },
            { label: "Webhook", value: "Paid" },
            { label: "Risk", value: "No chargeback" },
          ],
        },
        problem: {
          kicker: "PROBLEM",
          title: "Manual delivery is impossible at scale.",
          body: "Digital products require instant gratification. Waiting for manual transaction verification leads to poor UX and increased support overhead.",
        },
        solution: {
          kicker: "REQST FLOW",
          title: "Checkout-to-Delivery Automation",
          body: "Combine our high-conversion checkout with automated fulfillment logic. Reqst handles the payment monitoring; your server handles the delivery.",
        },
        productPlan: {
          kicker: "PRODUCT AND PLAN",
          title: "Checkout & API Integration",
          body: "A hybrid approach using our hosted UI for payments and our API for automated license delivery.",
          product: {
            label: "Product",
            title: "Checkout & API",
            body: "A ready-to-use payment interface combined with backend events for delivery automation.",
            href: "/products/checkout",
            linkLabel: "Explore Solutions",
          },
          plan: {
            label: "Plan",
            title: "Merchant / Developer",
            body: "Merchant for low volume; Developer for teams needing full webhook-driven fulfillment.",
            href: "/dev",
            linkLabel: "View Plans",
          },
        },
        networks: {
          kicker: "NETWORKS",
          title: "Support Global Stablecoin Demand",
          body: "Support the assets your buyers already hold. TRON USDT is the standard for software, while TON is perfect for Telegram distributions.",
          items: [
            { name: "TRON USDT", body: "Low-fee stablecoin transfers preferred by software and gaming buyers." },
            { name: "TON", body: "The native choice for digital assets sold within the Telegram ecosystem." },
            { name: "Solana", body: "Fast, confirmation-aware monitoring for high-speed digital sales." },
          ],
        },
        flow: {
          kicker: "INTEGRATION FLOW",
          title: "From Payment to Download",
          steps: [
            { title: "Order Created", body: "Your store generates a unique Reqst checkout link for the digital item." },
            { title: "Payment Confirmed", body: "Reqst watchers detect the transaction and verify it against the order." },
            { title: "Webhook Received", body: "Your fulfillment service receives a signed event confirming the payment." },
            { title: "Access Granted", body: "The license key or download link is automatically released to the customer." },
          ],
        },
        related: {
          kicker: "RELATED",
          title: "Automate digital delivery.",
          links: [
            { kicker: "Product", label: "Checkout UI", body: "Ready-to-use payment screens.", href: "/products/checkout" },
            { kicker: "Product", label: "Unified API", body: "Create invoices programmatically.", href: "/products/api" },
            { kicker: "Docs", label: "Webhooks", body: "Trigger delivery on payment events.", href: "/docs/webhooks" },
          ],
        },
        cta: {
          title: "Ready to automate your digital storefront?",
          body: "Switch to Reqst for 0% turnover fees and instant on-chain fulfillment signals.",
          primary: { label: "Start Selling Now", href: "/app/auth" },
          secondary: { label: "Explore API", href: "/products/api" },
        },
        features: ["Instant Payment Detection", "Automated Webhooks", "Low-Fee Networks", "No Chargeback Risk"],
        seoLabel: "Digital goods crypto payment automation details",
        seo: "Reqst provides automated crypto checkout for digital products, supporting instant fulfillment via signed webhooks, multi-chain monitoring, and direct-to-wallet payouts with 0% fees.",
      },
      "paid-communities": {
        name: "Paid Communities",
        metadata: {
          title: "Accept Crypto for Private Communities & Channels",
          description: "Manage membership access for Telegram channels and private groups with automated crypto payments. Support for TON, USDT, and Solana.",
        },
        kicker: "MEMBERSHIP ECONOMY",
        hero: {
          title: "Automated Access for Paid Communities",
          body: "Connect on-chain payments to community access. Reqst provides the infrastructure to monitor memberships and trigger access events automatically.",
        },
        snapshot: {
          kicker: "ACCESS EVENT",
          title: "member.access.granted",
          amount: "29.00 USDT",
          items: [
            { label: "Network", value: "TON" },
            { label: "Channel", value: "Private" },
            { label: "Plan", value: "Merchant" },
          ],
        },
        problem: {
          kicker: "PROBLEM",
          title: "Manual member management does not scale.",
          body: "Checking usernames against wallet transfers is time-consuming and prone to fraud. Handling renewals and expirations manually leads to revenue leakage.",
        },
        solution: {
          kicker: "REQST FLOW",
          title: "Payment States as Access Signals",
          body: "Use Reqst to verify membership payments instantly. Our events can drive your bot or management tool to invite or remove members based on real on-chain data.",
        },
        productPlan: {
          kicker: "PRODUCT AND PLAN",
          title: "Checkout & Merchant Dashboard",
          body: "Perfect for creators who need a professional payment link and a central dashboard to monitor their community's health.",
          product: {
            label: "Product",
            title: "Checkout UI",
            body: "A clean, mobile-optimized payment interface for membership passes and subscriptions.",
            href: "/products/checkout",
            linkLabel: "Explore Checkout",
          },
          plan: {
            label: "Plan",
            title: "Merchant",
            body: "Includes manual invoice tracking, real-time Telegram alerts, and 0% turnover fees for creators.",
            href: "/merchant",
            linkLabel: "View Merchant",
          },
        },
        networks: {
          kicker: "NETWORKS",
          title: "TON-First for Telegram Communities",
          body: "TON is the native choice for Telegram members, while TRON USDT provides a stable fallback for global subscribers.",
          items: [
            { name: "TON", body: "The most friction-less experience for Telegram-native communities." },
            { name: "TRON USDT", body: "A reliable stablecoin option for USD-denominated memberships." },
            { name: "Base / Arbitrum", body: "Ideal for web3-native groups and decentralized organizations." },
          ],
        },
        flow: {
          kicker: "INTEGRATION FLOW",
          title: "From Payment to Community Entry",
          steps: [
            { title: "Pass Selected", body: "The user chooses a membership tier or renewal period." },
            { title: "Checkout Opened", body: "Reqst generates a unique payment request with exact network/asset data." },
            { title: "Payment Verified", body: "Our watchers confirm the transfer on the blockchain in real-time." },
            { title: "Access Triggered", body: "Your management bot invites the user once the 'paid' event is emitted." },
          ],
        },
        related: {
          kicker: "RELATED",
          title: "Connect community payments.",
          links: [
            { kicker: "Network", label: "TON Support", body: "Native rails for Telegram memberships.", href: "/networks/ton" },
            { kicker: "Use Case", label: "Telegram Shops", body: "Commerce flows for physical/digital goods.", href: "/use-cases/telegram-shops" },
            { kicker: "Plan", label: "Merchant Tier", body: "Dashboard for community operators.", href: "/merchant" },
          ],
        },
        cta: {
          title: "Professionalize your paid community today.",
          body: "Switch to an automated payment flow and stop asking for screenshots in DMs. Direct-to-wallet, 0% fees.",
          primary: { label: "Start Accepting Payments", href: "/app/auth" },
          secondary: { label: "View Merchant", href: "/merchant" },
        },
        features: ["TON & Jetton Native", "Automated Access Signals", "Membership Renewal Tracking", "No Percentage Fees"],
        seoLabel: "Paid community crypto payment details",
        seo: "Reqst enables paid communities to accept crypto for Telegram channels and private groups, featuring TON support, automated access signals via webhooks, and 0% turnover fees.",
      },
    },
    compareHub: {
      title: "The Smarter Way to Process Crypto",
      description: "See how Reqst compares to manual verification and traditional custodial gateways. Transparency and efficiency in every transaction.",
      kicker: "COMPARE",
    },
    statusHub: {
      title: "System Status",
      description: "Real-time monitoring of Reqst infrastructure and network connectivity.",
      kicker: "STATUS",
      allSystemsOperational: "All Systems Operational",
      operational: "Operational",
      services: "Core Services",
      networks: "Network Connectivity",
      coreApi: "Core API",
      watchers: "Blockchain Watchers",
      checkout: "Checkout UI",
    },
  },
  plan: {
    back: "Back Home",
    auth: "Console",
    discuss: "Discuss Terms",
    compareTitle: "Protocol",
    flowTitle: "Integration",
    priceTitle: "Access",
    priceSubtitle: "Unlimited volume. Flat monthly fee.",
    codeTitle: "Implementation",
    codeSubtitle: "Ready for production in minutes.",
    codeBody: "Seamlessly integrate our protocol into your existing workflow.",
    processingNote: "Non-custodial architecture. All transactions go directly to your wallets.",
    compareSectionTitle: "Direct Access Architecture",
    compareSectionBody: "Reqst operates as a transparent middleware. Transactions flow directly from client to merchant, bypassing intermediary accounts.",
    merchant: {
      badge: "Reqst Merchant",
      title: "Accept Crypto. 0% Turnover Fees.",
      body: "Professional dashboard for manual and semi-automated payment acceptance. Direct payouts to your wallets and full control.",
      priceLabel: "$39",
      period: "per month",
      stats: [
        { value: "0%", label: "Fee" },
        { value: "100%", label: "Non-custodial" },
        { value: "Live", label: "Dashboard" },
        { value: "Basic", label: "Analytics" },
      ],
      features: [
        { title: "Unlimited Invoices", body: "Create unlimited payment links for any amount with no extra fees." },
        { title: "Manual Override", body: "Manually confirm payments in case of underpayments or client errors." },
        { title: "Direct-to-Wallet", body: "Funds go directly from client to your address. We never touch your money." },
        { title: "Instant Alerts", body: "Real-time Telegram notifications for every single transaction." },
      ],
      flow: [
        { title: "Account Setup", body: "Quick Telegram registration and adding your payout details." },
        { title: "Invoice Creation", body: "Generate payment links in a few clicks via our intuitive dashboard." },
        { title: "Real-time Tracking", body: "Live blockchain monitoring. We confirm transactions automatically." },
      ],
      code: `// Manual Invoice Link
// https://reqst.xyz/app/checkout/demo
// No code required for Merchant plan.
// Just share the link and get paid.`
    },
    developer: {
      badge: "Reqst Developer",
      title: "Payments Infrastructure. Control in Your Hands.",
      body: "Professional API and Webhooks for full business automation. Direct payouts and zero turnover commissions.",
      priceLabel: "$199",
      period: "per month",
      stats: [
        { value: "50k", label: "Requests/mo" },
        { value: "3", label: "Seats" },
        { value: "3", label: "Workspaces" },
        { value: "Standard", label: "Support" },
      ],
      features: [
        { title: "Webhook Delivery", body: "Guaranteed delivery with automated retries and HMAC signatures." },
        { title: "Real-time Monitoring", body: "Real-time transaction monitoring. Detect payments instantly." },
        { title: "Unified API v1", body: "A single interface for 7+ networks: TON, TRON, SOL, Base, and more." },
        { title: "Idempotency", body: "Built-in protection against duplicate transactions at the API level." },
      ],
      flow: [
        { title: "API Key Provisioning", body: "Generate rqst_live_ keys. Manage scopes for secure backend integration." },
        { title: "Webhook Config", body: "Set up HMAC-SHA256 signed callbacks for instant notifications." },
        { title: "Automated Processing", body: "Our watchers track transactions 24/7, confirming payments autonomously." },
      ],
      code: `// Create Invoice via Reqst API
const res = await fetch("https://api.reqst.xyz/v1/invoices", {
  method: "POST",
  headers: { "X-API-Key": "rqst_live_..." },
  body: JSON.stringify({
    title: "Order #99",
    base_amount_usd: "199.00",
    payable_network: "TON"
  })
});
const inv = await res.json();`
    },
    business: {
      badge: "Reqst Business",
      title: "Scalable Processing. For Growing Teams.",
      body: "Extended API limits, team access, and priority support for businesses with high payment volume.",
      priceLabel: "$499",
      period: "per month",
      stats: [
        { value: "200k", label: "Requests/mo" },
        { value: "10", label: "Seats" },
        { value: "10", label: "Workspaces" },
        { value: "Priority", label: "Support" },
      ],
      features: [
        { title: "Advanced Analytics", body: "In-depth insights into payments, conversion, and retention across workspaces." },
        { title: "Team Collaboration", body: "Add up to 10 members to your team with granular role management." },
        { title: "Multi-Workspace", body: "Manage up to 10 independent projects under a single subscription." },
        { title: "Extended Limits", body: "Higher API quotas and increased active webhook limits." },
      ],
      flow: [
        { title: "Team Onboarding", body: "Invite team members and assign roles to manage your projects." },
        { title: "Workspace Isolation", body: "Set up independent environments for different business lines." },
        { title: "Scale with Priority", body: "Work with dedicated monitoring queues and 24/7 priority support." },
      ],
      code: `// Multi-Workspace Management
// Manage up to 10 workspaces
// Isolated API keys and team seats
// Advanced Analytics enabled`
    },
    enterprise: {
      badge: "Reqst Enterprise",
      title: "Corporate Standard. Infrastructure Without Limits.",
      body: "Custom limits, SLA guarantees, and dedicated support for major market players.",
      priceLabel: "Custom",
      period: "individual pricing",
      stats: [
        { value: "1M+", label: "Requests/mo" },
        { value: "∞", label: "Seats" },
        { value: "SLA", label: "Guarantee" },
        { value: "Dedicated", label: "Support" },
      ],
      features: [
        { title: "Custom Rate Limits", body: "Individually tailored API throughput for your peak loads." },
        { title: "SLA & B2B Contracts", body: "Legal uptime guarantees and official corporate contracting." },
        { title: "Dedicated Engineering", body: "Direct communication with core developers for consultation." },
        { title: "Onboarding Assist", body: "Personal manager for integration and migration assistance." },
      ],
      flow: [
        { title: "Infrastructure Audit", body: "Analyzing your payment flows to design the optimal monitoring architecture." },
        { title: "Dedicated Provisioning", body: "Deploying isolated infrastructure for maximum reliability." },
        { title: "Hyper-scale Support", body: "Launch with unlimited quotas under direct supervision of our team." },
      ],
      code: `// Enterprise SLA Integration
// 99.9% Uptime Guarantee
// Dedicated monitoring nodes
// 24/7 Incident Response
// Custom Webhook retry logic`
    },
  },
  legal: { privacy: {
      kicker: "PRIVACY POLICY",
      title: "PRIVACY POLICY AND DATA PROCESSING AGREEMENT",
      summary:
        "READ THIS DOCUMENT CAREFULLY. BY ACCESSING THE REQST SOFTWARE, DASHBOARD, API, OR PUBLIC CHECKOUT PAGES, YOU EXPLICITLY CONSENT TO THE DATA PRACTICES HEREIN. IF YOU DO NOT AGREE, YOU MUST IMMEDIATELY CEASE ALL USE OF THE SERVICE.",
      updatedLabel: "Last Updated",
      operatorLabel: "Effective Date",
      metaItems: ["Last Updated: March 13, 2026", "Effective Date: March 13, 2026"],
      draftTitle: "Document Frame",
      draftBody:
        "This page preserves the provided Privacy text in English without translation.",
      draftItems: [
        "Scope: software, dashboard, API, Telegram bots, checkout pages",
        "Data reality: blockchain is public and immutable",
        "Storage: strictly necessary localStorage only",
        "Sharing: Telegram, RPC providers, cloud infrastructure, market oracles",
        "Retention: active account + disputes + technical logs",
      ],
      sections: [],
      footerNote: "The privacy document is rendered in English as provided, without translation.",
    }, terms: {
      kicker: "TERMS OF SERVICE",
      title: "TERMS OF SERVICE: COMPREHENSIVE END-USER LICENSE AND USAGE AGREEMENT",
      summary:
        "PLEASE READ THIS COMPREHENSIVE AGREEMENT CAREFULLY. IT CONTAINS A MANDATORY BINDING ARBITRATION CLAUSE, A CLASS ACTION WAIVER, AND EXTENSIVE DISCLAIMERS OF LIABILITY THAT MATERIALLY AFFECT YOUR LEGAL RIGHTS. BY ACCESSING, INTEGRATING, OR UTILIZING THE REQST SOFTWARE, API, OR WEBHOOKS, YOU EXPLICITLY AGREE TO BE BOUND BY THESE TERMS IN THEIR ENTIRETY.",
      updatedLabel: "Last Updated",
      operatorLabel: "Effective Date",
      metaItems: ["Last Updated: March 13, 2026", "Effective Date: March 13, 2026"],
      draftTitle: "Document Frame",
      draftBody:
        "This page preserves the provided Terms text in its original language mix and legal wording.",
      draftItems: [
        'Company: reqst',
        'Scope: software, API, webhooks, blockchain monitoring',
        'Model: non-custodial, direct-to-wallet',
        'Dispute flow: arbitration + class action waiver',
        'Liability cap: last three months of subscription fees',
      ],
      sections: [],
      footerNote: "The text above is rendered without translation and preserves the supplied wording structure for publication styling.",
    } },
} as const;

export default en;
