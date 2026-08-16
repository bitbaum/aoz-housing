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
  'nav.housing': 'Жильё',
  'nav.activities': 'Мероприятия',
  'nav.preferences': 'Настройки',
  'nav.profile': 'Профиль',
  'nav.transfer': 'Заявка на переезд',
  'nav.help': 'Помощь',
  'nav.logout': 'Выйти',
  'nav.more': 'Ещё',
  'nav.moreTitle': 'Всё сразу',
  'nav.closeMore': 'Закрыть меню',

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

  'action.save': 'Сохранить',
  'action.cancel': 'Отмена',
  'action.back': 'Назад',
  'action.close': 'Закрыть',
  'action.showAll': 'Показать все',

  'language.label': 'Язык',
  'language.change': 'Сменить язык',
  'language.machineNotice': 'Этот перевод ещё не проверен носителем языка.',

  'safety.emergency': 'В экстренном случае: звони 112 или свяжись с администрацией дома',
}
