# Documentation de référence — backend Tout-Doux

Documentation **vivante** de l'API. Lue par des développeurs humains **et** par des assistants
IA : elle doit permettre d'implémenter ou d'étendre un endpoint sans relire tout le code.

> **Une doc obsolète est pire que pas de doc.** Chaque type de fichier ci-dessous a un
> **déclencheur de mise à jour** explicite. Si ton changement correspond à un déclencheur, la
> doc se met à jour **dans le même commit**.

## Périmètre

**Couvert** : tout `backend/` — projet Django `backend.*` + application unique `tout_doux`
(3 455 lignes de Python, 12 modèles, 12 modules de vues, 41 sérialiseurs, 4 migrations).

**Référencé, non documenté** : le monorepo parent — `frontend/` (SPA Vue 3, qui a sa propre
doc : [`../../frontend/docs/`](../../frontend/docs/)), `.conf/*/backend/` (Dockerfiles,
`run.sh`), `docker-compose*.yml`, `td.sh`, `.github/workflows/`. Ces éléments ne sont cités que
lorsqu'ils déterminent le comportement du backend — voir
[workflows/development.md](workflows/development.md).

**Ce dont ce dossier est propriétaire** : le **contrat d'API**. Il n'existe aucun schéma
généré ; le front en tient une copie manuelle dans `frontend/src/models/`. La table de
[architecture/api-surface.md](architecture/api-surface.md) est donc la référence unique. Voir
[adr/0004-no-openapi-schema.md](adr/0004-no-openapi-schema.md).

## Index

| Dossier / fichier              | Purpose                                                                                |
| ------------------------------ | -------------------------------------------------------------------------------------- |
| [architecture/](architecture/) | Une fiche par couche : responsabilité, briques, dépendances, contraintes non évidentes |
| [patterns/](patterns/)         | Comment on résout les problèmes techniques **récurrents de ce projet**                 |
| [workflows/](workflows/)       | Procédures pas-à-pas de dev et de vérification                                         |
| [domain/](domain/)             | Langage métier et **ce que le serveur garantit réellement**                            |
| [adr/](adr/)                   | Décisions structurantes et leur pourquoi                                               |
| [quality/](quality/)           | Registre **évaluatif** : ce qui est cassé, risqué, ou à refactorer                     |
| `features/`                    | **Absent, délibérément** — voir la section dédiée ci-dessous                           |

Point d'entrée conseillé : [architecture/overview.md](architecture/overview.md).

> **État du dépôt** : le dernier commit touchant `backend/` date du **14/12/2023**. Le backend
> est stable pendant que le front migre vers Vue 3 / Vuetify 4. Une affirmation de cette doc qui
> te surprend décrit probablement un choix de 2022-2023 encore en place, pas un oubli.

---

## architecture/

**Purpose** — répond à « de quoi cette couche est-elle responsable, de quoi dépend-elle, et
qu'est-ce qui n'est pas déductible du code ? ». Une fiche par couche structurante, pas par
dossier.

**When to create / update** :

- une couche change de responsabilité ou de surface publique ;
- un modèle, un sérialiseur, une vue, une permission ou une classe d'authentification est
  ajouté ou supprimé ;
- **un endpoint est ajouté, renommé, supprimé, ou change de méthode / permission / filtre** →
  [api-surface.md](architecture/api-surface.md), dont la table est **maintenue à la main** ;
- une contrainte non évidente est découverte (ordre de résolution d'URL, effet de bord d'un
  signal, comportement du routeur).

**Ne pas** mettre à jour pour un sérialiseur de plus qui suit une convention déjà décrite —
sauf s'il crée un endpoint (alors la table de `api-surface.md` change).

**Naming** — `kebab-case.md`, nommé d'après la couche (`serializers.md`, `data-model.md`), pas
d'après le dossier source.

**Format** :

```markdown
# <Couche>

<1-3 phrases : responsabilité, et la frontière avec les couches voisines.>

## Chaîne / briques

<Fichiers clés avec chemins. Le flux, pas l'exhaustivité.>

## Règles

<Ce qu'on doit respecter. Marquer OUTILLÉ ou DISCIPLINE pour chacune.>

## Contraintes non évidentes

<Effets de bord, ordre, pièges. Ce qui ne se lit pas dans le code.>

## Décisions négatives

<Ce qui a été volontairement écarté, et pourquoi. Sinon quelqu'un le « corrigera ».>

## Voir aussi

<Liens relatifs.>
```

> **Critère de taille** : le lecteur doit comprendre la couche en **moins de cinq minutes**. Une
> table de référence ne ralentit pas la lecture, un paragraphe explicatif oui. **Indicateur de
> découpage** : si la prose (hors tables et blocs de code) dépasse ~90 lignes, scinder.

## patterns/

**Purpose** — la recette à suivre pour un problème qui revient **dans ce projet**. Jamais un
idiome standard de Django ou DRF : si la doc officielle le dit déjà, on ne le recopie pas.

**When to create / update** :

- **créer** quand la même solution technique apparaît pour la 3ᵉ fois dans le code ;
- **mettre à jour** quand un nouveau cas d'usage ne rentre pas dans la recette, ou qu'une
  variante devient la norme ;
- **mettre à jour** quand un site d'application est ajouté à une règle transverse (un nouveau
  garde d'archivage, un nouveau contrôle d'appartenance) : ces fiches **énumèrent leurs sites**.

**Naming** — `kebab-case.md` décrivant l'action ou l'objet (`adding-an-endpoint.md`,
`archive-guards.md`), pas la techno.

**Format** :

```markdown
# <Pattern>

**Problème** — <ce que ça résout, en une phrase.>

## Recette

<Étapes numérotées, avec un exemple réel du dépôt et son chemin.>

## Sites d'application

<La liste exhaustive, si le pattern est réplique à la main. Maintenue à la main.>

## Variantes légitimes

<Si plusieurs approches coexistent : le critère de choix pour un nouveau cas.>

## Écarts assumés / non migrés

<Les endroits qui ne suivent pas, en les nommant. Dette ou décision ?>

## Voir aussi
```

## workflows/

**Purpose** — procédures exécutables : lancer, configurer, migrer, vérifier.

**When to update** :

- une commande `manage.py` maison est ajoutée, renommée ou supprimée ;
- la façon de lancer ou de configurer l'app change (`td.sh`, `docker-compose*.yml`,
  `.conf/*/backend/`, une variable d'environnement lue par `settings.py`) ;
- une dépendance de `requirements.txt` ou une version d'image Docker change ;
- **un point de contrôle qualité est ajouté ou retiré** (test, linter, hook, étape CI) →
  [verification.md](workflows/verification.md).

**Naming** — `kebab-case.md` nominal (`development.md`, `verification.md`). Une migration
ponctuelle porte le nom de sa cible et **est supprimée quand elle est terminée** — l'historique
git suffit ensuite.

**Format** :

```markdown
# <Workflow>

**Quand** — <dans quelle situation on suit cette procédure.>

## Prérequis

## Étapes

<Numérotées, avec les commandes exactes.>

## Pièges

<Ce qui échoue silencieusement, et comment le détecter.>
```

## domain/

**Purpose** — le vocabulaire métier de référence et, surtout, **la frontière entre ce que le
serveur garantit et ce que seule l'UI impose**. C'est la question à laquelle le code ne répond
pas d'un coup d'œil, et celle dont dépend toute décision de confiance.

> **Partage avec le front** : `frontend/docs/domain/` décrit les règles que **l'UI** ajoute.
> Ici, on décrit ce que **le serveur** refuse. Les deux fichiers homonymes sont complémentaires,
> pas redondants : ne pas recopier l'un dans l'autre, les lier.

**When to update** :

- une entité, un champ ou une valeur d'énumération est ajouté, renommé ou supprimé ;
- une relation change (cardinalité, `null`, `on_delete`, contrainte d'unicité) ;
- **une validation est ajoutée ou retirée d'un sérialiseur** : c'est exactement ce que ces
  fichiers recensent ;
- une règle passe de « imposée par l'UI seulement » à « refusée par le serveur » — dans ce cas
  on met à jour **les deux** docs.

**Naming** — `glossary.md` pour les entités ; sinon le sous-domaine (`daily-rules.md`,
`events.md`).

**Format** :

```markdown
# <Domaine>

## Entités / énumérations

<Tables.>

## Ce que le serveur refuse

<Table : règle → où elle est appliquée (fichier:ligne) → message d'erreur.>

## Ce que le serveur accepte alors qu'on pourrait croire l'inverse

<⚠️ Le plus précieux du dossier : les trous de garantie.>

## Voir aussi
```

## adr/

**Purpose** — pourquoi une décision structurante a été prise, et ce qui a été écarté.

**When to create** — quand un choix contraint durablement le code et qu'un nouveau venu
pourrait légitimement le « corriger » : mécanisme d'authentification, périmètre d'une couche,
convention de sérialisation, renoncement assumé. **Pas** pour un choix local ou réversible.

**When to update** — un ADR n'est pas réécrit. On ajoute un ADR qui le supersede et on
renseigne le champ `Statut` de l'ancien.

**Naming** — `NNNN-titre-en-kebab-case.md`, numérotation continue.

**Format** :

```markdown
# NNNN — <Titre>

- **Statut** : accepté | superseded par [NNNN](NNNN-....md) | déprécié
- **Date** : YYYY-MM (ou « inconnue — inféré de <commit> »)

## Contexte

## Décision

## Alternatives écartées

<Et la raison du rejet.>
## Conséquences
<Y compris les négatives.>
## Preuve
<Commits, fichiers:lignes, ou « rationale inféré » si le pourquoi n'est pas tracé.>
```

> **Honnêteté requise** : le backend n'a **aucune trace écrite** de ses arbitrages (pas d'ADR
> historique, messages de commit courts). Quand le _pourquoi_ n'est pas établi, écrire
> « rationale inféré » plutôt que d'inventer une justification.

## quality/

**Purpose** — registre **évaluatif**, séparé du reste de `docs/` **délibérément** :

- le reste de `docs/` décrit l'**état sanctionné** du système — ce qu'on doit imiter ;
- `quality/` décrit ce qui est **cassé, fragile ou risqué** — ce qu'on ne doit **pas** imiter.

Un lecteur (humain ou IA) qui travaille depuis `patterns/` ne doit jamais prendre une faiblesse
signalée pour un modèle. C'est la raison de la séparation en sous-arbre.

Deux natures d'entrées, **jamais mélangées dans le même fichier** :

| Fichier                                                          | Nature                      | Contenu                                                   |
| ---------------------------------------------------------------- | --------------------------- | --------------------------------------------------------- |
| [quality/refactoring-backlog.md](quality/refactoring-backlog.md) | **Intention d'agir**        | Priorité + raison de la priorité                          |
| [quality/watched-risks.md](quality/watched-risks.md)             | **Aucune intention d'agir** | Veille assumée + **condition de déclenchement** explicite |

**When to update** :

- une faiblesse, un contrat implicite ou une règle non outillée est découvert → l'inscrire ;
- une condition de déclenchement est atteinte → déplacer l'item vers le backlog ;
- un item est **résolu** → **supprimer sa ligne et sa section**. Ne pas le marquer « Fait » :
  l'historique git est déjà le registre de ce qui a été corrigé. Ce registre ne suit que
  l'ouvert.

**Format** — un tableau d'index en tête, puis une section par item :

```markdown
## <ID> — <Titre>

- **Origine** : <fichier:ligne, ou comment ça a été trouvé>
- **Contexte** : <le fait technique, vérifiable>
- **Décision** : <agir / ne pas agir, et pourquoi c'est raisonnable aujourd'hui>
- **Déclencheur** : <risques surveillés uniquement — mesurable : volume, taille, durée>
- **Sévérité** : <sécurité uniquement — + référence CWE/CVE si pertinent>
```

Les déclencheurs de performance s'expriment en termes **mesurables** (volume, taille, durée),
jamais « plus tard ».

## features/ — absent (délibéré)

**Pourquoi il n'existe pas** : côté backend, la capacité utilisateur **est** l'endpoint. Une
fiche par feature dupliquerait la table de
[architecture/api-surface.md](architecture/api-surface.md) et les règles de
[domain/](domain/), et dériverait dès le premier renommage de route.

**Déclencheur de création** — créer `features/<nom>.md` quand une capacité remplit **au moins
une** condition :

- elle enchaîne ≥ 3 endpoints dans un ordre imposé avec un état persisté entre eux ;
- elle a un cycle de vie que ni le modèle ni la table des endpoints ne rendent lisible ;
- elle sort du périmètre HTTP (tâche planifiée, webhook, consommation de file).

**Format attendu** :

```markdown
# <Feature>

**Capacité** — <ce que l'utilisateur peut faire, en une phrase.>
**Endpoints** — <la séquence, dans l'ordre>
**Fichiers** — <points d'entrée>

## Parcours

<Les états et les transitions. C'est la raison d'être de la fiche.>

## Règles d'accès

## Hors périmètre
```

**Candidat unique aujourd'hui** : `account-lifecycle.md` — inscription → e-mail d'activation →
activation → (renvoi d'e-mail) → réinitialisation de mot de passe → changement d'e-mail en deux
temps → suppression de compte. Ce parcours traverse 9 endpoints, 2 modèles et 4 templates
d'e-mail, avec des jetons de deux natures différentes. Il est aujourd'hui décrit dans
[architecture/auth.md](architecture/auth.md) ; si cette fiche dépasse sa limite de taille,
c'est ce parcours qu'il faut en extraire.

---

## Ce qu'on ne documente **pas** ici

| Sujet                                                      | Où ça vit                                                                                                                               |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Le client web, ses stores, ses composants                  | [`../../frontend/docs/`](../../frontend/docs/)                                                                                          |
| Idiomes Django / DRF standard                              | Documentation officielle                                                                                                                |
| Ce que le code exprime déjà clairement                     | Le code. Ne pas paraphraser un `class Meta`                                                                                             |
| Le schéma SQL détaillé                                     | Les migrations `tout_doux/migrations/`, qui font foi                                                                                    |
| Historique des corrections                                 | `git log`. Un item résolu de `quality/` est **supprimé**, pas archivé                                                                   |
| Déploiement, secrets, serveur                              | `.conf/`, `docker-compose.prod.yml`, `.github/workflows/` — résumés seulement dans [workflows/development.md](workflows/development.md) |
| Règles à charger en contexte immédiat pour générer du code | [`../CLAUDE.md`](../CLAUDE.md), qui **pointe** vers ici sans dupliquer                                                                  |
