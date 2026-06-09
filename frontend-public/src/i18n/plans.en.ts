export const planSEOEn = {
  merchant: {
    hero: {
      badge: "recv Merchant",
      title: "Non-Custodial Crypto Payment Gateway",
      body: "Accept cryptocurrency directly to your wallet with zero turnover fees. Create payment links from the dashboard or Telegram bot for TON, TON_USDT, TRON, Base, and BSC.",
    },
    idealFor: {
      title: "Who Needs the Merchant Protocol?",
      description: "Designed for independent creators, Telegram channel administrators, and e-commerce entrepreneurs who demand full ownership of their revenue streams via a decentralized crypto checkout.",
      points: [
        "Telegram community managers monetizing premium groups via crypto subscriptions.",
        "Freelancers invoicing international clients for direct USDT payouts.",
        "Independent e-commerce merchants looking for predictable subscription pricing.",
        "Digital goods sellers automating delivery after blockchain confirmation."
      ]
    },
    deepDive: {
      title: "Direct-to-Wallet Architecture Explained",
      cards: [
        { title: "Direct Settlement", body: "recv does not hold merchant funds. Payments settle to your configured wallets while you remain responsible for customer, tax, and compliance requirements." },
        { title: "0% Turnover Commission", body: "recv uses subscription pricing rather than charging a percentage of payment volume. Network fees still apply to blockchain transfers." },
        { title: "Telegram Alerts", body: "Connect the Telegram bot to receive notifications when invoices and confirmed payments are recorded." },
        { title: "Smart Underpayment Handling", body: "Our checkout interface automatically detects if a user sends less than the required amount, prompting them to send the remaining balance seamlessly." }
      ]
    },
    technicalSpecs: {
      title: "Merchant Technical Specifications",
      description: "A robust, no-code environment for processing decentralized payments.",
      specs: [
        { label: "Supported Networks", value: "TON, TON_USDT, TRON (TRC20), Base, BSC" },
        { label: "Confirmation Timing", value: "Depends on the selected network and required confirmations" },
        { label: "Integration Type", value: "No-code payment links, Telegram Bot, Dashboard UI" },
        { label: "Custody Model", value: "100% Non-custodial (Direct P2P transfer)" }
      ]
    },
    securityArchitecture: {
      title: "Uncompromising Security",
      body: "Your private keys are not required by recv. Customers send funds to your designated destination address, while recv monitors public blockchain data to update invoice status. Merchants remain responsible for wallet security and operations."
    },
    faq: [
      { q: "What is a non-custodial crypto gateway and how does it benefit me?", a: "A non-custodial gateway means that the payment processor never holds, touches, or routes your funds through intermediary accounts. When a customer pays, the cryptocurrency goes straight from their wallet to yours. This eliminates the risk of frozen accounts, withdrawal delays, or platform bankruptcies." },
      { q: "How do I create a crypto invoice without programming knowledge?", a: "The Merchant plan provides an intuitive web dashboard and a Telegram bot. You simply enter the required amount (in fiat or crypto) and a description. The system instantly generates a secure checkout link with QR codes that you can share with your customer via chat, email, or social media." },
      { q: "Is it really true that there are no transaction fees?", a: "Yes. recv Merchant operates on a flat monthly subscription model ($9/mo). Whether you process $100 or $100,000 in a month, you pay exactly zero percentage-based turnover fees. Your customers only pay the standard network gas fee." },
      { q: "Which cryptocurrencies and networks are currently supported?", a: "We focus on liquid, low-fee networks. We currently support native TON and stablecoin payments across TON_USDT, TRON (TRC20), Base, and Binance Smart Chain (BSC)." },
      { q: "What happens if a customer sends the wrong amount?", a: "Our Smart Checkout UI constantly monitors the mempool. If an underpayment is detected, the invoice remains in a 'Partial' state, and the customer is prompted to send the remaining balance. If they overpay, the invoice is marked as 'Overpaid', and you receive an alert to manually resolve the excess." },
      { q: "How does recv handle customer verification?", a: "recv provides non-custodial payment infrastructure and does not make compliance decisions for your business. You remain responsible for customer verification, tax, sanctions, and other legal requirements that apply to your jurisdiction and activity." },
      { q: "How does the Telegram crypto billing bot work?", a: "By linking your Telegram account to recv, the bot becomes your mobile command center. It instantly pushes notifications for new invoices, confirmed payments, and potential underpayments, allowing you to manage your revenue stream entirely from your phone." },
      { q: "Can I use recv Merchant for physical retail stores?", a: "Absolutely. You can generate static QR codes for your products or generate dynamic invoices on a tablet at the point of sale. Customers simply scan the code with their mobile crypto wallet to complete the purchase instantly." }
    ]
  },
  developer: {
    hero: {
      badge: "recv Developer",
      title: "Idempotent Web3 Payment API",
      body: "The ultimate REST API for automated cryptocurrency billing. Integrate real-time webhook notifications, unified multi-chain monitoring, and bulletproof idempotency into your SaaS, game, or automation backend.",
    },
    idealFor: {
      title: "Built for Automation Engineers",
      description: "Engineered specifically for backend developers building the next generation of decentralized applications, SaaS billing engines, and automated digital fulfillment systems.",
      points: [
        "SaaS founders implementing automated recurring crypto billing without fiat processors.",
        "Web3 game developers needing instant, reliable in-game currency top-ups via TON, Base, or BSC.",
        "Discord and Telegram bot creators building paid, automated community access layers.",
        "Digital goods distributors that need signed webhook-driven fulfillment."
      ]
    },
    deepDive: {
      title: "API Capabilities & Architecture",
      cards: [
        { title: "Unified Multi-Chain Gateway", body: "Stop maintaining custom RPC nodes and fragile blockchain listeners. One standard REST API integration covers native TON, TON_USDT, TRON, Base, and BSC." },
        { title: "Cryptographic Webhooks", body: "Payment status changes can trigger POST webhooks to your server. Payloads use HMAC-SHA256 signatures and timestamps so your backend can verify authenticity and apply replay controls." },
        { title: "Native Idempotency", body: "Never credit a user twice for the same blockchain transaction. Our core protocol enforces strict idempotency, protecting your database from duplicate processing during network congestion or micro-forks." },
        { title: "Testnet & Sandbox Mode", body: "Develop and test your integration safely using our Sandbox environment. Generate mock invoices and simulate blockchain confirmations without risking real capital." }
      ]
    },
    technicalSpecs: {
      title: "Developer Technical Specifications",
      description: "High-performance primitives for backend integration.",
      specs: [
        { label: "API Protocol", value: "RESTful JSON over HTTPS" },
        { label: "Authentication", value: "Bearer Token (API Keys)" },
        { label: "Webhook Security", value: "HMAC-SHA256 Signatures" },
        { label: "Rate Limits", value: "Up to 50,000 requests per month" }
      ]
    },
    securityArchitecture: {
      title: "API Security & Reliability",
      body: "Security is implemented at the transport and application layers. API credentials are stored as hashes. Failed webhook deliveries are queued for retries according to the active plan, and integrations must remain idempotent because deliveries can repeat."
    },
    faq: [
      { q: "How exactly do the crypto webhooks function?", a: "When a customer initiates a transfer, our Watchers monitor the respective blockchain. Once the transaction reaches the required confirmations, recv fires a JSON payload via HTTP POST to your pre-configured endpoint with the invoice ID, amount, and TX hash." },
      { q: "How does the API handle network congestion?", a: "recv uses redundant RPC access for supported networks. If a public node drops, we fail over to backup providers. During congestion, watchers maintain state and deliver the webhook when the payment is finalized on-chain." },
      { q: "What is idempotency and why is it critical for crypto payments?", a: "Idempotency ensures that no matter how many times a specific API request or webhook is retried (due to network drops or client errors), the end result is the same. In crypto, this is vital to prevent 'double-spending' or granting a user a premium subscription twice for a single blockchain transaction." },
      { q: "Can I generate unique deposit addresses for every single user?", a: "recv API utilizes a smart-matching protocol rather than generating unique wallet addresses per invoice (which is expensive and difficult to sweep). We use mathematically unique decimal suffixes (e.g., 100.000123 USDT) or network-native memos (on TON) to map a single incoming transaction on your master wallet to a specific user invoice instantly." },
      { q: "Is there an SDK available for Node.js or Python?", a: "Currently, we provide a heavily documented, language-agnostic RESTful API that can be consumed by any modern HTTP client (Axios, Fetch, Requests). Official SDKs for TypeScript/Node.js and Go are actively in development." },
      { q: "How do I verify that a webhook actually came from recv?", a: "Every webhook includes an 'X-recv-Signature' header. You must use your secret Webhook Key to compute an HMAC-SHA256 hash of the raw request body. If your computed hash matches our header, the payload is authentic and untampered." },
      { q: "What happens if I exceed my 50,000 monthly API requests limit?", a: "We do not hard-block your API if you hit a spike. You will receive an automated alert via email and Telegram as you approach the limit (80% and 100%). Overages may be billed at a nominal rate, or you can seamlessly upgrade to the Business plan." },
      { q: "Do you offer technical support for API integration?", a: "Yes. Developer plan subscribers have access to prioritized email support and a dedicated developer community channel where our core engineers actively assist with architecture design and debugging." }
    ]
  },
  business: {
    hero: {
      badge: "recv Business",
      title: "B2B Cryptocurrency Billing Infrastructure",
      body: "Scale your corporate crypto revenue operations. Deploy multi-workspace environments, leverage high-volume blockchain processing, and manage team access controls through a professional B2B crypto invoicing suite.",
    },
    idealFor: {
      title: "Engineered for Scaling Organizations",
      description: "The definitive solution for agencies, mid-market SaaS platforms, and multi-brand conglomerates requiring strict financial separation, deep analytics, and robust team management.",
      points: [
        "Web development agencies managing decentralized billing for multiple distinct client accounts.",
        "High-traffic SaaS applications processing thousands of recurring crypto payments daily.",
        "Global platforms with disparate teams needing specialized 'Finance' vs 'Developer' access roles.",
        "Marketplaces requiring advanced CSV exports and reconciliation tools for crypto accounting."
      ]
    },
    deepDive: {
      title: "Corporate Workflow & Analytics",
      cards: [
        { title: "Multi-Workspace Isolation", body: "Operate up to 10 entirely independent projects from a single subscription. Each workspace features completely isolated API keys, webhook endpoints, and transaction histories." },
        { title: "Granular Team Roles", body: "Invite up to 10 colleagues to your organization. Assign fine-grained permissions: allow developers to manage API keys while restricting them from viewing financial analytics, or grant accountants export-only access." },
        { title: "Advanced Financial Analytics", body: "Unlock deep insights into your cash flow. Track conversion rates by blockchain, visualize volume trends over time, and identify your most profitable networks through interactive dashboard charts." },
        { title: "Extended Processing Quotas", body: "Process up to 200,000 API requests monthly. Built to handle massive spikes in checkout volume during product launches or NFT minting events." }
      ]
    },
    technicalSpecs: {
      title: "Business Technical Specifications",
      description: "High-capacity architecture for corporate deployment.",
      specs: [
        { label: "Request Quota", value: "200,000 requests / month" },
        { label: "Workspace Limit", value: "Up to 10 isolated environments" },
        { label: "Team Seats", value: "Up to 10 active members" },
        { label: "Data Export", value: "Automated CSV and JSON reconciliation" }
      ]
    },
    securityArchitecture: {
      title: "Corporate Compliance & Separation",
      body: "Workspace isolation is enforced at the database level. An API key from Workspace A cannot query data from Workspace B. Furthermore, all significant actions (e.g., manually confirming an invoice or rotating webhook secrets) are logged with audit trails, providing transparency and accountability for distributed teams."
    },
    faq: [
      { q: "How exactly do Workspaces function?", a: "Think of Workspaces as separate companies under a holding group. If you run a SaaS product and a separate e-commerce store, you create two Workspaces. They share your Business plan limits, but they have completely separate invoice histories, different receiving wallet addresses, and independent API keys." },
      { q: "Can I assign different receiving wallets for different projects?", a: "Yes. Because Workspaces are fully isolated, you can configure Workspace A to payout to a multi-sig corporate treasury wallet, while Workspace B pays out to a fast-moving operational hot wallet." },
      { q: "What analytics are provided in the Business dashboard?", a: "The Business dashboard provides detailed time-series charts showing revenue by day/week/month, breakdown of volume by specific blockchain network (e.g., 60% TRON, 40% Base), and invoice conversion rates (how many generated checkouts resulted in a successful payment)." },
      { q: "How do I export data for my accountants?", a: "You can filter your transaction history by date, network, or status, and export the exact dataset as a standardized CSV. This makes it incredibly simple to import your crypto revenue data into traditional accounting software like Xero or QuickBooks." },
      { q: "What happens when I hit the 200k API request limit?", a: "Unlike restrictive web2 services, we do not sever your checkout flow. If you exceed 200,000 requests, your infrastructure remains operational while you reduce traffic or contact support for a limit review." },
      { q: "Is Priority Support included?", a: "Yes. Business plan members jump the queue. Your support tickets are routed directly to our senior support engineers, ensuring that any API questions or network anomalies are resolved with the highest urgency." },
      { q: "Can I restrict my developer from seeing our total revenue?", a: "Absolutely. Our Role-Based Access Control (RBAC) allows you to invite a user as a 'Developer'. They will have access to API keys, webhooks, and the sandbox, but the dashboard will block access to gross revenue metrics and accounting exports." },
      { q: "Are there any hidden setup fees?", a: "None. The Business plan is a flat $79 per month. There are no setup fees, no percentage cuts taken from your volume, and no hidden integration costs." }
    ]
  }
};
