# Événements — règles temporelles

Un `Event` est un élément d'agenda. Sa forme temporelle est **partiellement libre dans le modèle
mais fortement contrainte par le formulaire** : `EventModel` permet des combinaisons que l'UI
interdit. Les trois prédicats de `src/utils/event.utils.ts` sont la source de vérité du
comportement d'affichage.

Consommateurs : agenda (`views/agenga/Agenda.vue`), onglet événements d'un projet, étape
« event » du wizard daily, résumé journalier.

## Champs

`startDate` est le **seul champ temporel obligatoire**. Tous sont des `string` :
`'YYYY-MM-DD'` pour les dates, `'HH:mm'` (24 h) pour les heures.

| Champ                             | Rôle                           |
| --------------------------------- | ------------------------------ |
| `startDate`                       | requis                         |
| `startTime`, `endDate`, `endTime` | optionnels                     |
| `takesWholeDay`                   | booléen — « toute la journée » |

## Combinaisons autorisées par le formulaire

| Forme                                                   | Contrainte imposée par `EventDialog`                                                                          |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Journée entière                                         | `takesWholeDay: true` **efface et désactive** `startTime`, `endDate`, `endTime` → il ne reste que `startDate` |
| Événement horaire sur un jour (`startDate === endDate`) | `startTime` **et** `endTime` deviennent **requis**                                                            |
| Événement sur plusieurs jours                           | `endDate` doit être **strictement après** `startDate` (comparaison date+heure, `'00:00'` par défaut)          |
| —                                                       | `endTime` est désactivé tant que `endDate` est vide → **pas d'heure de fin sans date de fin**                 |

À la soumission, les chaînes vides sont normalisées en `null` (`EventPostOrPatch` déclare ces
champs `string | null`).

⚠️ **Le modèle est plus permissif que l'UI** : `{ takesWholeDay: true, startTime, endDate }` est
parfaitement représentable et inatteignable par le formulaire. Un tel enregistrement serait
évalué comme un événement à plage (voir `isPassed` ci-dessous) et afficherait mal ses dates.

## Les trois prédicats

### `isPassed(event)` — « est-il terminé, maintenant ? »

Granularité **adaptative**, dans cet ordre :

1. si `endDate` existe → comparaison à la fin, à la **minute** si `endTime` existe, sinon au **jour** ;
2. sinon si `takesWholeDay` → comparaison au **jour** (un événement « toute la journée » reste
   donc « non passé » jusqu'à la fin de la journée) ;
3. sinon → comparaison au début, à la **minute** si `startTime`, sinon au **jour**.

Note : `endDate` est testé **avant** `takesWholeDay`. Usage purement présentationnel — couleur de
carte (`passedEvent` vs `event`), icône de timeline, partition « à venir / passés » d'un projet.

### `isEventRelatedToDate(event, date)` — « couvre-t-il ce jour ? »

Si `endDate` existe : `date` est comprise entre `startDate` et `endDate` **bornes incluses**, à la
granularité du **jour**. Sinon : même jour que `startDate`. **Ignore les heures et
`takesWholeDay`.**

Utilisé pour garder une liste de journée cohérente après création/édition, pour valider le
formulaire dans le wizard (`relatedToDate`), et pour remplir le dialog de jour de l'agenda.

### `sortEvents(e1, e2, { handlePassedEvent })` — ordre d'affichage

Par ordre de priorité décroissante :

1. si `handlePassedEvent` est activé : **les événements passés d'abord** ;
2. instant de début croissant (`startDate` + `startTime ?? '00:00'`) ;
3. à début égal : instant de fin croissant, et un événement **avec** `endDate` passe **après** un
   événement sans ;
4. toujours égal : `takesWholeDay` d'abord.

`handlePassedEvent: true` n'est utilisé **qu'au résumé journalier** (`DailyDetail`), pour que la
timeline se lise passé → futur. Partout ailleurs le défaut `false` s'applique.

⚠️ `sortEvents` est appliqué via `Array.prototype.sort`, donc **il mute le tableau en place** —
y compris, dans un cas, la réponse d'API avant stockage (`project.store.ts:92`).

## Règles appliquées par l'UI seulement

- Les contraintes de combinaison ci-dessus (le modèle ne les exprime pas).
- **`EventExtendedModel.project` est typé non-optionnel** alors qu'un événement peut n'avoir aucun
  projet (`EventPostOrPatch.projectId` est optionnel) ; les composants testent défensivement
  `v-if="project"`. Le type est trop strict.
- Les **minutes sont restreintes aux multiples de 5** par le sélecteur d'heure, pas par le modèle.

## Voir aussi

- [glossary.md](glossary.md) · [daily-rules.md](daily-rules.md)
- [../architecture/api-layer.md](../architecture/api-layer.md) — `getEvents` ne renvoie **pas**
  l'enveloppe de pagination, contrairement aux autres endpoints de liste
- [vuetify-4-migration.md](../workflows/vuetify-4-migration.md) — `EventDialog` a été
  entièrement réécrit pour les sélecteurs de date/heure de Vuetify 4 (point 1.8)
