# Événements — dates, heures et rattachement

Un `Event` a quatre champs temporels dont trois facultatifs, plus un drapeau « journée
entière ». Leur validation croisée (`serializers/event/event_post_or_patch.py:73`, 47 lignes)
est la plus dense du projet, et elle **corrige silencieusement** les données autant qu'elle les
refuse.

## Les cinq champs

| Champ API       | Obligatoire         | Format                                              |
| --------------- | ------------------- | --------------------------------------------------- |
| `startDate`     | **oui**             | `YYYY-MM-DD`                                        |
| `startTime`     | non                 | `HH:MM` **strictement** (`input_formats=['%H:%M']`) |
| `endDate`       | non                 | `YYYY-MM-DD`                                        |
| `endTime`       | non                 | `HH:MM`                                             |
| `takesWholeDay` | non, défaut `false` | booléen                                             |

## Ce que le serveur corrige sans le dire

Avant toute validation, deux normalisations muettes — aucune erreur n'est renvoyée, les valeurs
envoyées sont simplement **écrasées** :

| Entrée                | Effet                                                    |
| --------------------- | -------------------------------------------------------- |
| `takesWholeDay: true` | `startTime`, `endDate` et `endTime` sont forcés à `null` |
| `endDate: null`       | `endTime` est forcé à `null`                             |

Conséquence structurante : **un événement « journée entière » ne peut pas s'étaler sur
plusieurs jours.** Ce n'est pas un refus, c'est une amputation silencieuse de `endDate`.

## Ce que le serveur refuse

| Règle                                                                                                                                   | S'applique à             | Message                                                                               |
| --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ | ------------------------------------------------------------------------------------- |
| Une heure de fin sans date de fin                                                                                                       | **création seulement**   | `You can't add an end time without an end date`                                       |
| Même jour de début et de fin sans les **deux** heures                                                                                   | création et modification | `You must provide a start and end time to an event that start and end the same day`   |
| Fin antérieure ou égale au début                                                                                                        | création et modification | `You can't set the end date before the start date`                                    |
| Ajouter une heure ou une date de fin à un événement déjà « journée entière », sans repasser `takesWholeDay: false` dans la même requête | modification             | `You can't add a start time or end date or end time to an event that takes whole day` |
| Modifier un événement d'un projet archivé                                                                                               | modification             | `You can't edit an event related to an archived project`                              |

La comparaison début/fin utilise `time.min` quand l'heure manque : un événement du 1er au 2 sans
heures est donc valide (00:00 < 00:00 du lendemain), mais un événement du 1er au 1er sans heures
est rejeté par la règle du même jour.

## Le rattachement à un projet est à sens unique

`event_post_or_patch.py:87` : dès que l'événement **a déjà** un projet, toute requête contenant
`projectId` est rejetée par `This event is already link to a project`.

Trois conséquences, toutes vérifiables en lisant la condition `if 'project' in data` :

- **on ne peut pas changer** le projet d'un événement ;
- **on ne peut pas le détacher** : envoyer `projectId: null` place bien la clé dans `data` et
  déclenche donc le même refus ;
- **renvoyer la valeur actuelle échoue aussi** — un PATCH qui réémet tout l'objet, y compris son
  `projectId` inchangé, est refusé. Le client doit omettre le champ.

À l'inverse, **attacher** un projet à un événement qui n'en avait pas est autorisé, et
irréversible.

## Filtrer la liste

`GET event/` accepte deux filtres, tous deux implémentés à la main dans `views/event.py:20` :

| Paramètres                   | Effet                                                                                  |
| ---------------------------- | -------------------------------------------------------------------------------------- |
| `date=YYYY-MM-DD`            | événements dont ce jour est le début, ou qui l'englobent (`start_date ≤ d ≤ end_date`) |
| `month=M` **et** `year=YYYY` | événements dont le début **ou** la fin tombe dans ce mois                              |

`month` seul, ou `year` seul, est **ignoré en silence** : la condition exige les deux. Une date
mal formée renvoie 400 (`Date is not valid.`), un mois hors de 1–12 aussi (`Month and/or year
parameters are incorrect`).

**Cette liste n'est pas paginée** — c'est l'un des deux endpoints sans enveloppe, voir
[../architecture/api-surface.md](../architecture/api-surface.md).

## `?extended=` ne fait pas ce que son nom suggère

`GET event/` et `GET event/{pk}/` renvoient **toujours** la forme étendue (avec le projet
imbriqué). Le paramètre `extended` n'agit **que sur la réponse d'un POST ou d'un PATCH**, en
choisissant entre `EventSerializer` et `EventExtendedSerializer` — voir
[../architecture/serializers.md](../architecture/serializers.md).

## Comportement non vérifié

La branche `takes_whole_day` de la modification s'appuie sur
`data.get('takes_whole_day') is not False`. En PATCH (`partial=True`), DRF n'applique pas les
valeurs par défaut, donc l'absence du champ vaut `None` et le garde s'applique. **En PUT**, le
défaut `False` du sérialiseur serait appliqué et le garde tomberait. Aucun client n'utilise PUT
et ce cas n'a pas été testé — lire `event_post_or_patch.py:95` avant de s'y fier.

## Voir aussi

- [glossary.md](glossary.md) — la place de `Event` dans le domaine
- [`../../../frontend/docs/domain/events.md`](../../../frontend/docs/domain/events.md) — ce que
  l'UI impose en plus
