-- Generated from frontend-public/content/blog/articles.json.
-- Do not edit manually; run: cd frontend-public && node scripts/generate-blog-seed.mjs
INSERT INTO blog_posts (
  slug, title, h1, content_md, excerpt, author, is_published, status,
  meta_title, meta_description, og_title, og_description,
  robots_index, robots_follow, include_in_sitemap, author_slug,
  tags, locale, internal_links_count, internal_linking_status, published_at
)
SELECT
  seed.slug, seed.title, seed.h1, seed.content_md, seed.excerpt, seed.author,
  TRUE, seed.status, seed.meta_title, seed.meta_description,
  seed.og_title, seed.og_description, TRUE, TRUE, TRUE, seed.author_slug,
  seed.tags, seed.locale, seed.internal_links_count,
  seed.internal_linking_status, seed.published_at
FROM (VALUES
  ($slug0$accept-usdt-payments-on-website$slug0$, $title0$How to accept USDT payments on a website$title0$, $h10$How to accept USDT payments on a website$h10$, $body0$## Choose the payment flow

Start with a server-created invoice rather than a reusable wallet address. An invoice binds an order to an amount, asset, network, expiry window, and payment status. recv can return hosted checkout instructions while settlement still goes to your connected wallet. See the [quickstart](/en/docs/quickstart) and [invoice API](/en/docs/invoices).

## Keep invoice creation on the server

Create invoices from your backend after validating the cart and order total. Never expose a live API key in browser code. Store the invoice public ID beside the order, then send the customer to checkout or render the returned payment details in your own interface.

## Fulfill from verified state

Treat the browser as a display layer, not the source of truth. Update the order from a signed webhook or a server-side invoice lookup. Verify the raw request body and timestamp before processing an event; the complete signing flow is documented in [webhooks](/en/docs/webhooks).

## Handle network and amount mistakes

Display the selected network prominently because USDT exists on multiple chains. Do not mark an order paid merely because a transaction exists: compare the detected asset, network, amount, destination, and invoice state. Route underpayments, overpayments, and late transfers through explicit support or review rules.$body0$, $excerpt0$A practical integration path for creating USDT invoices, showing payment instructions, detecting transfers, and fulfilling orders safely.$excerpt0$, $author0$Recv Core Team$author0$, $status0$published$status0$, $metaTitle0$How to accept USDT payments on a website$metaTitle0$, $metaDescription0$Learn how to accept USDT payments on a website with invoices, hosted checkout, direct wallet settlement, status tracking, and signed webhooks.$metaDescription0$, $ogTitle0$How to accept USDT payments on a website$ogTitle0$, $ogDescription0$Learn how to accept USDT payments on a website with invoices, hosted checkout, direct wallet settlement, status tracking, and signed webhooks.$ogDescription0$, $authorSlug0$recv-core$authorSlug0$, ARRAY[$tag0_0$USDT$tag0_0$, $tag0_1$checkout$tag0_1$, $tag0_2$integration$tag0_2$]::text[], $locale0$en$locale0$, 3, $linkStatus0$complete$linkStatus0$, '2026-04-08T09:00:00Z'::timestamptz),
  ($slug1$accept-usdt-payments-on-website$slug1$, $title1$Как принимать USDT на сайте$title1$, $h11$Как принимать USDT на сайте$h11$, $body1$## Выберите платёжный сценарий

Используйте инвойс, созданный сервером, а не один постоянный адрес кошелька. Инвойс связывает заказ с суммой, активом, сетью, сроком действия и статусом. recv может вернуть hosted checkout, при этом средства зачисляются на подключённый кошелёк. Начните с [quickstart](/ru/docs/quickstart) и [API инвойсов](/ru/docs/invoices).

## Создавайте инвойсы на backend

Backend должен проверить корзину и итоговую сумму до обращения к платёжному API. Не передавайте live API key в браузер. Сохраните public ID инвойса рядом с заказом, затем откройте checkout или покажите полученные платёжные инструкции в своём интерфейсе.

## Выдавайте заказ по проверенному статусу

Браузер показывает состояние, но не подтверждает оплату. Меняйте статус заказа по подписанному вебхуку или серверному запросу инвойса. Проверяйте исходные байты тела и timestamp до обработки события; схема подписи описана в разделе [вебхуков](/ru/docs/webhooks).

## Обрабатывайте ошибки сети и суммы

USDT существует в нескольких сетях, поэтому выбранную сеть нужно показывать явно. Наличие транзакции ещё не означает оплату заказа: сверяйте актив, сеть, сумму, адрес и состояние инвойса. Для недоплат, переплат и поздних переводов задайте отдельные правила поддержки или ручной проверки.$body1$, $excerpt1$Практичная схема интеграции: создание USDT-инвойса, экран оплаты, детекция перевода и безопасная выдача заказа.$excerpt1$, $author1$Recv Core Team$author1$, $status1$published$status1$, $metaTitle1$Как принимать USDT на сайте$metaTitle1$, $metaDescription1$Как принимать USDT на сайте через инвойсы, hosted checkout, прямое зачисление на кошелёк, отслеживание статуса и подписанные вебхуки.$metaDescription1$, $ogTitle1$Как принимать USDT на сайте$ogTitle1$, $ogDescription1$Как принимать USDT на сайте через инвойсы, hosted checkout, прямое зачисление на кошелёк, отслеживание статуса и подписанные вебхуки.$ogDescription1$, $authorSlug1$recv-core$authorSlug1$, ARRAY[$tag1_0$USDT$tag1_0$, $tag1_1$checkout$tag1_1$, $tag1_2$интеграция$tag1_2$]::text[], $locale1$ru$locale1$, 3, $linkStatus1$complete$linkStatus1$, '2026-04-08T09:00:00Z'::timestamptz),
  ($slug2$non-custodial-payment-gateway$slug2$, $title2$What is a non-custodial payment gateway?$title2$, $h12$What is a non-custodial payment gateway?$h12$, $body2$## The custody boundary

A non-custodial gateway coordinates payment instructions and status without holding the merchant's revenue balance. The customer transfers funds to a merchant-controlled destination, while the gateway observes the relevant chain and links the transfer to an invoice. This architecture is described on the [security page](/en/security).

## What the gateway still does

Non-custodial does not mean unmonitored. The service still creates invoices, calculates payable instructions, watches supported networks, records status transitions, and delivers signed webhooks. Merchant systems remain responsible for order policy, accounting, refunds, and access to their own wallet keys.

## Operational trade-offs

Direct settlement reduces platform custody exposure, but it also moves wallet operations to the merchant. Teams need controlled wallet access, address checks, treasury procedures, and reconciliation. Review the exact supported assets and wallet buckets in [network documentation](/en/docs/networks).

## Questions to ask a provider

Confirm who controls private keys, where customer funds land, whether withdrawals are required, how payment status is determined, and how webhook authenticity is verified. Also check the handling of unsupported assets, wrong networks, late payments, and manual review before choosing an integration.$body2$, $excerpt2$How direct-to-wallet crypto payment infrastructure differs from processors that hold balances and control merchant withdrawals.$excerpt2$, $author2$Recv Core Team$author2$, $status2$published$status2$, $metaTitle2$What is a non-custodial payment gateway?$metaTitle2$, $metaDescription2$Understand how a non-custodial payment gateway creates invoices and detects blockchain payments while funds settle directly to merchant wallets.$metaDescription2$, $ogTitle2$What is a non-custodial payment gateway?$ogTitle2$, $ogDescription2$Understand how a non-custodial payment gateway creates invoices and detects blockchain payments while funds settle directly to merchant wallets.$ogDescription2$, $authorSlug2$recv-core$authorSlug2$, ARRAY[$tag2_0$non-custodial$tag2_0$, $tag2_1$payments$tag2_1$, $tag2_2$security$tag2_2$]::text[], $locale2$en$locale2$, 2, $linkStatus2$complete$linkStatus2$, '2026-04-15T09:00:00Z'::timestamptz),
  ($slug3$non-custodial-payment-gateway$slug3$, $title3$Что такое non-custodial payment gateway$title3$, $h13$Что такое non-custodial payment gateway$h13$, $body3$## Граница хранения средств

Non-custodial gateway формирует платёжные инструкции и статусы, но не хранит выручку продавца на внутреннем балансе. Покупатель переводит средства на адрес под контролем продавца, а gateway наблюдает сеть и связывает перевод с инвойсом. Архитектура описана на странице [безопасности](/ru/security).

## Что всё равно делает gateway

Non-custodial не означает отсутствие автоматизации. Сервис создаёт инвойсы, формирует реквизиты, наблюдает поддерживаемые сети, записывает переходы статусов и отправляет подписанные вебхуки. Продавец отвечает за правила заказов, учёт, возвраты и доступ к ключам своих кошельков.

## Операционные компромиссы

Прямое зачисление уменьшает custodial-риск платформы, но переносит кошелёк и treasury-процессы к продавцу. Нужны контроль доступа, проверка адресов и сверка. Точные активы и wallet buckets перечислены в [документации сетей](/ru/docs/networks).

## Что спросить у провайдера

Уточните, кто контролирует приватные ключи, куда поступают средства, нужен ли вывод, как определяется статус и проверяется подлинность вебхуков. До интеграции также проверьте сценарии неверной сети, неподдерживаемого актива, поздней оплаты и ручной проверки.$body3$, $excerpt3$Чем direct-to-wallet инфраструктура криптоплатежей отличается от процессинга, который хранит баланс и управляет выводом продавца.$excerpt3$, $author3$Recv Core Team$author3$, $status3$published$status3$, $metaTitle3$Что такое non-custodial payment gateway$metaTitle3$, $metaDescription3$Как non-custodial payment gateway создаёт инвойсы и детектит платежи в блокчейне, пока средства поступают прямо на кошельки продавца.$metaDescription3$, $ogTitle3$Что такое non-custodial payment gateway$ogTitle3$, $ogDescription3$Как non-custodial payment gateway создаёт инвойсы и детектит платежи в блокчейне, пока средства поступают прямо на кошельки продавца.$ogDescription3$, $authorSlug3$recv-core$authorSlug3$, ARRAY[$tag3_0$non-custodial$tag3_0$, $tag3_1$платежи$tag3_1$, $tag3_2$безопасность$tag3_2$]::text[], $locale3$ru$locale3$, 2, $linkStatus3$complete$linkStatus3$, '2026-04-15T09:00:00Z'::timestamptz),
  ($slug4$trc20-payment-api$slug4$, $title4$TRC20 payment API integration guide$title4$, $h14$TRC20 payment API integration guide$h14$, $body4$## Model TRON as a network choice

TRC20 describes a token standard on TRON; in a payment API, keep the network and asset explicit. For recv invoices the payment option uses the TRON network with USDT as the asset. Check the current identifiers in [supported networks](/en/docs/networks) instead of inferring them from a token label.

## Create and store the invoice

Send the order amount and TRON/USDT option from your backend. Save the returned invoice ID, payable amount, destination, expiry, and current status with the order. The request and response fields are documented in the [invoice API](/en/docs/invoices).

## Make the checkout unambiguous

Show TRON or TRC20 next to USDT, include the exact amount, and warn customers not to use another network. A QR code should encode the same destination shown as text. Do not silently substitute a different chain when the customer has already selected a payment option.

## Process events idempotently

Verify each webhook before updating an order and deduplicate repeated deliveries. Store the transition or invoice status you processed, then make fulfillment safe to run more than once. Return a successful response quickly and move slow business logic to a queue; see [webhook guidance](/en/docs/webhooks).$body4$, $excerpt4$A backend-focused guide to creating TRON USDT invoices, presenting the correct network, and processing payment events idempotently.$excerpt4$, $author4$Recv Core Team$author4$, $status4$published$status4$, $metaTitle4$TRC20 payment API integration guide$metaTitle4$, $metaDescription4$Integrate a TRC20 payment API for USDT on TRON: create invoices, show exact payment details, verify webhooks, and reconcile edge cases.$metaDescription4$, $ogTitle4$TRC20 payment API integration guide$ogTitle4$, $ogDescription4$Integrate a TRC20 payment API for USDT on TRON: create invoices, show exact payment details, verify webhooks, and reconcile edge cases.$ogDescription4$, $authorSlug4$recv-core$authorSlug4$, ARRAY[$tag4_0$TRC20$tag4_0$, $tag4_1$TRON$tag4_1$, $tag4_2$API$tag4_2$]::text[], $locale4$en$locale4$, 3, $linkStatus4$complete$linkStatus4$, '2026-04-22T09:00:00Z'::timestamptz),
  ($slug5$trc20-payment-api$slug5$, $title5$Интеграция TRC20 payment API$title5$, $h15$Интеграция TRC20 payment API$h15$, $body5$## Храните сеть отдельно от актива

TRC20 — стандарт токенов в TRON, поэтому в API сеть и актив должны быть явными. В инвойсах recv вариант оплаты использует сеть TRON и актив USDT. Проверяйте актуальные идентификаторы в разделе [поддерживаемых сетей](/ru/docs/networks), а не выводите их из названия токена.

## Создайте и сохраните инвойс

Передайте сумму заказа и вариант TRON/USDT с backend. Сохраните ID инвойса, payable amount, адрес, срок действия и текущий статус рядом с заказом. Поля запроса и ответа перечислены в [API инвойсов](/ru/docs/invoices).

## Сделайте checkout однозначным

Показывайте TRON или TRC20 рядом с USDT, точную сумму и предупреждение не выбирать другую сеть. QR должен содержать тот же адрес, который показан текстом. Не заменяйте сеть молча после того, как покупатель выбрал вариант оплаты.

## Обрабатывайте события идемпотентно

Проверяйте подпись вебхука и дедуплицируйте повторные доставки. Сохраняйте обработанный transition или статус инвойса, чтобы выдача могла безопасно выполняться повторно. Быстро отвечайте успешным HTTP-кодом, а тяжёлую логику переносите в очередь; см. [вебхуки](/ru/docs/webhooks).$body5$, $excerpt5$Backend-гайд по созданию TRON USDT инвойсов, отображению правильной сети и идемпотентной обработке платёжных событий.$excerpt5$, $author5$Recv Core Team$author5$, $status5$published$status5$, $metaTitle5$Интеграция TRC20 payment API$metaTitle5$, $metaDescription5$Интеграция TRC20 payment API для USDT в TRON: создание инвойсов, точные реквизиты, проверка вебхуков и сверка нестандартных платежей.$metaDescription5$, $ogTitle5$Интеграция TRC20 payment API$ogTitle5$, $ogDescription5$Интеграция TRC20 payment API для USDT в TRON: создание инвойсов, точные реквизиты, проверка вебхуков и сверка нестандартных платежей.$ogDescription5$, $authorSlug5$recv-core$authorSlug5$, ARRAY[$tag5_0$TRC20$tag5_0$, $tag5_1$TRON$tag5_1$, $tag5_2$API$tag5_2$]::text[], $locale5$ru$locale5$, 3, $linkStatus5$complete$linkStatus5$, '2026-04-22T09:00:00Z'::timestamptz),
  ($slug6$ton-telegram-payments$slug6$, $title6$TON and Telegram payments: integration patterns$title6$, $h16$TON and Telegram payments: integration patterns$h16$, $body6$## Separate Telegram identity from payment state

A Telegram user ID identifies the customer, but it does not prove payment. Create an order on your backend, associate it with the Telegram user, and then create a payment invoice. Keep bot tokens and payment API keys outside Mini App browser code.

## Offer the intended TON asset

Native TON and USDT on TON are different payment options. Show the asset and network together, and preserve the selected option in the order. The current network identifiers and wallet grouping are listed in [network documentation](/en/docs/networks).

## Use links as navigation, not confirmation

A wallet deep link can simplify opening the transfer screen, but returning to Telegram is not evidence that the transfer completed. Display a pending state while your backend waits for a signed event or checks the invoice through the API.

## Unlock only after verification

For a shop, mark the order ready after a verified paid state. For a channel or group, grant access from an idempotent backend job and record the entitlement separately from the invoice. The [Telegram shops use case](/en/use-cases/telegram-shops) shows where checkout fits in the wider flow.$body6$, $excerpt6$How Telegram shops and communities can connect an order to a TON or TON USDT invoice and unlock access after verified payment.$excerpt6$, $author6$Recv Core Team$author6$, $status6$published$status6$, $metaTitle6$TON and Telegram payments: integration patterns$metaTitle6$, $metaDescription6$Build TON and Telegram payment flows with server-created invoices, wallet deep links, signed webhooks, and verified access or order fulfillment.$metaDescription6$, $ogTitle6$TON and Telegram payments: integration patterns$ogTitle6$, $ogDescription6$Build TON and Telegram payment flows with server-created invoices, wallet deep links, signed webhooks, and verified access or order fulfillment.$ogDescription6$, $authorSlug6$recv-core$authorSlug6$, ARRAY[$tag6_0$TON$tag6_0$, $tag6_1$Telegram$tag6_1$, $tag6_2$checkout$tag6_2$]::text[], $locale6$en$locale6$, 2, $linkStatus6$complete$linkStatus6$, '2026-04-29T09:00:00Z'::timestamptz),
  ($slug7$ton-telegram-payments$slug7$, $title7$Платежи TON и Telegram: схемы интеграции$title7$, $h17$Платежи TON и Telegram: схемы интеграции$h17$, $body7$## Разделяйте Telegram identity и оплату

Telegram user ID определяет покупателя, но не подтверждает платёж. Создайте заказ на backend, свяжите его с пользователем Telegram и затем создайте платёжный инвойс. Не помещайте bot token и payment API key в браузерный код Mini App.

## Предлагайте конкретный TON-актив

Нативный TON и USDT в сети TON — разные варианты оплаты. Показывайте актив вместе с сетью и сохраняйте выбор в заказе. Актуальные идентификаторы и группировка кошельков приведены в [документации сетей](/ru/docs/networks).

## Deep link не подтверждает платёж

Wallet deep link помогает открыть экран перевода, но возврат пользователя в Telegram не доказывает завершение транзакции. Показывайте pending, пока backend не получит подписанное событие или не проверит инвойс через API.

## Выдавайте доступ после проверки

В магазине переводите заказ в готовое состояние после подтверждённого paid. Для канала или группы выдавайте доступ идемпотентной backend-задачей и храните entitlement отдельно от инвойса. Контекст показан на странице [Telegram shops](/ru/use-cases/telegram-shops).$body7$, $excerpt7$Как Telegram-магазину или сообществу связать заказ с TON либо TON USDT инвойсом и выдать доступ после проверенной оплаты.$excerpt7$, $author7$Recv Core Team$author7$, $status7$published$status7$, $metaTitle7$Платежи TON и Telegram: схемы интеграции$metaTitle7$, $metaDescription7$Как построить платежи TON и Telegram через серверные инвойсы, wallet deep links, подписанные вебхуки и проверенную выдачу заказа или доступа.$metaDescription7$, $ogTitle7$Платежи TON и Telegram: схемы интеграции$ogTitle7$, $ogDescription7$Как построить платежи TON и Telegram через серверные инвойсы, wallet deep links, подписанные вебхуки и проверенную выдачу заказа или доступа.$ogDescription7$, $authorSlug7$recv-core$authorSlug7$, ARRAY[$tag7_0$TON$tag7_0$, $tag7_1$Telegram$tag7_1$, $tag7_2$checkout$tag7_2$]::text[], $locale7$ru$locale7$, 2, $linkStatus7$complete$linkStatus7$, '2026-04-29T09:00:00Z'::timestamptz),
  ($slug8$verify-webhook-signatures$slug8$, $title8$How to verify webhook signatures safely$title8$, $h18$How to verify webhook signatures safely$h18$, $body8$## Preserve the raw request body

Signature verification must use the exact bytes received. Parsing JSON and serializing it again can change whitespace or key order and produce a different digest. Configure the webhook route to capture raw bytes before the framework applies a JSON body parser.

## Rebuild the signed message

recv signs the timestamp and raw body together with HMAC-SHA256. Read the timestamp and signature headers, construct the documented message, and calculate the expected value with the endpoint secret. Follow the exact header names and format in [webhook documentation](/en/docs/webhooks).

## Reject stale and mismatched requests

Check that the timestamp falls within your accepted tolerance before acting on the event. Compare signatures with a constant-time function rather than a normal string equality check. Reject malformed values, unknown signature versions, and requests with missing headers.

## Make valid delivery safe to repeat

A valid signature proves authenticity, not uniqueness. Providers retry deliveries when acknowledgements fail, so deduplicate using the transition or invoice state and make fulfillment idempotent. Store verification failures without logging the secret or full sensitive payload. Review the wider trust boundaries on the [security page](/en/security).$body8$, $excerpt8$A practical checklist for HMAC verification, raw request bodies, timestamp tolerance, constant-time comparison, and idempotent processing.$excerpt8$, $author8$Recv Core Team$author8$, $status8$published$status8$, $metaTitle8$How to verify webhook signatures safely$metaTitle8$, $metaDescription8$Verify webhook signatures safely using the raw request body, timestamp checks, HMAC-SHA256, constant-time comparison, and idempotent event handling.$metaDescription8$, $ogTitle8$How to verify webhook signatures safely$ogTitle8$, $ogDescription8$Verify webhook signatures safely using the raw request body, timestamp checks, HMAC-SHA256, constant-time comparison, and idempotent event handling.$ogDescription8$, $authorSlug8$recv-core$authorSlug8$, ARRAY[$tag8_0$webhooks$tag8_0$, $tag8_1$HMAC$tag8_1$, $tag8_2$security$tag8_2$]::text[], $locale8$en$locale8$, 2, $linkStatus8$complete$linkStatus8$, '2026-05-06T09:00:00Z'::timestamptz),
  ($slug9$verify-webhook-signatures$slug9$, $title9$Как безопасно проверять подпись вебхука$title9$, $h19$Как безопасно проверять подпись вебхука$h19$, $body9$## Сохраните исходное тело запроса

Подпись нужно проверять по точным полученным байтам. Парсинг JSON с последующей сериализацией может изменить пробелы или порядок ключей и дать другой digest. Настройте webhook route так, чтобы получить raw body до JSON parser фреймворка.

## Соберите подписанное сообщение

recv подписывает timestamp и raw body через HMAC-SHA256. Прочитайте заголовки timestamp и signature, соберите сообщение в документированном формате и вычислите ожидаемое значение секретом endpoint. Точные имена заголовков описаны в [документации вебхуков](/ru/docs/webhooks).

## Отклоняйте устаревшие запросы

Проверьте, что timestamp попадает в допустимое окно, до выполнения бизнес-логики. Сравнивайте подписи constant-time функцией, а не обычным равенством строк. Отклоняйте неверный формат, неизвестную версию подписи и отсутствующие заголовки.

## Безопасно обрабатывайте повторы

Корректная подпись подтверждает источник, но не уникальность доставки. Вебхуки повторяются при неуспешном подтверждении, поэтому дедуплицируйте по transition или состоянию инвойса и делайте выдачу идемпотентной. Не записывайте секрет в логи; другие границы доверия описаны на странице [безопасности](/ru/security).$body9$, $excerpt9$Практический checklist: HMAC, исходное тело запроса, допустимый timestamp, constant-time сравнение и идемпотентная обработка.$excerpt9$, $author9$Recv Core Team$author9$, $status9$published$status9$, $metaTitle9$Как безопасно проверять подпись вебхука$metaTitle9$, $metaDescription9$Безопасная проверка подписи вебхука: исходное тело, timestamp, HMAC-SHA256, constant-time сравнение и идемпотентная обработка событий.$metaDescription9$, $ogTitle9$Как безопасно проверять подпись вебхука$ogTitle9$, $ogDescription9$Безопасная проверка подписи вебхука: исходное тело, timestamp, HMAC-SHA256, constant-time сравнение и идемпотентная обработка событий.$ogDescription9$, $authorSlug9$recv-core$authorSlug9$, ARRAY[$tag9_0$вебхуки$tag9_0$, $tag9_1$HMAC$tag9_1$, $tag9_2$безопасность$tag9_2$]::text[], $locale9$ru$locale9$, 2, $linkStatus9$complete$linkStatus9$, '2026-05-06T09:00:00Z'::timestamptz),
  ($slug10$custodial-vs-direct-to-wallet$slug10$, $title10$Custodial vs direct-to-wallet crypto payments$title10$, $h110$Custodial vs direct-to-wallet crypto payments$h110$, $body10$## Follow the money first

In a custodial flow, customer funds typically become a balance controlled by the processor until withdrawal or settlement. In a direct-to-wallet flow, the payment destination belongs to the merchant and the platform coordinates detection and status. The difference is architectural, not merely a checkout design choice.

## Compare control and responsibility

Custody can centralize conversion, payouts, and account-level controls, but introduces dependence on the provider's balance and withdrawal process. Direct settlement avoids that platform balance while requiring the merchant to manage wallet access, treasury movements, and on-chain accounting.

## Review support workflows

Both models need policies for wrong networks, unsupported tokens, duplicate transfers, refunds, and disputed order state. Direct-to-wallet refunds are sent from merchant-controlled funds rather than reversed from a processor balance. Read the [payment status guide](/en/docs/invoices) before designing customer support.

## Choose by operating model

A team that wants managed conversion or fiat settlement may prioritize a custodial processor. A team that already operates crypto wallets and wants funds delivered directly may prefer a [non-custodial gateway](/en/blog/non-custodial-payment-gateway). Document the fund path, key ownership, fees, compliance duties, and failure procedures before deciding.$body10$, $excerpt10$A comparison of fund flow, withdrawals, operational responsibility, reconciliation, and integration trade-offs for merchants.$excerpt10$, $author10$Recv Core Team$author10$, $status10$published$status10$, $metaTitle10$Custodial vs direct-to-wallet crypto payments$metaTitle10$, $metaDescription10$Compare custodial and direct-to-wallet crypto payments across fund flow, withdrawals, key ownership, reconciliation, refunds, and operations.$metaDescription10$, $ogTitle10$Custodial vs direct-to-wallet crypto payments$ogTitle10$, $ogDescription10$Compare custodial and direct-to-wallet crypto payments across fund flow, withdrawals, key ownership, reconciliation, refunds, and operations.$ogDescription10$, $authorSlug10$recv-core$authorSlug10$, ARRAY[$tag10_0$custodial$tag10_0$, $tag10_1$direct-to-wallet$tag10_1$, $tag10_2$comparison$tag10_2$]::text[], $locale10$en$locale10$, 2, $linkStatus10$complete$linkStatus10$, '2026-05-13T09:00:00Z'::timestamptz),
  ($slug11$custodial-vs-direct-to-wallet$slug11$, $title11$Custodial или direct-to-wallet криптоплатежи$title11$, $h111$Custodial или direct-to-wallet криптоплатежи$h111$, $body11$## Сначала проследите движение средств

В custodial-сценарии средства покупателя обычно становятся балансом под контролем процессинга до вывода или settlement. В direct-to-wallet сценарии адрес принадлежит продавцу, а платформа координирует детекцию и статус. Это архитектурное различие, а не только дизайн checkout.

## Сравните контроль и ответственность

Custody может централизовать конвертацию, выплаты и контроль аккаунта, но создаёт зависимость от баланса и процесса вывода провайдера. Прямое зачисление убирает платформенный баланс, но требует от продавца управления доступом к кошелькам, treasury и on-chain учётом.

## Проверьте поддержку нестандартных случаев

Обе модели требуют правил для неверной сети, неподдерживаемых токенов, повторных переводов, возвратов и спорного статуса заказа. В direct-to-wallet возврат отправляется из средств продавца. Изучите [статусы инвойса](/ru/docs/invoices) до проектирования поддержки.

## Выбирайте по операционной модели

Команда, которой нужна управляемая конвертация или fiat settlement, может выбрать custodial-процессинг. Команда с собственными криптокошельками может предпочесть [non-custodial gateway](/ru/blog/non-custodial-payment-gateway). До решения зафиксируйте путь средств, владение ключами, комиссии и действия при сбоях.$body11$, $excerpt11$Сравнение движения средств, вывода, операционной ответственности, сверки и интеграционных компромиссов для продавца.$excerpt11$, $author11$Recv Core Team$author11$, $status11$published$status11$, $metaTitle11$Custodial или direct-to-wallet криптоплатежи$metaTitle11$, $metaDescription11$Сравнение custodial и direct-to-wallet криптоплатежей: движение средств, вывод, ключи, сверка, возвраты и операционные процессы.$metaDescription11$, $ogTitle11$Custodial или direct-to-wallet криптоплатежи$ogTitle11$, $ogDescription11$Сравнение custodial и direct-to-wallet криптоплатежей: движение средств, вывод, ключи, сверка, возвраты и операционные процессы.$ogDescription11$, $authorSlug11$recv-core$authorSlug11$, ARRAY[$tag11_0$custodial$tag11_0$, $tag11_1$direct-to-wallet$tag11_1$, $tag11_2$сравнение$tag11_2$]::text[], $locale11$ru$locale11$, 2, $linkStatus11$complete$linkStatus11$, '2026-05-13T09:00:00Z'::timestamptz),
  ($slug12$multi-chain-crypto-invoices$slug12$, $title12$How multi-chain crypto invoices work$title12$, $h112$How multi-chain crypto invoices work$h112$, $body12$## One order, controlled options

A multi-chain invoice lets a merchant offer a small set of network and asset combinations for one order. It should not mean accepting any token on any chain. The invoice response defines the supported choices and provides the destination and payable amount for each option.

## Keep every option explicit

Render the network beside the asset, because the same symbol can exist on different chains. Preserve the selected option through checkout and analytics. recv invoice requests can include selected payment options; see the current request shape in [invoice documentation](/en/docs/invoices).

## Use one business state

The order should have one fulfillment state even when several payment options are displayed. When one option reaches a confirmed paid state, close or ignore the alternatives according to your application rules. Do not fulfill twice because two watchers report activity around the same order.

## Reconcile by network and asset

Store the chosen network, asset, expected amount, detected amount, transaction reference, and final invoice status. This makes support and accounting possible when customers use the wrong option or send after expiry. Review the available chains in [supported networks](/en/docs/networks).$body12$, $excerpt12$How one order can offer selected payment options across networks without confusing settlement, status tracking, or reconciliation.$excerpt12$, $author12$Recv Core Team$author12$, $status12$published$status12$, $metaTitle12$How multi-chain crypto invoices work$metaTitle12$, $metaDescription12$Learn how multi-chain crypto invoices present selected network and asset options while keeping payment detection, status, and reconciliation consistent.$metaDescription12$, $ogTitle12$How multi-chain crypto invoices work$ogTitle12$, $ogDescription12$Learn how multi-chain crypto invoices present selected network and asset options while keeping payment detection, status, and reconciliation consistent.$ogDescription12$, $authorSlug12$recv-core$authorSlug12$, ARRAY[$tag12_0$multi-chain$tag12_0$, $tag12_1$invoices$tag12_1$, $tag12_2$networks$tag12_2$]::text[], $locale12$en$locale12$, 2, $linkStatus12$complete$linkStatus12$, '2026-05-20T09:00:00Z'::timestamptz),
  ($slug13$multi-chain-crypto-invoices$slug13$, $title13$Как работают multi-chain инвойсы$title13$, $h113$Как работают multi-chain инвойсы$h113$, $body13$## Один заказ и ограниченный выбор

Multi-chain инвойс предлагает покупателю небольшой набор комбинаций сети и актива для одного заказа. Это не означает приём любого токена в любой сети. Ответ API определяет доступные варианты и реквизиты для каждого из них.

## Показывайте сеть вместе с активом

Одинаковый символ токена может существовать в разных сетях, поэтому сеть должна быть видна рядом с активом. Сохраняйте выбранный вариант в checkout и аналитике. Формат payment options приведён в [документации инвойсов](/ru/docs/invoices).

## Используйте одно состояние заказа

У заказа должно быть одно состояние выдачи, даже если на checkout показано несколько вариантов. Когда один вариант достигает подтверждённого paid, закройте или игнорируйте альтернативы по правилам приложения. Не выдавайте заказ дважды из-за активности в разных сетях.

## Сверяйте сеть и актив

Храните выбранную сеть, актив, ожидаемую и фактическую сумму, ссылку на транзакцию и финальный статус. Это помогает поддержке и учёту при неверном варианте или оплате после expiry. Доступные сети перечислены в разделе [поддерживаемых сетей](/ru/docs/networks).$body13$, $excerpt13$Как предложить несколько сетей для одного заказа без путаницы в зачислении, статусах и сверке платежей.$excerpt13$, $author13$Recv Core Team$author13$, $status13$published$status13$, $metaTitle13$Как работают multi-chain инвойсы$metaTitle13$, $metaDescription13$Как multi-chain инвойсы предлагают выбранные сети и активы, сохраняя единые правила детекции платежа, статуса заказа и сверки.$metaDescription13$, $ogTitle13$Как работают multi-chain инвойсы$ogTitle13$, $ogDescription13$Как multi-chain инвойсы предлагают выбранные сети и активы, сохраняя единые правила детекции платежа, статуса заказа и сверки.$ogDescription13$, $authorSlug13$recv-core$authorSlug13$, ARRAY[$tag13_0$multi-chain$tag13_0$, $tag13_1$инвойсы$tag13_1$, $tag13_2$сети$tag13_2$]::text[], $locale13$ru$locale13$, 2, $linkStatus13$complete$linkStatus13$, '2026-05-20T09:00:00Z'::timestamptz),
  ($slug14$late-underpaid-overpaid-crypto-payments$slug14$, $title14$Late, underpaid, and overpaid crypto payments$title14$, $h114$Late, underpaid, and overpaid crypto payments$h114$, $body14$## Why exceptions need explicit states

Blockchain transfers cannot be edited after broadcast, and customer wallets may send the wrong amount or confirm after checkout expires. Keep these cases separate from paid rather than forcing them into a binary success or failure field. recv exposes underpaid, overpaid, expired, and manual-review states in the [invoice lifecycle](/en/docs/invoices).

## Underpaid transfers

Define whether the customer may send the remainder and how long you will wait. Do not fulfill a full-value order from a partial transfer unless your business policy permits it. Store both expected and received amounts so support can explain the difference.

## Overpaid and late transfers

An overpayment may be accepted, reviewed, or partially refunded according to merchant policy. A late transfer needs review because price, inventory, or access terms may have changed after expiry. Never automate a refund to an address taken only from untrusted customer input.

## Build a review workflow

Show operators the invoice, transaction reference, network, asset, amounts, timestamps, and customer order. Keep fulfillment idempotent and record every manual decision. Signed events from [webhooks](/en/docs/webhooks) can open the review task, but the merchant's policy determines the outcome.$body14$, $excerpt14$Operational rules for crypto transfers that arrive after expiry, below the requested amount, or above the invoice total.$excerpt14$, $author14$Recv Core Team$author14$, $status14$published$status14$, $metaTitle14$Late, underpaid, and overpaid crypto payments$metaTitle14$, $metaDescription14$Handle late, underpaid, and overpaid crypto payments with explicit invoice states, review rules, customer evidence, and safe fulfillment.$metaDescription14$, $ogTitle14$Late, underpaid, and overpaid crypto payments$ogTitle14$, $ogDescription14$Handle late, underpaid, and overpaid crypto payments with explicit invoice states, review rules, customer evidence, and safe fulfillment.$ogDescription14$, $authorSlug14$recv-core$authorSlug14$, ARRAY[$tag14_0$payments$tag14_0$, $tag14_1$underpaid$tag14_1$, $tag14_2$overpaid$tag14_2$]::text[], $locale14$en$locale14$, 2, $linkStatus14$complete$linkStatus14$, '2026-05-27T09:00:00Z'::timestamptz),
  ($slug15$late-underpaid-overpaid-crypto-payments$slug15$, $title15$Поздние платежи, недоплаты и переплаты в крипто$title15$, $h115$Поздние платежи, недоплаты и переплаты в крипто$h115$, $body15$## Исключениям нужны отдельные статусы

Перевод в блокчейне нельзя изменить после отправки, а покупатель может указать неверную сумму или получить подтверждение после expiry checkout. Не сводите такие случаи к одному success/failure. recv использует underpaid, overpaid, expired и manual-review в [lifecycle инвойса](/ru/docs/invoices).

## Недоплата

Определите, может ли покупатель доплатить остаток и сколько времени вы ждёте. Не выдавайте заказ полной стоимости по частичному переводу, если это не разрешено политикой бизнеса. Храните ожидаемую и фактическую сумму, чтобы поддержка могла объяснить расхождение.

## Переплата и поздний перевод

Переплату можно принять, отправить на проверку или частично вернуть по правилам продавца. Поздний перевод требует review, потому что цена, остаток или условия доступа могли измениться. Не отправляйте автоматический refund на адрес, полученный только из непроверенного ввода клиента.

## Создайте workflow ручной проверки

Покажите оператору инвойс, transaction reference, сеть, актив, суммы, timestamps и заказ. Делайте выдачу идемпотентной и записывайте ручные решения. Подписанные события из [вебхуков](/ru/docs/webhooks) могут открыть review-задачу, но результат определяет политика продавца.$body15$, $excerpt15$Операционные правила для переводов после expiry, ниже запрошенной суммы или выше итоговой суммы инвойса.$excerpt15$, $author15$Recv Core Team$author15$, $status15$published$status15$, $metaTitle15$Поздние платежи, недоплаты и переплаты в крипто$metaTitle15$, $metaDescription15$Как обрабатывать поздние криптоплатежи, недоплаты и переплаты через явные статусы, ручную проверку и безопасную выдачу заказа.$metaDescription15$, $ogTitle15$Поздние платежи, недоплаты и переплаты в крипто$ogTitle15$, $ogDescription15$Как обрабатывать поздние криптоплатежи, недоплаты и переплаты через явные статусы, ручную проверку и безопасную выдачу заказа.$ogDescription15$, $authorSlug15$recv-core$authorSlug15$, ARRAY[$tag15_0$платежи$tag15_0$, $tag15_1$недоплата$tag15_1$, $tag15_2$переплата$tag15_2$]::text[], $locale15$ru$locale15$, 2, $linkStatus15$complete$linkStatus15$, '2026-05-27T09:00:00Z'::timestamptz),
  ($slug16$cryptobot-alternative-usdt-ton$slug16$, $title16$Looking for a CryptoBot Alternative? Accept USDT and TON Natively$title16$, $h116$Looking for a CryptoBot Alternative? Accept USDT and TON Natively$h116$, $body16$## Introduction

For developers and online business owners operating in the Telegram ecosystem, managing cryptocurrency payments efficiently is essential. While many start out using Telegram-native solutions, the search for a reliable CryptoBot alternative often begins when transaction fees start eating into margins and custody-related risks become too high to ignore. If you want to accept USDT and TON without giving up control of your funds or paying a percentage on every sale, it is time to look at non-custodial payment architectures.

Using custodial gateways introduces unnecessary friction, including transaction verification delays, mandatory compliance checks, and expensive withdrawal fees. This guide analyzes how to accept digital currencies natively, comparing the well-known Crypto Pay API, unautomated manual transfers, and modern non-custodial processing.

---

## Why You Need a CryptoBot Alternative for Your Business

While custodial services like CryptoBot are simple to set up initially, they come with architectural trade-offs that can hinder a growing digital business. Understanding these trade-offs helps explain why more indie hackers, SaaS founders, and Telegram shop owners are migrating to alternative tools.

### The Problem with Custody and Account Freezes
When you use a custodial provider, your revenue does not go directly to you. Instead, it accumulates in the provider's collective wallet. This means you do not hold your own private keys, and your funds are subject to the provider’s internal rules, regional restrictions, and compliance processes. If a sudden policy change or false fraud flag occurs, your business revenue can be locked instantly, with little recourse. 

### Squeezed Margins from Turnover and Withdrawal Fees
Custodial gateways monetize by taking a percentage of your sales (often around 1% or higher) and charging heavy withdrawal fees when you try to transfer your funds to your private wallet. For example, withdrawing USDT can cost upwards of 1 to 3.5 USDT per transaction. For high-volume merchants, these transaction taxes quickly add up to hundreds or thousands of dollars monthly.

### The Friction of Forced KYC
For many international merchants, maintaining privacy or avoiding complex onboarding verification is key. Custodial processors frequently enforce strict KYC verification tiers. If you run a legitimate independent SaaS or a paid community, navigating these verification hurdles can delay your time-to-market.

---

## Comparing the Options: Crypto Pay API, Manual Payments, and recv

When building a check-out system for a Telegram bot or web application, three main pathways emerge. The following table highlights the operational differences:

| Feature | Crypto Pay API | Manual Payments | recv |
| :--- | :--- | :--- | :--- |
| **Custody Type** | Custodial (Funds held by platform) | Non-custodial (Direct to your wallet) | Non-custodial (Direct to your wallet) |
| **Turnover Fee** | Typically ~1% per invoice | 0% | 0% (Flat subscription) |
| **Withdrawal Fees** | High fixed network fees per payout | None | None |
| **Verification (KYC)** | Strict tiered KYC limits | None | No KYC required |
| **Automation** | Automated via Webhooks | Manual validation (Time-consuming) | Automated via HMAC-SHA256 Webhooks |
| **Supported Networks** | TON, TRON, BSC, etc. | Varies by your personal wallets | TON, TRON, Base, BSC |
| **Developer Tools** | Standard JSON API | None | Unified API, AI/MCP server, TG bot |

---

## Deep Dive into the Three Payment Methods

To choose the right checkout architecture, it helps to examine how each method operates in production environments.

### 1. Crypto Pay API (The Custodial Approach)
The Crypto Pay API, built on top of the CryptoBot ecosystem, is widely used for Telegram bot payments. It provides developers with a standard API to generate invoices and receive webhook alerts once an invoice is paid.

*   **How it works:** The customer pays the invoice, and the funds go to the provider's pool. To actually use those funds, the merchant must initiate a payout request to their own address.
*   **Drawbacks:** Apart from the custodial risk, the withdrawal process triggers fixed network fees that eat into small transactions. Additionally, if your target audience wants to pay with emerging networks, your integration is limited only to what the custodial platform supports.

### 2. Manual Payments (The DIY Approach)
Some small-scale merchants decide to bypass platforms altogether by asking users to send payments manually to a specific address, followed by sending a transaction screenshot to an admin or support bot.

*   **How it works:** The customer copies the wallet address, opens their wallet app, transfers the funds, and waits for a human administrator to verify the transaction on the blockchain.
*   **Drawbacks:** This approach is impossible to scale. It introduces errors like unpaid invoices, underpayments (where a user forgets to account for transaction fees), and delayed customer delivery. It also ruins the checkout experience, leading to high cart abandonment rates.

### 3. The Modern Solution: recv (Non-Custodial & Fee-Free)
To bridge the gap between complete ownership and total automation, choosing a [non-custodial crypto payment gateway](/en/) provides the ideal balance. That is exactly where using a platform like recv shifts the paradigm.

By utilizing a real-time blockchain watcher, recv matches incoming transfers to specific invoices without ever taking custody of your money. 

*   **Direct-to-Wallet Settlement:** The payment moves directly from the customer’s private wallet to your private wallet. Because recv never holds your private keys, your funds cannot be frozen, compromised, or delayed.
*   **0% Turnover Fees:** Instead of taking a percentage of your hard-earned revenue, recv operates on a transparent, flat-rate subscription model. You keep 100% of your sales, whether you process $1,000 or $100,000 a month. Plans scale from a free Trial (up to 15 live invoices) to Merchant ($9/mo), Developer ($29/mo), and Business ($79/mo).
*   **Smart Checkout Features:** Customers enjoy QR-native checkouts, direct deep-linking into popular wallets like Tonkeeper or Phantom, and intelligent underpayment resolution (which allows users to pay the remaining balance if they sent too little).
*   **Multi-Network Support:** You can accept TON, TON_USDT, TRON (TRC-20 USDT), Base (Coinbase L2), and BSC. Supported assets include USDT, USDC, TON, SOL, and BNB.

---

## Integrating a Non-Custodial Checkout Flow

For developers, integrating recv is designed to be highly intuitive. It provides a [unified payment API](/en/dev) that handles address generation and monitoring behind the scenes, emitting secure webhooks once payment is confirmed.

To keep your backend secure, every webhook payload is signed with an `HMAC-SHA256` signature, allowing your application to verify that the message came securely from the payment gateway.

Here is a practical example of how to implement webhook validation in a TypeScript/Node.js environment:$body16$, $excerpt16$Tired of custodial freeze risks and high withdrawal commissions? Learn how using a non-custodial CryptoBot alternative can save your margins.$excerpt16$, $author16$Recv Core Team$author16$, $status16$published$status16$, $metaTitle16$Looking for a CryptoBot Alternative? Accept USDT and TON Natively$metaTitle16$, $metaDescription16$Need an automated CryptoBot alternative to accept USDT and TON? Compare Crypto Pay API, manual payments, and recv. Keep 100% of your revenue.$metaDescription16$, $ogTitle16$Looking for a CryptoBot Alternative? Accept USDT and TON Natively$ogTitle16$, $ogDescription16$Need an automated CryptoBot alternative to accept USDT and TON? Compare Crypto Pay API, manual payments, and recv. Keep 100% of your revenue.$ogDescription16$, $authorSlug16$recv-core$authorSlug16$, ARRAY[$tag16_0$cryptobot alternative$tag16_0$, $tag16_1$crypto pay api$tag16_1$, $tag16_2$accept usdt$tag16_2$, $tag16_3$accept ton$tag16_3$, $tag16_4$non-custodial checkout$tag16_4$, $tag16_5$telegram bot payments$tag16_5$, $tag16_6$payment gateway$tag16_6$]::text[], $locale16$en$locale16$, 2, $linkStatus16$complete$linkStatus16$, '2026-06-10T12:00:00Z'::timestamptz),
  ($slug17$cryptobot-alternative-usdt-ton$slug17$, $title17$Альтернатива CryptoBot: прием USDT и TON без лишних комиссий$title17$, $h117$Альтернатива CryptoBot: прием USDT и TON без лишних комиссий$h117$, $body17$## Введение

Для разработчиков и владельцев бизнеса в экосистеме Telegram критически важно настроить быстрый и экономичный прием криптовалюты. Хотя многие начинают с использования встроенных решений мессенджера, надежная альтернатива CryptoBot требуется сразу, как только комиссии за вывод начинают съедать маржу, а риски блокировки средств становятся реальной угрозой. Если вы хотите принимать USDT и TON, не передавая контроль над транзакциями третьим лицам и не выплачивая проценты с каждой продажи, стоит обратить внимание на некастодиальную архитектуру.

Использование кастодиальных шлюзов создает лишнее трение: задержки при обработке транзакций, обязательные проверки KYC и высокие фиксированные комиссии за вывод средств на личные адреса. В этой статье мы подробно разберем, как организовать прием цифровых активов без посредников, сравнив популярный интерфейс Crypto Pay API, ручные переводы и современные платежные мониторы.

---

## Почему разработчики ищут альтернативу CryptoBot

Хотя кастодиальные боты кажутся удобными для быстрого старта, их технические особенности накладывают серьезные ограничения на масштабирование цифрового бизнеса.

### Риск заморозки и кастодиальные угрозы
При использовании кастодиального процессора ваши средства скапливаются на общем балансе сервиса. Вы не владеете приватными ключами, а значит, сохранность вашей выручки полностью зависит от внутренних правил платформы, комплаенс-политики и географических ограничений. В случае внезапного изменения правил или ложного срабатывания систем безопасности ваши деньги могут оказаться замороженными на неопределенный срок.

### Потери на комиссиях с оборота и за вывод средств
Кастодиальные платформы зарабатывают на процентах от каждой вашей транзакции (обычно от 1% и выше) плюс взимают фиксированные сборы за вывод активов. Например, комиссия за отправку USDT может составлять от 1 до 3.5 USDT за каждую транзакцию вывода. Для бизнеса с большим объемом микроплатежей эти издержки выливаются в сотни долларов упущенной прибыли каждый месяц.

### Сложности прохождения KYC
Многие предприниматели предпочитают сохранять конфиденциальность своей деятельности или просто не хотят тратить время на бюрократическую верификацию. В кастодиальных платежных системах требования к идентификации личности становятся все более жесткими. Прохождение многоуровневых проверок замедляет запуск продукта и отсекает часть аудитории.

---

## Сравнение платежных решений: Crypto Pay API, ручные платежи и recv

При проектировании платежного сценария для Telegram-бота или веб-сайта у вас есть три основных пути. Сравним их ключевые характеристики:

| Критерий сравнения | Crypto Pay API | Ручные платежи | recv |
| :--- | :--- | :--- | :--- |
| **Тип кастодиальности** | Кастодиальный (средства у платформы) | Некастодиальный (напрямую вам) | Некастодиальный (напрямую вам) |
| **Комиссия с оборота** | Около 1% с каждого счета | 0% | 0% (фиксированная подписка) |
| **Комиссия за вывод** | Высокие сетевые сборы платформы | Отсутствует | Отсутствует |
| **Верификация (KYC)** | Обязательный KYC по лимитам | Отсутствует | Не требуется |
| **Автоматизация** | Автоматически через Webhooks | Вручную (проверка скриншотов) | Автоматически через HMAC-SHA256 вебхуки |
| **Доступные сети** | TON, TRON, BSC и др. | Ограничено вашими кошельками | TON, TRON, Base, BSC |
| **Инструменты разработчика** | Базовый JSON API | Отсутствуют | Единый API, MCP-сервер, Telegram-бот |

---

## Детальный анализ платежных методов

Чтобы принять правильное архитектурное решение, важно понимать, как эти методы проявляют себя в реальной эксплуатации.

### 1. Сервис Crypto Pay API (Кастодиальный подход)
Интерфейс Crypto Pay API является частью экосистемы популярного бота CryptoBot. Он предоставляет разработчикам удобные методы для генерации платежных ссылок прямо внутри мессенджера.

*   **Принцип работы:** Пользователь переводит средства на адрес системы. Баланс отображается в личном кабинете разработчика, но для реального использования криптовалюты ее необходимо перевести на собственный кошелек.
*   **Минусы:** Помимо риска блокировок, вывод небольших сумм становится невыгодным из-за завышенных сетевых тарифов сервиса. Кроме того, вы полностью привязаны к списку сетей и токенов, которые поддерживает провайдер.

### 2. Ручные переводы (Метод «на коленке»)
Некоторые небольшие каналы и чаты просят покупателей отправлять средства на указанный в описании адрес, после чего администратор вручную проверяет транзакцию по хэшу или скриншоту.

*   **Принцип работы:** Покупатель вручную копирует адрес, отправляет точную сумму из своего кошелька, а затем ждет подтверждения от администратора.
*   **Минусы:** Данный процесс невозможно автоматизировать или масштабировать. Возникают проблемы с недоплатами (когда клиенты забывают учесть комиссию сети), путаницей в транзакциях и задержкой выдачи доступа к продукту, что снижает конверсию и лояльность пользователей.

### 3. Современный подход: recv (Некастодиальный эквайринг)
Чтобы совместить безопасность прямого владения активами и удобство полной автоматизации, компании выбирают [некастодиальный криптопроцессинг](/ru/). В этом сценарии платформа recv предлагает принципиально иную логику работы.

Специальный блокчейн-наблюдатель в реальном времени отслеживает транзакции в публичном реестре и сопоставляет их с выставленными счетами.

*   **Расчеты прямо на ваш кошелек:** Криптовалюта отправляется покупателем напрямую на ваши реквизиты. Поскольку платформа recv не хранит ваши приватные ключи и не удерживает баланс, ваши средства физически невозможно заморозить или конфисковать.
*   **0% комиссии с оборота:** Вместо удержания процентов от продаж используется прозрачная модель подписки с фиксированной оплатой. Вы сохраняете всю полученную выручку. Доступны различные [тарифные планы](/ru/business): от бесплатного тарифа Trial (с ограничением в 15 активных счетов) до тарифов Merchant ($9/мес), Developer ($29/мес) и Business ($79/мес).
*   **Удобный интерфейс Smart Checkout:** Ваши покупатели получают готовые платежные страницы с поддержкой QR-кодов, бесшовным открытием мобильных кошельков (Tonkeeper, Phantom) через диплинки и функцией автоматического отслеживания недоплат (клиент может просто доплатить недостающую сумму по тому же счету).
*   **Поддержка популярных сетей:** Вы можете настроить автоматический прием платежей TON, TON_USDT, TRON (USDT TRC-20), Base и BSC. Процессинг работает с токенами USDT, USDC, TON, SOL и BNB.

---

## Настройка интеграции и прием платежей

Для веб-разработчиков и создателей ботов интеграция recv выглядит максимально прозрачной. Платформа предоставляет [единый API для платежей](/ru/dev), который решает все задачи по генерации адресов и отслеживанию статуса транзакций в блокчейне.

Для защиты вашего сервера от поддельных запросов каждое уведомление подписывается уникальной сигнатурой `HMAC-SHA256`.

Ниже представлен рабочий пример обработки и проверки вебхука на Node.js (TypeScript):$body17$, $excerpt17$Устали от кастодиальных рисков и высоких комиссий на вывод? Рассказываем, как альтернатива CryptoBot экономит ваши деньги.$excerpt17$, $author17$Recv Core Team$author17$, $status17$published$status17$, $metaTitle17$Альтернатива CryptoBot: прием USDT и TON без лишних комиссий$metaTitle17$, $metaDescription17$Ищете замену CryptoBot для приема USDT и TON? Сравните Crypto Pay API, ручные переводы и recv. Принимайте платежи прямо на свой кошелек.$metaDescription17$, $ogTitle17$Альтернатива CryptoBot: прием USDT и TON без лишних комиссий$ogTitle17$, $ogDescription17$Ищете замену CryptoBot для приема USDT и TON? Сравните Crypto Pay API, ручные переводы и recv. Принимайте платежи прямо на свой кошелек.$ogDescription17$, $authorSlug17$recv-core$authorSlug17$, ARRAY[$tag17_0$альтернатива cryptobot$tag17_0$, $tag17_1$прием usdt$tag17_1$, $tag17_2$прием ton$tag17_2$, $tag17_3$некастодиальный эквайринг$tag17_3$, $tag17_4$криптопроцессинг без комиссий$tag17_4$, $tag17_5$телеграм боты платежи$tag17_5$, $tag17_6$платежный шлюз$tag17_6$]::text[], $locale17$ru$locale17$, 3, $linkStatus17$complete$linkStatus17$, '2026-06-10T12:00:00Z'::timestamptz)
) AS seed(
  slug, title, h1, content_md, excerpt, author, status,
  meta_title, meta_description, og_title, og_description, author_slug,
  tags, locale, internal_links_count, internal_linking_status, published_at
)
ON CONFLICT (slug, locale) DO NOTHING;
