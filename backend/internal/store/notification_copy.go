package store

// Localized copy for Telegram payment notifications. These run inside the
// payment-completion transaction so the merchant hears about money in their
// own language the instant it lands. Kept deliberately short, human, and
// action-first — this is the message that wakes someone up at 3am.

type notificationCopy struct {
	subscriptionActivated string // plan, received, network, days
	paymentConfirmed      string // public id, received, network
	partialPayment        string // public id, received, network, expected, network
	underpaid             string // public id, received, network, expected, network
	overpaid              string // public id, received, network, expected, network
	latePayment           string // public id, received, network
	statusUpdated         string // public id, status

	actionCountAsPaid string
	actionWaitTopUp   string
	actionKeepReview  string
}

var notificationCopyEN = notificationCopy{
	subscriptionActivated: "✅ %s is live.\nReceived %s %s · %d days unlocked. Go build.",
	paymentConfirmed:      "✅ Paid — %s.\n+%s %s landed in your wallet.",
	partialPayment:        "🟡 Almost there — %s.\nGot %s %s, invoice asked for %s %s. Looks like an exchange fee. Count it as paid or wait for the top-up?",
	underpaid:             "🟡 Short payment — %s.\nGot %s %s, expected %s %s. Your call on how to handle it.",
	overpaid:              "🔵 Overpaid — %s.\nGot %s %s, expected %s %s. Confirm and you're done.",
	latePayment:           "🟠 Late arrival — %s.\n%s %s came in after expiry. Parked in review for you to confirm.",
	statusUpdated:         "🔔 %s is now %s.",

	actionCountAsPaid: "✅ Count as paid",
	actionWaitTopUp:   "⏳ Wait for top-up",
	actionKeepReview:  "🔍 Keep in review",
}

var notificationCopyRU = notificationCopy{
	subscriptionActivated: "✅ %s активирован.\nПолучено %s %s · разблокировано на %d дней. Поехали.",
	paymentConfirmed:      "✅ Оплачено — %s.\n+%s %s уже в вашем кошельке.",
	partialPayment:        "🟡 Почти всё — %s.\nПришло %s %s, в счёте было %s %s. Похоже на комиссию биржи. Засчитать как оплату или ждём доплату?",
	underpaid:             "🟡 Недоплата — %s.\nПришло %s %s, ожидалось %s %s. Решение за вами.",
	overpaid:              "🔵 Переплата — %s.\nПришло %s %s, ожидалось %s %s. Подтвердите — и готово.",
	latePayment:           "🟠 Поздняя оплата — %s.\n%s %s пришли после истечения срока. Отложено на проверку.",
	statusUpdated:         "🔔 %s теперь в статусе %s.",

	actionCountAsPaid: "✅ Засчитать оплату",
	actionWaitTopUp:   "⏳ Ждать доплату",
	actionKeepReview:  "🔍 Оставить на проверке",
}

var notificationCopyES = notificationCopy{
	subscriptionActivated: "✅ %s activo.\nRecibido %s %s · %d días desbloqueados. A construir.",
	paymentConfirmed:      "✅ Pagado — %s.\n+%s %s recibidos en tu billetera.",
	partialPayment:        "🟡 Casi listo — %s.\nRecibido %s %s, la factura requería %s %s. Parece una comisión de la red. ¿Marcar como pagado o esperar el resto?",
	underpaid:             "🟡 Pago incompleto — %s.\nRecibido %s %s, esperado %s %s. Tú decides cómo manejarlo.",
	overpaid:              "🔵 Pago de más — %s.\nRecibido %s %s, esperado %s %s. Confirma y listo.",
	latePayment:           "🟠 Llegada tarde — %s.\n%s %s llegaron después de la expiración. Estacionado en revisión para que lo confirmes.",
	statusUpdated:         "🔔 %s es ahora %s.",

	actionCountAsPaid: "✅ Contar como pagado",
	actionWaitTopUp:   "⏳ Esperar saldo",
	actionKeepReview:  "🔍 Dejar en revisión",
}

var notificationCopyPT = notificationCopy{
	subscriptionActivated: "✅ %s ativo.\nRecebido %s %s · %d dias desbloqueados. Vamos construir.",
	paymentConfirmed:      "✅ Pago — %s.\n+%s %s recebidos na sua carteira.",
	partialPayment:        "🟡 Quase pronto — %s.\nRecebido %s %s, a fatura pedia %s %s. Parece taxa de corretora/rede. Deseja marcar como pago ou aguardar o restante?",
	underpaid:             "🟡 Pagamento incompleto — %s.\nRecebido %s %s, esperado %s %s. Você decide como tratar.",
	overpaid:              "🔵 Pago a mais — %s.\nRecebido %s %s, esperado %s %s. Confirme para finalizar.",
	latePayment:           "🟠 Chegada tardia — %s.\n%s %s recebidos após o vencimento. Aguardando revisão para confirmação.",
	statusUpdated:         "🔔 %s agora é %s.",

	actionCountAsPaid: "✅ Marcar como pago",
	actionWaitTopUp:   "⏳ Aguardar restante",
	actionKeepReview:  "🔍 Manter em revisão",
}

func notificationCopyFor(language string) notificationCopy {
	switch NormalizeLanguage(language) {
	case "ru":
		return notificationCopyRU
	case "es":
		return notificationCopyES
	case "pt":
		return notificationCopyPT
	default:
		return notificationCopyEN
	}
}
