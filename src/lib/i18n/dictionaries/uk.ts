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
  'nav.messages': 'Повідомлення',
  'nav.housing': 'Житло',
  'nav.activities': 'Заходи',
  'nav.preferences': 'Налаштування',
  'nav.profile': 'Профіль',
  'nav.transfer': 'Переїзд',
  'nav.help': 'Допомога',
  'nav.learning': 'Навчання',
  'nav.accountMenu': 'Обліковий запис',
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

  'messages.title': 'Повідомлення',
  'messages.subtitle': 'Напиши команді підтримки — вона відповість тобі тут.',
  'messages.empty': 'Ще немає повідомлень. Напиши нам, якщо щось потрібно.',
  'messages.placeholder': 'Твоє повідомлення …',
  'messages.send': 'Надіслати',
  'messages.sending': 'Надсилання …',
  'messages.you': 'Ти',
  'messages.staff': 'Команда',
  'messages.unread': 'нове',

  'action.save': 'Зберегти',
  'action.cancel': 'Скасувати',
  'action.back': 'Назад',
  'action.close': 'Закрити',
  'action.showAll': 'Показати всі',

  'language.label': 'Мова',
  'language.change': 'Змінити мову',
  'language.machineNotice': 'Цей переклад ще не перевірений носієм мови.',

  'safety.emergency': 'У разі надзвичайної ситуації: телефонуйте 112 або зверніться до адміністрації',

  'help.title': 'Допомога та FAQ',
  'help.subtitle': 'Відповіді та контакти — у небезпеці спочатку номери екстреної допомоги.',
  'help.faqTitle': 'Часті запитання',
  'help.contactTitle': 'Контакт',
  'help.emergencyTitle': 'Надзвичайна ситуація',
  'help.emergencyDesc': 'У разі небезпеки зверніться негайно:',
  'help.faq.placement.q': 'Як розподіляють кімнати?',
  'help.faq.placement.a':
    'Враховуємо сон, шум, чистоту і мови. Що точніші відповіді, то краще поселення.',
  'help.faq.preferences.q': 'Чи можу я змінити дані?',
  'help.faq.preferences.a': 'Так, у налаштуваннях. Зміни діють для наступних поселень.',
  'help.faq.conflict.q': 'Що робити при конфлікті?',
  'help.faq.conflict.a': 'Скористайся «Повідомити». Команда ставиться до кожного повідомлення серйозно.',
  'help.faq.transfer.q': 'Чи можу я просити переїзд?',
  'help.faq.transfer.a': 'Так, через «Переведення» або свого соціального працівника.',
  'help.faq.privacy.q': 'Чи захищені мої дані?',
  'help.faq.privacy.a':
    'Так. Лише житлові вподобання — без діагнозів і без статусу притулку. Можна попросити доступ до даних.',
  'help.link.report': 'Повідомити про проблему',
  'help.link.rules': 'Правила будинку',

  'report.title': 'Повідомити про проблему',
  'report.subtitle': 'Поломка або конфлікт — команда це побачить.',
  'report.emergencyTitle': 'Безпосередня небезпека?',
  'report.emergencyMessage': 'У надзвичайній ситуації: 112. AOZ поза робочим часом: 044 415 63 30.',
  'report.noPlacement': 'У тебе ще немає житла. Звернись до супроводу.',

  'rules.title': 'Правила будинку',
  'rules.subtitle':
    'Обов’язковий текст німецькою — той, який ти підписуєш. Запитай супровід, якщо щось незрозуміло.',
  'rules.noPlacement': 'Коли буде кімната, правила з’являться тут.',
  'rules.toDecisions': 'До рішень',

  'learning.title': 'Твоє навчання',
  'learning.subtitle': 'Сертифікати, курси та волонтерство — можеш сам додати, що робиш.',
  'learning.achievements': 'Досягнення',
  'learning.achievementsEmpty':
    'Ще немає досягнень. Завершені тести, курси та волонтерство з’являться тут.',
  'learning.inProgress': 'Триває',
  'learning.offers': 'Курси та пропозиції',
  'learning.offersEmpty': 'Зараз немає навчальних пропозицій. Подивись у Заходи.',
  'learning.hours': 'Години',

  'care.title': 'Твоя команда',
  'care.subtitle': 'Хто за тебе відповідає — житло, соціальна робота, job coach.',
  'care.empty': 'Ще нікого не призначено. Супровід додасть команду.',
  'care.housing': 'Житло / супровід',
  'care.social': 'Соціальна робота',
  'care.job': 'Job coach',
  'care.appointments': 'Зустрічі',
  'care.appointmentsEmpty': 'Немає запланованих зустрічей.',
}
