import type { Dictionary } from './de'

/**
 * Ukrainian.
 *
 * NOT REVIEWED — see `LOCALES.uk.reviewed`. This was written without a native
 * speaker, so it is present in the repo and absent from the picker until
 * someone who speaks it has read it. The strings most worth their attention are
 * `safety.emergency` and anything in `reports.*`: those are the ones a resident
 * has to act on rather than merely understand.
 */
export const uk: Dictionary = {
  'nav.overview': 'Огляд',
  'nav.apartment': 'Квартира',
  'nav.expenses': 'Витрати',
  'nav.roommates': 'Сусіди',
  'nav.chores': 'Завдання',
  'nav.rules': 'Правила',
  'nav.decisions': 'Голосування',
  'nav.report': 'Повідомити',
  'nav.reports': 'Мої звернення',
  'nav.housing': 'Житло',
  'nav.activities': 'Заходи',
  'nav.preferences': 'Налаштування',
  'nav.profile': 'Профіль',
  'nav.transfer': 'Переїзд',
  'nav.help': 'Допомога',
  'nav.logout': 'Вийти',
  'nav.more': 'Ще',
  'nav.moreTitle': 'Усе разом',
  'nav.closeMore': 'Закрити меню',

  'navGroup.living': 'Щоденне',
  'navGroup.together': 'Вирішуємо разом',
  'navGroup.concerns': 'Звернення та пропозиції',
  'navGroup.account': 'Мій акаунт',

  'reports.title': 'Ваші звернення',
  'reports.subtitle': 'Усе, про що ви повідомили — і що відповіла команда.',
  'reports.showAll': 'Показати всі звернення',
  'reports.empty': 'Ви ще нічого не повідомляли.',
  'reports.new': 'Нове звернення',
  'reports.open': 'Відкрито',
  'reports.done': 'Вирішено',
  'reports.pending': 'Команда розглядає це звернення.',
  'reports.answer': 'Відповідь команди',
  'reports.viewYours': 'Переглянути ваші звернення',

  'action.save': 'Зберегти',
  'action.cancel': 'Скасувати',
  'action.back': 'Назад',
  'action.close': 'Закрити',
  'action.showAll': 'Показати всі',

  'language.label': 'Мова',
  'language.change': 'Змінити мову',
  'language.machineNotice': 'Цей переклад ще не перевірений носієм мови.',

  'safety.emergency': 'У разі надзвичайної ситуації: телефонуйте 112 або зверніться до адміністрації',
}
