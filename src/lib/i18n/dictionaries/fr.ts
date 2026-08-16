import type { Dictionary } from './de'

/**
 * French — a Swiss national language, and the one non-German locale most likely
 * to be shared by a resident and a caseworker.
 *
 * REGISTER: `tu`, following the German source, which says "Deine Meldungen"
 * and "Du hast noch nichts gemeldet". That is a product decision, not an
 * oversight: the WG brand is a flatmate app, not an authority writing to a
 * case file, and `vous` would make the app sound like the office rather than
 * the flat. Every T/V language here follows the same rule.
 */
export const fr: Dictionary = {
  'nav.overview': 'Aperçu',
  'nav.apartment': 'Appartement',
  'nav.expenses': 'Dépenses',
  'nav.roommates': 'Colocataires',
  'nav.chores': 'Tâches',
  'nav.rules': 'Règles',
  'nav.decisions': 'Voter',
  'nav.report': 'Signaler',
  'nav.reports': 'Mes signalements',
  'nav.messages': 'Messages',
  'nav.housing': 'Logements',
  'nav.activities': 'Activités',
  'nav.preferences': 'Paramètres',
  'nav.profile': 'Profil',
  'nav.transfer': 'Demande de transfert',
  'nav.help': 'Aide',
  'nav.logout': 'Se déconnecter',
  'nav.more': 'Plus',
  'nav.moreTitle': 'Tout en un coup d’œil',
  'nav.closeMore': 'Fermer le menu',

  'navGroup.living': 'Au quotidien',
  'navGroup.together': 'Décider ensemble',
  'navGroup.concerns': 'Demandes et offres',
  'navGroup.account': 'Mon compte',

  'reports.title': 'Tes signalements',
  'reports.subtitle': 'Tout ce que tu as signalé — et ce qu’en dit l’équipe.',
  'reports.showAll': 'Afficher tous les signalements',
  'reports.empty': 'Tu n’as encore rien signalé.',
  'reports.new': 'Nouveau signalement',
  'reports.open': 'Ouvert',
  'reports.done': 'Résolu',
  'reports.pending': 'L’équipe examine ce signalement.',
  'reports.answer': 'Réponse de l’équipe',
  'reports.viewYours': 'Voir tes signalements',

  'messages.title': 'Messages',
  'messages.subtitle': 'Écris à l’équipe — elle te répond ici.',
  'messages.empty': 'Pas encore de messages. Écris-nous si tu as besoin de quelque chose.',
  'messages.placeholder': 'Ton message …',
  'messages.send': 'Envoyer',
  'messages.sending': 'Envoi …',
  'messages.you': 'Toi',
  'messages.staff': 'L’équipe',
  'messages.unread': 'nouveau',

  'action.save': 'Enregistrer',
  'action.cancel': 'Annuler',
  'action.back': 'Retour',
  'action.close': 'Fermer',
  'action.showAll': 'Tout afficher',

  'language.label': 'Langue',
  'language.change': 'Changer de langue',
  'language.machineNotice':
    'Cette traduction n’a pas encore été vérifiée par une personne de langue maternelle.',

  'safety.emergency':
    'En cas d’urgence : appelle le 112 ou contacte l’administration du logement',
}
