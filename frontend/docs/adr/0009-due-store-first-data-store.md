# 0009 — Un store pour le résumé des échéances, première brique d'un état applicatif

- **Statut** : accepté — étend [0002](0002-pinia-stores-scope.md)
- **Date** : 2026-10

## Contexte

Le menu, l'en-tête, la page Daily Summary et les listes de projets et de collections doivent
dire, sur toutes les pages, s'il reste des tâches en retard ou dues aujourd'hui. La donnée est
lue par plusieurs composants sans lien de parenté, et changée par des actions dispersées :
planifier une tâche, la terminer, changer son échéance. Le périmètre de [0002](0002-pinia-stores-scope.md)
ne couvre pas ce cas : ce n'est ni un agrégat de page détail, ni un singleton chargé au démarrage.

## Décision

Un store `due` (`src/store/due.store.ts`), en style options comme les autres, porte le résumé
renvoyé par `GET task/due-summary/` et sa fraîcheur. C'est la première donnée applicative tenue
par un store : on prévoit d'y faire passer progressivement les données de l'application.

- `refresh({ force })` partage la requête en cours, ne relance pas une donnée de moins d'une
  minute sauf si on la force, et relance toujours au changement de jour.
- `AuthenticatedLayout` le rafraîchit au chargement, au changement de jour (`useToday`) et au
  retour sur l'onglet du navigateur.
- Chaque mutation qui change le compte le force : création, modification et suppression de
  tâches (stores projet et collection, daily update), création, modification, suppression et
  report de daily tasks.
- `app.exit()` le vide à la déconnexion.

## Alternatives écartées

- **Composable à état de module** (sur le modèle de `useToday`) — écarté : la direction voulue
  est de gérer les données par les stores, et un composable aurait été à migrer ensuite.
- **Recalcul côté client depuis le détail des projets et collections** — c'est ce que fait
  l'onglet Due du daily update ; trop lourd pour une pastille présente sur toutes les pages.
- **Rafraîchir à chaque navigation** — écarté : un appel par changement de page pour une donnée
  qui ne change qu'avec une mutation ou un changement de jour.

## Conséquences

- ✅ Une dizaine d'appels par session : chargement, mutations, changement de jour, retours sur
  l'onglet espacés d'au moins une minute.
- ⚠️ Les mutations hors de la liste ci-dessus (archiver un projet, une collection) ne
  rafraîchissent pas : la pastille se corrige au prochain retour sur l'onglet ou changement de
  jour.
- ⚠️ Chaque nouveau site de mutation doit penser à appeler `refresh({ force: true })` : rien ne
  le vérifie.

## Preuve

`src/store/due.store.ts`, `src/store/due.store.spec.ts`, `src/layout/AuthenticatedLayout.vue`,
`backend/tout_doux/queries.py` (`task_due_summary`).
