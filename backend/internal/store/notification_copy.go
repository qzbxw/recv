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

var notificationCopyUK = notificationCopy{
	subscriptionActivated: "✅ %s активовано.\nОтримано %s %s · розблоковано на %d днів. Поїхали.",
	paymentConfirmed:      "✅ Оплачено — %s.\n+%s %s вже у вашому гаманці.",
	partialPayment:        "🟡 Майже все — %s.\nПрийшло %s %s, у рахунку було %s %s. Схоже на комісію біржі. Зарахувати як оплату чи чекаємо на доплату?",
	underpaid:             "🟡 Недоплата — %s.\nПрийшло %s %s, очікувалось %s %s. Рішення за вами.",
	overpaid:              "🔵 Переплата — %s.\nПрийшло %s %s, очікувалось %s %s. Підтвердіть — і готово.",
	latePayment:           "🟠 Пізня оплата — %s.\n%s %s прийшли після закінчення терміну. Відкладено на перевірку.",
	statusUpdated:         "🔔 %s тепер у статусі %s.",

	actionCountAsPaid: "✅ Зарахувати оплату",
	actionWaitTopUp:   "⏳ Чекати на доплату",
	actionKeepReview:  "🔍 Залишити на перевірці",
}

var notificationCopyUZ = notificationCopy{
	subscriptionActivated: "✅ %s faollashtirildi.\n%s %s qabul qilindi · %d kunga ochildi. Boshladik.",
	paymentConfirmed:      "✅ To'landi — %s.\n+%s %s hamyoningizga tushdi.",
	partialPayment:        "🟡 Deyarli tayyor — %s.\n%s %s keldi, hisob-kitobda %s %s edi. Birja/tarmoq komissiyasiga o'xshaydi. To'langan deb hisoblaymizmi yoki qo'shimcha to'lovni kutamizmi?",
	underpaid:             "🟡 Kam to'lov — %s.\n%s %s keldi, kutilgan %s %s. Qaror sizdan.",
	overpaid:              "🔵 Ortiqcha to'lov — %s.\n%s %s keldi, kutilgan %s %s. Tasdiqlang va tayyor.",
	latePayment:           "🟠 Kech qolgan to'lov — %s.\n%s %s muddati tugagandan keyin keldi. Tasdiqlashingiz uchun tekshiruvga olib qo'yildi.",
	statusUpdated:         "🔔 %s hozirda %s statusida.",

	actionCountAsPaid: "✅ To'lov sifatida hisoblash",
	actionWaitTopUp:   "⏳ Qo'shimcha to'lovni kutish",
	actionKeepReview:  "🔍 Tekshiruvda qoldirish",
}

var notificationCopyDE = notificationCopy{
	subscriptionActivated: "✅ %s ist aktiv.\n%s %s erhalten · %d Tage freigeschaltet. Los geht's.",
	paymentConfirmed:      "✅ Bezahlt — %s.\n+%s %s ist jetzt in deiner Wallet.",
	partialPayment:        "🟡 Fast geschafft — %s.\n%s %s erhalten, Rechnung verlangte %s %s. Sieht nach einer Netzwerk-/Börsengebühr aus. Als bezahlt markieren oder auf Zuzahlung warten?",
	underpaid:             "🟡 Zu wenig gezahlt — %s.\n%s %s erhalten, erwartet %s %s. Deine Entscheidung.",
	overpaid:              "🔵 Zu viel gezahlt — %s.\n%s %s erhalten, erwartet %s %s. Bestätigen zum Abschließen.",
	latePayment:           "🟠 Verspätete Zahlung — %s.\n%s %s gingen nach Ablauf der Rechnung ein. Zur Überprüfung zurückgelegt.",
	statusUpdated:         "🔔 %s ist jetzt %s.",

	actionCountAsPaid: "✅ Als bezahlt werten",
	actionWaitTopUp:   "⏳ Auf Zuzahlung warten",
	actionKeepReview:  "🔍 In Überprüfung belassen",
}

func notificationCopyFor(language string) notificationCopy {
	switch NormalizeLanguage(language) {
	case "ru":
		return notificationCopyRU
	case "uk":
		return notificationCopyUK
	case "uz":
		return notificationCopyUZ
	case "de":
		return notificationCopyDE
	case "es":
		return notificationCopyES
	case "pt":
		return notificationCopyPT
	default:
		return notificationCopyEN
	}
}
