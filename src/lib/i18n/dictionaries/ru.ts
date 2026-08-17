import type { Dictionary } from './de'

/**
 * Russian — not a country's language here but a lingua franca: it is often the
 * language a Ukrainian, Georgian, Chechen or Central Asian resident and a
 * caseworker actually share.
 *
 * NOT VOUCHED FOR — see `LOCALES.ru.reviewed`. Complete, in the repo, and not
 * in the picker.
 *
 * WHAT A REVIEWER SHOULD CHECK FIRST, so "please review this" is a question
 * rather than a chore:
 *
 *  1. `ты` throughout, following the German source. In German a flat-share app
 *     saying "du" is warm; in Russian, an institution addressing an adult as
 *     `ты` can read as talking down to them. If that lands wrong for people in
 *     this situation, the whole file moves to `вы` — it is one decision, not
 *     forty.
 *  2. `обращение` for a report. It is the register officialdom uses, which may
 *     be right (it is a formal channel) or may be exactly the officialdom this
 *     product is trying not to sound like; `сообщение` is the softer option.
 *  3. `safety.emergency` — the only string here somebody has to act on.
 */
export const ru: Dictionary = {
  'nav.overview': 'Обзор',
  'nav.apartment': 'Квартира',
  'nav.expenses': 'Расходы',
  'nav.roommates': 'Соседи',
  'nav.chores': 'Задачи',
  'nav.rules': 'Правила',
  'nav.decisions': 'Голосование',
  'nav.report': 'Сообщить',
  'nav.reports': 'Мои обращения',
  'nav.messages': 'Сообщения',
  'nav.housing': 'Жильё',
  'nav.activities': 'Мероприятия',
  'nav.preferences': 'Настройки',
  'nav.profile': 'Профиль',
  'nav.transfer': 'Заявка на переезд',
  'nav.help': 'Помощь',
  'nav.learning': 'Обучение',
  'nav.logout': 'Выйти',
  'nav.more': 'Ещё',
  'nav.moreTitle': 'Всё сразу',
  'nav.closeMore': 'Закрыть меню',
  'nav.accountMenu': 'Аккаунт',

  'navGroup.living': 'Повседневное',
  'navGroup.together': 'Решаем вместе',
  'navGroup.concerns': 'Обращения и предложения',
  'navGroup.account': 'Мой аккаунт',

  'reports.title': 'Твои обращения',
  'reports.subtitle': 'Всё, о чём ты сообщил — и что ответила команда.',
  'reports.showAll': 'Показать все обращения',
  'reports.empty': 'Ты ещё ни о чём не сообщал.',
  'reports.new': 'Новое обращение',
  'reports.open': 'Открыто',
  'reports.done': 'Решено',
  'reports.pending': 'Команда рассматривает это обращение.',
  'reports.answer': 'Ответ команды',
  'reports.viewYours': 'Посмотреть твои обращения',

  'messages.title': 'Сообщения',
  'messages.subtitle': 'Напиши команде — она ответит тебе здесь.',
  'messages.empty': 'Сообщений пока нет. Напиши нам, если что-то нужно.',
  'messages.placeholder': 'Твоё сообщение …',
  'messages.send': 'Отправить',
  'messages.sending': 'Отправка …',
  'messages.you': 'Ты',
  'messages.staff': 'Команда',
  'messages.unread': 'новое',

  'action.save': 'Сохранить',
  'action.cancel': 'Отмена',
  'action.back': 'Назад',
  'action.close': 'Закрыть',
  'action.showAll': 'Показать все',

  'language.label': 'Язык',
  'language.change': 'Сменить язык',
  'language.machineNotice': 'Этот перевод ещё не проверен носителем языка.',

  'safety.emergency': 'В экстренном случае: звони 112 или свяжись с администрацией дома',

  'help.title': 'Помощь и частые вопросы',
  'help.subtitle': 'Ответы и контакты — при опасности сначала номера экстренных служб.',
  'help.faqTitle': 'Частые вопросы',
  'help.contactTitle': 'Контакт',
  'help.emergencyTitle': 'Экстренная ситуация',
  'help.emergencyDesc': 'При опасности сразу свяжись:',
  'help.faq.placement.q': 'Как распределяют комнаты?',
  'help.faq.placement.a':
    'Учитываем сон, шум, чистоту и языки. Чем точнее ответы, тем лучше заселение.',
  'help.faq.preferences.q': 'Могу ли я изменить данные?',
  'help.faq.preferences.a': 'Да, в настройках. Изменения действуют для будущих заселений.',
  'help.faq.conflict.q': 'Что делать при конфликте?',
  'help.faq.conflict.a': 'Используй «Сообщить». Команда воспринимает каждое сообщение всерьёз.',
  'help.faq.transfer.q': 'Могу ли я просить переезд?',
  'help.faq.transfer.a': 'Да, через «Перевод» или своего социального работника.',
  'help.faq.privacy.q': 'Защищены ли мои данные?',
  'help.faq.privacy.a':
    'Да. Только жилищные предпочтения — без диагнозов и без статуса убежища. Можно запросить доступ к данным.',
  'help.link.report': 'Сообщить о проблеме',
  'help.link.rules': 'Правила дома',

  'report.title': 'Сообщить о проблеме',
  'report.subtitle': 'Поломка или конфликт — команда это увидит.',
  'report.emergencyTitle': 'Непосредственная опасность?',
  'report.emergencyMessage': 'В экстренном случае: 112. Вне рабочего времени: 044 415 63 30.',
  'report.noPlacement': 'У тебя ещё нет жилья. Свяжись с сопровождением.',

  'rules.title': 'Правила дома',
  'rules.subtitle':
    'Обязательный текст на немецком — тот, который ты подписываешь. Спроси сопровождение, если что-то непонятно.',
  'rules.noPlacement': 'Когда будет комната, правила появятся здесь.',
  'rules.toDecisions': 'К решениям',

  'learning.title': 'Твоё обучение',
  'learning.subtitle': 'Сертификаты, курсы и волонтёрство — можешь сам указать, чем занимаешься.',
  'learning.achievements': 'Достижения',
  'learning.achievementsEmpty':
    'Пока нет достижений. Завершённые тесты, курсы и волонтёрство появятся здесь.',
  'learning.inProgress': 'В процессе',
  'learning.offers': 'Курсы и предложения',
  'learning.offersEmpty': 'Сейчас нет учебных предложений. Смотри Мероприятия.',
  'learning.hours': 'Часы',

  'care.title': 'Твоя команда',
  'care.subtitle': 'Кто за тебя отвечает — жильё, социальная работа, карьерный коуч.',
  'care.empty': 'Пока никого не назначили. Сопровождение добавит команду.',
  'care.housing': 'Жильё / сопровождение',
  'care.social': 'Социальная работа',
  'care.job': 'Карьерный коуч',
  'care.appointments': 'Встречи',
  'care.appointmentsEmpty': 'Нет запланированных встреч.',
}
