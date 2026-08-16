import type { Dictionary } from './de'

/**
 * Arabic. Right-to-left, which is why it is in this first batch: RTL has to be
 * proven by a real language early, or the layout assumptions harden and every
 * later addition fights them.
 *
 * NOT REVIEWED — see `LOCALES.ar.reviewed`. Present in the repo, absent from
 * the picker until a native speaker has read it. Note that Arabic here is
 * Modern Standard; residents may speak Levantine, Iraqi or Sudanese varieties,
 * which is exactly the kind of judgement a reviewer needs to make and a
 * generator cannot.
 */
export const ar: Dictionary = {
  'nav.overview': 'نظرة عامة',
  'nav.apartment': 'الشقة',
  'nav.expenses': 'المصاريف',
  'nav.roommates': 'شركاء السكن',
  'nav.chores': 'المهام',
  'nav.rules': 'القواعد',
  'nav.decisions': 'التصويت',
  'nav.report': 'الإبلاغ',
  'nav.reports': 'بلاغاتي',
  'nav.messages': 'الرسائل',
  'nav.housing': 'السكن',
  'nav.activities': 'الأنشطة',
  'nav.preferences': 'الإعدادات',
  'nav.profile': 'الملف الشخصي',
  'nav.transfer': 'طلب النقل',
  'nav.help': 'المساعدة',
  'nav.logout': 'تسجيل الخروج',
  'nav.more': 'المزيد',
  'nav.moreTitle': 'كل شيء في نظرة واحدة',
  'nav.closeMore': 'إغلاق القائمة',

  'navGroup.living': 'الحياة اليومية',
  'navGroup.together': 'نقرر معًا',
  'navGroup.concerns': 'الطلبات والعروض',
  'navGroup.account': 'حسابي',

  'reports.title': 'بلاغاتك',
  'reports.subtitle': 'كل ما أبلغت عنه — وما قاله فريق الرعاية بشأنه.',
  'reports.showAll': 'عرض كل البلاغات',
  'reports.empty': 'لم تُبلّغ عن أي شيء بعد.',
  'reports.new': 'بلاغ جديد',
  'reports.open': 'مفتوح',
  'reports.done': 'تم الحل',
  'reports.pending': 'الفريق يراجع هذا البلاغ حاليًا.',
  'reports.answer': 'رد فريق الرعاية',
  'reports.viewYours': 'عرض بلاغاتك',

  'messages.title': 'الرسائل',
  'messages.subtitle': 'اكتب لفريق الرعاية — سيجيبك هنا.',
  'messages.empty': 'لا توجد رسائل بعد. اكتب لنا إذا احتجت شيئًا.',
  'messages.placeholder': 'رسالتك …',
  'messages.send': 'إرسال',
  'messages.sending': 'جارٍ الإرسال …',
  'messages.you': 'أنت',
  'messages.staff': 'فريق الرعاية',
  'messages.unread': 'جديد',

  'action.save': 'حفظ',
  'action.cancel': 'إلغاء',
  'action.back': 'رجوع',
  'action.close': 'إغلاق',
  'action.showAll': 'عرض الكل',

  'language.label': 'اللغة',
  'language.change': 'تغيير اللغة',
  'language.machineNotice': 'لم تتم مراجعة هذه الترجمة بعد من متحدث أصلي.',

  'safety.emergency': 'في حالات الطوارئ: اتصل بالرقم 112 أو تواصل مع إدارة السكن',
}
