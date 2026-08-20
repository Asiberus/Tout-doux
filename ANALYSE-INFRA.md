# Analyse de l'infrastructure Docker, de `.conf/` et de `td.sh`

Périmètre : `docker-compose.yml`, `docker-compose.prod.yml`, `.dockerignore`, l'arborescence
`.conf/` (Dockerfiles dev et prod, `setup-config.sh`, `run.sh`, `default.conf.tpl`,
`uwsgi_params`, templates d'environnement) et `td.sh`.

Version analysée : `0.4.1` — branche `develop`, commit `b3afec9`.
Date : 2026-08-16.

## Méthode et niveaux de preuve

Chaque constat porte une mention de son niveau de preuve. Cette distinction est importante :
trois affirmations d'une première passe de lecture se sont révélées fausses une fois
confrontées à l'état réel de la machine, et sont signalées comme telles dans le document.

| Niveau      | Signification                                                                   |
| ----------- | ------------------------------------------------------------------------------- |
| **Exécuté** | Reproduit par une commande dont la sortie est citée.                            |
| **Lu**      | Établi par lecture directe du fichier, sans ambiguïté d'interprétation.         |
| **Déduit**  | Conséquence logique d'un comportement documenté d'un outil, non reproduite ici. |

Environnement de vérification : macOS (Darwin 25.5.0), Docker Engine 27.0.3 via Docker Desktop.
Certains comportements observés dépendent de cet environnement et sont annotés quand c'est le cas.

---

## 1. Architecture

### 1.1 Développement — `docker-compose.yml`

Quatre services :

| Service    | Rôle                                | Image / build                           |
| ---------- | ----------------------------------- | --------------------------------------- |
| `frontend` | Vite en mode watch, code bind-monté | `.conf/development/frontend/Dockerfile` |
| `backend`  | Django `runserver`, code bind-monté | `.conf/development/backend/Dockerfile`  |
| `db`       | PostgreSQL                          | `postgres:${DB_POSTGRES_VERSION}`       |
| `adminer`  | Console SQL                         | `adminer`                               |

Le front appelle l'API en direct sur `http://localhost:8000/`, valeur injectée au build via
`ARG_API_URL` (`docker-compose.yml:9`) puis écrite dans les balises `<meta>` de `index.html`
par `setup-config.sh`. Aucun proxy en dev.

Le démarrage du backend est séquencé dans la commande du service
(`docker-compose.yml:19-22`) : `wait_for_db`, puis `migrate`, puis `runserver`. La commande
`wait_for_db` existe bien (`backend/tout_doux/management/commands/wait_for_db.py`), ce qui rend
acceptable l'absence de `healthcheck` sur `db`.

### 1.2 Production — `docker-compose.prod.yml`

Trois services. Le service `frontend` cumule deux rôles : il sert le SPA compilé **et** fait
office de reverse proxy vers le backend, via deux blocs `server` distingués par `server_name`
(`default.conf.tpl`) :

```
SERVER_HOST  → bloc 1 → /usr/share/nginx/html  (SPA, try_files → index.html)
API_HOST     → bloc 2 → uwsgi_pass ${BACKEND_PROXY}  +  /static → alias /vol/static
```

Le TLS n'est pas géré ici : nginx écoute en clair sur `SERVER_PORT` (8020 par défaut) et la
terminaison HTTPS est déléguée à un nginx hôte. C'est cohérent avec le message de `td.sh:41`
qui exige nginx sur la machine de production.

### 1.3 Circulation des fichiers statiques

Le chemin est correct, mais il demande un effort de lecture, donc il est documenté ici :

1. `run.sh:7` — `collectstatic` écrit dans `STATIC_ROOT` = `/vol/web/static`
   (`backend/backend/settings.py:162`).
2. Le backend monte le volume `td_static_files` sur `/vol/web` (`docker-compose.prod.yml:43`).
   Les fichiers atterrissent donc dans le volume sous `static/`.
3. Le frontend monte **le même volume** sur `/vol/static` (`docker-compose.prod.yml:19`).
4. `STATIC_URL` vaut `/static/static/` (`settings.py:161`). Pour l'URI `/static/static/app.css`,
   la directive `alias /vol/static` (`default.conf.tpl:33`) remplace le préfixe `/static` et
   sert `/vol/static/static/app.css`.

Le double `static/static/` n'est pas une faute : il découle de la combinaison `STATIC_URL` +
`alias`. Il est simplement contre-intuitif à la relecture.

---

## 2. Constats bloquants

### B1 — Le build de production du frontend est cassé

**Fichier** : `.conf/production/frontend/Dockerfile:20-21`
**Preuve** : **Exécuté**

```dockerfile
COPY --chown=node:node ./frontend/package.json ./frontend/package-lock.json ./
RUN npm install
```

Le projet est géré avec **Yarn 1** (`frontend/yarn.lock`, en-tête `# yarn lockfile v1`, scripts
`yarn dev` / `yarn build`). Le fichier `frontend/package-lock.json` n'existe pas.

Build lancé pour vérification :

```
$ docker build -f .conf/production/frontend/Dockerfile \
    --build-arg ARG_VERSION=0.4.1 --build-arg ARG_API_URL=https://example.test/ .

ERROR: failed to solve: failed to compute cache key: failed to calculate checksum of ref
"/frontend/package-lock.json": not found
```

**Impact** : aucun déploiement en production n'est possible en l'état.

**Correctif** — passer sur Yarn et retirer l'exclusion du lockfile (voir B2) :

```dockerfile
COPY --chown=node:node ./frontend/package.json ./frontend/yarn.lock ./
RUN yarn install --frozen-lockfile
```

Attention au drapeau : `--frozen-lockfile` est la syntaxe **Yarn 1**. `--immutable` (utilisé dans
la ligne commentée `.conf/development/frontend/Dockerfile:24`) appartient à Yarn 2+ et
échouerait ici.

### B2 — `yarn.lock` est exclu du contexte de build

**Fichier** : `.dockerignore:11`
**Preuve** : **Lu**

La ligne `yarn.lock` empêche tout Dockerfile de copier le lockfile. C'est la cause racine de B1,
et l'explication des deux `RUN` neutralisés dans le Dockerfile de dev
(`.conf/development/frontend/Dockerfile:24-25`) : les tentatives d'installation verrouillée ont
été abandonnées faute de lockfile disponible dans le contexte.

**Impact** : les images sont construites avec `yarn install` sans lockfile. Les versions sont
donc résolues au moment du build, dans les bornes de `package.json`. Deux builds du même commit
peuvent produire deux arbres de dépendances différents, et une régression amont peut arriver en
production sans le moindre changement de code.

**Correctif** : supprimer la ligne 11 de `.dockerignore`.

### B3 — Le port du frontend de développement est désynchronisé entre trois sources

**Fichiers** : `.conf/development/conf.tpl.env:5`, `td.sh:91`, `frontend/vite.config.ts:25`
**Preuve** : **Exécuté**

| Source                                             | Valeur               |
| -------------------------------------------------- | -------------------- |
| `conf.tpl.env:5`                                   | `FRONTEND_PORT=8080` |
| `td.sh:91` (générateur de `conf.env`)              | `FRONTEND_PORT=8080` |
| `vite.config.ts:25` (`server.port`)                | `3000`               |
| `.conf/development/conf.env` local (non versionné) | `3000`               |

> **Correction d'une première analyse.** Sur la base du seul template, ce point avait été qualifié
> de « stack dev cassée ». C'est faux : le `conf.env` local a été corrigé à la main et
> `docker compose --env-file .conf/development/conf.env config` résout bien `published: "3000"` /
> `target: 3000`, en accord avec Vite. L'installation courante fonctionne.

**Impact réel** : toute nouvelle installation via `./td.sh install dev` écrit `8080`, alors que
Vite écoute sur `3000`. Le mapping devient `8080:8080` vers un port sur lequel rien n'écoute, et
le front est injoignable. Le problème est nul pour le poste actuel, bloquant pour tout nouvel
arrivant ou toute réinstallation.

**Correctif** — faire de `FRONTEND_PORT` la source unique, en le propageant à Vite. Le service
`frontend` n'ayant aujourd'hui aucun bloc `environment:`, la variable doit d'abord être injectée
dans le conteneur :

```yaml
# docker-compose.yml, service frontend
environment:
  FRONTEND_PORT: ${FRONTEND_PORT}
```

```ts
// frontend/vite.config.ts
server: {
  host: true,
  port: Number(process.env.FRONTEND_PORT ?? 3000),
}
```

et aligner `conf.tpl.env:5` ainsi que `td.sh:91` sur `3000`. À défaut, mapper
`${FRONTEND_PORT}:3000` dans `docker-compose.yml:11` et documenter que le port interne est figé.

---

## 3. Constats de sécurité

### S1 — La base et le socket uwsgi sont publiés sur l'hôte en production

**Fichier** : `docker-compose.prod.yml:40-41` et `55-56`
**Preuve** : **Lu**

```yaml
backend:
  ports:
    - ${BACKEND_PORT}:${BACKEND_PORT} # 8021 — socket uwsgi
db:
  ports:
    - ${DB_PORT}:${DB_PORT} # 8022 — PostgreSQL
```

Sans adresse d'écoute explicite, Docker publie sur `0.0.0.0` et insère ses propres règles dans
`iptables`, en amont de la plupart des configurations `ufw`. Un pare-feu hôte réputé fermé ne
protège donc pas ces ports.

Or aucun des deux n'a besoin d'être joignable de l'extérieur :

- nginx atteint le backend par le réseau Docker interne, via
  `BACKEND_PROXY: ${BACKEND_NAME}:${BACKEND_PORT}` (`docker-compose.prod.yml:17`) ;
- rien n'accède à PostgreSQL hors du réseau Docker (`adminer` n'existe pas en prod).

Le socket uwsgi est le plus préoccupant des deux : c'est un protocole binaire sans
authentification, qui parle directement à l'application Django en court-circuitant nginx.

**Correctif** : supprimer les deux blocs `ports:`. Les services restent joignables par leur nom
sur le réseau Docker. Si un accès ponctuel à la base est nécessaire, préférer un tunnel SSH ou,
au minimum, un binding restreint : `127.0.0.1:${DB_PORT}:${DB_PORT}`.

### S2 — CORS ouvert à toutes les origines

**Fichier** : `backend/backend/settings.py:82`
**Preuve** : **Lu**

```python
CORS_ORIGIN_ALLOW_ALL = True
```

La valeur est inconditionnelle : elle ne dépend ni de `DEBUG` ni d'une variable
d'environnement, et s'applique donc telle quelle en production.

**Correctif** : restreindre à l'origine du front, déjà disponible dans l'environnement du
conteneur sous `SERVER_URL` (`settings.py:32`, alimenté par `docker-compose.prod.yml:27`) :

```python
CORS_ALLOWED_ORIGINS = [os.environ['SERVER_URL'].rstrip('/')]
```

### S3 — Les secrets sont saisis en clair à l'installation

**Fichier** : `td.sh:60-81`
**Preuve** : **Lu**

Le mot de passe de la base, la clé secrète Django et les deux identifiants Mailjet sont lus avec
`read -rp`, sans `-s`. Les valeurs s'affichent à l'écran pendant la frappe et subsistent dans
l'historique de défilement du terminal, voire dans les journaux d'une session partagée.

**Correctif** : utiliser `read -rsp` et ajouter un saut de ligne explicite, avec une double
saisie de confirmation pour le mot de passe. La clé secrète Django gagnerait par ailleurs à être
**générée** plutôt que demandée à l'utilisateur :

```sh
backendsecretkey=$(python3 -c 'import secrets; print(secrets.token_urlsafe(50))')
```

### S4 — Socles techniques hors support

**Fichiers** : `.conf/*/backend/Dockerfile:1`, `backend/requirements.txt`,
`.conf/production/frontend/Dockerfile:27`
**Preuve** : **Lu** (versions), **Déduit** (statut de support)

| Composant | Version | Statut                                               |
| --------- | ------- | ---------------------------------------------------- |
| Python    | 3.9     | Fin de support sécurité en octobre 2025              |
| Django    | 3.2     | Fin du support étendu LTS en avril 2024              |
| nginx     | 1.24    | Branche stable de 2023, plusieurs branches de retard |

Aucun correctif de sécurité n'est plus publié pour les deux premiers. La montée de version
Django est le chantier le plus lourd (3.2 → 4.2 LTS → 5.x), et il faudra tenir compte de
`CSRF_TRUSTED_ORIGINS`, devenu obligatoire à partir de Django 4.0 pour les requêtes non sûres —
il n'est aujourd'hui défini nulle part.

### S5 — Le fichier `conf.env` transite dans le contexte de build

**Fichier** : `.dockerignore`
**Preuve** : **Lu**

`.conf/development/conf.env` et `.conf/production/conf.env` ne sont pas exclus. Ils ne sont
jamais la cible d'un `COPY`, donc ils n'atterrissent pas dans les images ; mais ils sont
transmis au démon Docker à chaque build, ce qui élargit inutilement la surface d'exposition de
secrets (contexte distant, démon partagé, cache de build).

**Correctif** : ajouter `.conf/*/conf.env` à `.dockerignore`.

---

## 4. Constats de fiabilité

### F1 — uwsgi ne reçoit pas les signaux d'arrêt

**Fichier** : `.conf/production/backend/run.sh:10`
**Preuve** : **Déduit**

```sh
uwsgi --socket :"$BACKEND_PORT" --workers 4 --master --enable-threads --module backend.wsgi
```

`CMD ["run.sh"]` fait de `/bin/sh` le PID 1. Sans `exec`, uwsgi est lancé comme processus
**enfant** de ce shell. Le `SIGTERM` émis par `docker stop` est délivré au PID 1, qui ne le
relaie pas : uwsgi n'arrête donc pas ses workers proprement et se fait tuer par le `SIGKILL`
émis au bout du délai de grâce (10 s par défaut).

**Correctif** : `exec uwsgi --socket … --module backend.wsgi`.

### F2 — Les journaux nginx sont écrits dans des fichiers du conteneur

**Fichiers** : `.conf/production/frontend/Dockerfile:37-42`, `default.conf.tpl:7-8` et `23-24`
**Preuve** : **Lu**

L'image officielle nginx redirige `/var/log/nginx/access.log` et `error.log` vers `/dev/stdout`
et `/dev/stderr`. Ici, quatre chemins personnalisés sont créés (`front/` et `api/`), qui sont de
vrais fichiers. Deux conséquences : `docker logs tout_doux_frontend` ne montre rien d'utile, et
les journaux grossissent sans rotation dans la couche inscriptible du conteneur jusqu'à
saturation du disque.

**Correctif** : conserver la séparation front/api mais rediriger vers la sortie standard.

```dockerfile
RUN mkdir -p /var/log/nginx/front /var/log/nginx/api && \
    ln -sf /dev/stdout /var/log/nginx/front/access.log && \
    ln -sf /dev/stderr /var/log/nginx/front/error.log && \
    ln -sf /dev/stdout /var/log/nginx/api/access.log && \
    ln -sf /dev/stderr /var/log/nginx/api/error.log
```

### F3 — Course au démarrage entre nginx et le backend

**Fichier** : `docker-compose.prod.yml:2-19`
**Preuve** : **Déduit**

Le service `frontend` ne déclare pas de `depends_on: backend`. Or nginx résout le nom d'hôte
d'un `uwsgi_pass` littéral **au chargement de la configuration**, pas à la première requête. Si
le conteneur backend n'est pas encore démarré et donc pas encore résolvable par le DNS interne
de Docker, nginx échoue au démarrage avec `host not found in upstream`.

Le `restart: always` (`docker-compose.prod.yml:4`) finit par rattraper la situation, mais au prix
de plusieurs redémarrages et d'une indisponibilité au lancement de la stack.

**Correctif** : ajouter `depends_on: [backend]` au service `frontend`. Pour une robustesse
complète, on peut aussi passer par une variable et un `resolver`, mais `depends_on` suffit ici.

### F4 — Le bind-mount masque le travail de l'image en développement

**Fichier** : `docker-compose.yml:13`
**Preuve** : **Déduit**

`./frontend:/frontend` recouvre l'intégralité du répertoire de travail construit dans l'image, ce
qui a deux effets non évidents :

1. `/frontend/node_modules` installé au build (`Dockerfile:26`) est masqué par le
   `node_modules` de l'hôte. Ce sont donc des dépendances installées sur macOS qui s'exécutent
   dans un conteneur Linux — sans conséquence pour du JavaScript pur, mais source d'erreurs
   `invalid ELF header` dès qu'un binaire natif entre en jeu (`esbuild` et les binaires
   `@rollup/rollup-*` de Vite en sont). La ligne commentée
   `.conf/development/frontend/Dockerfile:29`, qui ajoutait manuellement
   `@rollup/rollup-linux-arm64-musl`, est le symptôme direct de ce problème.
2. L'`index.html` patché par `setup-config.sh` au build (`Dockerfile:32`) est remplacé par celui
   de l'hôte. Les balises `VERSION` et `API_URL` servies en dev sont donc celles versionnées dans
   `frontend/index.html:7-8`. Cela fonctionne aujourd'hui uniquement parce que ces valeurs
   coïncident avec la configuration (`0.4.1` et `http://localhost:8000/`).

**Correctif** : superposer un volume anonyme pour préserver les `node_modules` de l'image.

```yaml
volumes:
  - ./frontend:/frontend
  - /frontend/node_modules
```

### F5 — Le chemin de production de `td.sh` appelle un binaire absent

**Fichier** : `td.sh:240`, `252`, `266`, `280-281`
**Preuve** : **Exécuté**

Les branches `dev` utilisent `docker compose` (plugin v2), les branches `prod` utilisent
`docker-compose` (binaire v1, en fin de vie depuis juin 2023 et absent des installations
récentes).

```
$ command -v docker-compose ; echo "rc=$?"
rc=1
```

**Impact** : `./td.sh build prod`, `start prod`, `quit prod` et `reset prod` échouent sur cette
machine. Ce n'est pas un risque théorique.

**Correctif** : remplacer les quatre occurrences par `docker compose`.

---

## 5. Qualité et maintenabilité

### Q1 — `editConfFile` cumule quatre défauts

**Fichier** : `td.sh:196-232`
**Preuve** : **Lu**

| Ligne | Problème                                                                                                                                                                                                                                                                  |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 211   | `echo "tmp"` affiche la chaîne littérale `tmp` — reliquat de débogage, il manque le `$`.                                                                                                                                                                                  |
| 214   | `if [ $? -eq 0 ]` teste le code retour de l'`echo` de la ligne 211, jamais celui du `grep` de la ligne 210. La condition est donc **toujours vraie**, y compris quand la variable est absente du fichier.                                                                 |
| 226   | `sed -i ''` est la syntaxe **BSD/macOS**. Sur GNU sed, la chaîne vide est interprétée comme un nom de fichier et la commande échoue. C'est précisément le cas d'usage principal de cette fonction : éditer la configuration **de production**, donc sur un serveur Linux. |
| 226   | `s/${tmp}/…/` injecte la valeur courante dans le motif. Un secret contenant `/`, `&`, `.` ou `*` casse la substitution ou la corrompt silencieusement.                                                                                                                    |

S'ajoute un défaut de robustesse : `grep ${envVar}` n'est ni ancré ni quoté. Si plusieurs lignes
correspondent, `$tmp` devient multiligne et `sed` part en erreur.

**Correctif** : remplacer la substitution par une réécriture ancrée, insensible aux caractères
spéciaux de la valeur :

```sh
awk -v k="$envVar" -v v="$replaceVar" \
    'BEGIN{FS=OFS="="} $1==k {$0=k"="v} {print}' "$confFile" > "$confFile.tmp" \
  && mv "$confFile.tmp" "$confFile"
```

### Q2 — `editConfFile` dépend du répertoire courant

**Fichier** : `td.sh:199` et `202`
**Preuve** : **Lu**

```sh
confFile=$(echo $(pwd)/.conf/production/conf.env)
```

Toutes les autres fonctions utilisent `${basedir}` (`td.sh:3`), qui suit l'emplacement du script.
Celle-ci utilise `$(pwd)` : `/chemin/vers/td.sh edit dev` depuis un autre répertoire vise un
fichier inexistant. Le `$(echo …)` qui enveloppe l'expression est par ailleurs inutile.

### Q3 — L'aide annonce une étape que le code ne fait pas

**Fichier** : `td.sh:26` et `326-333`
**Preuve** : **Lu**

L'aide décrit `update` comme « Quit, pull, build and start aplication ». La fonction `updateApp`
enchaîne `quitApp`, `buildApp`, `startApp` — il n'y a **aucun** `git pull`. L'utilisateur qui
suit la documentation redéploie donc le code déjà présent en croyant récupérer la dernière
version. (À noter également, la coquille « aplication », ainsi que « Stoping » aux lignes 262
et 265.)

**Correctif** : soit ajouter le `git pull`, soit corriger le texte d'aide. La seconde option est
plus prudente : un `pull` implicite sur un dépôt de production peut surprendre.

### Q4 — `isInstalled` signale les erreurs comme des succès

**Fichier** : `td.sh:36-44`
**Preuve** : **Lu**

En cas de dépendance manquante, la fonction sort avec `exit 0` (ligne 42). Tout appelant
automatisé interprète cela comme une réussite. De plus, la boucle de vérification
(`td.sh:158`) ne teste que `docker`, alors que le message d'erreur mentionne `docker-compose` et
`nginx`.

**Correctif** : `exit 1`, et étendre la liste des commandes vérifiées.

### Q5 — Le Dockerfile de développement du frontend accumule du code mort

**Fichier** : `.conf/development/frontend/Dockerfile`
**Preuve** : **Exécuté** (ligne 16), **Lu** (le reste)

| Ligne         | Problème                                                                                                                                                                                                                                                                                                                                                                               |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 16            | `apt install python3 make g++`, sans `apt-get update` et sans `-y`. Vérifié : ces trois paquets sont **déjà présents** dans `node:22-bullseye` (`/usr/bin/python3`, `/usr/bin/make`, `/usr/bin/g++`), donc apt répond « already the newest version » et sort en 0. La ligne ne fait rien. Si un paquet venait à manquer, apt demanderait confirmation et abandonnerait, faute de `-y`. |
| 24-25         | Deux `RUN` dont le contenu est intégralement commenté. Ils ne font rien mais créent chacun une couche.                                                                                                                                                                                                                                                                                 |
| 27            | `yarn cache clean` après `yarn install` dans un `RUN` distinct : le cache reste présent dans la couche précédente, aucun octet n'est économisé.                                                                                                                                                                                                                                        |
| 22, 29, 35-37 | Lignes commentées accumulées (`COPY` du lockfile, ajout manuel d'un binaire rollup, `CMD`/`ENTRYPOINT` alternatifs).                                                                                                                                                                                                                                                                   |

Le `# Todo` de la ligne 13 pose déjà la bonne question. La réponse est oui : les trois paquets
peuvent être retirés.

### Q6 — Règles obsolètes ou inopérantes dans `.dockerignore`

**Fichier** : `.dockerignore:10`, `18-21`
**Preuve** : **Exécuté**

- **Lignes 18-21** — `app/__pycache__/` et ses trois variantes visent un répertoire `app/` qui
  n'existe pas : le backend est dans `backend/`. Ces règles ne matchent rien, et les caches
  Python **sont** copiés dans l'image. Le dépôt contient d'ailleurs des `.cpython-314.pyc`
  (Python 3.14 de l'hôte) qui partent dans une image Python 3.9, où ils sont inutilisables.
  Sans danger, mais c'est du poids mort et une source de confusion.
- **Ligne 10** — `**/tests` ne matche qu'un segment de chemin nommé exactement `tests`.
  Vérification faite, aucun répertoire de ce nom n'existe dans le dépôt, et les tests du backend
  sont dans un **fichier** (`backend/tout_doux/tests.py`), que ce motif ne couvre pas.

> **Correction d'une première analyse.** Ce fichier de tests avait été décrit à tort comme exclu
> de l'image. Il ne l'est pas. La règle ligne 10 n'exclut strictement rien.

**Correctif** :

```
**/__pycache__/
**/*.pyc
```

en remplacement des lignes 18-21, et décider explicitement du sort de la ligne 10 (l'écrire
`**/tests.py` si l'intention était bien d'exclure les tests, la supprimer sinon).

### Q7 — Portabilité de l'utilisateur non-root du backend en développement

**Fichiers** : `.conf/development/backend/Dockerfile:13` et `17`, `docker-compose.yml:39`
**Preuve** : **Exécuté**

L'image crée un utilisateur `backend` (uid 1000) et bascule dessus, tandis que le code est
bind-monté depuis l'hôte.

```
$ docker exec tout_doux_backend sh -c 'id; ls -ld /backend; touch /backend/_write_test'
uid=1000(backend) gid=1000(backend) groups=1000(backend)
drwxr-xr-x 11 root root 352 /backend
ECRITURE OK
```

> **Correction d'une première analyse.** Ce point avait été qualifié de bug d'écriture. Le test
> le contredit : l'écriture aboutit malgré la discordance apparente de propriétaire, parce que la
> couche de partage de fichiers de Docker Desktop (virtiofs) neutralise la correspondance d'uid.

Il s'agit donc d'un problème de **portabilité**, pas d'un bug actif : sur un hôte Linux, où le
bind-mount conserve l'uid réel de l'hôte, l'uid 1000 du conteneur n'aurait pas les droits
d'écriture sur des fichiers appartenant à l'uid de l'utilisateur hôte, et des commandes comme
`makemigrations` exécutées dans le conteneur échoueraient. À traiter le jour où un
développement se fera sous Linux, via un `ARG UID` passé au build.

### Q8 — Points mineurs

| Constat                                                                                                                                                                                                                                                                                             | Emplacement                                 | Preuve  |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- | ------- |
| `image: adminer` sans tag de version — seule image non épinglée, alors que `postgres`, `node` et `nginx` le sont.                                                                                                                                                                                   | `docker-compose.yml:56`                     | Lu      |
| `FROM … as …` en minuscules : BuildKit émet `FromAsCasing` aux lignes 1 et 27 (warnings observés pendant le build de vérification).                                                                                                                                                                 | `.conf/production/frontend/Dockerfile:1,27` | Exécuté |
| Le numéro de version est dupliqué à la main entre `td.sh:2` et `frontend/package.json`. Les deux valent bien `0.4.1` aujourd'hui, mais le commentaire « Must match package.json version number » décrit un piège plutôt qu'il ne l'évite. Un `grep` sur `package.json` supprimerait la duplication. | `td.sh:2`                                   | Lu      |
| `python3 make g++` installés dans l'étape de build de production pour node-gyp ; probablement inutiles aujourd'hui, à valider par un build d'essai.                                                                                                                                                 | `.conf/production/frontend/Dockerfile:16`   | Déduit  |
| Aucun `HEALTHCHECK` sur les trois services de production.                                                                                                                                                                                                                                           | `docker-compose.prod.yml`                   | Lu      |
| Pas de `SECURE_PROXY_SSL_HEADER` : nginx transmet la requête en clair à uwsgi, donc `request.is_secure()` est toujours faux derrière le proxy, alors que le trafic externe est en HTTPS.                                                                                                            | `backend/backend/settings.py`               | Lu      |
| nginx tourne en root dans l'image de production (comportement par défaut de l'image officielle).                                                                                                                                                                                                    | `.conf/production/frontend/Dockerfile`      | Déduit  |
| `td.sh` n'active ni `set -e` ni `set -u` ; plusieurs variables sont déréférencées sans guillemets (`td.sh:50,55,60,66`), ce qui provoque `too many arguments` si une saisie contient une espace.                                                                                                    | `td.sh`                                     | Lu      |
| Les `eval` autour des commandes docker (`td.sh:237,240,249,…`) sont inutiles : aucune expansion différée n'est nécessaire, et ils fragilisent le script si `${basedir}` contient une espace.                                                                                                        | `td.sh`                                     | Lu      |
| `.conf/production/conf.env` n'existe pas sur cette machine : `./td.sh edit prod` ferait un `grep` sur un fichier absent, sans message clair (voir Q1, la condition ligne 214 masque l'erreur).                                                                                                      | —                                           | Exécuté |
| `run.sh:3` — `BACKEND_PORT=${BACKEND_PORT}` est une réassignation sans effet ; `set -e` ligne 4 gagnerait à être placé en tête.                                                                                                                                                                     | `.conf/production/backend/run.sh`           | Lu      |

---

## 6. Ce qui est correct

Points relevés comme solides, pour éviter qu'ils ne soient dégradés lors des correctifs :

- **Utilisateur non-root dans les deux images backend** (`adduser --disabled-password
--no-create-home`, puis `USER backend`).
- **Purge des dépendances de compilation** via le groupe virtuel `.tmp-deps`
  (`.conf/development/backend/Dockerfile:8-12`, `.conf/production/backend/Dockerfile:12-16`) :
  `build-base`, `postgresql-dev`, `musl-dev`,
  `linux-headers` et `libffi-dev` sont installés puis supprimés dans la même instruction `RUN`,
  donc absents de la couche finale. C'est fait correctement.
- **Multi-stage propre** côté frontend de production : seul `dist/` passe dans l'image nginx,
  aucune trace de Node dans l'image servie.
- **Gestion de la configuration** : `conf.env` ignoré par git, `conf.tpl.env` versionné comme
  documentation vivante des variables attendues. Les clés du template et du fichier réel sont
  identiques et dans le même ordre (vérifié par `diff`) — seules les valeurs divergent.
- **`envsubst` de nginx utilisé correctement** : `NGINX_ENVSUBST_TEMPLATE_SUFFIX=.tpl` avec un
  template dans `/etc/nginx/templates/`. Les variables nginx (`$uri`, `$document_uri`, …) étant
  écrites sans accolades, elles ne sont pas substituées par erreur — c'est une subtilité souvent
  ratée.
- **`uwsgi_params`** conforme au fichier de référence uWSGI. Les en-têtes HTTP client sont par
  ailleurs transmis automatiquement (`uwsgi_pass_request_headers` est actif par défaut), il n'y a
  donc rien à ajouter pour `Authorization`.
- **`container_name: ${DB_HOST}`** : le nom du conteneur et le nom DNS utilisé par Django
  proviennent de la même variable, ils ne peuvent donc pas diverger.
- **Séquencement du démarrage** par `wait_for_db` plutôt que par un `depends_on` naïf, ce qui
  gère le cas — réel — d'un PostgreSQL démarré mais pas encore prêt à accepter des connexions.
- **`client_max_body_size 10M`** défini explicitement sur le bloc API
  (`default.conf.tpl:29`), au lieu du défaut de 1 Mo qui aurait fini par surprendre.

---

## 7. Ordre de traitement suggéré

1. ~~**B2 puis B1**~~ ✅ fait — `yarn.lock` retiré de `.dockerignore`, Dockerfile de production
   basculé sur `yarn install --frozen-lockfile` (commit `2e93c06`).
2. ~~**S1**~~ ✅ fait — publication des ports `8021` et `8022` supprimée en production
   (`docker-compose.prod.yml`) ; `backend` et `db` ne sont plus joignables que depuis le réseau
   interne Docker.
3. ~~**F5**~~ ✅ fait — `td.sh` appelle `docker compose` partout, y compris en production
   (commit `df06f83`). **Q1** reste à faire (réparer `editConfFile`), sans quoi la configuration
   de production ne peut pas être modifiée depuis un serveur Linux.
4. **B3** — aligner les trois sources du port frontend (`conf.tpl.env`, `td.sh`, `vite.config.ts`).
   N'affecte que le développement conteneurisé : la production utilise `SERVER_PORT` de façon
   cohérente sur les trois fichiers équivalents, donc **aucun impact en production**.
5. **F1, F2, F3** — arrêt propre d'uwsgi, journaux sur la sortie standard, `depends_on` sur le
   frontend. Trois correctifs courts qui améliorent nettement l'exploitabilité.
6. ~~**S2, S3**~~ ✅ fait — CORS restreint à `SERVER_URL` (`CORS_ALLOWED_ORIGINS`), saisie des
   secrets masquée dans `td.sh` (`read -rs`).
7. **S5** — exclure `.conf/*/conf.env` de `.dockerignore` : le fichier contenant les vrais
   secrets transite dans le contexte de build Docker à chaque build sans y être nécessaire (aucun
   `COPY` ne le cible). Pas encore corrigé.
8. **Q5, Q6** — nettoyage des Dockerfiles et de `.dockerignore`.
9. **S4** — montée de version Python et Django. Chantier à part entière, à planifier.

## 8. Points ouverts

- Le conteneur `tout_doux_frontend` est en statut `Created` (jamais démarré), avec un code de
  sortie `0`, aucune erreur enregistrée et des journaux vides. La cause n'a pas été établie et
  aucune hypothèse n'est avancée ici. À investiguer par un `docker compose up frontend` en
  premier plan.
- La suppression de `python3 make g++` de l'étape de build de production (Q8) demande un build
  d'essai pour confirmer qu'aucune dépendance ne réclame node-gyp.
