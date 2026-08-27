# Faiblesses et risques surveillés

Items **sans intention d'agir aujourd'hui**. Chacun porte une **condition de déclenchement**
explicite : c'est elle qui rouvre le sujet, pas une impression. Ce qu'on a l'intention de
corriger est dans [refactoring-backlog.md](refactoring-backlog.md).

Ne rien faire est souvent le bon choix pour une application mono-développeur à faible volume — la
raison est indiquée pour chaque item.

> **Cycle de vie** : si un déclencheur est atteint, **déplacer l'item vers le backlog**. Si un
> item est résolu, **supprimer sa ligne et sa section**.

| ID  | Titre                                                          | Nature      | Déclencheur                                                         |
| --- | -------------------------------------------------------------- | ----------- | ------------------------------------------------------------------- |
| W1  | Aucun test automatisé                                          | Fiabilité   | > 1 développeur, ou 2 régressions sur un même endpoint              |
| W2  | Aucun linter, formateur ni CI sur le backend                   | Fiabilité   | Une contribution à relire par un tiers                              |
| W3  | E-mails envoyés sans reprise ni trace                          | Robustesse  | Un signalement d'e-mail non reçu, ou > 50 inscriptions/jour         |
| W4  | `SECRET_KEY` retombe sur `'secret'` si la variable manque      | Sécurité    | Tout déploiement dont la conf n'est pas générée par `td.sh`         |
| W5  | Pas de limitation de débit, et énumération d'e-mails possible  | Sécurité    | Trafic anormal sur `auth/login/` ou `user/is-email-unique/`         |
| W6  | Ports backend et base publiés sur l'hôte en production         | Sécurité    | Hébergement sans pare-feu, ou migration d'hôte                      |
| W7  | Utilisateur `anonymous` créé automatiquement                   | Intégrité   | Une ligne rattachée à `anonymous` apparaît en base                  |
| W9  | Mot de passe en clair dans `validated_data` à l'inscription    | Sécurité    | Toute modification de `UserRegisterSerializer.create`               |
| W11 | `event/` renvoie tous les événements sans pagination           | Performance | > 500 événements pour un utilisateur                                |
| W12 | `GET /collection/` : le `COUNT(*)` de pagination est enveloppé | Performance | Pagination réelle **et** > 100 ms, ou une collection > 5 000 tâches |
| W13 | `daily-task/summary/` n'impose aucune borne à l'intervalle     | Robustesse  | Un appel dont l'intervalle dépasse 400 jours                        |

---

## W1 — Aucun test automatisé

- **Origine** : `tout_doux/tests.py` — squelette de `startapp`, jamais rempli. Aucun autre
  fichier de test dans `backend/`.
- **Contexte** : la logique métier est concentrée dans les sérialiseurs, sous forme de
  conditions croisées (47 lignes pour `event_post_or_patch.validate`, 4 conditions simultanées
  pour la propagation d'achèvement d'un daily task). C'est exactement ce qu'un test unitaire
  couvre bien et qu'une vérification manuelle couvre mal.
- **Décision** : ne pas agir. Un développeur unique, qui est aussi l'utilisateur, détecte les
  régressions à l'usage. Le coût d'écriture d'une base de tests dépasse aujourd'hui le coût des
  régressions constatées.
- **Déclencheur** : un second contributeur, ou deux régressions successives sur le même
  endpoint. Le premier test à écrire est celui de la propagation d'achèvement
  ([../domain/daily-rules.md](../domain/daily-rules.md)) — c'est la règle la plus subtile et la
  plus coûteuse à vérifier à la main.

## W2 — Aucun linter, formateur ni CI sur le backend

- **Origine** : absence de `setup.cfg`, `pyproject.toml`, `.flake8`, `tox.ini` ;
  `.github/workflows/deployment.yml` ne fait que construire et relancer les images.
- **Contexte** : rien ne relit le code. C'est ce qui a laissé passer R1 (`is not` au lieu de
  `!=`, que `ruff` signale en `F632`), R2 (`print` résiduel) et R9 (configuration morte). Trois
  des dix items du backlog seraient détectés par un linter standard, sans configuration
  particulière.
- **Décision** : ne pas agir **en tant que tel** — mais noter que le rapport coût/bénéfice est
  ici bien meilleur que pour W1 : un `ruff check` en hook `pre-commit` coûte une ligne de
  configuration. C'est le premier outillage à poser si l'on ne devait en poser qu'un.
- **Déclencheur** : une contribution externe à relire, ou la correction de R1 (poser le linter
  au même moment évite la 14ᵉ occurrence).

## W3 — E-mails envoyés sans reprise ni trace

- **Origine** : `services/email.py:21` — `threading.Thread(...).start()`, détaché.
- **Contexte** : conséquence assumée de
  [../adr/0005-fire-and-forget-emails.md](../adr/0005-fire-and-forget-emails.md). Un échec
  Mailjet est invisible : pas de log, pas de reprise, pas de statut. Les deux endpoints de renvoi
  d'e-mail d'activation sont la compensation prévue.
- **Décision** : ne pas agir. Quatre e-mails transactionnels sur une application à très faible
  trafic ne justifient pas un broker et un worker. Un premier palier bien moins coûteux existe :
  envelopper `_send_mail` dans un `try/except` qui journalise.
- **Déclencheur** : un signalement d'e-mail d'activation non reçu, ou un volume dépassant 50
  inscriptions par jour.

## W4 — `SECRET_KEY` retombe sur `'secret'`

- **Origine** : `settings.py:24` — `os.environ.get('SECRET_KEY', 'secret')`.
- **Contexte** : si la variable est absente, Django démarre **sans erreur** avec une clé
  publique connue. Or la `SECRET_KEY` signe les jetons d'activation et de réinitialisation de
  mot de passe (`default_token_generator`) : la connaître permet de forger un lien de
  réinitialisation valide pour n'importe quel compte dont on connaît l'`id`. `manage.py check
--deploy` le signale (`security.W009`).
- **Décision** : ne pas agir sur le mécanisme — `td.sh install prod` **exige** la saisie d'une
  clé, et le workflow de déploiement l'injecte depuis un secret GitHub. Le défaut n'est donc
  jamais atteint sur le déploiement existant. Une correction propre (lever une exception si la
  variable manque et que `DEBUG` est faux) reste souhaitable si l'app est déployée autrement.
- **Déclencheur** : tout déploiement dont la configuration n'est pas produite par `td.sh`.
- **Sévérité** : haute **si** déclenché — CWE-1188 (initialisation à une valeur par défaut non
  sûre).

## W5 — Pas de limitation de débit, et énumération d'e-mails possible

- **Origine** : absence de `DEFAULT_THROTTLE_CLASSES` dans `settings.py:120` ;
  `views/user.py:163` (`is_email_unique`, `AllowAny`).
- **Contexte** : deux faiblesses liées. D'une part `auth/login/` accepte un nombre illimité de
  tentatives. D'autre part, `reset-password-request` a été **délibérément** conçu pour répondre
  204 même sur un e-mail inconnu (`views/auth.py:56`), et `EmailBackend` égalise même les temps
  de réponse — mais `user/is-email-unique/`, ouvert et sans authentification, répond
  explicitement `{"unique": false}` pour toute adresse enregistrée. Le soin pris d'un côté est
  annulé de l'autre.
- **Décision** : ne pas agir. L'endpoint d'unicité existe pour la validation en direct du
  formulaire d'inscription, et le retirer dégraderait ce parcours. La base d'utilisateurs est de
  l'ordre de l'unité : il n'y a rien à énumérer. Reconnaître l'incohérence vaut mieux que
  prétendre que l'anti-énumération de `reset-password-request` protège quelque chose.
- **Déclencheur** : trafic anormal constaté sur `auth/login/` ou `user/is-email-unique/`, ou
  ouverture de l'inscription au-delà du cercle privé.
- **Sévérité** : basse aujourd'hui — CWE-204 (divergence de réponse observable) et CWE-307
  (absence de restriction des tentatives d'authentification).

## W6 — Ports backend et base publiés sur l'hôte en production

- **Origine** : `docker-compose.prod.yml:40-41` (backend) et `:55-56` (base).
- **Contexte** : nginx joint le backend par le réseau Docker interne
  (`BACKEND_PROXY=${BACKEND_NAME}:${BACKEND_PORT}`, `.conf/production/frontend/default.conf.tpl:27`),
  donc les deux publications de ports sont **inutiles au fonctionnement**. Elles exposent
  pourtant sur l'hôte le socket uwsgi (protocole binaire uwsgi, sans authentification propre :
  qui l'atteint parle directement à Django, hors nginx) et PostgreSQL. Par ailleurs, le vhost
  `${API_HOST}` proxyfie tout, donc `/admin/` et `/api-auth/` sont joignables publiquement — ils
  exigent une session valide, mais la surface est là.
- **Décision** : ne pas agir tant que l'exposition réelle n'est pas établie. Elle **dépend
  entièrement du pare-feu de l'hôte**, qui n'est pas décrit dans ce dépôt : impossible de dire
  depuis le code si ces ports sont réellement joignables depuis internet. Ne pas conclure à une
  faille sans l'avoir vérifié sur la machine.
- **Déclencheur** : migration d'hôte, ou constat que les ports 8021/8022 répondent depuis
  l'extérieur. Dans ce cas, retirer les deux blocs `ports:` suffit.
- **Sévérité** : indéterminée — CWE-1327 (liaison à une adresse non restreinte).

## W7 — Utilisateur `anonymous` créé automatiquement

- **Origine** : `models/user.py:5` (`get_anonymous_user`), utilisé comme `default` du champ
  `user` de `UserRelatedModel`.
- **Contexte** : vestige de la migration 0004, qui devait donner une valeur aux lignes
  préexistantes. La fonction fait un `get_or_create(username="anonymous")` : **elle crée le
  compte à la demande**, sans mot de passe utilisable mais avec `is_active=True` par défaut.
  Toute ligne créée sans propriétaire explicite lui est rattachée, silencieusement. C'est ce qui
  rend R3 invisible.
- **Décision** : ne pas agir isolément. Retirer le `default` transformerait chaque oubli en
  `IntegrityError` — ce qui serait mieux — mais demande une migration et la certitude qu'aucune
  ligne n'y est déjà rattachée. À traiter avec R3.
- **Déclencheur** : constater en base une ligne dont `user` est le compte `anonymous`
  (`select count(*) from tout_doux_preferences p join tout_doux_user u on u.id = p.user_id
where u.username = 'anonymous';`).

## W9 — Mot de passe en clair dans `validated_data` à l'inscription

- **Origine** : `serializers/user/user_register.py:28-38`.
- **Contexte** : `create()` fait `get_user_model()(**validated_data)` alors que `validated_data`
  contient encore `password` en clair : l'attribut `user.password` reçoit donc brièvement le mot
  de passe non haché. Les lignes suivantes appellent `set_password()` puis `save()`, dans cet
  ordre, ce qui écrase la valeur **avant** toute écriture en base. Le comportement actuel est
  donc correct.
- **Décision** : ne pas agir — le code fonctionne. L'inscrire ici parce que la correction est
  invisible : rien n'indique dans le fichier que l'ordre des trois lignes est ce qui empêche
  d'écrire un mot de passe en clair en base. Un `validated_data.pop('password')` avant la
  construction rendrait l'intention explicite.
- **Déclencheur** : toute modification de `UserRegisterSerializer.create` — relire cette fiche
  avant de toucher à ces dix lignes.
- **Sévérité** : nulle aujourd'hui ; CWE-256 (stockage de mot de passe en clair) si l'ordre est
  rompu.

## W11 — `event/` sans pagination

- **Origine** : `views/event.py:11` — seul viewset de liste sans `pagination_class`.
- **Contexte** : `GET event/` renvoie un tableau nu de **tous** les événements de l'utilisateur
  quand aucun filtre n'est passé. Le front filtre systématiquement par mois ou par date, donc le
  cas ne se produit pas en usage normal.
- **Décision** : ne pas agir. Ajouter la pagination changerait la forme de la réponse et
  casserait les appels du client, qui attend un tableau — le coût est côté front, pour un
  problème qui n'existe pas encore.
- **Déclencheur** : plus de 500 événements pour un utilisateur, ou un appel non filtré ajouté au
  client.

## W12 — Le `COUNT(*)` de pagination de `GET /collection/` est enveloppé

- **Origine** : `views/collection.py:19` — `Count('tasks')` et
  `Count('tasks', filter=Q(tasks__completed=True))`.
- **Contexte** : Django enveloppe le comptage de pagination dans une sous-requête groupée dès
  qu'une annotation contient un agrégat. Vérifié sur le SQL généré :
  `SELECT COUNT(*) FROM (SELECT collection.id FROM collection LEFT OUTER JOIN task … GROUP BY 1)
subquery`. Il était plat avant. `ProjectViewSet` n'a pas ce coût : ses sous-requêtes scalaires
  sont élidées du comptage.
- **Décision** : ne pas agir. `Count` est ici plus lisible et idiomatique — les deux compteurs
  portent sur la **même** relation, donc aucun produit cartésien n'est possible et une
  sous-requête serait une complication gratuite. Joindre et grouper quelques milliers de lignes
  coûte une fraction de milliseconde au volume actuel.
- **Déclencheur** : la pagination réelle est introduite **et** `GET /collection/` dépasse 100 ms
  — ce comptage est alors refait à chaque page ; ou une collection dépasse quelques milliers de
  tâches. Le remède est d'une ligne : `scalar_count`, même signature qu'en `views/project.py`.

## W13 — `daily-task/summary/` n'impose aucune borne à l'intervalle demandé

- **Origine** : `views/daily_task.py`, action `summary()`.
- **Contexte** : `start_date` et `end_date` sont acceptés tels quels. Le coût en requêtes est
  désormais constant — 2, quel que soit l'intervalle — mais la liste de dates construite en
  mémoire reste linéaire : `start_date=2000-01-01&end_date=2026-01-01` fabrique 9 500
  dictionnaires. Avant le chantier N+1, le même appel faisait plus de 28 000 requêtes.
- **Décision** : ne pas agir. Le front demande entre 10 et 42 jours selon la largeur d'écran
  (`DailySummary.vue:63`), et rien d'autre n'appelle cet endpoint. Borner côté serveur
  changerait le contrat de l'API pour un abus qui ne s'est jamais produit.
- **Déclencheur** : un appel dont l'intervalle dépasse 400 jours, quelle qu'en soit l'origine.
  Le remède est un plafond dans `summary()`, avec un `ParseError` explicite — et sa mise à jour
  dans [../architecture/api-surface.md](../architecture/api-surface.md).
