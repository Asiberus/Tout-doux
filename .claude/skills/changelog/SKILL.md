---
name: changelog
description: Use when the user asks for a changelog or release notes from git history — "fais-moi un changelog", "quoi de neuf depuis la v0.5.0", "ce qui part en prod". Produces an English, user-facing changelog from a commit range, verified against the real diff.
---

# Changelog fonctionnel

Produit un changelog destiné aux **utilisateurs de l'application**, en anglais, à partir
d'une plage de commits. Tout ce qui n'est pas observable depuis l'interface est écarté.

## Procédure

### 1. Résoudre la plage

Argument fourni → l'utiliser tel quel. Sinon `git describe --tags --abbrev=0` → `HEAD`.
Dépôt sans tag → `master...HEAD`. Annoncer la plage retenue avant d'aller plus loin.

Au-delà d'une quarantaine de commits, prévenir et proposer de restreindre la plage
avant de lire les diffs.

### 2. Inventorier

`git log --oneline <plage>` puis `git diff --stat <base>...<tête>`.

### 3. Trier sur les fichiers touchés, jamais sur le préfixe du commit

Un `chore:` peut contenir un changement visible, un `feat:` peut être 90 % de plomberie.

Ne sont pas candidats les commits dont le diff ne touche que : tests, `docs/`, `*.md`,
CI, `.conf/`, `.gitattributes`, dépendances, configuration de build.

### 4. Vérifier dans le diff

Pour chaque candidat, lire le diff applicatif réel et formuler l'effet constatable par
l'utilisateur. Si le diff ne révèle aucun effet observable, écarter le changement.

### 5. Regrouper

Plusieurs commits composant une même fonctionnalité donnent une ligne. Un correctif
portant sur une fonctionnalité de la même plage est absorbé par elle.

### 6. Rédiger

Sections fixes, dans cet ordre, les vides omises :

`New features`, `Fixes`, `Performance`.

`New features` se découpe en sous-sections, dans cet ordre, les vides omises :
`Project`, `Collection`, `Agenda`, `Daily`, `Settings`, `User`, `Others`.

`Others` recueille ce qui ne relève d'aucun des six domaines. Si `Others` est la seule
sous-section produite, la supprimer et placer ses lignes directement sous `New features`.

Un changement couvrant plusieurs domaines à la fois ne va pas dans `Others` : il se place
directement sous `New features`, avant les sous-sections.

Un seul domaine concerné en tout → aucune sous-section.

Les autres sections ne sont jamais découpées.

### 7. Restituer

Afficher le markdown en chat, puis le copier avec `pbcopy`.

Donner ensuite le titre de la release dans un texte à part, hors du markdown copié :
quelques mots en anglais sur le thème dominant de la plage, sans numéro de version ni
préfixe. Mêmes règles de rédaction que le reste — formel, concis, aucun terme technique,
pas d'énumération. Sans thème dominant, nommer les deux ou trois domaines touchés.

Les incertitudes restantes se disent en chat, sous le changelog — jamais dedans.

## Règles de rédaction

Texte en **anglais**. Une ligne par changement, formelle et concise.

Interdits :

- chemins de fichier, noms de classe ou de composant, hash, branche, numéro de ticket
- magnitudes de performance non mesurées (« much faster », « 2× quicker ») ; la
  direction seule est admise
- tout détail d'implémentation : gestion d'erreur, codes HTTP, migrations, requêtes,
  noms de tables, bibliothèques
- toute section « actions requises », « sous le capot », « technique » ou équivalente

Attendus :

- ce que l'utilisateur peut faire, voir, ou ne subit plus
- les valeurs qui le concernent directement — une limite portée à 150 caractères se
  dit, la migration qui l'applique ne se dit pas

## Exemple

    ## New features

    - Task, daily task and common task titles accept up to 150 characters.

    ### Project
    - Project description is now optional.

    ### Collection
    - Collection description is now optional.

    ### Daily
    - Tasks can be added to today's daily from the task card.

    ## Fixes

    - Agenda weeks start on Monday.
    - Events keep their order within a day.

    ## Performance

    - Faster loading of the project, collection, agenda and daily screens.

Titre donné à part : `Daily planning and performance`
