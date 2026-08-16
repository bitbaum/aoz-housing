import type { Dictionary } from './de'

/**
 * Turkish — also the language many Kurdish residents from Turkey read, which is
 * why it is worth having even though Kurdish is listed separately.
 *
 * NOT VOUCHED FOR — see `LOCALES.tr.reviewed`. Complete, in the repo, and not
 * in the picker.
 *
 * WHAT A REVIEWER SHOULD CHECK FIRST:
 *
 *  1. `sen` throughout, following the German source. Turkish marks respect
 *     through `siz` more strongly than German marks it through "Sie", and an
 *     adult being addressed as `sen` by the institution housing them may read
 *     it as diminishing. One decision, not forty.
 *  2. `bildirim` for a report. It is also the ordinary word for a phone
 *     notification, so "Bildirimlerim" may parse as "my notifications" rather
 *     than "the things I reported". `başvuru` or `talep` are the alternatives.
 *  3. `safety.emergency` — the only string here somebody has to act on. Note
 *     that 112 is the emergency number in Switzerland AND in Turkey, so it
 *     needs no explanation, which is a small piece of luck.
 */
export const tr: Dictionary = {
  'nav.overview': 'Genel bakış',
  'nav.apartment': 'Daire',
  'nav.expenses': 'Masraflar',
  'nav.roommates': 'Ev arkadaşları',
  'nav.chores': 'Görevler',
  'nav.rules': 'Kurallar',
  'nav.decisions': 'Oylama',
  'nav.report': 'Bildir',
  'nav.reports': 'Bildirimlerim',
  'nav.messages': 'Mesajlar',
  'nav.housing': 'Konutlar',
  'nav.activities': 'Etkinlikler',
  'nav.preferences': 'Ayarlar',
  'nav.profile': 'Profil',
  'nav.transfer': 'Nakil talebi',
  'nav.help': 'Yardım',
  'nav.logout': 'Çıkış yap',
  'nav.more': 'Daha fazla',
  'nav.moreTitle': 'Her şey bir bakışta',
  'nav.closeMore': 'Menüyü kapat',

  'navGroup.living': 'Günlük yaşam',
  'navGroup.together': 'Birlikte karar vermek',
  'navGroup.concerns': 'Talepler ve fırsatlar',
  'navGroup.account': 'Hesabım',

  'reports.title': 'Bildirimlerin',
  'reports.subtitle': 'Bildirdiğin her şey — ve ekibin bunlar hakkında söyledikleri.',
  'reports.showAll': 'Tüm bildirimleri göster',
  'reports.empty': 'Henüz bir şey bildirmedin.',
  'reports.new': 'Yeni bildirim',
  'reports.open': 'Açık',
  'reports.done': 'Çözüldü',
  'reports.pending': 'Ekip bu bildirimi inceliyor.',
  'reports.answer': 'Ekibin yanıtı',
  'reports.viewYours': 'Bildirimlerini gör',

  'messages.title': 'Mesajlar',
  'messages.subtitle': 'Ekibe yaz — sana buradan yanıt verir.',
  'messages.empty': 'Henüz mesaj yok. Bir şeye ihtiyacın olursa bize yaz.',
  'messages.placeholder': 'Mesajın …',
  'messages.send': 'Gönder',
  'messages.sending': 'Gönderiliyor …',
  'messages.you': 'Sen',
  'messages.staff': 'Ekip',
  'messages.unread': 'yeni',

  'action.save': 'Kaydet',
  'action.cancel': 'İptal',
  'action.back': 'Geri',
  'action.close': 'Kapat',
  'action.showAll': 'Tümünü göster',

  'language.label': 'Dil',
  'language.change': 'Dili değiştir',
  'language.machineNotice':
    'Bu çeviri henüz ana dili bu dil olan biri tarafından kontrol edilmedi.',

  'safety.emergency': 'Acil durumda: 112’yi ara veya konut yönetimine başvur',
}
