# Déploiement continu

Comment une modification du code arrive en production sans intervention manuelle, et surtout
**dans quels cas elle n'y arrive pas**.

Ce document part de zéro : il explique le vocabulaire au passage. Il décrit le système tel qu'il
est, pas tel qu'on aimerait qu'il soit — la dernière section liste ce qui manque encore.

## Le vocabulaire minimum

| Terme                 | Ce que c'est ici                                                                                                               |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Image Docker**      | Un paquet figé contenant l'application prête à tourner. Deux par version : une pour le front (nginx), une pour l'API (Django)  |
| **Registre**          | L'entrepôt où sont rangées les images. Ici **GHCR**, le registre de GitHub. Les images sont privées                            |
| **Tag d'image**       | L'étiquette qui désigne une image dans le registre : `0.8.0` désigne une version précise, `latest` désigne « la plus récente » |
| **Tag git**           | Un marque-page posé sur un commit, par exemple `v0.8.0`. Sans rapport avec le tag d'image, même s'ils portent le même numéro   |
| **GitHub Actions**    | Les serveurs de GitHub qui exécutent automatiquement des tâches — ici, construire et publier les images                        |
| **cron**              | Le programme du serveur qui exécute une commande à intervalle régulier. Ici toutes les 10 minutes                              |
| **Sonde de vitalité** | Une commande que Docker relance périodiquement pour savoir si un conteneur est vivant (`healthy`) ou mort (`unhealthy`)        |

## Le cycle, en six temps

| #   | Qui         | Ce qui se passe                                                                                             |
| --- | ----------- | ----------------------------------------------------------------------------------------------------------- |
| 1   | **Vous**    | Vous développez sur `develop`, comme d'habitude                                                             |
| 2   | **Vous**    | Vous ouvrez une PR `develop` → `master` intitulée `Release v0.8.0 - Titre`. La description est le changelog |
| 3   | **Vous**    | Vous fusionnez la PR. **C'est le seul point de décision** : rien ne part avant                              |
| 4   | **GitHub**  | Le titre est validé, les deux images sont construites et publiées sur GHCR sous `0.8.0` **et** `latest`     |
| 5   | **GitHub**  | Le tag `v0.8.0` et la Release GitHub sont créés — seulement si le build a réussi                            |
| 6   | **Serveur** | Dans les 10 minutes, le cron détecte la nouvelle version, sauvegarde la base, puis déploie                  |
| 7   | **Vous**    | Vous reportez `master` sur `develop` (`git merge master`) pour la suite                                     |

Le numéro de version n'est écrit nulle part dans le code : **c'est vous qui le décidez, dans le
titre de la PR.** Voir [ADR 0006](../frontend/docs/adr/0006-version-from-git-tag.md).

## Côté GitHub — de la fusion à l'image publiée

Deux fichiers pilotent cette moitié : `.github/workflows/release.yml` et
`.github/workflows/build-images.yml`.

### `release.yml`, trois étapes enchaînées

**1. `parse` — lire et valider le titre.** Le workflow ne se déclenche que si la PR est
**fusionnée** (pas seulement fermée), vers `master`, et que son titre commence par `Release`. Le
titre doit alors correspondre exactement à `Release vX.Y.Z` suivi éventuellement d'un tiret et
d'un intitulé. Un titre mal formé fait échouer le workflow avec un message explicite plutôt que
de créer un tag vide. Un numéro de version déjà utilisé est refusé.

**2. `build` — construire les images.** Cette étape appelle `build-images.yml` en lui passant le
commit de fusion et le numéro de version.

**3. `release` — poser le tag et publier la Release.** Elle ne s'exécute **que si le build a
réussi**. C'est volontaire : si la construction échoue, aucun tag n'est créé et aucune Release
n'est annoncée. Vous corrigez et rouvrez une PR, sans avoir laissé derrière vous une version
fantôme qui ne correspond à aucune image.

### `build-images.yml`, et la règle du tag `latest`

Ce workflow construit les deux images et les pousse sur GHCR. Il peut être déclenché de deux
façons, qui **ne se comportent pas pareil** :

| Déclenchement                     | Tags publiés            | Pourquoi                                                                        |
| --------------------------------- | ----------------------- | ------------------------------------------------------------------------------- |
| Automatique, depuis `release.yml` | `X.Y.Z` **et** `latest` | C'est une vraie release, elle doit devenir la version courante                  |
| Manuel (bouton _Run workflow_)    | `X.Y.Z` seulement       | Reconstruire une vieille version ne doit **jamais** faire reculer la production |

Cette distinction est essentielle. Le serveur surveille le tag `latest` : si un lancement manuel
sur une vieille version le déplaçait, le serveur « mettrait à jour » la production **vers
l'arrière**, silencieusement.

Chaque image reçoit aussi une **étiquette** `org.opencontainers.image.version` contenant son
numéro de version. C'est elle que le serveur lit pour savoir ce que `latest` désigne, sans avoir
à interroger l'API de GitHub.

## Où vit le numéro de version

Deux affirmations différentes, deux supports différents. Les confondre est la source d'erreurs la
plus courante.

| Affirmation                           | Support                                                          | Écrit par                       |
| ------------------------------------- | ---------------------------------------------------------------- | ------------------------------- |
| « cette image **est** la 0.8.0 »      | L'étiquette OCI et la balise `<meta>`, gravées à la construction | La CI, depuis le titre de la PR |
| « c'est la 0.8.0 qui tourne **ici** » | La ligne `VERSION=` du `conf.env` du serveur                     | `td.sh autoupdate`              |

La première ne peut pas mentir : elle voyage avec l'image. La seconde est un simple pointeur —
c'est elle qui décide quelle image `docker compose` doit démarrer.

Les fichiers du dépôt (`package.json`, `index.html`) ne portent plus de version : ils contiennent
des valeurs neutres, volontairement. Ne les « corrigez » pas.

## Côté serveur — `td.sh autoupdate prod`

Le cron exécute cette commande toutes les 10 minutes :

```
*/10 * * * * cd /web/Tout-doux && flock -n /tmp/td-autoupdate.lock ./td.sh autoupdate prod >> ~/logs/td-autoupdate.log 2>&1
```

- `cd` — `td.sh` manipule des chemins relatifs à la racine du dépôt.
- `flock -n` — prend un verrou exclusif et **abandonne immédiatement** si un déploiement précédent
  est encore en cours. Sans lui, un déploiement lent (la sauvegarde peut durer) se ferait doubler
  par l'exécution suivante.
- `>> … 2>&1` — ajoute la sortie et les erreurs au journal.

### Les gardes, dans l'ordre d'exécution

C'est le cœur du système. `autoupdate` traverse une série de contrôles ; **le premier qui échoue
arrête tout**.

| #   | Contrôle                                          | Si le contrôle ne passe pas                                     | Déploie ? | Bruit             |
| --- | ------------------------------------------------- | --------------------------------------------------------------- | --------- | ----------------- |
| 0   | Le verrou `flock` est libre                       | La tâche s'arrête, un déploiement est déjà en cours             | **Non**   | Silence           |
| 1   | `PINNED=false` dans `conf.env`                    | Les mises à jour sont gelées volontairement (après un rollback) | **Non**   | Silence           |
| 2   | Lecture de l'étiquette de `latest`                | Étiquette absente → erreur, l'image est mal construite          | **Non**   | `ERROR`, sortie 1 |
| 3   | La version publiée diffère de la version déployée | Rien de neuf à installer                                        | **Non**   | Silence           |
| 4   | `BACKUP_SCRIPT` est renseigné                     | Refus de déployer sans savoir comment sauvegarder               | **Non**   | `ERROR`, sortie 1 |
| 5   | **La sauvegarde réussit**                         | Refus de déployer sur une sauvegarde qui n'existe pas           | **Non**   | `ERROR`, sortie 1 |
| —   | Tous les contrôles passent                        | Épinglage de la version, récupération des images, redémarrage   | **Oui**   | Journal complet   |

Les trois « Silence » sont volontaires : sans eux, le journal recevrait des lignes toutes les dix
minutes sans qu'il ne se passe rien, et plus personne ne le lirait.

Lancé **à la main** dans un terminal, `autoupdate` devient au contraire bavard et affiche chaque
étape. Lancé par cron, il ne dit rien tant qu'il n'y a rien à déployer. La distinction se fait
sur la présence d'un terminal.

### La sauvegarde, garde principale

Le point le plus important : **les migrations de base de données tournent au démarrage du
conteneur backend.** Une migration ne se défait pas facilement. Donc rien ne doit être déployé
sans sauvegarde valide juste avant.

Le script de sauvegarde ne se contente pas de produire un fichier :

- il vérifie que le conteneur tourne ;
- il écrit dans un fichier temporaire puis le renomme — une redirection classique `> fichier`
  viderait la cible **avant** que la commande ne s'exécute, et un échec écraserait la sauvegarde
  précédente par un fichier vide ;
- il vérifie que le résultat est un JSON valide **et** qu'il contient au moins un objet ;
- il ne supprime les sauvegardes anciennes **qu'après** avoir validé la nouvelle.

S'il échoue, il sort en code 1, et `autoupdate` s'arrête là. Les conteneurs ne sont pas recréés,
`VERSION=` n'est pas modifiée, et la production continue de tourner sur l'ancienne version.

### Ce que fait un déploiement réussi

1. Journalise la version détectée ;
2. lance la sauvegarde et attend qu'elle se termine ;
3. écrit `VERSION=<nouvelle>` dans `conf.env` ;
4. récupère les images correspondantes depuis GHCR ;
5. recrée les conteneurs (`docker compose up -d`) ;
6. supprime les images devenues inutiles, **en se limitant à celles de Tout-Doux** — le serveur
   héberge d'autres services ;
7. journalise la fin.

Les conteneurs démarrent en cascade : la base doit être `healthy` avant l'API, l'API avant nginx.
Chacune de ces étapes est vérifiée par une sonde de vitalité.

## Le retour arrière

```bash
./td.sh rollback prod 0.7.0
```

La commande épingle la version demandée **et** pose `PINNED=true`, ce qui gèle les mises à jour
automatiques. Sans ce gel, le cron constaterait dans les dix minutes que `latest` désigne une
version différente de celle déployée et réinstallerait exactement celle dont vous venez de sortir.

Pour reprendre les mises à jour : remettre `PINNED=false` dans `conf.env`.

## Publier une release, pas à pas

1. Reportez `master` sur `develop` s'il a pris de l'avance : `git checkout develop && git merge master`
2. Développez, commitez, poussez sur `develop`
3. Ouvrez une PR `develop` → `master`
4. Titre : `Release v0.8.0 - Un intitulé court`. Le format est strict — `v`, trois nombres
   séparés par des points
5. Description : le changelog. Il devient tel quel les notes de la Release GitHub
6. Fusionnez
7. Surveillez l'onglet _Actions_ : si le build échoue, aucun tag n'est créé
8. Dans les dix minutes, la production se met à jour seule. Le journal du serveur en garde la trace

## Améliorations possibles

Par ordre d'importance. Rien de tout cela n'est fait aujourd'hui.

### 1. `autoupdate` ne vérifie pas que le déploiement a réussi

C'est le manque le plus sérieux. `docker compose up -d` n'est pas testé : s'il échoue, le script
journalise quand même `deployed X.Y.Z` — et comme `VERSION=` a déjà été réécrite juste avant, le
passage suivant du cron conclura qu'il n'y a rien à faire. Un déploiement raté serait donc
enregistré comme un succès et ne serait jamais retenté.

Correctif : tester le code de sortie de `up -d`, et n'écrire `VERSION=` qu'après une réussite
confirmée.

### 2. Une panne réseau ressemble à « rien de neuf »

`docker pull latest` n'est pas testé non plus. Si le registre est injoignable ou le jeton expiré,
le script continue avec l'image `latest` déjà présente localement, dont l'étiquette correspond à
la version déjà déployée — donc sortie silencieuse. Les déploiements s'arrêteraient sans que rien
ne le signale.

Même remarque pour `git pull --ff-only` : s'il échoue, le déploiement continue avec un fichier
`docker-compose.prod.yml` périmé.

### 3. Aucune notification

Le journal n'est lu par personne. Un simple appel HTTP en fin d'`autoupdate`, en succès comme en
échec, suffirait à savoir que la production a changé — ou qu'elle n'a pas pu changer.

### 4. La sauvegarde est un export de données, pas une sauvegarde de base

`manage.py backupdb` produit des _fixtures_ Django. Les recharger suppose une base vide **au même
état de migration**. Or ce fichier sert de filet juste avant des migrations : si l'une d'elles
abîme les données, l'export d'avant ne se recharge pas dans le schéma d'après sans reconstruire
la base à la main. Un `pg_dump` restaurerait schéma et données en une commande.

Voir la section « Points ouverts » d'[ANALYSE-INFRA.md](ANALYSE-INFRA.md).

### 5. Rien ne vérifie le code avant de le publier

Aucun test, aucun contrôle de types n'est exécuté avant la construction des images. `yarn build`
ne vérifie aucun type. Ajouter `yarn type-check` comme étape bloquante du job `build` est le gain
de fiabilité le moins cher disponible, et il tombe au bon endroit puisque le build précède la
création du tag.

### 6. Aucun contrôle de cohérence des versions

Le workflow refuse un numéro de version déjà utilisé, mais rien n'empêche de publier `0.8.0`
après `0.9.0`. Une comparaison sémantique dans l'étape `parse` le corrigerait.

### 7. Aucune vérification après déploiement

Une fois les conteneurs redémarrés, rien ne confirme que l'application répond réellement. Les
sondes vérifient qu'un port est ouvert, pas que le site fonctionne. Un appel HTTP à la page
d'accueil comparant la version affichée à la version attendue, avec retour arrière automatique en
cas d'échec, fermerait la boucle.

### 8. Le cron interroge au lieu d'être prévenu

Le délai entre la publication et le déploiement peut atteindre dix minutes. Un webhook déclenché
par GitHub supprimerait cette latence, au prix d'un point d'entrée HTTP à exposer et à
authentifier sur une machine qui héberge d'autres services. Écarté pour l'instant.

### 9. Le report `master` → `develop` est manuel

Chaque release laisse `develop` en retard. Rien ne le rappelle, et l'écart grandit à chaque cycle.

### 10. Le journal n'est pas tourné

Il grossit lentement, mais rien ne le limite. Un fichier dans `/etc/logrotate.d/` réglerait la
question avant qu'elle ne se pose.
