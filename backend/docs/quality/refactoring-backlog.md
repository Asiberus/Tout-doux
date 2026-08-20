# Backlog de refactoring

Items avec **intention d'agir**. Ce qui est signalé ici est **cassé, mort ou faux** : ne pas le
prendre comme modèle. Les faiblesses qu'on assume sans agir sont dans
[watched-risks.md](watched-risks.md).

> **Cycle de vie** : quand un item est résolu, **supprimer sa ligne et sa section**. Ne pas le
> marquer « Fait » — `git log` est déjà le registre du corrigé.

| ID  | Titre                                                                    | Priorité  | Raison de la priorité                                         |
| --- | ------------------------------------------------------------------------ | --------- | ------------------------------------------------------------- |
| R1  | Contrôle d'appartenance écrit avec `is not` (13 occurrences)             | **haute** | Rend l'application inutilisable pour tout compte d'`id` > 256 |
| R3  | `preferences/` incohérent pour un utilisateur sans ligne `Preferences`   | **haute** | Atteint tout compte créé hors inscription, dont le superuser  |
| R11 | Admin Django et API browsable inaccessibles (`AUTHENTICATION_BACKENDS`)  | **haute** | Deux surfaces d'administration mortes, et une doc qui ment    |
| R4  | « Aujourd'hui » calculé en UTC alors que `TIME_ZONE` vaut `Europe/Paris` | moyenne   | Fenêtre de dysfonctionnement quotidienne de 1 à 2 h           |
| R8  | Cycle d'imports entre les barrels de `serializers/`                      | moyenne   | Un réordonnancement anodin casse le démarrage                 |
| R10 | Dérive doc↔code des références du monorepo                              | moyenne   | Cause de code erroné généré ; c'est ce que `docs/` corrige    |
| R2  | `print(request.method)` résiduel dans `CreateOrAdmin`                    | basse     | Correction d'une ligne                                        |
| R7  | `openapi.yaml` : stub mort à la racine du monorepo                       | basse     | Laisse croire à un contrat maintenu                           |
| R9  | `SearchFilter` sans `search_fields` sur `FeedbackViewSet`                | basse     | Configuration morte                                           |
| R12 | `Tag` est le seul modèle sans `Meta.ordering`, et il est paginé          | basse     | Doublons ou lignes omises entre deux pages de `tag/`          |

---

## R1 — Contrôle d'appartenance écrit avec `is not`

- **Origine** : `serializers/task/task_post.py:52` et 12 autres — liste complète dans
  [../patterns/ownership-and-scoping.md](../patterns/ownership-and-scoping.md).
- **Contexte** : `if tag.user.pk is not current_user.pk` compare des **identités d'objets**, pas
  des valeurs. Ça ne fonctionne que grâce au cache des petits entiers de CPython (−5 à 256).
  Vérifié dans le conteneur : `int('257') is int('257')` → `False`. Dès qu'un utilisateur a un
  `id` supérieur à 256, tous ses contrôles d'appartenance échouent et il se voit refuser **ses
  propres** tags, projets, sections, collections et tâches, avec le message
  `Invalid pk "…" - object does not exist.`
- **Décision** : agir. Remplacer les 13 occurrences par `!=`. La cause racine est la duplication
  (voir [../adr/0001-serializer-per-action.md](../adr/0001-serializer-per-action.md)) : la
  correction devrait poser un mixin ou une fonction partagée, sinon la 14ᵉ occurrence
  réintroduira le bug.
- **Note** : l'échec est **fermé** (refus, jamais autorisation abusive) — ce n'est donc pas une
  faille de sécurité, mais une panne fonctionnelle totale pour les comptes concernés.

## R3 — `preferences/` incohérent sans ligne `Preferences`

- **Origine** : `views/preferences.py:11`, `serializers/user/user_register.py:41`.
- **Contexte** : la ligne `Preferences` n'est créée **que** par l'inscription. Un compte créé par
  `createsuperuser` — ce que `td.sh` demande explicitement au premier démarrage — ou par l'admin
  Django n'en a pas. `get_queryset()` renvoie alors `None`, et :
  - `GET preferences/` répond `{"progressWheelMode": null}` (vérifié dans le conteneur :
    `PreferencesSerializer(None).data`), une valeur hors énumération que le front n'attend pas ;
  - `PATCH preferences/` appelle `serializer.save()` sur `instance=None`, donc `create()`. Le
    champ `user` n'étant pas dans `Meta.fields`, il retombe sur
    `default=get_anonymous_user` : **la ligne créée appartient à l'utilisateur `anonymous`**, et
    l'utilisateur réel n'a toujours pas de préférences. _(Déduit du code, non exécuté — ne pas
    tester en base de développement sans y penser.)_
- **Décision** : agir. Deux pistes : `get_or_create` dans `get_queryset()`, ou un signal
  `post_save` sur `User`. La seconde couvre aussi les comptes créés par l'admin.
- **Voir aussi** : [W7](watched-risks.md) — l'utilisateur `anonymous` est ce qui rend ce bug
  silencieux.

## R11 — Admin Django et API browsable inaccessibles

- **Origine** : `backend/settings.py:118` (`AUTHENTICATION_BACKENDS`),
  `tout_doux/auth/email_backend.py:6`.
- **Contexte** : `AUTHENTICATION_BACKENDS` ne contient qu'`EmailBackend`, qui **remplace**
  `ModelBackend` au lieu de s'y ajouter. Or `EmailBackend.authenticate()` n'accepte que le kwarg
  `email`, tandis que le formulaire de l'admin Django et celui de `/api-auth/login/` appellent
  `authenticate(request, username=…, password=…)`. Vérifié dans le conteneur :
  `authenticate(email='…')` renvoie l'utilisateur, `authenticate(username='…')` renvoie `None`,
  que la valeur passée soit l'e-mail ou le nom d'utilisateur. Le POST de connexion réaffiche donc
  le formulaire (200) ; il n'est pas refusé par le CSRF (403). **Antérieur à la migration Django
  6.1** : comportement identique sous Django 3.2.
- **Conséquence** : l'admin est inatteignable alors que `td.sh` demande explicitement un
  `createsuperuser` au premier démarrage, et
  [../workflows/verification.md](../workflows/verification.md) documentait une procédure de
  connexion à l'API browsable qui ne peut pas aboutir.
- **Décision** : agir, mais **pas dans une montée de versions**. Le correctif tient en une ligne
  — ajouter `'django.contrib.auth.backends.ModelBackend'` à la suite — mais il rouvre
  l'authentification par nom d'utilisateur sur **toute** l'application, `/auth/login/` compris.
  C'est un changement de comportement à arbitrer pour lui-même.
- **Voir aussi** : R3 — les comptes créés par `createsuperuser` sont déjà un angle mort.

## R4 — « Aujourd'hui » calculé en UTC

- **Origine** : `views/daily_task.py:31`, `serializers/daily_task/daily_task_patch.py:57`,
  et `DailyTask.date` (`auto_now_add`).
- **Contexte** : ces trois points utilisent `datetime.date.today()`, qui lit l'horloge système.
  Vérifié : le conteneur est en **UTC** (`time.tzname` → `('UTC','UTC')`, pas de variable `TZ`),
  alors que `settings.TIME_ZONE` vaut `Europe/Paris`. Entre 00:00 et 02:00 heure de Paris (01:00
  en hiver), le serveur est encore la veille : l'utilisateur ne peut pas supprimer une ligne du
  jour affiché, ne peut plus en modifier le nom, et les lignes qu'il crée sont datées de la
  veille.
- **Décision** : agir. `django.utils.timezone.localdate()` respecte `TIME_ZONE` et corrige les
  trois points. Pour `auto_now_add`, il faut remplacer le champ par un `default=` appelable —
  `DateField.pre_save` utilise `date.today()` en dur.

## R8 — Cycle d'imports entre les barrels de `serializers/`

- **Origine** : `serializers/section/section.py:3` ↔ `serializers/project/project_detail.py:4`.
  Détail dans [../architecture/overview.md](../architecture/overview.md).
- **Contexte** : importer `tout_doux.serializers.section` avant `…project` lève un `ImportError`
  (vérifié). L'application ne démarre que parce que `views/__init__.py` atteint `project` en
  premier, et parce que `project/__init__.py` liste `.project` avant `.project_detail`.
  Réordonner un barrel, renommer un fichier de sérialiseur ou ajouter un import de `project`
  dans un module chargé tôt casse le démarrage — sans que rien ne le signale avant l'exécution.
  Le même schéma existe en plus petit dans `serializers/event/`.
- **Décision** : agir. La sortie propre est de faire porter les relations imbriquées par une
  déclaration paresseuse (`serializers.SerializerMethodField`, ou import différé dans la
  méthode) sur l'un des deux côtés du cycle — vraisemblablement `SectionSerializer.project`,
  qui n'est utilisé que par `TaskExtendedSerializer`.

## R10 — Dérive doc↔code des références du monorepo

- **Origine** : constatée en construisant cette documentation.
- **Contexte** : trois points de référence du monorepo étaient faux ou vides.
  `README.md` à la racine contient le mot « README » et rien d'autre. `openapi.yaml` laisse
  croire à un contrat maintenu (voir R7). `frontend/docs/README.md` décrivait le contrat d'API
  comme défini « hors de ce dépôt », alors que `backend/` est dans le même monorepo — corrigé en
  même temps que la création de `backend/docs/`.
- **Décision** : agir sur ce qu'il reste, c'est-à-dire le `README.md` racine : il devrait
  présenter le monorepo en quelques lignes et pointer vers `backend/docs/` et
  `frontend/docs/`. Traiter en même temps que R7.
- **Prévention** : c'est exactement ce que le mécanisme décrit dans
  [../README.md](../README.md) et [`../../CLAUDE.md`](../../CLAUDE.md) est censé empêcher de se
  reproduire.

## R2 — `print(request.method)` résiduel dans `CreateOrAdmin`

- **Origine** : `permissions/create__or_admin.py:9`.
- **Contexte** : un `print` de débogage est exécuté à chaque appel de `feedback/`. En production
  il écrit sur la sortie standard d'uwsgi, donc dans les logs du conteneur.
- **Décision** : agir, c'est une ligne. Ne rien logger à la place : la permission n'a rien
  d'intéressant à tracer.

## R7 — `openapi.yaml` : stub mort

- **Origine** : `openapi.yaml` à la racine du monorepo, 13 lignes, inchangé depuis juin 2021
  (`fd81c71`).
- **Contexte** : décrit un seul chemin (`/project`) sans schéma de réponse, ne correspond à rien
  de l'API réelle, n'est lu par aucun outil ni script. Sa seule fonction actuelle est d'induire
  en erreur.
- **Décision** : agir — le supprimer, et pointer vers
  [../architecture/api-surface.md](../architecture/api-surface.md). La reconstruction d'un vrai
  schéma est un autre sujet, traité dans
  [../adr/0004-no-openapi-schema.md](../adr/0004-no-openapi-schema.md).

## R9 — `SearchFilter` sans `search_fields`

- **Origine** : `views/feedback.py:15`.
- **Contexte** : `filter_backends` déclare `filters.SearchFilter`, mais la vue ne définit aucun
  `search_fields`. Le filtre est donc inopérant : `?search=` est ignoré en silence. Copie
  probable de `views/tag.py:15`, qui lui définit bien `search_fields = ('name',)`.
- **Décision** : agir — soit retirer le backend, soit ajouter
  `search_fields = ('title', 'message')`, ce qui est vraisemblablement l'intention initiale
  pour un écran d'administration des retours utilisateurs.

## R12 — `Tag` sans `Meta.ordering` alors qu'il est paginé

- **Origine** : `models/tag.py:37` — découvert par un `UnorderedObjectListWarning` de Django émis
  depuis `pagination.py:25` pendant les tests.
- **Contexte** : `Tag.Meta` déclare des `constraints` mais **pas d'`ordering`**, alors que les
  onze autres modèles en ont un. `TagViewSet` utilise pourtant `ExtendedPageNumberPagination`.
  PostgreSQL ne garantit aucun ordre pour un `SELECT` sans `ORDER BY` : deux pages successives
  peuvent renvoyer la même ligne, ou en omettre une. Django émet l'avertissement à chaque appel
  paginé de `tag/`.
- **Décision** : agir — ajouter `ordering = ('pk',)` à `Tag.Meta`, par cohérence avec
  `CommonTask` et `DailyTask` qui utilisent déjà cette valeur. Génère une migration
  `AlterModelOptions`, sans SQL.
- **Portée réelle** : faible tant qu'un utilisateur a moins de 20 tags (la taille de page par
  défaut) — le défaut ne se manifeste qu'à partir de la deuxième page.
