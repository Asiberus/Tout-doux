# Documentation de référence — frontend Tout-Doux

Documentation **vivante** du client web. Lue par des développeurs humains **et** par des
assistants IA : elle doit permettre d'implémenter ou d'étendre une fonctionnalité sans relire
tout le code.

> **Une doc obsolète est pire que pas de doc.** Chaque type de fichier ci-dessous a un
> **déclencheur de mise à jour** explicite. Si ton changement correspond à un déclencheur, la
> doc se met à jour **dans le même commit**.

## Périmètre

**Couvert** : tout `frontend/` (SPA Vue 3 + Vuetify 4 + Pinia + Vue Router, ~13 500 lignes,
86 SFC / 70 modules TS).

**Référencé, non documenté** : le monorepo parent — `backend/` (Django), `.conf/*/frontend/`
(Dockerfiles + injection de config), `docker-compose*.yml`, `.github/workflows/`. Ces éléments
ne sont cités que lorsqu'ils déterminent le comportement du front (voir
[workflows/development.md](workflows/development.md)).

**Propriété d'autrui** : le contrat d'API est défini côté Django. Il n'existe **aucune
génération de types** ; `openapi.yaml` à la racine du monorepo est un stub de 13 lignes,
non maintenu et non utilisé. Voir [adr/0003-hand-written-api-models.md](adr/0003-hand-written-api-models.md).

## Index

| Dossier / fichier | Purpose |
|---|---|
| [architecture/](architecture/) | Une fiche par couche : responsabilité, briques, dépendances, contraintes non évidentes |
| [patterns/](patterns/) | Comment on résout les problèmes techniques **récurrents de ce projet** |
| [workflows/](workflows/) | Procédures pas-à-pas de dev et de vérification |
| [domain/](domain/) | Langage métier : vocabulaire de référence et règles implicites |
| [adr/](adr/) | Décisions structurantes et leur pourquoi |
| [quality/](quality/) | Registre **évaluatif** : ce qui est cassé, risqué, ou à refactorer |
| [features/](features/) | **Non peuplé** — voir la section dédiée ci-dessous |

Point d'entrée conseillé : [architecture/overview.md](architecture/overview.md).

---

## architecture/

**Purpose** — répond à « de quoi cette couche est-elle responsable, de quoi dépend-elle, et
qu'est-ce qui n'est pas déductible du code ? ». Une fiche par couche structurante, pas par
dossier.

**When to create / update** :
- une couche change de responsabilité ou de surface publique ;
- une **dépendance entre couches** est ajoutée ou supprimée (ex. un store se met à appeler une
  nouvelle API, une couche importe une couche qu'elle n'importait pas) ;
- un store, un guard, un intercepteur ou un layout est ajouté ou supprimé ;
- une contrainte non évidente est découverte (ordre d'initialisation, cycle d'import, effet de
  bord).

**Ne pas** mettre à jour pour l'ajout d'un endpoint, d'une route ou d'un composant qui suit un
pattern déjà documenté — sauf si la table concernée est explicitement marquée « maintenue à la
main ».

**Naming** — `kebab-case.md`, nommé d'après la couche (`api-layer.md`, `state.md`), pas d'après
le dossier source.

**Format** :

```markdown
# <Couche>

<1-3 phrases : responsabilité, et la frontière avec les couches voisines.>

## Chaîne / briques
<Fichiers clés avec chemins. Le flux, pas l'exhaustivité.>

## Règles
<Ce qu'on doit respecter. Marquer OUTILLÉ ou DISCIPLINE pour chacune.>

## Contraintes non évidentes
<Ordre d'init, cycles, pièges. Ce qui ne se lit pas dans le code.>

## Décisions négatives
<Ce qui a été volontairement écarté, et pourquoi. Sinon quelqu'un le « corrigera ».>

## Voir aussi
<Liens relatifs.>
```

> **Critère de taille** : le lecteur doit comprendre la couche en **moins de cinq minutes**. La
> densité compte plus que la longueur — une table de référence (routes, tokens) ne ralentit pas la
> lecture, un paragraphe explicatif oui.
>
> Les fiches actuelles font 80 à 130 lignes, dont une part importante de tables. Ce qui les fait
> dépasser une page, c'est la section « contraintes non évidentes » — et c'est précisément leur
> valeur. **Indicateur de découpage** : si la prose (hors tables et blocs de code) dépasse ~90
> lignes, ou si la fiche couvre deux couches qui évoluent séparément, la scinder.

## patterns/

**Purpose** — la recette à suivre pour un problème qui revient **dans ce projet**. Jamais un
idiome standard de Vue ou Vuetify : si la doc officielle le dit déjà, on ne le recopie pas.

**When to create / update** :
- **créer** quand la même solution technique apparaît pour la 3ᵉ fois dans le code ;
- **mettre à jour** quand on ajoute un cas d'usage qui ne rentre pas dans la recette, ou quand
  une variante devient la norme ;
- **mettre à jour** quand on introduit une nouvelle façon de faire à côté d'une existante : le
  fichier doit alors dire laquelle choisir, ou nommer celle qui est du legacy non migré.

**Naming** — `kebab-case.md` décrivant l'action ou l'objet (`adding-an-endpoint.md`,
`dialogs.md`), pas la techno.

**Format** :

```markdown
# <Pattern>

**Problème** — <ce que ça résout, en une phrase.>

## Recette
<Étapes numérotées, avec un exemple réel du dépôt et son chemin.>

## Variantes légitimes
<Si plusieurs approches coexistent : le critère de choix pour un nouveau cas.>

## Écarts assumés / non migrés
<Les endroits qui ne suivent pas, en les nommant. Dette ou décision ?>

## Voir aussi
```

## workflows/

**Purpose** — procédures exécutables : installer, lancer, vérifier, migrer.

**When to update** :
- un script de `package.json` est ajouté, renommé ou supprimé ;
- la façon de lancer/configurer l'app change (port, Docker, injection de config) ;
- un point de contrôle qualité est ajouté ou retiré (hook, CI, script) ;
- une version d'outil épinglée change (Node/Yarn via Volta, Vite, TypeScript).

**Naming** — `kebab-case.md` à l'infinitif ou nominal (`development.md`, `verification.md`).
Une migration ponctuelle porte le nom de sa cible (`vuetify-4-migration.md`) et **est supprimée
quand elle est terminée** — l'historique git suffit ensuite.

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

**Purpose** — le vocabulaire métier de référence et les règles qui ne sont **pas** exprimées par
les types. Sert à éviter la dérive de nommage et les régressions sur des invariants implicites.

**When to update** :
- une entité, un champ ou une valeur d'énumération métier est ajouté, renommé ou supprimé ;
- une relation entre entités change (cardinalité, optionnalité) ;
- une règle métier est ajoutée, ou passe d'« implicite en UI » à « garantie par le type / le
  backend » — dans ce cas on **retire** la mention d'implicite.

**Naming** — `glossary.md` pour les entités ; sinon le sous-domaine (`daily-rules.md`,
`events.md`).

**Format** :

```markdown
# <Domaine>

## Entités / règles
<Tables pour les entités et les énumérations.>

## Distinctions à ne pas confondre
<Les concepts voisins et ce qui les sépare vraiment.>

## Règles appliquées par l'UI seulement
<⚠️ Ce qui casse si on contourne le composant. Le plus précieux du dossier.>

## Voir aussi
```

## adr/

**Purpose** — pourquoi une décision structurante a été prise, et ce qui a été écarté.

**When to create** — quand un choix contraint durablement le code et qu'un nouveau venu
pourrait légitimement le « corriger » : mécanisme de configuration, périmètre d'une couche,
dépendance structurante, renoncement assumé. **Pas** pour un choix local ou réversible.

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

> **Honnêteté requise** : si le *pourquoi* n'est pas documenté dans l'historique, écrire
> « rationale inféré » plutôt que d'inventer une justification.

## quality/

**Purpose** — registre **évaluatif**, séparé du reste de `docs/` **délibérément** :

- le reste de `docs/` décrit l'**état sanctionné** du système — ce qu'on doit imiter ;
- `quality/` décrit ce qui est **cassé, fragile ou risqué** — ce qu'on ne doit **pas** imiter.

Un lecteur (humain ou IA) qui travaille depuis `patterns/` ne doit jamais prendre une faiblesse
signalée pour un modèle. C'est la raison de la séparation en sous-arbre.

Deux natures d'entrées, **jamais mélangées dans le même fichier** :

| Fichier | Nature | Contenu |
|---|---|---|
| [quality/refactoring-backlog.md](quality/refactoring-backlog.md) | **Intention d'agir** | Priorité + raison de la priorité |
| [quality/watched-risks.md](quality/watched-risks.md) | **Aucune intention d'agir** | Veille assumée + **condition de déclenchement** explicite |

**When to update** :
- une faiblesse, un contrat implicite ou une règle non outillée est découvert → l'inscrire ;
- une condition de déclenchement d'un risque surveillé est atteinte → déplacer l'item vers le
  backlog ;
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

## features/ — non peuplé (délibéré)

**Pourquoi vide** : les 9 features de `src/views/` (les 10 dossiers moins `components/`, qui n'en
est pas une) ont une capacité utilisateur directement lisible
dans la table des routes ([architecture/routing.md](architecture/routing.md)) et dans les noms
de vues. Neuf fiches dupliqueraient cette table et dériveraient à la première refonte de
routes. La seule feature à mécanique réellement non évidente — le « daily » — est couverte par
[domain/daily-rules.md](domain/daily-rules.md).

**Déclencheur de création** — créer `features/<nom>.md` quand une feature remplit **au moins
une** condition :
- son parcours utilisateur ne se déduit **pas** de la route + du glossaire (états multiples,
  wizard, machine à états) ;
- elle coordonne ≥ 3 zones de `src/views/` ;
- elle a des règles d'accès ou de visibilité propres, au-delà des guards existants.

**Format attendu** :

```markdown
# <Feature>

**Capacité** — <ce que l'utilisateur peut faire, en une phrase.>
**Routes** — <noms de routes + chemins>
**Fichiers** — <points d'entrée>

## Parcours
<Les états et les transitions. C'est la raison d'être de la fiche.>

## Règles d'accès
## Hors périmètre
<Ce que la feature ne fait délibérément pas.>
```

**Candidats à écrire plus tard** : `daily.md` (parcours summary ↔ detail ↔ wizard, aujourd'hui
éclaté entre `domain/daily-rules.md` et `architecture/routing.md`) ;
`account-lifecycle.md` (inscription → activation par e-mail → reset de mot de passe →
changement d'e-mail → suppression de compte, qui traverse `non-auth/` et `profile/` avec des
liens e-mail hors application).

---

## Ce qu'on ne documente **pas** ici

| Sujet | Où ça vit |
|---|---|
| Contrat d'API, schémas de réponse | Côté backend Django (hors de ce dépôt). Le front en tient une copie **manuelle** dans `src/models/` |
| Idiomes Vue / Vuetify / Pinia standard | Documentation officielle des libs |
| Ce que le code exprime déjà clairement | Le code. Ne pas paraphraser une signature de fonction |
| Historique des corrections | `git log`. Un item résolu de `quality/` est **supprimé**, pas archivé |
| Infra, déploiement, backend | Monorepo parent (`.conf/`, `docker-compose*.yml`, `backend/`) |
| Règles à charger en contexte immédiat pour générer du code | [`../CLAUDE.md`](../CLAUDE.md), qui **pointe** vers ici sans dupliquer |
