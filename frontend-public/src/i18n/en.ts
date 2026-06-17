const en = {
    hero: {
      title: "Accept Crypto Payments Direct to Your Wallets with 0% Fees.",
      body:
        "Non-custodial crypto payment gateway for USDT, Gram, and TRON. Integrate our high-performance processing API or smart checkout into Telegram bots, SaaS platforms, and global e-commerce with zero turnover fees.",
      subcopy:
        "Engineered for Telegram Shops, SaaS Billing, and Digital Commerce.",
      primary: "Launch Console",
      secondary: "View Docs",
      badges: ["Direct-to-Wallet", "0% Turnover Fees", "Non-Custodial API", "Signed Webhooks"],
    },
    heroPanel: {
      eyebrow: "Infrastructure",
      title: "Performance First",
      body: "Experience raw efficiency with our optimized blockchain monitoring protocol.",
      amount: "149.00 USDT",
      invoice: "RECV-INFRA-99",
      status: "Confirmed",
      primary: "Demo Checkout",
      secondary: "Console",
      helper: "Flat subscription. Unlimited volume.",
      chips: ["GRAM", "TRON", "SOL", "BASE"],
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
      title: "Built for the way crypto businesses actually get paid.",
      tabs: [
        { id: "tg-shops", title: "TG Shops", body: "Automate physical and digital goods sales inside Telegram with instant delivery.", cta: "Explore TG Commerce" },
        { id: "saas", title: "SaaS Billing", body: "Reliable infrastructure for software platforms. Flat fees mean higher margins for your business.", cta: "Optimize Margins" },
        { id: "digital", title: "Digital Goods", body: "Instant fulfillment for keys and accounts immediately after blockchain confirmation.", cta: "Scale Automation" },
        { id: "communities", title: "Communities", body: "Automated access management for private channels and groups with recurring logic.", cta: "Manage Members" },
      ]
    },
    mcp: {
      kicker: "AI & MCP",
      title: "Let AI agents accept crypto for you.",
      body: "recv ships a Model Context Protocol server, so agents like Claude and Cursor can create invoices, check payment status, and verify webhooks autonomously — no glue code required.",
      tools: [
        { name: "create_invoice", body: "Issue payment requests on any supported network." },
        { name: "get_invoice", body: "Check real-time status and confirmations." },
        { name: "list_invoices", body: "Review recent payment activity." },
        { name: "simulate_payment", body: "Test the full flow in Sandbox before going live." },
        { name: "verify_webhook", body: "Validate incoming notifications securely." },
        { name: "list_supported_networks", body: "Discover available chains and assets." },
      ],
      cta: "Read the MCP guide",
    },
    networks: {
      kicker: "NETWORKS",
      title: "Global Connectivity.",
      list: [
        { slug: "ton", label: "TON" },
        { slug: "ton_usdt", label: "USDT on TON" },
        { slug: "tron", label: "TRON" },
        { slug: "solana", label: "Solana" },
        { slug: "base", label: "Base" },
        { slug: "arbitrum", label: "Arbitrum" },
        { slug: "bsc", label: "BSC" },
      ],
      rails: [
        { name: "GRAM", body: "Native Gram payments for Telegram-based commerce and the growing TON ecosystem." },
        { name: "USDT on TON", body: "USDT on TON for stablecoin payments in the TON ecosystem." },
        { name: "TRON", body: "The global standard for USDT settlement with high throughput and low costs." },
        { name: "BASE", body: "Coinbase's L2 for reliable EVM-compatible stablecoin payments." },
        { name: "BSC", body: "High-performance network with one of the largest ecosystems of active users." }
      ]
    },
    compare: {
      kicker: "EVOLUTION",
      title: "The recv Advantage.",
      rows: [
        {
          legacy: "Manual verification and screenshot chasing.",
          recv: "Automated blockchain watchers & instant alerts.",
        },
        {
          legacy: "Gateway fees (1-5%) eating your profit.",
          recv: "0% turnover fees. Keep 100% of what you earn.",
        },
        {
          legacy: "Custodial risk & withdrawal delays.",
          recv: "Non-custodial. Direct-to-wallet. Instant liquidity.",
        },
      ],
    },
    pricing: {
      kicker: "ACCESS",
      title: "0% commission on all plans.",
      popular: "Popular",
      trial: {
        name: "Trial",
        price: "0",
        features: ["15 live invoices total", "No API access (manual only)", "1 Webhook endpoint", "Telegram bot notifications", "1 Workspace / 1 Seat", "Community support"],
        cta: "Start Free Trial"
      },
      merchant: {
        name: "Merchant",
        price: "9",
        trial: "Payment links",
        features: ["Payment links", "Telegram-flow", "Manual review", "API limit"],
        cta: "Activate Merchant"
      },
      developer: {
        name: "Developer",
        price: "29",
        features: ["Full API", "Webhooks", "Idempotency", "MCP tools"],
        cta: "Activate Developer"
      },
      business: {
        name: "Business",
        price: "79",
        features: ["Teams", "Audit logs", "Custom branding", "200k monthly requests"],
        cta: "Activate Business"
      }
    },
    faq: {
      kicker: "FAQ",
      title: "Protocol Details.",
      body: "Essential insights on asset security, payment mechanics, and platform integration.",
      items: [
        {
          question: "How does recv ensure the security of my funds?",
          answer: "We utilize a non-custodial architecture. This means your private keys never leave your device, and funds are sent directly from the client to your address. recv only monitors the blockchain and provides transaction notifications.",
        },
        {
          question: "Which networks and assets are currently supported?",
          answer: "We currently support TON (Gram and USDT), TRON, Solana, Base, Arbitrum, and BSC. We are continuously adding new liquid protocols based on business-tier demands.",
        },
        {
          question: "Can I automate the delivery of digital goods?",
          answer: "Absolutely. Our Webhook system provides instantaneous notifications to your server upon payment confirmation, enabling full automation of access, subscriptions, or digital delivery.",
        },
        {
          question: "How are underpayments or incorrect amounts handled?",
          answer: "recv intelligently detects any deviations from the expected amount. If an underpayment occurs, the transaction is flagged as 'Underpaid,' allowing you to either request the balance or manually approve the order.",
        },
        {
          question: "Do I need to pass KYC to start using recv?",
          answer: "No. Since we operate strictly as non-custodial middleware and do not hold or process fiat currency, we do not require KYC verification from merchants. You can start accepting crypto immediately.",
        },
        {
          question: "Is there a limit on how many invoices I can create?",
          answer: "Paid subscription plans have absolutely no limits on manual invoice creation. However, the free Trial plan has a lifetime limit of 15 live invoices. You can upgrade to any paid plan to unlock unlimited invoices.",
        },
        {
          question: "What happens if a network (e.g., TRON) goes down?",
          answer: "Our watchers are distributed across multiple global RPC providers. If a network halts, recv queues the monitoring tasks. Once the blockchain resumes block production, all pending transactions will be automatically verified and webhooks fired.",
        },
      ],
    },
    final: {
      kicker: "GET STARTED",
      title: "Scale Your Business with recv.",
      body:
        "Join industry leaders who have already automated their crypto processing and eliminated manual overhead.",
      primary: "Get Started Now",
      secondary: "Documentation",
    },
    footer: {
      title: "recv",
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
        mcp: { title: "MCP Agent", desc: "Autonomous AI agent tools" },
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
        ton_usdt: "TON USDT",
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
      engineered: "Direct-to-wallet settlement, signed webhooks, and zero turnover fees across TON, USDT on TON, TRON, Base, and BSC.",
      implementation: "IMPLEMENTATION",
      readyInMinutes: "Production-ready in minutes",
      integrateEase: "Integrate our high-performance API into your existing stack with ease.",
      management: "MANAGEMENT",
      workflow: "WORKFLOW",
      intelligence: "INTELLIGENCE",
      readyToScale: "Ready to Scale?",
      joinMerchants: "Join hundreds of merchants who have already optimized their revenue flow with recv.",
      benefits: "BENEFITS",
    },
    ogSubtitle: "Next-generation crypto payments infrastructure",
    checkoutProduct: {
      metadata: {
        title: "Accept Crypto Payments | Non-Custodial Checkout for TON, TRC-20, TON USDT",
        description: "Scale your business with the highest-converting crypto checkout. Support USDT (TRC-20, TON, Base, BSC) with 0% turnover fees. Non-custodial, secure, and Telegram-ready.",
        keywords: "accept crypto payments, crypto checkout gateway, TON payments, TRON USDT gateway, TON USDT checkout, non-custodial crypto payment, telegram payment bot api, usdt trc20 checkout"
      },
      kicker: "CONVERSION ENGINE",
      title: "Checkout: The Gold Standard of Crypto UX",
      description: "Why settle for generic payment links? Offer a premium, non-custodial checkout experience engineered to eliminate 'copy-paste' fatigue and reduce underpayment errors.",
      hero: {
        title: "Maximum Conversion. Minimum Friction.",
        body: "recv Checkout is the ultimate non-custodial interface designed to turn abandoned carts into confirmed transactions. Seamlessly integrated, multi-chain by default, and optimized for every device.",
        cta: "Try Live Demo"
      },
      comparison: {
        title: "The recv Evolution",
        items: [
          {
            legacy: "Manual wallet address copying leads to errors and lost funds.",
            recv: "QR-native flow and wallet deep links reduce address-copying errors."
          },
          {
            legacy: "Customers get stuck on 'waiting' screens for minutes.",
            recv: "Live invoice status provides feedback as supported networks are observed."
          },
          {
            legacy: "Underpayments cause support nightmares and order loss.",
            recv: "Intelligent resolution prompts for the exact remaining balance."
          }
        ]
      },
      bento: {
        title: "Micro-Features, Macro Impact",
        items: [
          { title: "Telegram Ready", body: "Seamlessly runs inside Telegram Web Apps and mobile in-app browsers." },
          { title: "Deep Link Ready", body: "Instantly opens payment screens in Tonkeeper, Phantom, and other wallets." },
          { title: "Real-Time Deltas", body: "Automatic calculation of exchange rates and network fees." },
          { title: "Dual Locale", body: "Fully localized payment interface in English and Russian." },
          { title: "Focus on UI", body: "A clean, distraction-free payment page optimized for fast conversion." },
          { title: "Network Safety", body: "Built-in alerts for incorrect network selection." }
        ]
      },
      deepDive: [
        {
          title: "Intelligent Underpayment Resolution",
          body: "recv classifies underpayments and can show the remaining balance so the customer can complete payment without creating a new order. Merchant policy still determines fulfillment and refunds."
        },
        {
          title: "Native Telegram Integration",
          body: "Our checkout UI is designed for mobile browsers and Telegram Mini Apps. Wallet deep links can guide buyers to a compatible wallet while confirmation timing remains dependent on the selected network."
        },
        {
          title: "Cross-Chain Unified UI",
          body: "Whether it's jetton transfers for USDT on TON or the unique memo requirements of native TON, recv abstracts the complexity. Your customers get a consistent, polished experience regardless of the underlying blockchain technology, reducing cognitive load and increasing trust."
        }
      ],
      stats: [
        { value: "5", label: "Core Networks" },
        { value: "0%", label: "Turnover Fee" },
        { value: "2", label: "Locales" },
        { value: "HMAC", label: "Webhook Signing" }
      ],
      finalTitle: "Ready to optimize your checkout conversion?",
      seo: "recv Checkout is a non-custodial payment gateway engineered for high-conversion cryptocurrency processing. Designed to eliminate friction in digital commerce, the UI supports direct-to-wallet transactions across TON, TRON (TRC-20), Base, and BSC-compatible networks. Core functionality includes dynamic exchange rate calculation, deep linking to major mobile wallets, and intelligent underpayment resolution to recover partial transactions. By bypassing intermediary custodians, merchants retain full control of their liquidity while providing customers with a seamless, multi-chain payment experience without turnover fees."
    },
    apiProduct: {
      metadata: {
        title: "Unified Blockchain API | Webhooks & Monitoring for TON, TRON, EVM",
        description: "Crypto payment infrastructure for developers. One API for TON, TRC-20, Base and BSC with retryable webhook delivery and HMAC signatures.",
        keywords: "crypto payment api, blockchain monitoring api, webhooks for crypto, TON developer api, TRON trc20 api, automated crypto payments, unified blockchain api"
      },
      kicker: "DEVELOPER FIRST",
      title: "API & Infrastructure for Scale",
      description: "Reliability is the only metric that matters. recv API provides the high-performance primitives you need to build production-grade payment flows.",
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
            recv: "One unified API for supported networks with standardized JSON."
          },
          {
            legacy: "Webhooks that fail without retry logic or signatures.",
            recv: "Queued retries with plan-specific limits and HMAC signatures."
          },
          {
            legacy: "Duplicate processing of the same transaction.",
            recv: "Idempotency controls help prevent duplicate processing."
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
          title: "Retryable Webhook Delivery",
          body: "Our webhook engine uses a persistent queue and plan-specific retry budgets. Every payload is signed with HMAC; your backend must verify the signature and timestamp, acknowledge quickly, and process events idempotently."
        },
        {
          title: "Unified Chain Abstraction",
          body: "Integrating TON, TRON, and EVM usually requires three different libraries and logic flows. recv provides a single schema for all networks. Create an invoice for TRC-20 USDT the same way you create one for native TON or USDT on TON."
        },
        {
          title: "High-Performance Watchers",
          body: "recv observes supported networks and updates invoice status after detection and required confirmations. Timing depends on the selected network and the availability of its RPC infrastructure."
        }
      ],
      stats: [
        { value: "REST", label: "API Protocol" },
        { value: "HMAC", label: "Webhook Signing" },
        { value: "Retry", label: "Delivery Queue" },
        { value: "Keys", label: "Idempotency" }
      ],
      finalTitle: "Build your next-gen payment flow today.",
      seo: "The recv Unified API provides infrastructure for integrating blockchain payments into B2B software, gaming platforms, and business applications. Development teams use one REST interface for supported networks, idempotency controls for duplicate processing, and retryable webhook delivery with HMAC-SHA256 signatures."
    },
    invoicingProduct: {
      metadata: {
        title: "Professional Crypto Invoicing | B2B Billing Solution with 0% Fees",
        description: "Issue, track, and manage professional crypto invoices. Support for USDT and native Gram. Non-custodial, automated tracking, and CSV reports for accounting.",
        keywords: "crypto invoicing for business, b2b crypto billing, freelance crypto invoices, professional usdt billing, crypto payment tracking, 0 fee crypto invoicing"
      },
      kicker: "BUSINESS GRADE",
      title: "Invoicing: Professional Billing for Modern Commerce",
      description: "Stop using spreadsheets. recv Invoicing provides a professional way to issue, track, and manage crypto payments with zero turnover fees.",
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
            recv: "Branded hosted invoice pages with real-time status."
          },
          {
            legacy: "Manually checking explorers for client payments.",
            recv: "Instant Telegram and Email alerts when settled."
          },
          {
            legacy: "Cluttered spreadsheets for monthly accounting.",
            recv: "Centralized console with CSV/JSON export capabilities."
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
          body: "recv Invoicing is designed for businesses that need more than just a payment link. Manage the entire lifecycle from draft to settlement. Track 'Overdue' or 'Underpaid' states and communicate professionally with your partners at every step."
        },
        {
          title: "Direct-to-Wallet Security",
          body: "Unlike custodial competitors, recv never touches the funds in your invoices. Your clients pay you directly on-chain. Our service acts as a professional monitoring layer, ensuring you get notified without having to watch the ledger yourself."
        },
        {
          title: "Global Multi-Currency Support",
          body: "Bill in USD or any supported stablecoin. recv handles the real-time conversion rates, ensuring that the amount of USDT, GRAM, or SOL requested matches your desired fiat value at the moment the invoice is generated."
        }
      ],
      stats: [
        { value: "0%", label: "Escrow Risk" },
        { value: "24/7", label: "Monitoring" },
        { value: "<1min", label: "Creation" },
        { value: "100%", label: "Non-Custodial" }
      ],
      finalTitle: "Professionalize your B2B billing now.",
      seo: "Streamline corporate financial operations with recv Invoicing, a specialized billing solution tailored for B2B crypto transactions and freelance accounting. The platform enables businesses to generate branded, multi-currency invoices with automated fiat-to-crypto pegging at the time of creation. Administrative features include real-time payment tracking via dedicated Telegram and email notifications, centralized client management, and comprehensive CSV export capabilities to simplify tax reporting and reconciliation. Operating on a zero-fee, direct-transfer model, it modernizes accounts receivable without introducing third-party holding risks."
    },
    breadcrumbs: {
      home: "Home",
      blog: "Blog",
      compare: "Compare",
      useCases: "Use Cases",
      networks: "Networks",
      products: "Products",
      invoicing: "Invoicing",
      mcp: "MCP Agent",
    },
    mcpProduct: {
      metadata: {
        title: "MCP Agent Integration | AI-Native Crypto Payments via Model Context Protocol",
        description: "Connect AI agents to recv via Model Context Protocol. Autonomous workspace setup, plan purchase, invoice creation, and webhook management — all from your LLM.",
        keywords: "mcp crypto payments, model context protocol payments, ai agent payments, llm invoice creation, autonomous crypto billing, claude mcp recv"
      },
      kicker: "AI-NATIVE",
      title: "Payments for the Agentic Era",
      description: "The first crypto payment infrastructure built for AI agents. recv MCP lets any Claude, GPT, or custom LLM agent bootstrap a workspace, buy a plan, and start accepting payments — zero human intervention required.",
      hero: {
        title: "Your AI Agent, Now a Crypto Merchant.",
        body: "recv is the first payment platform with a native Model Context Protocol server. Any MCP-compatible agent can onboard, subscribe, create invoices, and verify webhooks without touching a dashboard.",
        cta: "View MCP Docs"
      },
      comparison: {
        title: "The Agentic Difference",
        items: [
          {
            legacy: "Agents can't sign up, buy plans, or get API keys without a human.",
            recv: "bootstrap_agent_workspace creates a workspace and returns an access token in one call."
          },
          {
            legacy: "LLMs have no way to generate or verify payment invoices natively.",
            recv: "create_invoice and get_invoice are first-class MCP tools your agent can call directly."
          },
          {
            legacy: "Webhook signature verification requires manual backend code and secrets.",
            recv: "verify_webhook runs locally in the MCP server — no network call, no leaking secrets."
          }
        ]
      },
      bento: {
        title: "Tools Your Agent Gets Out of the Box",
        items: [
          { title: "bootstrap_agent_workspace", body: "Create a trial workspace and receive an access token — the agent's starting point." },
          { title: "create_invoice", body: "Generate a hosted payment invoice on any supported network." },
          { title: "get_invoice / list_invoices", body: "Poll status and paginate your invoice history programmatically." },
          { title: "create_api_key", body: "Issue scoped API keys after a plan is activated." },
          { title: "create_webhook_endpoint", body: "Register HTTPS endpoints to receive signed event callbacks." },
          { title: "verify_webhook", body: "Validate HMAC-SHA256 signatures locally without a network round-trip." }
        ]
      },
      deepDive: [
        {
          title: "Zero-Touch Agent Onboarding",
          body: "An AI agent can fully onboard itself to recv without any human action. It calls bootstrap_agent_workspace, receives an access token, purchases a Developer or Business subscription via create_subscription_checkout, polls get_checkout_invoice until paid, then issues its own API key. The entire flow is expressible as a sequence of MCP tool calls."
        },
        {
          title: "Any MCP-Compatible Runtime",
          body: "The recv MCP server runs over stdio and works with Claude Desktop, Claude Code, Cursor, Cline, Continue, and any other host that implements the Model Context Protocol spec. Add it to your mcp.json with RECV_API_KEY and RECV_ACCESS_TOKEN and your agent gains payment superpowers immediately."
        },
        {
          title: "Secure by Design",
          body: "Webhook verification happens inside the MCP process — your raw body and secret never leave the local runtime. API keys are scoped to invoices:read and invoices:write. The agent only sees what it needs, and every payment event is cryptographically signed before delivery."
        }
      ],
      stats: [
        { value: "12", label: "MCP Tools" },
        { value: "stdio", label: "Transport" },
        { value: "7+", label: "Networks" },
        { value: "0", label: "Human Steps" }
      ],
      finalTitle: "Give your agent the power to earn.",
      seo: "recv MCP (Model Context Protocol) integration enables AI agents and LLM-powered applications to autonomously manage the full lifecycle of crypto payments. Agents running in Claude Desktop, Claude Code, Cursor, or any MCP-compatible host can call bootstrap_agent_workspace to self-register, purchase a subscription plan, generate API keys, create and monitor payment invoices across TON, TRON, Solana, Base, Arbitrum, and BSC networks, and register webhook endpoints for event-driven payment flows. The verify_webhook tool performs local HMAC-SHA256 signature validation without exposing secrets to the network. This makes recv the first payment infrastructure platform natively designed for the agentic era of autonomous software."
    },
    productsHub: {
      title: "Solutions for Every Business Scale",
      description: "From simple payment links to business-grade infrastructure. Choose the product that fits your current growth stage.",
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
      },
      mcp: {
        title: "MCP Agent",
        desc: "Let AI agents accept payments autonomously. Native Model Context Protocol integration — your AI sets up workspaces, buys plans, and creates invoices without human input.",
        link: "Learn more",
      }
    },
    networksHub: {
      title: "Universal Blockchain Connectivity",
      description: "We bridge the gap between businesses and decentralized liquidity. recv supports all major protocols with a single integration.",
      kicker: "NETWORKS",
      explanation: "All supported networks operate on a direct-to-wallet basis. recv does not hold merchant funds; merchants remain responsible for wallet security and operations."
    },
    networkPages: {
      ton: {
        name: "TON",
        fullName: "The Open Network",
        metadata: {
          title: "Accept TON Payments for Telegram Commerce",
          description: "Use recv to accept TON and supported Jetton payments with hosted Checkout, API invoices, payment comments, and direct-to-wallet settlement.",
        },
        kicker: "TON NETWORK",
        hero: {
          title: "TON payments built for Telegram-native commerce.",
          body: "recv turns TON transfers into clean checkout states for Telegram shops, paid communities, and mobile-first buyers while keeping funds direct to your wallet.",
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
            { name: "GRAM", body: "Native Gram transfers for simple Telegram and wallet-native payments." },
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
            { title: "Create invoice", body: "Checkout or API creates a Gram payment request with the exact amount, asset, address, and required comment." },
            { title: "Show payment", body: "The buyer sees a hosted page with QR, copyable address, amount, and clear comment instructions." },
            { title: "Detect transfer", body: "recv watchers match the incoming transfer by amount and required payment comment." },
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
          title: "Launch Gram checkout with direct settlement.",
          body: "Use recv to accept Gram payments, detect transfers automatically, and keep customer payments flowing directly to your wallet.",
          primary: { label: "Start accepting Gram", href: "/app/auth" },
          secondary: { label: "Explore Checkout", href: "/products/checkout" },
        },
        seoLabel: "TON network payment details",
        seo: "recv supports Gram payments for Telegram commerce with hosted Checkout, API invoice creation, required payment comments, blockchain watchers, direct-to-wallet settlement, and webhooks for order or access automation.",
      },
      tron: {
        name: "TRON",
        fullName: "TRON Network",
        metadata: {
          title: "Accept TRON USDT Payments for SaaS and Business",
          description: "Accept USDT TRC-20 through recv Checkout and API with stablecoin-friendly invoices, watcher matching, signed webhooks, and direct payouts.",
        },
        kicker: "TRON NETWORK",
        hero: {
          title: "TRON USDT payments for global stablecoin buyers.",
          body: "recv makes TRC-20 USDT practical for SaaS, invoices, and business checkout flows without percentage fees or custodial settlement accounts.",
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
            { title: "Track transfer", body: "recv watchers detect the incoming TRC-20 transfer and match it to the invoice." },
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
          body: "Use recv to issue TRC-20 invoices, track transfers in real time, and connect stablecoin payments to your business systems.",
          primary: { label: "Start with USDT", href: "/app/auth" },
          secondary: { label: "View Business", href: "/business" },
        },
        seoLabel: "TRON USDT payment details",
        seo: "recv enables TRON USDT payments through Checkout, API invoices, TRC-20 watcher detection, signed webhooks, direct-to-wallet settlement, and stablecoin payment flows for SaaS and business use cases.",
      },
      ton_usdt: {
        name: "TON USDT",
        fullName: "Tether USDT on TON",
        metadata: {
          title: "Accept TON USDT Payments | Stablecoin Checkout on TON",
          description: "Accept USDT stablecoin on The Open Network (TON) with recv. Hosted Checkout, API invoices, automated comment matching, and direct-to-wallet payouts.",
        },
        kicker: "TON USDT STABLECOIN",
        hero: {
          title: "Accept TON USDT payments with direct settlement.",
          body: "Seamlessly accept Tether (USDT) on TON. recv handles payment detection and comment-based matching, sending funds directly to your non-custodial wallet.",
        },
        snapshot: {
          kicker: "STABLECOIN CHECKOUT",
          title: "checkout.network.ton_usdt",
          amount: "49.00 USDT",
          items: [
            { label: "Asset", value: "USDT (Jetton)" },
            { label: "Network", value: "TON" },
            { label: "Matching", value: "Comment" },
          ],
        },
        assets: {
          kicker: "SUPPORTED STABLECOINS",
          title: "USDT as a native TON Jetton.",
          body: "Collect USD-pegged stablecoin payments on The Open Network, leveraging Telegram's native ecosystem without exposing buyers to price volatility.",
          items: [
            { name: "TON USDT", body: "The official USD₮ Jetton on the TON blockchain, widely used in Telegram Wallet and Tonkeeper." },
            { name: "TON", body: "The native network asset used for transaction fees (gas) when sending Jettons." },
            { name: "Direct Payouts", body: "USDT goes directly to your non-custodial TON wallet without holding periods or intermediaries." },
          ],
        },
        why: {
          kicker: "WHY TON USDT",
          title: "Stablecoin stability with Telegram-native speed.",
          body: "TON USDT is the perfect solution for Telegram commerce. It eliminates the price volatility of native TON while retaining the fast transaction speeds, low fees, and deep integration with Telegram chats.",
        },
        mechanics: {
          kicker: "AUTOMATED DETECTOR",
          title: "Jetton transfer monitoring with custom comments.",
          steps: [
            { title: "Create Invoice", body: "Generate a TON USDT invoice specifying the exact USDT amount and required payment comment." },
            { title: "Present Details", body: "Checkout shows the destination TON address, QR code, and the required payment comment." },
            { title: "Watch Blockchain", body: "recv monitors TON blockchain transactions to detect matching USDT Jetton transfers with the correct comment." },
            { title: "Trigger Backend", body: "An automated webhook notifies your application when the payment is confirmed, instantly unlocking access or completing orders." },
          ],
        },
        limitations: {
          kicker: "LIMITATIONS AND NOTES",
          title: "Memo-based matching and transaction fees.",
          body: "Just like native TON, TON USDT matching relies on the required comment. Buyers must not modify this comment. Additionally, buyers or wallets must have native TON to cover blockchain transaction fees (gas).",
        },
        useCases: {
          kicker: "USE CASES",
          title: "Built for Telegram commerce and bots.",
          body: "TON USDT is ideal for businesses that want stable, dollar-pegged pricing but sell products inside the Telegram ecosystem.",
          items: [
            { name: "Telegram Mini Apps", body: "Enable one-click USDT stablecoin checkouts directly within your app or bot." },
            { name: "Digital Subscriptions", body: "Bill recurring memberships, courses, or private group access in stable dollar values." },
            { name: "E-Commerce", body: "Sell physical or digital goods to global customers using Telegram and TON-compatible wallets." },
          ],
        },
        related: {
          kicker: "RELATED",
          title: "Build the TON USDT flow.",
          links: [
            { kicker: "Use Case", label: "Telegram Shops", body: "Automate shop payments and orders in Telegram.", href: "/use-cases/telegram-shops" },
            { kicker: "Product", label: "Checkout", body: "Hosted payment pages with multi-network support.", href: "/products/checkout" },
            { kicker: "Product", label: "API", body: "Integrate recv directly into your custom backend application.", href: "/products/api" },
          ],
        },
        cta: {
          title: "Start accepting TON USDT today.",
          body: "Set up stablecoin checkouts on TON, automate invoice matching via comments, and receive payments directly to your own wallet.",
          primary: { label: "Get started", href: "/app/auth" },
          secondary: { label: "View API Docs", href: "/docs" },
        },
        seoLabel: "TON USDT payment gateway details",
        seo: "recv supports TON USDT payments (Tether on TON) with hosted Checkout, API invoice creation, required comment matching, blockchain watchers, and direct-to-wallet settlement for Telegram bots and Mini Apps.",
      },
      solana: {
        name: "Solana",
        fullName: "Solana Blockchain",
        metadata: {
          title: "Accept Solana Payments with API and Checkout",
          description: "Use recv to accept SOL and supported SPL assets with fast checkout flows, API invoices, watcher detection, and signed webhooks.",
        },
        kicker: "SOLANA NETWORK",
        hero: {
          title: "Solana payments for fast developer-owned checkout.",
          body: "recv brings SOL and supported SPL assets into one payment API, so web3 products can create invoices and react to confirmed transfers without custom watcher logic.",
        },
        snapshot: {
          kicker: "API EVENT",
          title: "payment.network.solana",
          amount: "49.00 USDT",
          items: [
            { label: "Assets", value: "SPL USDT" },
            { label: "Flow", value: "API" },
            { label: "Status", value: "Detected" },
          ],
        },
        assets: {
          kicker: "SUPPORTED ASSETS",
          title: "USDT SPL payments on Solana.",
          body: "Solana support fits teams that need fast stablecoin payments on the Solana network.",
          items: [
            { name: "SPL USDT", body: "The standard stablecoin on Solana for high-speed, low-fee USD-denominated payments." },
          ],
        },
        why: {
          kicker: "WHY Solana",
          title: "Fast payment feedback for web3 users.",
          body: "Solana is a strong fit when your buyers already use Solana wallets and expect quick confirmation in developer tools, apps, or digital goods flows.",
        },
        mechanics: {
          kicker: "CHECKOUT AND API MECHANICS",
          title: "One invoice flow for SOL and SPL assets.",
          steps: [
            { title: "Create invoice", body: "Your backend creates a Solana invoice through recv API or uses hosted Checkout." },
            { title: "Show wallet data", body: "Checkout displays network, asset, amount, address, and QR in a buyer-friendly screen." },
            { title: "Watch transfer", body: "recv tracks native or SPL transfers and matches the payment to the invoice." },
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
          body: "Use recv API and Checkout to accept Solana assets and let signed events drive your payment state.",
          primary: { label: "Start integration", href: "/app/auth" },
          secondary: { label: "Explore API", href: "/products/api" },
        },
        seoLabel: "Solana network payment details",
        seo: "recv supports Solana payments with SOL and configured SPL assets, hosted Checkout, API invoice creation, blockchain watchers, signed webhooks, and developer-focused payment automation.",
      },
      base: {
        name: "Base",
        fullName: "Base L2",
        metadata: {
          title: "Accept Base Payments with Unified API",
          description: "Accept ETH and supported ERC-20 assets on Base with recv Checkout, API invoices, watcher monitoring, and business-ready webhooks.",
        },
        kicker: "BASE NETWORK",
        hero: {
          title: "Base payments for EVM buyers and low-cost checkout.",
          body: "recv lets teams add Base to the same checkout and API flow they use for other networks, with direct settlement and normalized payment events.",
        },
        snapshot: {
          kicker: "L2 INVOICE",
          title: "payment.network.base",
          amount: "99.00 USDT",
          items: [
            { label: "Rail", value: "Base" },
            { label: "Assets", value: "ERC-20 USDT" },
            { label: "API", value: "Unified" },
          ],
        },
        assets: {
          kicker: "SUPPORTED ASSETS",
          title: "USDT on Base.",
          body: "Use Base for buyers who already operate on Coinbase-aligned or EVM-compatible L2 rails.",
          items: [
            { name: "USDT on Base", body: "USDT stablecoin transfer on Coinbase's L2 network for fast and cheap transactions." },
          ],
        },
        why: {
          kicker: "WHY BASE",
          title: "EVM compatibility with lower checkout friction.",
          body: "Base fits businesses serving onchain users who want familiar EVM wallets, lower fees than mainnet, and stablecoin-friendly payment options.",
        },
        mechanics: {
          kicker: "CHECKOUT AND API MECHANICS",
          title: "Same recv flow, Base-specific watcher.",
          steps: [
            { title: "Create invoice", body: "Use Checkout or API with Base as the payable network and the configured asset." },
            { title: "Present payment", body: "The buyer sees Base network instructions, amount, address, and QR." },
            { title: "Monitor chain", body: "recv watches native and ERC-20 transfers on Base and matches them to invoices." },
            { title: "Emit webhook", body: "Your backend receives the same normalized payment state used across other supported networks." },
          ],
        },
        limitations: {
          kicker: "LIMITATIONS AND NOTES",
          title: "Base assets must be sent on Base.",
          body: "Base, Base, BSC, and other EVM transfers are separate networks. Wrong-chain deposits are not automatically interchangeable with Base payments.",
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
          body: "Use recv to add Base checkout, monitor transfers, and keep your backend payment logic consistent across networks.",
          primary: { label: "Start integration", href: "/app/auth" },
          secondary: { label: "Explore API", href: "/products/api" },
        },
        seoLabel: "Base network payment details",
        seo: "recv supports Base payments with ETH and configured ERC-20 assets, hosted Checkout, API invoices, Base watchers, normalized webhooks, direct-to-wallet settlement, and business payment workflows.",
      },
      bsc: {
        name: "BSC",
        fullName: "BNB Smart Chain",
        metadata: {
          title: "Accept BSC Payments with Checkout and API",
          description: "Accept BNB and supported BEP-20 assets on BSC with recv payment links, API invoices, watcher detection, and direct-to-wallet settlement.",
        },
        kicker: "BSC NETWORK",
        hero: {
          title: "BSC payments for broad retail stablecoin reach.",
          body: "recv helps businesses accept BNB Smart Chain payments through a clean checkout and unified API flow built for direct settlement.",
        },
        snapshot: {
          kicker: "BEP-20 INVOICE",
          title: "payment.network.bsc",
          amount: "149.00 USDT",
          items: [
            { label: "Rail", value: "BSC" },
            { label: "Assets", value: "BEP-20 USDT" },
            { label: "Status", value: "Live" },
          ],
        },
        assets: {
          kicker: "SUPPORTED ASSETS",
          title: "BEP-20 USDT checkout options.",
          body: "BSC gives customers a familiar low-fee payment network for token transfers.",
          items: [
            { name: "BEP-20 USDT", body: "Stablecoin checkout for buyers who hold USDT on BNB Smart Chain." },
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
            { title: "Create invoice", body: "Choose BSC and the payable asset through hosted Checkout or the recv API." },
            { title: "Show instructions", body: "Checkout shows BSC network details, QR, address, amount, and payment state." },
            { title: "Detect transfer", body: "recv watchers track native BNB and BEP-20 transfers for the invoice." },
            { title: "Update system", body: "Dashboard and webhooks update your order, invoice, or account state after confirmation." },
          ],
        },
        limitations: {
          kicker: "LIMITATIONS AND NOTES",
          title: "BEP-20 only means BSC only.",
          body: "Buyers must send the selected asset on BSC. USDT sent on another chain is outside automatic BSC matching.",
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
          body: "Use recv to accept BNB Smart Chain transfers through Checkout, API invoices, and real-time payment events.",
          primary: { label: "Start accepting BSC", href: "/app/auth" },
          secondary: { label: "View Business", href: "/business" },
        },
        seoLabel: "BSC network payment details",
        seo: "recv supports BSC payments with BNB and configured BEP-20 assets, hosted Checkout, API invoice creation, blockchain watchers, webhooks, and direct-to-wallet settlement for business payment flows.",
      },
      arbitrum: {
        name: "Base",
        fullName: "Base One",
        metadata: {
          title: "Accept Base Payments with recv API",
          description: "Accept ETH and supported ERC-20 assets on Base One with Checkout, API invoices, watcher monitoring, webhooks, and direct settlement.",
        },
        kicker: "BASE NETWORK",
        hero: {
          title: "Base payments for Base-aligned buyers.",
          body: "recv adds Base One to your payment stack with the same checkout, invoice, and webhook model used across supported networks.",
        },
        snapshot: {
          kicker: "L2 PAYMENT",
          title: "payment.network.arbitrum",
          amount: "249.00 USDT",
          items: [
            { label: "Rail", value: "Base One" },
            { label: "Assets", value: "ERC-20 USDT" },
            { label: "Settlement", value: "Direct" },
          ],
        },
        assets: {
          kicker: "SUPPORTED ASSETS",
          title: "Base-native USDT payments.",
          body: "Use Base for customers who want Base-compatible assets with lower transaction costs than mainnet.",
          items: [
            { name: "USDT on Base", body: "USDT stablecoin transfer on Base One layer 2 for highly scalable USD-denominated payments." },
          ],
        },
        why: {
          kicker: "WHY BASE",
          title: "Base alignment without mainnet costs.",
          body: "Base is a practical option for EVM-native customers who prefer Base tooling but need lower fees for routine payments.",
        },
        mechanics: {
          kicker: "CHECKOUT AND API MECHANICS",
          title: "Normalized events for Base transfers.",
          steps: [
            { title: "Create invoice", body: "Use recv Checkout or API with Base One as the payable network." },
            { title: "Guide payment", body: "The buyer sees Base-specific address, amount, asset, and QR instructions." },
            { title: "Monitor transfer", body: "recv watchers detect native and ERC-20 transfers on Base One." },
            { title: "Sync backend", body: "Signed webhooks update your order or billing system with the same event shape as other networks." },
          ],
        },
        limitations: {
          kicker: "LIMITATIONS AND NOTES",
          title: "Base One is separate from mainnet and other L2s.",
          body: "Payments must be sent on Base One. Base, Base, BSC, or other EVM transfers are different rails and will not be treated as the same payment automatically.",
        },
        useCases: {
          kicker: "RELEVANT USE CASES",
          title: "Best for EVM-native businesses.",
          body: "Base works well for teams whose buyers already operate in Base L2 environments.",
          items: [
            { name: "API payments", body: "Add Base to backend-driven invoice and webhook flows." },
            { name: "Business billing", body: "Collect stablecoin invoices from Base-aligned customers." },
            { name: "Web3 services", body: "Support buyers who prefer L2 settlement for recurring or one-time services." },
          ],
        },
        related: {
          kicker: "RELATED",
          title: "Use Base in production flows.",
          links: [
            { kicker: "Product", label: "API", body: "Create Base invoices and process signed payment events.", href: "/products/api" },
            { kicker: "Plan", label: "Business", body: "Scale EVM payment operations with team features.", href: "/business" },
            { kicker: "Plan", label: "Developer", body: "Backend integration access for production teams.", href: "/dev" },
          ],
        },
        cta: {
          title: "Add Base payments to your checkout stack.",
          body: "Use recv to accept Base One payments, monitor transfers, and keep settlement direct to your wallet.",
          primary: { label: "Start integration", href: "/app/auth" },
          secondary: { label: "Explore API", href: "/products/api" },
        },
        seoLabel: "Base network payment details",
        seo: "recv supports Base One payments with ETH and configured ERC-20 assets, hosted Checkout, API invoices, blockchain watchers, signed webhooks, and direct-to-wallet settlement for EVM business workflows.",
      },
    },
    useCasesHub: {
      title: "Solutions for Every Business Scale",
      description: "Explore how different industries use recv to automate their crypto operations and eliminate manual overhead.",
      kicker: "USE CASES",
      customUseCase: {
        title: "Have a unique use case?",
        body: "Our API is flexible enough to power any payment flow. Let's discuss how recv can help your specific business.",
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
          body: "recv provides a high-performance checkout flow, real-time blockchain monitoring, and direct-to-wallet settlement for Telegram-native commerce.",
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
          kicker: "RECV FLOW",
          title: "Automated Checkout Links replace manual checks.",
          body: "Generate secure payment links for every order. recv watchers monitor the blockchain 24/7, moving orders to 'paid' state automatically as soon as the transfer is confirmed.",
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
            { title: "Transfer Detected", body: "recv watchers detect the on-chain transfer and verify the amount instantly." },
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
          body: "Stop checking screenshots. Let recv handle the blockchain monitoring while you focus on scaling your business.",
          primary: { label: "Start Accepting Payments", href: "/app/auth" },
          secondary: { label: "Explore Checkout", href: "/products/checkout" },
        },
        features: ["TON & Jetton Support", "Real-time Order Status", "Direct-to-Wallet Payouts", "Telegram Mini App Optimized"],
        seoLabel: "Telegram shop crypto payments documentation",
        seo: "recv enables Telegram shops to accept crypto payments with hosted checkout links, TON support, stablecoin networks, direct-to-wallet settlement, and real-time payment detection for order fulfillment.",
      },
      "saas-billing": {
        name: "SaaS Billing",
        metadata: {
          title: "Crypto Billing Infrastructure for SaaS Platforms",
          description: "Integrate crypto billing for SaaS subscriptions with TON, TRON, and EVM payment options, retryable webhooks, and HMAC signatures.",
        },
        kicker: "SAAS INFRASTRUCTURE",
        hero: {
          title: "Business-Grade Crypto Billing for SaaS",
          body: "Eliminate percentage-based fees. recv provides the API primitives for idempotent invoice creation and guaranteed webhook delivery.",
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
          kicker: "RECV FLOW",
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
            body: "Idempotent invoice creation and a retry queue for billing-system events.",
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
          body: "Default to USDT (TRC-20) for business stability or add Base and Base for lower-cost EVM transactions.",
          items: [
            { name: "TRON USDT", body: "The industry standard for USD-denominated stablecoin billing." },
            { name: "Base / Base", body: "Optimized L2 networks for low-fee Base ecosystem payments." },
            { name: "TON / USDT on TON", body: "High-performance options for web3-native user bases." },
          ],
        },
        flow: {
          kicker: "INTEGRATION FLOW",
          title: "Automated Renewal Cycle",
          steps: [
            { title: "Invoice Issued", body: "Your billing service creates a recv invoice with an idempotency key." },
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
        seo: "recv provides SaaS platforms with robust crypto billing infrastructure, featuring idempotent API calls, HMAC-signed webhooks, and universal support for TON, TRON, and EVM networks with 0% turnover fees.",
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
          body: "Automate the delivery of licenses, keys, and downloads. recv triggers fulfillment events immediately upon blockchain confirmation.",
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
          kicker: "RECV FLOW",
          title: "Checkout-to-Delivery Automation",
          body: "Combine our high-conversion checkout with automated fulfillment logic. recv handles the payment monitoring; your server handles the delivery.",
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
            { name: "USDT on TON", body: "Fast, confirmation-aware monitoring for high-speed digital sales." },
          ],
        },
        flow: {
          kicker: "INTEGRATION FLOW",
          title: "From Payment to Download",
          steps: [
            { title: "Order Created", body: "Your store generates a unique recv checkout link for the digital item." },
            { title: "Payment Confirmed", body: "recv watchers detect the transaction and verify it against the order." },
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
          body: "Switch to recv for 0% turnover fees and instant on-chain fulfillment signals.",
          primary: { label: "Start Selling Now", href: "/app/auth" },
          secondary: { label: "Explore API", href: "/products/api" },
        },
        features: ["Instant Payment Detection", "Automated Webhooks", "Low-Fee Networks", "No Chargeback Risk"],
        seoLabel: "Digital goods crypto payment automation details",
        seo: "recv provides automated crypto checkout for digital products, supporting instant fulfillment via signed webhooks, multi-chain monitoring, and direct-to-wallet payouts with 0% fees.",
      },
      "paid-communities": {
        name: "Paid Communities",
        metadata: {
          title: "Accept Crypto for Private Communities & Channels",
          description: "Manage membership access for Telegram channels and private groups with automated crypto payments. Support for TON and USDT on TON.",
        },
        kicker: "MEMBERSHIP ECONOMY",
        hero: {
          title: "Automated Access for Paid Communities",
          body: "Connect on-chain payments to community access. recv provides the infrastructure to monitor memberships and trigger access events automatically.",
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
          kicker: "RECV FLOW",
          title: "Payment States as Access Signals",
          body: "Use recv to verify membership payments instantly. Our events can drive your bot or management tool to invite or remove members based on real on-chain data.",
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
            { name: "Base / Base", body: "Ideal for web3-native groups and decentralized organizations." },
          ],
        },
        flow: {
          kicker: "INTEGRATION FLOW",
          title: "From Payment to Community Entry",
          steps: [
            { title: "Pass Selected", body: "The user chooses a membership tier or renewal period." },
            { title: "Checkout Opened", body: "recv generates a unique payment request with exact network/asset data." },
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
        seo: "recv enables paid communities to accept crypto for Telegram channels and private groups, featuring TON support, automated access signals via webhooks, and 0% turnover fees.",
      },
    },
    compareHub: {
      title: "The Smarter Way to Process Crypto",
      description: "Compare recv to manual verification and custodial gateways: direct-to-wallet settlement, zero turnover fees, signed webhooks, and supported payment networks.",
      kicker: "COMPARE",
      items: [
        { title: "recv vs Manual Verification", slug: "recv-vs-manual", body: "Discover how automation eliminates human error and scales your operations." },
        { title: "recv vs Custodial Gateways", slug: "recv-vs-custodial", body: "Why non-custodial infrastructure is safer and more cost-effective for your business." },
        { title: "recv vs NowPayments", slug: "nowpayments", body: "A direct comparison of fees, control, and integration flexibility." },
        { title: "recv vs Coinbase Commerce", slug: "coinbase-commerce", body: "Non-custodial direct payouts vs Coinbase's hosted balance model." },
        { title: "recv vs BitPay", slug: "bitpay", body: "Compare fixed subscriptions to BitPay's percentage-based fee structure." },
        { title: "recv vs CoinGate", slug: "coingate", body: "Developer-first protocol vs CoinGate's merchant-focused platform." },
        { title: "recv vs Cryptomus", slug: "cryptomus", body: "Atomic on-chain payouts versus Cryptomus internal wallet management." },
      ]
    },
    comparePages: {
      "recv-vs-manual": {
        name: "Manual Payments",
        title: "recv vs Manual Wallet Payments: Why Automate?",
        description: "Comparing automated non-custodial processing with manual wallet tracking. Learn how recv eliminates human error and scales your crypto operations.",
        kicker: "AUTOMATION",
        points: [
          {
            title: "Scalability",
            competitor: "Impossible to scale. Every transaction requires manual verification and manual accounting.",
            recv: "Automated invoice tracking and webhooks reduce per-payment manual work."
          },
          {
            title: "Accuracy",
            competitor: "High risk of human error. Typos in wallet addresses, missed payments, or wrong network transfers.",
            recv: "Automated matching reduces manual attribution errors while exception states remain reviewable."
          },
          {
            title: "Customer UX",
            competitor: "Slow and frustrating. Customers wait hours for manual confirmation and product delivery.",
            recv: "Verified invoice status can trigger automated fulfillment according to merchant policy."
          }
        ]
      },
      "recv-vs-custodial": {
        name: "Custodial Gateways",
        title: "recv vs Custodial Gateways: Non-Custodial Advantage",
        description: "Compare recv's direct-to-wallet infrastructure and subscription pricing with custodial payment processors.",
        kicker: "SOVEREIGNTY",
        points: [
          {
            title: "Control of Funds",
            competitor: "Third-party custody. Risk of frozen accounts, withdrawal delays, and platform insolvency.",
            recv: "100% Non-custodial. Funds flow directly to your wallet. We never touch or hold your money."
          },
          {
            title: "Fee Structure",
            competitor: "Pricing may include percentage-based, settlement, or conversion charges; current terms must be checked with the provider.",
            recv: "Fixed subscription. Zero turnover fees. Predictable costs regardless of your volume."
          },
          {
            title: "Compliance & Privacy",
            competitor: "Strict KYC/KYB requirements and data sharing. Dependency on third-party policy changes.",
            recv: "Privacy-first infrastructure. You maintain your own relationships with your users."
          }
        ]
      },
      "nowpayments": {
        name: "NowPayments",
        title: "recv vs NowPayments: Control vs Convenience",
        description: "A detailed comparison of two popular crypto payment solutions. Choose the one that fits your scaling needs.",
        kicker: "COMPARISON",
        points: [
          {
            title: "Payout Model",
            competitor: "Internal balance system. You need to manually withdraw or wait for automated payout cycles.",
            recv: "Atomic payouts. Every transaction hits your wallet as soon as it is confirmed on-chain."
          },
          {
            title: "Commission",
            competitor: "Pricing and network charges follow the provider's current published terms.",
            recv: "0% commission. Only pay your fixed subscription and standard network gas fees."
          },
          {
            title: "Integration",
            competitor: "Proprietary API and standard plugins. Focus on generic e-commerce platforms.",
            recv: "Developer-first protocol. Optimized for high-throughput SaaS, Telegram Mini Apps, and custom builds."
          }
        ]
      },
      "coinbase-commerce": {
        name: "Coinbase Commerce",
        title: "recv vs Coinbase Commerce: Non-Custodial vs Hosted Balance",
        description: "Compare recv's direct-to-wallet flow with Coinbase Commerce using the providers' current custody, settlement, network, and pricing documentation.",
        kicker: "CUSTODY",
        points: [
          {
            title: "Fund Custody",
            competitor: "Custody and settlement behavior follows the current Coinbase Commerce product configuration and terms.",
            recv: "Pure non-custodial. Every confirmed payment goes straight to your wallet address. recv never touches your funds."
          },
          {
            title: "Fee Model",
            competitor: "Transaction pricing follows Coinbase Commerce's current published terms.",
            recv: "0% turnover fee. Flat monthly subscription only. Your gross margin stays intact regardless of payment volume."
          },
          {
            title: "Network Flexibility",
            competitor: "Available networks and assets follow the current Coinbase Commerce documentation.",
            recv: "recv documents its supported network and asset combinations and provides checkout suitable for Telegram Mini Apps."
          }
        ]
      },
      "bitpay": {
        name: "BitPay",
        title: "recv vs BitPay: Fixed Subscription vs Percentage Fees",
        description: "Compare recv subscription pricing and direct settlement with BitPay using current official pricing and settlement documentation.",
        kicker: "FEES",
        points: [
          {
            title: "Cost Structure",
            competitor: "Transaction and settlement pricing follows BitPay's current published terms.",
            recv: "Fixed monthly subscription. Zero percentage fees. Costs are completely decoupled from your transaction volume."
          },
          {
            title: "Settlement Speed",
            competitor: "Settlement methods and timing follow the merchant's BitPay configuration and current terms.",
            recv: "Atomic on-chain settlement. Funds arrive in your wallet on the same block as the customer payment."
          },
          {
            title: "Developer Experience",
            competitor: "Enterprise-focused API with strict compliance requirements, KYB processes, and limited API-only access tiers.",
            recv: "API access, signed webhooks, and programmatic invoice controls; merchants remain responsible for applicable compliance requirements."
          }
        ]
      },
      "coingate": {
        name: "CoinGate",
        title: "recv vs CoinGate: Direct Payouts vs Conversion-First Model",
        description: "CoinGate converts crypto to fiat before settlement. recv delivers the exact crypto asset your customer paid — directly to your wallet, with zero conversion slippage.",
        kicker: "SETTLEMENT",
        points: [
          {
            title: "Settlement Asset",
            competitor: "CoinGate defaults to fiat conversion, introducing FX risk and additional processing steps before you receive funds.",
            recv: "Native crypto settlement. You receive exactly what was paid — USDT stays USDT, TON stays TON, in your wallet."
          },
          {
            title: "Commission",
            competitor: "1% transaction fee plus spread on conversion. True cost can exceed 2% when conversion rates are included.",
            recv: "0% commission on transactions. Only a flat monthly subscription regardless of how much you process."
          },
          {
            title: "Customization",
            competitor: "Standard hosted checkout pages. Limited control over payment UI, branding, and customer flow.",
            recv: "Full API access, hosted checkout with your branding, or raw webhook-driven flows — your choice at every step."
          }
        ]
      },
      "cryptomus": {
        name: "Cryptomus",
        title: "recv vs Cryptomus: On-Chain Payouts vs Internal Wallet",
        description: "Cryptomus routes payments through an internal balance before payout. recv is non-custodial by design — your wallet receives funds directly on-chain, no internal ledger involved.",
        kicker: "ARCHITECTURE",
        points: [
          {
            title: "Payout Architecture",
            competitor: "Cryptomus maintains an internal wallet. You must request withdrawals, which adds latency and counterparty dependency.",
            recv: "No internal wallet. Every payment confirms directly on-chain to your address. recv is invisible in the money flow."
          },
          {
            title: "Fee Transparency",
            competitor: "0.4–1% transaction fees depending on plan. Fees compound at high volume and are charged before funds reach you.",
            recv: "Zero transaction fees. Flat subscription. You see exactly what the customer sends, minus only the network gas fee."
          },
          {
            title: "Telegram Integration",
            competitor: "Basic Telegram bot integrations. Not designed for Telegram Mini App payment flows or high-frequency bot-driven commerce.",
            recv: "Built for Telegram. TON and TON USDT support, Mini App-compatible checkout, and Telegram alert notifications out of the box."
          }
        ]
      }
    },
    statusHub: {
      title: "System Status",
      description: "Real-time monitoring of recv infrastructure and network connectivity.",
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
    compareSectionBody: "recv operates as a transparent middleware. Transactions flow directly from client to merchant, bypassing intermediary accounts.",
    merchant: {
      badge: "recv Merchant",
      title: "Accept Crypto. 0% Turnover Fees.",
      body: "Professional dashboard for manual and semi-automated payment acceptance. Direct payouts to your wallets and full control.",
      priceLabel: "$9",
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
        { title: "Account Setup", body: "Quick Telegram registration and adding your TON, TRON, or EVM payout details." },
        { title: "Invoice Creation", body: "Generate payment links in a few clicks via our intuitive dashboard." },
        { title: "Real-time Tracking", body: "Live blockchain monitoring. We confirm transactions automatically." },
      ],
      code: `// Manual Invoice Link
// https://recv.money/app/checkout/demo
// No code required for Merchant plan.
// Just share the link and get paid.`
    },
    developer: {
      badge: "recv Developer",
      title: "Payments Infrastructure. Control in Your Hands.",
      body: "Professional API and Webhooks for full business automation. Direct payouts and zero turnover commissions.",
      priceLabel: "$29",
      period: "per month",
      stats: [
        { value: "50k", label: "Requests/mo" },
        { value: "3", label: "Seats" },
        { value: "3", label: "Workspaces" },
        { value: "Standard", label: "Support" },
      ],
      features: [
        { title: "Webhook Delivery", body: "Queued delivery with automated retries and HMAC signatures." },
        { title: "Real-time Monitoring", body: "Transaction monitoring updates invoice state as supported networks are observed." },
        { title: "Unified API v1", body: "A single interface for native TON, USDT on TON, TRON, Base, and BSC." },
        { title: "Idempotency", body: "Built-in protection against duplicate transactions at the API level." },
      ],
      flow: [
        { title: "API Key Provisioning", body: "Generate live_ keys. Manage scopes for secure backend integration." },
        { title: "Webhook Config", body: "Set up HMAC-SHA256 signed callbacks for instant notifications." },
        { title: "Automated Processing", body: "Our watchers track transactions 24/7, confirming payments autonomously." },
      ],
      code: `// Create Invoice via recv API
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
      title: "Scalable Processing. For Growing Teams.",
      body: "Extended API limits, team access, and priority support for businesses with high payment volume.",
      priceLabel: "$79",
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
  },
  legal: {
    privacy: {
      kicker: "PRIVACY POLICY",
      title: "PRIVACY POLICY",
      summary:
        "READ THIS DOCUMENT CAREFULLY. BY ACCESSING THE RECV SOFTWARE, DASHBOARD, API, OR PUBLIC CHECKOUT PAGES, YOU EXPLICITLY CONSENT TO THE DATA PRACTICES DESCRIBED HEREIN. IF YOU DO NOT AGREE, YOU MUST IMMEDIATELY CEASE ALL USE OF THE SERVICE.",
      updatedLabel: "Last Updated",
      operatorLabel: "Effective Date",
      metaItems: ["Last Updated: June 14, 2026", "Effective Date: June 14, 2026"],
      draftTitle: "Service Provider and Data Controller",
      draftBody:
        "The Service is operated by the operators of the website recv.money (“recv”, “Company”, “we”, “us”). Notices and requests may be submitted to the following contact channels:",
      draftItems: [
        "Legal Notices: legal@recv.money",
        "Privacy Requests: privacy@recv.money",
        "Support: support@recv.money",
      ],
      sections: [
        {
          title: "1. PREAMBLE AND SCOPE",
          paragraphs: [
            'This Privacy Policy (the "Policy") governs how recv ("Company", "we", "us", "our") collects, processes, utilizes, and safeguards information when you ("Merchant", "User", "you") or your end-users ("Customers") interact with our software-as-a-service infrastructure, Telegram bots, API endpoints, and public checkout interfaces (collectively, the "Service").',
            "This Policy is designed to comply with global data protection principles while explicitly acknowledging the inherently public, immutable, and decentralized nature of cryptographic blockchain technology.",
          ],
        },
        {
          title: "2. THE FUNDAMENTAL REALITY OF BLOCKCHAIN DATA (CRITICAL NOTICE)",
          paragraphs: [
            "2.1. Public Ledgers: You and your Customers expressly acknowledge that blockchain networks (including but not limited to TON, TRON, Solana, Base, Arbitrum, and BSC) are decentralized, public ledgers.",
            "2.2. No Expectation of Privacy On-Chain: Wallet addresses, transaction hashes (TXIDs), timestamps, transfer amounts, and on-chain memos/comments are permanently recorded and accessible to anyone globally. The Company does not control these networks and cannot erase, obfuscate, or alter on-chain data.",
            "2.3. Data Erasure: Data recorded on a public blockchain cannot be altered or deleted by recv. This limitation applies only to the blockchain record itself. Requests to access, correct, restrict or erase personal data stored in recv-controlled systems remain applicable subject to lawful exceptions, including security, fraud prevention, accounting, dispute and legal-retention requirements.",
          ],
        },
        {
          title: "3. CATEGORIES OF DATA WE COLLECT",
          paragraphs: [
            'To operate the "Direct-to-Wallet" routing and notification architecture, we strictly minimize data collection to the following categories:',
            "3.1. Merchant Account Data: When a Merchant authenticates via the Telegram Mini App or Bot, we automatically collect and store Telegram User ID, Telegram Username, and Email address (if voluntarily provided or required for specific billing tiers).",
            "3.2. Operational Infrastructure Data: To facilitate the Service, the Merchant must configure public blockchain destination wallet addresses, preferred default networks, webhook URL endpoints, and associated cryptographic secrets.",
            "3.3. Customer and Transactional Metadata: When a Customer accesses a publicly generated checkout URL, we process invoice metadata (Title, Base Amount, Expiration Time), ephemeral HTTP request data (IP addresses, User-Agent strings), and captured on-chain events via our watchers (TX Hash, Amount, Destination, Observed Timestamp).",
            "NOTE: We do NOT collect Customer names, Customer emails, Customer physical addresses, or any traditional KYC/AML documentation.",
          ],
        },
        {
          title: "4. STRICT LIABILITY FOR INVOICE METADATA",
          paragraphs: [
            '4.1. Merchant Data Input: The Service allows Merchants to assign custom "Titles" to invoices. The Merchant agrees NOT to input Personally Identifiable Information (PII) belonging to their Customers into the invoice title, payment comment, or webhook payloads.',
            "4.2. Public Checkout Exposure: Merchant acknowledges that the checkout URL is accessible to anyone holding the link. The public invoice ID, invoice title, payable amount, and destination address are visible on this page. The Company is not liable for PII exposed due to the Merchant's failure to anonymize invoice metadata.",
          ],
        },
        {
          title: "5. COOKIES, LOCAL STORAGE AND ANALYTICS",
          paragraphs: [
            "We use strictly necessary storage to maintain authentication, security, language and interface preferences. This includes access tokens stored in localStorage and refresh tokens stored in Secure, HttpOnly cookies.",
            "We also use a first-party attribution cookie named “recv_attr”. It may contain an attribution identifier, campaign parameters, referral code, landing page and referring website. Its maximum lifetime is 90 days.",
            "Where enabled, Google Tag Manager and Yandex Metrica may receive device, browser, page-view, interaction, network and approximate location information under their respective privacy terms. These technologies are not activated for users who require prior consent until the user has provided that consent.",
            "We collect aggregated website performance measurements, including page path, locale, navigation type, LCP, INP and CLS values.",
            "Users may withdraw optional analytics consent at any time through our Cookie Settings. Withdrawal does not affect strictly necessary storage.",
          ],
        },
        {
          title: "6. ROLES AND LEGAL BASES FOR PROCESSING",
          paragraphs: [
            "We process account, authentication, workspace, invoice, wallet, API, webhook and subscription data to perform our contract with the Merchant.",
            "We process security logs, session information, IP addresses, user-agent data, audit events, fraud indicators and service diagnostics based on our legitimate interests in securing, maintaining and improving the Service.",
            "We process billing and transaction records to perform the contract and comply with applicable accounting, tax, sanctions and legal obligations.",
            "We process optional analytics and advertising attribution data based on consent where consent is required by law, and otherwise as permitted by applicable law.",
            "For invoice and checkout data submitted by a Merchant concerning its Customers, the Merchant generally determines the purpose of processing and acts as Controller. recv acts as Processor to the extent it processes that data on the Merchant’s instructions. recv acts as an independent Controller for security, abuse prevention, service billing and compliance records.",
          ],
        },
        {
          title: "7. DATA RETENTION",
          paragraphs: [
            "We retain personal data in accordance with the following retention schedule:",
            "• Account and workspace data: while the account is active and for up to 24 months after closure.",
            "• Authentication codes: until used or expired, followed by deletion within 30 days.",
            "• Active refresh sessions: until expiration or revocation; session security records may be retained for up to 12 months.",
            "• Invoice, subscription and blockchain reconciliation records: for up to 7 years where required for accounting, tax, dispute or fraud-prevention purposes.",
            "• Webhook delivery and API request logs: up to 12 months.",
            "• Product analytics, UTM attribution and Web Vitals: up to 24 months.",
            "• Backups: until overwritten under the backup rotation schedule, ordinarily within 30 days.",
            "We may retain specific records longer where necessary to establish, exercise or defend legal claims or comply with law.",
          ],
        },
        {
          title: "8. SECURITY",
          paragraphs: [
            "API key values are stored using one-way hashes after initial issuance. Access and refresh tokens are cryptographically signed or stored as token hashes, as applicable. Webhook signing secrets must remain available to the Service to sign deliveries and are therefore stored as confidential credentials protected by access controls. No method of storage or transmission is completely secure.",
          ],
        },
        {
          title: "9. YOUR PRIVACY RIGHTS",
          paragraphs: [
            "Depending on applicable law, you may request access to, correction of, deletion of, restriction of, objection to, or portability of personal data processed by recv. You may also withdraw consent where processing is based on consent and lodge a complaint with a competent supervisory authority.",
            "Submit requests to privacy@recv.money. We may verify your identity and authority before acting on a request. We will respond within the period required by applicable law.",
            "For California Residents (CCPA/CPRA): In the preceding 12 months, we have collected the categories of personal data described in Section 3 of this Policy. We do not 'sell' or 'share' (for cross-context behavioral advertising) personal data. Residents of California have the right to know, delete, correct, opt out of sale/sharing, limit the use of sensitive personal data, and be free from discrimination for exercising these rights. To submit a request, contact privacy@recv.money.",
          ],
        },
        {
          title: "10. MODIFICATIONS TO THIS POLICY",
          paragraphs: [
            "We reserve the right to unilaterally update this Privacy Policy at any time. Your continued use of the Service following the posting of an updated Policy constitutes your acceptance of the changes.",
          ],
        },
      ],
      footerNote: "This Privacy Policy was drafted to ensure alignment with global standards.",
    },
    terms: {
      kicker: "TERMS OF SERVICE",
      title: "TERMS OF SERVICE",
      summary:
        "PLEASE READ THIS COMPREHENSIVE AGREEMENT CAREFULLY. IT CONTAINS A MANDATORY BINDING ARBITRATION CLAUSE, A CLASS ACTION WAIVER, AND EXTENSIVE DISCLAIMERS OF LIABILITY THAT MATERIALLY AFFECT YOUR LEGAL RIGHTS. BY ACCESSING, INTEGRATING, OR UTILIZING THE RECV SOFTWARE, API, OR WEBHOOKS, YOU AGREE TO BE BOUND BY THESE TERMS.",
      updatedLabel: "Last Updated",
      operatorLabel: "Effective Date",
      metaItems: ["Last Updated: June 14, 2026", "Effective Date: June 14, 2026"],
      draftTitle: "Contracting Party",
      draftBody:
        "This Agreement is entered into by and between the Merchant and the operators of the website recv.money (“recv”, “Company”, “we”, “us”).",
      draftItems: [
        "Scope: software, API, webhooks, blockchain monitoring",
        "Model: non-custodial, direct-to-wallet",
        "Dispute flow: arbitration in Cyprus",
      ],
      sections: [
        {
          title: "1. PREAMBLE AND ACCEPTANCE OF TERMS",
          paragraphs: [
            '1.1. Parties to the Agreement: This Terms of Service Agreement (the "Agreement") constitutes a legally binding contract between you (acting individually or on behalf of a corporate entity, hereinafter "Merchant", "you", or "your") and recv (hereinafter "Company", "we", "us", "our", or "Service Provider").',
            "1.2. Capacity to Contract: By utilizing the Service via Telegram authentication or our API, you represent and warrant that you are at least eighteen (18) years of age, possess the legal capacity to enter into this Agreement, and, if acting on behalf of a legal entity, possess the requisite authority to bind said entity.",
            "1.3. Modifications: We reserve the right to amend or modify this Agreement at any time. Continued use of the Service following the publication of any modifications constitutes your acceptance of the amended terms.",
          ],
        },
        {
          title: "2. DEFINITION OF THE SERVICE",
          paragraphs: [
            '2.1. Software as a Service (SaaS): The "Service" refers exclusively to the proprietary, non-custodial software middleware provided by the Company. This includes the dashboard, checkout page generators, smart-matching algorithms, API endpoints, webhook delivery systems, and blockchain monitoring logic (the "Watchers").',
            "2.2. Non-Custodial Data Layer: You acknowledge that the Service operates strictly as an informational data layer and visual interface. The Service parses public, decentralized blockchain ledgers (e.g., TON, TRON, Solana, Base, BSC-compatible chains) and visualizes this data.",
            "2.3. Zero Financial Intermediation: The Company is not a payment processor, payment gateway, money transmitter, clearinghouse, custodian, fiduciary, or financial institution. At no point in the technical architecture does the Company receive, hold, control, or possess any fiat currency, digital assets, or cryptographic private keys belonging to the Merchant or the Merchant’s end-users (\"Customers\").",
            "2.4. Direct-to-Wallet Execution: All transfers of Digital Assets occur exclusively and directly on the public blockchain from the Customer's unhosted or custodial wallet directly to the Merchant's designated destination address.",
          ],
        },
        {
          title: "3. REGULATORY COMPLIANCE AND SANCTIONS",
          paragraphs: [
            "3.1. Total Merchant Liability: The Merchant assumes all liability for conducting any required identity verification, regulatory compliance, and tax reporting concerning their Customers, as mandated by the Merchant's operating jurisdiction.",
            "3.2. Sanctions and OFAC Representations: The Merchant represents and warrants that they are not located in, under the control of, or a national or resident of any country or territory subject to comprehensive economic sanctions by the United Nations, European Union, or the U.S. Office of Foreign Assets Control (OFAC).",
            "3.3. Tax Indemnification: The Company shall not calculate, collect, remit, or report any sales, value-added (VAT), income, or other taxes arising from the Merchant's transactions. The Merchant bears sole responsibility for all tax liabilities.",
          ],
        },
        {
          title: "4. PROHIBITED CONDUCT AND ACCOUNT TERMINATION",
          paragraphs: [
            "4.1. Strictly Prohibited Uses: The Merchant agrees NOT to utilize the Service, checkout links, or API infrastructure to facilitate the sale, distribution, or promotion of illegal narcotics, weapons, illicit adult content, unlicensed gambling, counterfeit goods, or fraudulent investment structures.",
            "4.2. Termination: The Company reserves the right to suspend, restrict, or permanently terminate any Merchant account, revoke API keys, and disable webhook functionality immediately, without prior notice or liability, if we suspect a violation of Section 4.1 or determine that the Merchant's activities expose the Company to legal, regulatory, or reputational peril.",
          ],
        },
        {
          title: "5. TECHNICAL MECHANICS AND RECONCILIATION MATCHING",
          paragraphs: [
            "5.1. Smart-Matching matching methods: For supported stablecoin payment options, recv may add a unique fractional suffix to the requested amount to associate an on-chain transfer with an invoice. For native TON payments, recv uses a unique payment comment. Supported matching methods may vary by network and asset and are displayed on the checkout page.",
            "5.2. Waiver of Liability for User Error: The Company bears no liability for any financial loss, delayed access to digital goods, or unfulfilled invoices arising from the Customer's failure to remit the exact amount (including matching suffix) or correct memo/comment, or utilizing an incorrect or unsupported blockchain network.",
            "5.3. Irrevocability of Transactions: The Merchant acknowledges that blockchain transactions are mathematically immutable. The Company cannot reverse, refund, or alter any on-chain transfer.",
            "5.4. Third-Party RPC Reliance: The Service’s blockchain monitoring capabilities are wholly dependent on the stability, uptime, and accuracy of third-party Remote Procedure Call (RPC) node providers and external oracle APIs. The Company is not liable for Service degradation, delayed webhooks, or failed mempool tracking caused by external RPC outages.",
          ],
        },
        {
          title: "6. API, WEBHOOKS, AND INTEGRATION",
          paragraphs: [
            "6.1. API License: Subject to these Terms and active subscription status, the Company grants the Merchant a limited, non-exclusive, non-transferable, and revocable license to access the recv API (v1).",
            "6.2. Webhook Delivery and Idempotency: Webhook notifications are delivered on an 'at-least-once' basis. The Merchant is required to implement Idempotency Safety on their servers to prevent duplicate order fulfillment.",
            "6.3. Webhook Verification: Each webhook includes X-recv-Event, X-recv-Timestamp and X-recv-Signature headers. The signature is calculated as 'v1=' followed by HMAC-SHA256 over the exact string timestamp + '.' + raw request body. Merchant must verify the signature against the unmodified raw body, reject stale timestamps and process events idempotently.",
          ],
        },
        {
          title: "7. SUBSCRIPTIONS, FEES, AND LIMITS",
          paragraphs: [
            "7.1. Paid Plans: Paid plans currently include Merchant, Developer and Business. Current prices, included features, quotas and billing periods are displayed at checkout and form part of this Agreement at the time of purchase.",
            "7.2. Subscription Period: A subscription payment purchases access for the fixed period displayed at checkout, currently 30 days. Subscriptions do not automatically renew unless recv expressly introduces and the Merchant separately authorizes automatic renewal.",
            "7.3. Limits: Plan limits may include invoice, API request, API key, webhook endpoint, retry, workspace and team-seat limits. Requests may be rejected or features restricted when an applicable limit is reached.",
          ],
        },
        {
          title: "8. REFUND POLICY",
          paragraphs: [
            "8.1. Irreversibility: Because blockchain transfers are irreversible, subscription payments cannot be automatically reversed. Except where required by applicable law, subscription fees are non-refundable after the paid plan has been activated.",
            "8.2. Approved Refunds: If recv fails to activate the purchased plan, duplicates a charge, or materially misdescribes the purchased service, the Merchant may contact support@recv.money within 14 days. Any approved refund will be sent to a verified wallet address selected through recv’s refund-verification procedure, less unavoidable blockchain network fees.",
          ],
        },
        {
          title: "9. INTELLECTUAL PROPERTY",
          paragraphs: [
            "All rights, title, and interest in and to the Service, the Software, the API, the design, the architecture, and the codebase remain the exclusive intellectual property of the Company. You may not decompile, reverse engineer, disassemble, or attempt to derive the source code of the Service.",
          ],
        },
        {
          title: "10. DISCLAIMERS OF WARRANTY",
          paragraphs: [
            'THE SERVICE, API, AND ALL RELATED INFRASTRUCTURE ARE PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS. THE COMPANY EXPRESSLY DISCLAIMS ALL WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.',
          ],
        },
        {
          title: "11. LIMITATION OF LIABILITY",
          paragraphs: [
            "IN NO EVENT SHALL THE COMPANY, ITS FOUNDERS, CORE DEVELOPERS, DIRECTORS, OR AFFILIATES BE LIABLE FOR ANY PUNITIVE, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR EXEMPLARY DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, LOSS OF REVENUE, LOSS OF DIGITAL ASSETS, OR CORRUPTION OF DATA.",
            "UNDER NO CIRCUMSTANCES SHALL THE COMPANY'S TOTAL CUMULATIVE LIABILITY TO YOU FOR ANY AND ALL CLAIMS EXCEED THE TOTAL AMOUNT OF SUBSCRIPTION FEES PAID BY YOU TO THE COMPANY IN THE THREE (3) MONTHS IMMEDIATELY PRECEDING THE EVENT GIVING RISE TO THE CLAIM. IF YOU ARE ON A FREE PLAN, THE AGGREGATE LIABILITY SHALL BE STRICTLY LIMITED TO ZERO DOLLARS ($0.00).",
          ],
        },
        {
          title: "12. INDEMNIFICATION",
          paragraphs: [
            "You agree to defend, indemnify, and hold harmless the Company and its affiliates from and against any claims, actions, demands, liabilities, damages, and expenses arising from your breach of this Agreement, violation of law, or any dispute between you and your Customers.",
          ],
        },
        {
          title: "13. GOVERNING LAW AND DISPUTE RESOLUTION",
          paragraphs: [
            "13.1. This Agreement is governed by the laws of Cyprus, without regard to its conflict-of-laws rules.",
            "13.2. Before commencing formal proceedings, a party must send written notice describing the dispute to legal@recv.money. The parties shall attempt in good faith to resolve the dispute within thirty (30) days.",
            "13.3. Any dispute not resolved under Section 13.2 shall be finally resolved by the competent courts of Nicosia, Cyprus, in the English language, under the rules in effect when the proceeding begins.",
            "13.4. Nothing in this Section prevents either party from seeking urgent injunctive relief or exercising rights that cannot lawfully be waived.",
          ],
        },
        {
          title: "14. SEVERABILITY AND ENTIRE AGREEMENT",
          paragraphs: [
            "If any provision of this Agreement is found to be unenforceable or invalid, that provision shall be limited or eliminated to the minimum extent necessary so that this Agreement shall otherwise remain in full force and effect. This Agreement constitutes the entire agreement between the parties.",
          ],
        },
        {
          title: "15. LANGUAGE AND TRANSLATIONS",
          paragraphs: [
            "15.1. This Agreement is executed in both English and Russian languages. In the event of any conflict, discrepancy, or inconsistency between the English version and the Russian translation, the English language version shall prevail and be legally binding.",
          ],
        },
      ],
      footerNote: "The terms above form the entire agreement governing your service use.",
    },
    dpa: {
      kicker: "DATA PROCESSING ADDENDUM",
      title: "DATA PROCESSING ADDENDUM",
      summary:
        "This Data Processing Addendum (“DPA”) governs the processing of Customer Personal Data by recv on behalf of the Merchant in connection with the Service.",
      updatedLabel: "Last Updated",
      operatorLabel: "Effective Date",
      metaItems: ["Last Updated: June 14, 2026", "Effective Date: June 14, 2026"],
      draftTitle: "Scope of processing",
      draftBody:
        "This DPA applies when and to the extent recv processes Customer Personal Data solely on behalf of the Merchant. In this context, Merchant acts as Controller and recv acts as Processor.",
      draftItems: [
        "Controller: Merchant",
        "Processor: recv",
        "Standards: GDPR, global data protection laws",
      ],
      sections: [
        {
          title: "1. ROLES AND COMPLIANCE",
          paragraphs: [
            "1.1. Scope: When recv processes Customer Personal Data solely on behalf of the Merchant, the Merchant acts as Data Controller and recv acts as Data Processor.",
            "1.2. Instructions: recv shall process such data only on the Merchant’s documented instructions, including as set forth in the Agreement, unless required to do so by applicable law.",
          ],
        },
        {
          title: "2. PROCESSOR OBLIGATIONS",
          paragraphs: [
            "2.1. Confidentiality: recv shall ensure that persons authorized to process the Customer Personal Data have committed themselves to confidentiality or are under an appropriate statutory obligation of confidentiality.",
            "2.2. Security Measures: recv shall implement appropriate technical and organizational measures to ensure a level of security appropriate to the risk of processing Customer Personal Data.",
            "2.3. Subprocessors: recv shall impose equivalent data protection obligations on any subprocessors it engages, and remains liable to the Merchant for the performance of subprocessors' obligations.",
            "2.4. Data Subject Requests: recv shall assist the Merchant, taking into account the nature of the processing, by appropriate technical and organizational measures, for the fulfillment of the Merchant's obligation to respond to requests for exercising data subjects' rights.",
            "2.5. Breach Notification: recv shall notify the Merchant of any confirmed personal data breach affecting Customer Personal Data without undue delay after becoming aware of the breach.",
            "2.6. Deletion or Return: recv shall, at the choice of the Merchant, delete or return all Customer Personal Data to the Merchant after the end of the provision of services, unless applicable law requires storage of the personal data.",
            "2.7. Audits: recv shall make available to the Merchant all information necessary to demonstrate compliance with these obligations and allow for and contribute to audits conducted by the Merchant or another auditor mandated by the Merchant.",
          ],
        },
        {
          title: "3. DPA SCHEDULES",
          paragraphs: [
            "3.1. Subject Matter and Duration: Processing of blockchain transaction routing, status confirmation, and associated notification metadata. The duration corresponds to the term of the Agreement.",
            "3.2. Categories of Data: Transaction hashes (TXIDs), destination wallet addresses, payable amounts, timestamps, IP addresses, browser User-Agent strings, and optional custom invoice metadata (if provided by the Merchant).",
            "3.3. Categories of Data Subjects: Customers (end-users) of the Merchant completing cryptocurrency payments via recv checkout links.",
            "3.4. Technical and Organizational Security Measures: Standard encryption of stored database credentials, cryptographic signatures for session tokens, one-way hashing for API keys, secure access controls, and rate-limiting for edge routing protection.",
            "3.5. Subprocessor List: The approved list of subprocessors is set forth in the Subprocessor List page.",
            "3.6. International Data Transfers: Where transfer of data outside the EU/EEA/UK is required, recv utilizes standard contractual clauses or equivalent transfer mechanisms approved by competent regulatory authorities.",
          ],
        },
      ],
      footerNote: "This DPA is incorporated by reference into the Terms of Service.",
    },
    subprocessors: {
      kicker: "SUBPROCESSOR LIST",
      title: "APPROVED SUBPROCESSORS",
      summary:
        "The following is an active list of third-party subprocessors authorized to process data on behalf of recv to deliver our Service infrastructure.",
      updatedLabel: "Last Updated",
      operatorLabel: "Effective Date",
      metaItems: ["Last Updated: June 14, 2026", "Effective Date: June 14, 2026"],
      draftTitle: "Authorization",
      draftBody:
        "The Merchant hereby authorizes the engagement of the third-party infrastructure and service providers listed below. All listed subprocessors have entered into data processing agreements with equivalent security standards.",
      draftItems: [
        "Infrastructure hosting",
        "Blockchain RPC services",
        "Notifications & pricing",
      ],
      sections: [
        {
          title: "1. TELEGRAM MESSENGER INC.",
          paragraphs: [
            "• Purpose: Facilitating user authentication, bot commands, Telegram Mini App hosting, and merchant event notifications.",
            "• Location: Globally distributed.",
          ],
        },
        {
          title: "2. REMOTE PROCEDURE CALL (RPC) NODE PROVIDERS",
          paragraphs: [
            "• Purpose: Querying blockchain block headers, monitoring destination wallets, and reading mempools (e.g. TonCenter, TronGrid, and default public nodes).",
            "• Location: Globally distributed.",
          ],
        },
        {
          title: "3. CLOUD PLATFORMS AND EDGE NETWORKS",
          paragraphs: [
            "• Purpose: Serving server compute environments, secure database hosting, and global edge request routing.",
            "• Location: European Union / United States.",
          ],
        },
        {
          title: "4. EXCHANGE RATE APIs AND ORACLES",
          paragraphs: [
            "• Purpose: Fetching public real-time cryptocurrency exchange rates (e.g. CoinGecko API) to compute USD-equivalent invoice values.",
            "• Location: Global.",
          ],
        },
      ],
      footerNote: "Any updates to this subprocessor list will be published on this page.",
    },
  },
} as const;

export default en;
