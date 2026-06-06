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

func notificationCopyFor(language string) notificationCopy {
	if NormalizeLanguage(language) == "ru" {
		return notificationCopyRU
	}
	return notificationCopyEN
}
