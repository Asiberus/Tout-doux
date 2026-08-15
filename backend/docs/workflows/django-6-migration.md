# Migration Django 3.2 → 6.1 · DRF 3.12 → 3.18 · Python 3.9 → 3.14

> ⚠️ **Document temporaire.** Il suit un chantier de montée de versions et **doit être supprimé**
> quand la migration atterrit — `git log` sera alors le registre de ce qui a été fait. Ce qui doit
> lui survivre doit être extrait **avant** la suppression :
>
> - les règles pérennes → [../patterns/](../patterns/) et
>   [development.md](development.md) / [verification.md](verification.md) ;
> - la dette encore ouverte → [../quality/refactoring-backlog.md](../quality/refactoring-backlog.md) ;
> - les arbitrages structurants (choix du palier, remplacement de Mailjet) → un ADR dans
>   [../adr/](../adr/).
>
> Ne pas y inscrire de règle de référence : elle serait perdue à la suppression.

> **But** : passer aux dernières versions stables de Django, DRF et Python **sans aucune
> différence de comportement de l'API** avant/après, à trois exceptions près, assumées et
> détaillées : §1.1 (ancrage des routes), §1.6 (invalidation des jetons) et §1.5 (transport
> e-mail).
> **Public** : ce document doit permettre à une personne qui **ne connaît pas le projet** de
> traiter chaque tâche. Chaque point donne les fichiers, les **numéros de ligne**, et le code
> **avant → après**.
> **Légende priorité** : 🔴 Bloquant (l'app ne démarre pas / un endpoint casse) · 🟠 Iso-comportement
> (l'app démarre mais se comporte différemment) · 🟡 Dette/nettoyage · ⚪ Optionnel.

Ce chantier **clôt les items R5 et R6** de
[../quality/refactoring-backlog.md](../quality/refactoring-backlog.md). Quand il est terminé,
supprimer leurs lignes et leurs sections dans ce fichier — ne pas les marquer « fait ».

---

## ✅ Avancement de la migration

> Suivi mis à jour au fil de l'eau. Chaque tâche réalisée est cochée ici **et** son titre de
> section reçoit le marqueur « — ✅ FAIT ».

### 0. Préalables

- [ ] §0.1 — Décider le palier cible (Django 6.1 ou 5.2 LTS) et l'inscrire ici
- [ ] §0.2 — Poser un filet de vérification minimal (au moins un test de fumée)
- [ ] §0.3 — Sauvegarder la base de production (`backupdb`) avant tout déploiement

### 1. 🔴 Bloquants

- [ ] 1.1 — `django.conf.urls.url` supprimé (Django 4.0) — 16 occurrences, 2 fichiers
- [ ] 1.2 — `USE_L10N` supprimé (Django 5.0)
- [ ] 1.3 — `CORS_ORIGIN_ALLOW_ALL` supprimé (django-cors-headers 4.0)
- [ ] 1.4 — `psycopg2` épinglé `<2.8.7` alors que Django 6.0 exige `≥2.9.9`
- [ ] 1.5 — `django-mailjet` abandonné depuis 2017 → remplacement
- [ ] 1.6 — `django-rest-knox` 4.\* → 5.1 : **tous les jetons existants sont invalidés**
- [ ] 1.7 — Images Docker `python:3.9-alpine` → `3.14-alpine` (dev **et** prod)
- [ ] 1.8 — `requirements.txt` réécrit et épinglé

### 2. 🟠 Iso-comportement

- [ ] 2.1 — CSRF/`Origin` derrière nginx : admin et API browsable cassés en production
- [ ] 2.2 — `wait_for_db` importe `psycopg2` en dur
- [ ] 2.3 — uWSGI 2.0.31 : compilation sur Python 3.14 + musl
- [ ] 2.4 — `django-extensions` 4.1 n'est testé que jusqu'à Django 5.2
- [ ] 2.5 — DRF 3.18 : format des erreurs des sérialiseurs `many=True`
- [ ] 2.6 — Django 6.0 a réécrit `EmailMessage` : vérifier les 4 e-mails
- [ ] 2.7 — Django 6.1 exige PostgreSQL ≥ 15 (le projet est en 16 → OK, à confirmer en prod)
- [ ] 2.8 — `DEFAULT_AUTO_FIELD` et `ToutDouxConfig` : vérifier qu'aucune migration n'apparaît

### 3. 🟡 Dette à traiter au passage

- [ ] 3.1 — R5 : ancrer les routes (fait mécaniquement par §1.1, à valider explicitement)
- [ ] 3.2 — Nettoyer les `__pycache__` versionnés (`.cpython-38/39.pyc`)
- [ ] 3.3 — Mettre à jour [development.md](development.md) et [verification.md](verification.md)
- [ ] 3.4 — Renseigner le nouveau niveau de référence de `check --deploy`

### 4. ⚪ Optionnel

- [ ] 4.1 — Passer à `psycopg` 3
- [ ] 4.2 — Remplacer uWSGI par gunicorn
- [ ] 4.3 — Poser `ruff` + un hook `pre-commit` backend

### 5. Checklist QA finale

- [ ] §5 — QA finale

---

## 0. À lire avant de commencer

### 0.1 État des lieux versionné

| Composant           | Aujourd'hui                     | Dernière stable (16/08/2026) | Écart                                       |
| ------------------- | ------------------------------- | ---------------------------- | ------------------------------------------- |
| Python              | 3.9 (image `python:3.9-alpine`) | **3.14.7**                   | EOL depuis octobre 2025                     |
| Django              | 3.2.9 (nov. 2021)               | **6.1** (05/08/2026)         | EOL depuis avril 2024 ; 4 versions majeures |
| djangorestframework | 3.12.4                          | **3.18.0**                   | 6 versions mineures                         |
| django-cors-headers | 3.10.0                          | **4.9.0**                    | 1 majeure (renommages de settings)          |
| django-filter       | 2.4.0                           | **26.1**                     | passage en CalVer                           |
| django-extensions   | 3.1.3                           | **4.1** (avril 2025)         | testé jusqu'à Django 5.2 seulement          |
| django-rest-knox    | `4.*`                           | **5.1.0**                    | 1 majeure — invalide les jetons             |
| psycopg2            | `>=2.8.6,<2.8.7`                | **2.9.12**                   | en dessous du minimum de Django 6.0 (2.9.9) |
| uWSGI               | `>=2.0.19.1,<2.1`               | **2.0.31**                   | même branche                                |
| django-mailjet      | non épinglé (0.3.1)             | **0.3.1 — de mars 2017**     | abandonné                                   |
| PostgreSQL          | 16-alpine                       | 18                           | 16 suffit (Django 6.1 exige ≥ 15)           |

**Contraintes de compatibilité vérifiées sur PyPI :**

- Django 6.1 exige **Python ≥ 3.12** et supporte 3.12 / 3.13 / 3.14.
- DRF 3.18.0 **abandonne** Django 4.2, 5.0 et 5.1 : il exige Django ≥ 5.2. Il n'existe donc
  aucune combinaison « dernier DRF + vieux Django ».
- django-filter 26.1 déclare Django 5.2 / 6.0 / 6.1.
- django-rest-knox 5.1.0 déclare jusqu'à Django 6.0 (pas encore 6.1).
- django-cors-headers 4.9.0 déclare jusqu'à Django 6.0 ; Django 6.1 est annoncé dans le
  changelog non publié.
- django-extensions 4.1 (avril 2025) déclare **au mieux Django 5.2** — c'est le maillon le plus
  en retard. Sa matrice `tox` teste néanmoins `djmaster` sur Python 3.13/3.14, donc le suivi
  amont existe.

### 0.2 🔴 Décision préalable : quel palier viser ?

**Deux cibles défendables. Trancher avant de commencer et inscrire le choix ici.**

| Cible                                   | Fin de support | Pour                                                                                            | Contre                                                                                              |
| --------------------------------------- | -------------- | ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| **Django 6.1** + DRF 3.18 + Py 3.14     | 31/12/2027     | La demande littérale : dernières stables partout                                                | Sortie il y a 11 jours. knox, cors-headers, anymail et django-extensions ne la déclarent pas encore |
| **Django 5.2 LTS** + DRF 3.18 + Py 3.14 | **30/04/2028** | Support **plus long** que 6.1, et c'est la version maximale déclarée par toutes les dépendances | Ce n'est pas « la dernière »                                                                        |

⚠️ **Le point contre-intuitif** : viser la dernière version donne ici **moins** de tranquillité
que viser la LTS. Django 6.1 sort du support principal en avril 2027 et meurt en décembre 2027,
alors que 5.2 LTS vit jusqu'en avril 2028. Sur un projet sans tests et sans CI, ce sont 4 mois de
sursis en plus et zéro dépendance hors matrice déclarée.

**Recommandation** : viser **Django 6.1** comme demandé, mais traiter §2.4 (django-extensions)
comme un vrai point de blocage potentiel. Si `manage.py check` ou `show_urls` casse sous 6.1, se
replier sur **5.2 LTS** — le reste du présent document est identique dans les deux cas (toutes les
suppressions listées en §1 sont antérieures à 5.2, sauf mention contraire).

**Faut-il passer par des paliers intermédiaires ?** Non, sauf si la §5 échoue. L'audit du code a
montré que la surface touchée est très étroite : aucun usage de `ugettext`, `force_text`,
`NullBooleanField`, `index_together`, `STATICFILES_STORAGE`, `django.utils.timezone.utc`,
`postgres.fields.JSONField`, `assertQuerysetEqual`, `filter_fields`, ni de `Model.save()` avec
arguments positionnels. Les seules suppressions qui touchent réellement ce code sont §1.1, §1.2
et §1.3. Un saut direct est donc raisonnable. **Repli** si le saut casse : 3.2 → 4.2 LTS → 5.2
LTS → 6.1, en rejouant §5 à chaque étape.

### 0.3 🔴 Il n'y a aucun garde-fou — et ça change la méthode

Rappel de [verification.md](verification.md) : **aucun test, aucun linter, aucune CI de
vérification**. Le seul filet est la procédure manuelle. Pour un chantier qui traverse 4 versions
majeures de Django, c'est insuffisant : `manage.py check` ne charge pas les vues et ne prouve pas
qu'un sérialiseur d'écriture fonctionne encore.

**Action à faire en tout premier** — se donner un filet, même minimal. Le moins cher qui apporte
quelque chose :

```python
# tout_doux/tests.py — remplace le squelette de startapp
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from tout_doux.models import User


class SmokeTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='smoke', email='smoke@example.com', password='Sm0ke!Test'
        )
        self.client = APIClient()

    def test_login_then_list_projects(self):
        response = self.client.post(
            reverse('login'), {'email': 'smoke@example.com', 'password': 'Sm0ke!Test'}, format='json'
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn('token', response.data)

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {response.data["token"]}')
        self.assertEqual(self.client.get('/project/').status_code, 200)

    def test_project_requires_authentication(self):
        self.assertEqual(self.client.get('/project/').status_code, 401)
```

```bash
docker exec tout_doux_backend python manage.py test tout_doux
```

Ces deux tests couvrent la chaîne complète — routeur, knox, DRF, ORM, PostgreSQL — soit
exactement ce que la migration met en danger. Ils prennent dix minutes à écrire et transforment
chaque section ci-dessous en « je relance, c'est vert ou c'est rouge ».

> ⚠️ Ce fichier est aujourd'hui le squelette de `startapp` (`tout_doux/tests.py`). Le remplir
> **rouvre** W1 de [../quality/watched-risks.md](../quality/watched-risks.md) : mettre cette fiche
> à jour, ou la supprimer si elle devient sans objet.

### 0.4 Vérification après **chaque** section

```bash
./td.sh update dev                        # rebuild obligatoire : requirements.txt change
docker logs --tail 50 tout_doux_backend   # l'app démarre-t-elle ?
docker exec tout_doux_backend python manage.py check
docker exec tout_doux_backend python manage.py makemigrations --check --dry-run
docker exec tout_doux_backend python manage.py test tout_doux   # si §0.3 est fait
docker exec tout_doux_backend python manage.py show_urls | head -40
```

⚠️ **Le rebuild n'est pas optionnel.** Le code est monté en volume, mais `requirements.txt` et
l'image Python ne le sont pas : toute modification de §1.4 à §1.8 exige `./td.sh update dev`.

⚠️ **Les migrations sont jouées au démarrage du conteneur.** La migration knox (§1.6) sera donc
appliquée automatiquement dès le premier `td.sh start` après le rebuild — y compris en
production, par `run.sh`. Faire la sauvegarde de §0.5 **avant**.

### 0.5 Sauvegarde avant déploiement

```bash
docker exec tout_doux_backend python manage.py backupdb > backup-avant-migration.json
```

(`backupdb` écrit sur stdout — cf. [development.md](development.md).)

---

## 1. 🔴 Bloquants

### 1.1 `django.conf.urls.url` supprimé en Django 4.0 — 16 occurrences

`url()` a été supprimé de Django en 4.0. Les deux `urls.py` du projet l'importent : **l'import
lève `ImportError` au démarrage**. C'est le blocage n°1, et c'est ce que R5 identifiait déjà comme
préalable technique à R6.

**Le piège à comprendre avant de corriger.** Depuis Django 2.0, `url()` était un alias de
`re_path()` : son premier argument est une **expression régulière non ancrée**, résolue par
`re.search`. `url('auth/login/', …)` matche donc n'importe quel chemin **contenant**
`auth/login/` — `POST /nimportequoi/auth/login/` fonctionne aujourd'hui. Deux traductions
possibles, qui ne sont pas équivalentes :

| Traduction                  | Comportement                                     | Verdict                                          |
| --------------------------- | ------------------------------------------------ | ------------------------------------------------ |
| `re_path('auth/login/', …)` | Identique à aujourd'hui : routes **non ancrées** | Iso-comportement, mais conserve le bug R5        |
| `path('auth/login/', …)`    | Route **ancrée** : seul `/auth/login/` matche    | ✅ **À retenir** — corrige R5 dans le même geste |

Aucune route du projet n'utilise de motif regex (pas de groupe de capture, pas de `\d+`,
pas de `(?P<…>)`) : `path()` s'applique partout sans réécriture. Le frontend n'appelle que les
chemins exacts (`frontend/src/api/api-routes.ts`), donc l'ancrage ne casse aucun appelant connu.

**`backend/urls.py`** — L.16, 21-22 :

```python
# AVANT (L.16-23)
from django.conf.urls import url
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    url('admin/', admin.site.urls),
    url('', include('tout_doux.urls'))
]

# APRÈS
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('tout_doux.urls'))
]
```

**`tout_doux/urls.py`** — L.1, puis les 14 entrées de `urlpatterns` (L.24-37) :

```python
# AVANT (L.1)
from django.conf.urls import url
from django.urls import include
# APRÈS
from django.urls import include, path
```

Puis remplacer `url(` par `path(` sur chacune des 14 lignes, sans rien changer d'autre :

| Ligne | Chemin                            | Vue                                                          |
| ----- | --------------------------------- | ------------------------------------------------------------ |
| 24    | `''`                              | `include(router.urls)`                                       |
| 25    | `'auth/login/'`                   | `LoginView`                                                  |
| 26    | `'auth/logout/'`                  | `LogoutView` (knox)                                          |
| 27    | `'auth/register/'`                | `UserRegisterView`                                           |
| 28    | `'auth/activate/'`                | `UserActivationView`                                         |
| 29    | `'auth/resend-activation-email/'` | `ResendActivationEmailView`                                  |
| 30    | `'auth/reset-password-request/'`  | `ResetPasswordRequestView`                                   |
| 31    | `'auth/reset-password/'`          | `ResetPasswordView`                                          |
| 32    | `'auth/validate-password/'`       | `ValidatePasswordView`                                       |
| 33    | `'auth/confirm-email-change/'`    | `ConfirmEmailView`                                           |
| 34    | `'auth/check-token/'`             | `CheckTokenView`                                             |
| 35    | `'auth/check-password/'`          | `CheckPasswordView`                                          |
| 36    | `'preferences/'`                  | `PreferencesViewSet`                                         |
| 37    | `'api-auth/'`                     | `include('rest_framework.urls', namespace='rest_framework')` |

> `path('', include(router.urls))` reste correct : le préfixe vide consomme zéro caractère et les
> motifs générés par `DefaultRouter` sont, eux, déjà ancrés.

**Vérification** — la liste complète des routes doit être **identique** avant/après :

```bash
docker exec tout_doux_backend python manage.py show_urls | sort > /tmp/urls-apres.txt
diff /tmp/urls-avant.txt /tmp/urls-apres.txt   # capturer /tmp/urls-avant.txt AVANT la migration
```

⚠️ **Capturer `urls-avant.txt` avec l'ancienne image, avant de toucher quoi que ce soit.**

Une fois validé : supprimer **R5** de
[../quality/refactoring-backlog.md](../quality/refactoring-backlog.md) (ligne du tableau **et**
section), et mettre à jour
[../architecture/api-surface.md](../architecture/api-surface.md) si sa table mentionne `url()` ou
le non-ancrage.

---

### 1.2 `USE_L10N` supprimé en Django 5.0

Le réglage a été retiré en 5.0 (son comportement est devenu inconditionnel dès 4.0). Le laisser
n'empêche pas le démarrage, mais Django le considère alors comme un réglage inconnu : il ne fait
plus rien et masque l'intention.

```python
# backend/settings.py — AVANT (L.152-156)
USE_I18N = True

USE_L10N = True

USE_TZ = True

# APRÈS
USE_I18N = True

USE_TZ = True
```

> `USE_TZ = True` est déjà explicite : le changement de valeur par défaut en Django 5.0
> (`False` → `True`) n'a **aucun** effet ici. Rien à faire.

---

### 1.3 `CORS_ORIGIN_ALLOW_ALL` supprimé en django-cors-headers 4.0

Le réglage a été renommé en 3.5.0 (l'ancien nom restant un alias), puis **l'alias a été supprimé
en 4.0.0**. Avec 4.9.0, `CORS_ORIGIN_ALLOW_ALL = True` est simplement **ignoré en silence** : le
middleware n'ajoute plus aucun en-tête CORS et **toutes les requêtes du frontend échouent en
preflight**.

⚠️ Panne silencieuse au démarrage : `manage.py check` ne dit rien. Seul un appel réel depuis le
navigateur la révèle.

```python
# backend/settings.py — AVANT (L.82)
CORS_ORIGIN_ALLOW_ALL = True
# APRÈS
CORS_ALLOW_ALL_ORIGINS = True
```

> **À arbitrer** : `CORS_ALLOW_ALL_ORIGINS = True` sur une API authentifiée exposée à internet est
> large. La migration est l'occasion de passer à `CORS_ALLOWED_ORIGINS = [settings.SERVER_URL]`.
> **Mais c'est un changement de comportement** : le faire dans un commit séparé, après que la
> migration soit validée, et vérifier que `SERVER_URL` (qui finit par `/`) est normalisé — la
> liste `CORS_ALLOWED_ORIGINS` attend des origines **sans** slash final.

---

### 1.4 `psycopg2` épinglé sous le minimum de Django

`requirements.txt` L.7 : `psycopg2>=2.8.6,<2.8.7`. Or :

- Django 4.0 relève le minimum de 2.5.4 à **2.8.4** (OK) ;
- Django 6.0 le relève à **2.9.9** — la contrainte actuelle est incompatible ;
- psycopg2 2.8.x ne compile pas sur Python 3.12+.

```
# requirements.txt — AVANT (L.7)
psycopg2>=2.8.6,<2.8.7
# APRÈS
psycopg2==2.9.12
```

Les dépendances de compilation sont déjà présentes dans les deux Dockerfiles (`build-base`,
`postgresql-dev`, `musl-dev`, `linux-headers`, `libffi-dev`) : rien à ajouter.

> **Alternative** — passer à `psycopg[binary]==3.3.4` (psycopg 3), supporté par Django ≥ 4.2 et
> recommandé en amont. Ça évite la compilation. **Mais ça impose §2.2** (`wait_for_db` importe
> `psycopg2` en dur) et c'est un changement de driver, donc un risque supplémentaire dans un
> chantier qui en compte déjà. **Traité en §4.1, après la migration.**

---

### 1.5 🔴 `django-mailjet` est abandonné depuis 2017

`requirements.txt` L.9 : `django-mailjet`, **sans épinglage**. Faits vérifiés sur PyPI :

- dernière version **0.3.1, publiée le 02/03/2017** ;
- classifiers : Django 1.8 / 1.10 / 1.11, Python 3.4 / 3.5 ;
- distribuée en **sdist uniquement**, sans métadonnées de dépendances : `mailjet_rest` n'est tiré
  que via `setup.py` ;
- le paquet qu'elle importe, `mailjet_rest`, est lui bien vivant (1.7.0, juin 2026) mais a été
  réécrit — la compatibilité de l'appel `Client(auth=…, version='v3.1')` puis
  `client.send.create()` **n'est pas garantie**.

Le code de `django_mailjet/backends.py` n'utilise en revanche **que des API Django publiques**
(`BaseEmailBackend`, `sanitize_address`, `DEFAULT_ATTACHMENT_MIME_TYPE`) — toutes trois toujours
présentes dans Django 6.1 (`django/core/mail/message.py`, L.107 et L.46). Il n'est donc **pas
exclu** qu'il fonctionne encore.

**C'est le seul point du chantier qui affecte la production sans se voir en développement** :
`BACKEND_USE_EMAIL_FILE_SYSTEM=1` en dev court-circuite entièrement Mailjet
(`settings.py` L.137-143), et l'envoi est **fire-and-forget** dans un thread
([../adr/0005-fire-and-forget-emails.md](../adr/0005-fire-and-forget-emails.md)) : un échec est
**silencieux**. Concrètement, si ce point est raté, plus personne ne peut activer son compte ni
réinitialiser son mot de passe, et **aucune erreur n'apparaît nulle part**.

**Décision recommandée : remplacer par `django-anymail[mailjet]`** (15.1, maintenu, exige
Django ≥ 5.0, déclare jusqu'à Django 6.0).

```
# requirements.txt — AVANT (L.9)
django-mailjet
# APRÈS
django-anymail[mailjet]==15.1
```

```python
# backend/settings.py — AVANT (L.137-143)
if bool(int(os.environ.get('BACKEND_USE_EMAIL_FILE_SYSTEM', 0))):
    EMAIL_BACKEND = 'django.core.mail.backends.filebased.EmailBackend'
    EMAIL_FILE_PATH = os.path.join(BASE_DIR, 'tmp/email')
else:
    EMAIL_BACKEND = 'django_mailjet.backends.MailjetBackend'
    MAILJET_API_KEY = os.environ.get('MAILJET_API_KEY')
    MAILJET_API_SECRET = os.environ.get('MAILJET_API_SECRET')

# APRÈS
if bool(int(os.environ.get('BACKEND_USE_EMAIL_FILE_SYSTEM', 0))):
    EMAIL_BACKEND = 'django.core.mail.backends.filebased.EmailBackend'
    EMAIL_FILE_PATH = os.path.join(BASE_DIR, 'tmp/email')
else:
    EMAIL_BACKEND = 'anymail.backends.mailjet.EmailBackend'
    ANYMAIL = {
        'MAILJET_API_KEY': os.environ.get('MAILJET_API_KEY'),
        'MAILJET_SECRET_KEY': os.environ.get('MAILJET_API_SECRET'),
    }
```

⚠️ **Le nom de la clé change** : anymail attend `MAILJET_SECRET_KEY`, pas `MAILJET_API_SECRET`.
Les variables d'environnement (`docker-compose*.yml`, `conf.tpl.env`, secrets GitHub) restent
`MAILJET_API_KEY` / `MAILJET_API_SECRET` — **ne pas les renommer**, seul le mapping dans
`settings.py` change.

`tout_doux/services/email.py` n'utilise que `EmailMultiAlternatives` + `attach_alternative()` :
**aucune modification**, anymail est un backend de transport transparent.

**Vérification obligatoire, en conditions réelles** (aucun autre moyen) :

```bash
# 1. En dev, forcer le vrai transport avec de vraies clés
#    BACKEND_USE_EMAIL_FILE_SYSTEM=0 dans .conf/development/conf.env, puis td.sh update dev
# 2. Déclencher un envoi via un endpoint réel
curl -s -X POST http://localhost:8000/auth/reset-password-request/ \
  -H 'Content-Type: application/json' -d '{"email":"<une-adresse-réelle>"}'
# 3. Vérifier la réception ET le tableau de bord Mailjet
docker logs --tail 50 tout_doux_backend
```

⚠️ L'endpoint répond **204 quoi qu'il arrive** (`views/auth.py:52-60`, `raise_exception=False`) :
le code HTTP ne prouve rien. Seule la réception effective compte.

> **Si le remplacement est jugé trop risqué à ce stade** : garder `django-mailjet` en l'épinglant
> (`django-mailjet==0.3.1` + `mailjet-rest==1.7.0`) et exécuter la même vérification. Mais alors
> l'inscrire dans [../quality/watched-risks.md](../quality/watched-risks.md) avec un déclencheur
> mesurable — par exemple « au premier échec d'envoi constaté, ou à la prochaine majeure de
> Django ». Ne pas laisser une dépendance de 2017 non tracée.

---

### 1.6 🔴 knox 4.\* → 5.1 : tous les jetons existants sont invalidés

`requirements.txt` L.6 : `django-rest-knox==4.*` — épinglage flou qui résout aujourd'hui vers
4.2.0. Deux ruptures cumulées dans le changelog amont :

- **4.2.0** : « Migration: 'salt' field of model 'AuthToken' is removed, **WARNING: invalidates
  old tokens!** »
- **5.0.0** : « **Tokens created prior to this release will no longer work** » (abandon de
  `cryptography` au profit de `hashlib`).

**Conséquence à assumer : au déploiement, tous les utilisateurs connectés sont déconnectés.**
Ce n'est pas évitable et ce n'est pas grave : le frontend intercepte les 401 et purge le jeton
(`frontend/src/axios/axios-instance.ts:20-21`). L'utilisateur retombe sur l'écran de connexion.
**À annoncer si le service a des utilisateurs actifs.**

**Ce qui ne change pas** (vérifié dans la doc et le code amont) :

- `REST_KNOX` : `TOKEN_TTL`, `AUTO_REFRESH` et `AUTH_HEADER_PREFIX` restent des noms valides →
  `settings.py` L.125-129 **inchangé** ;
- `knox.auth.TokenAuthentication` (L.120) → inchangé ;
- `knox.views.LoginView` / `LogoutView` → inchangés ; la charge utile de login contient toujours
  `token` et `expiry`, ce qu'attend `frontend/src/models/login.model.ts` ;
- `LogoutView` répond toujours `204`.

```
# requirements.txt — AVANT (L.6)
django-rest-knox==4.*
# APRÈS
django-rest-knox==5.1.0
```

**Migrations knox** : le passage 4.x → 5.x apporte ses propres migrations, jouées automatiquement
au démarrage du conteneur (dev) et par `run.sh` (prod). D'où la sauvegarde de §0.5.

**Nouveaux réglages disponibles** (facultatifs, à ne pas activer dans ce chantier) :
`AUTO_REFRESH_MAX_TTL` plafonne la durée de vie totale quand `AUTO_REFRESH = True` — ce qui est
le cas ici. À envisager dans un commit séparé.

**Vérification** :

```bash
docker exec tout_doux_backend python manage.py showmigrations knox
# puis : se connecter depuis le frontend, appeler un endpoint protégé, se déconnecter
```

Mettre à jour [../architecture/auth.md](../architecture/auth.md) si elle décrit le modèle
`AuthToken`, le champ `salt` ou l'algorithme de hachage.

---

### 1.7 Images Docker : `python:3.9-alpine` → `3.14-alpine`

Python 3.9 est en fin de vie depuis octobre 2025 et Django 6.1 exige ≥ 3.12. Les deux Dockerfiles
sont à modifier **de la même façon** — en oublier un donne une production qui ne construit plus.

```dockerfile
# .conf/development/backend/Dockerfile — L.1
# AVANT
FROM python:3.9-alpine
# APRÈS
FROM python:3.14-alpine
```

```dockerfile
# .conf/production/backend/Dockerfile — L.1
# AVANT
FROM python:3.9-alpine
# APRÈS
FROM python:3.14-alpine
```

Le tag `python:3.14-alpine` existe (3.14.7, base Alpine 3.24). Le reste des deux Dockerfiles
(dépendances de build, `adduser`, `USER backend`, volumes) reste valable.

⚠️ **C'est la modification la plus susceptible d'échouer au build**, pas à l'exécution : voir
§2.3 (uWSGI) et §1.4 (psycopg2). Prévoir un premier `./td.sh build dev` qui échoue et lire la
sortie de `pip install`.

Mettre à jour [development.md](development.md) — la section « Prérequis » annonce « Python 3.9
vit dans l'image ».

---

### 1.8 `requirements.txt` : réécriture complète

Le fichier n'a **ni lockfile ni épinglage cohérent** : `django-rest-knox==4.*` et
`django-mailjet` (sans version) rendent la construction non reproductible — deux builds à deux
mois d'écart peuvent installer des versions différentes. Sur un chantier de migration, c'est
exactement ce qu'il ne faut pas.

```
# AVANT
Django==3.2.9
django-cors-headers==3.10.0
djangorestframework==3.12.4
django-filter==2.4.0
django_extensions==3.1.3
django-rest-knox==4.*
psycopg2>=2.8.6,<2.8.7
uWSGI>=2.0.19.1,<2.1
django-mailjet

# APRÈS (cible Django 6.1)
Django==6.1
djangorestframework==3.18.0
django-cors-headers==4.9.0
django-filter==26.1
django-extensions==4.1
django-rest-knox==5.1.0
django-anymail[mailjet]==15.1
psycopg2==2.9.12
uWSGI==2.0.31
```

**Variante repli Django 5.2 LTS** — seule la première ligne change :

```
Django==5.2.17
```

(DRF 3.18.0 exige Django ≥ 5.2 : il fonctionne dans les deux cas.)

Notes :

- `django_extensions` → `django-extensions` : les deux formes fonctionnent, la seconde est le nom
  canonique.
- Épinglage **exact** partout : sans lockfile, c'est le seul moyen d'avoir un build reproductible.
- ⚠️ La montée de version n'est effective qu'après **`./td.sh update dev`** (rebuild).

---

## 2. 🟠 Iso-comportement

### 2.1 🔴 en production — CSRF / `Origin` derrière nginx

**Ce point ne se voit pas en développement et casse l'admin en production.** À traiter comme un
bloquant si l'admin Django ou l'API browsable sont utilisés en prod.

Django 4.0 a ajouté la **vérification de l'en-tête `Origin`** dans `CsrfViewMiddleware`, en plus
de l'ancienne vérification du `Referer`. Django compare `Origin` à l'origine reconstruite depuis
`request.get_host()` **et le schéma vu par Django**.

Or la chaîne de production est : navigateur → nginx (HTTPS) → socket uwsgi → Django. Et
`.conf/production/frontend/uwsgi_params` ne transmet **ni** `X-Forwarded-Proto` **ni**
`UWSGI_SCHEME` : Django reconstruit donc systématiquement `http://<api_host>`, alors que le
navigateur envoie `Origin: https://<api_host>`. **Mismatch → 403 CSRF sur tout POST de session.**

Aujourd'hui, sous Django 3.2, ça passe : la vérification `Referer` n'était appliquée qu'aux
requêtes que Django considérait comme sécurisées — c'est-à-dire jamais, puisqu'il les voit en
`http`. **Django 4.0 supprime cette échappatoire.**

Ce que ça casse : le formulaire de connexion de `/admin/` et celui de `/api-auth/login/`. Ce que
ça **ne** casse **pas** : l'API elle-même, qui est authentifiée par jeton knox et exempte de CSRF.

> _(Diagnostic **déduit** de `uwsgi_params`, des notes de version 4.0 et du comportement de
> `CsrfViewMiddleware` — **non reproduit** : il n'existe pas d'environnement de préproduction. Le
> traiter comme une hypothèse forte à confirmer au premier déploiement, pas comme un fait
> observé.)_

**Correctif** — deux gestes, les deux nécessaires :

```nginx
# .conf/production/frontend/uwsgi_params — ajouter en fin de fichier
uwsgi_param UWSGI_SCHEME $scheme;
```

```python
# backend/settings.py — ajouter près de ALLOWED_HOSTS (après L.30)
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
CSRF_TRUSTED_ORIGINS = [
    f'https://{host}' for host in ALLOWED_HOSTS if host != '*'
]
```

⚠️ `CSRF_TRUSTED_ORIGINS` exige le **schéma** depuis Django 4.0 (`'example.com'` n'est plus
accepté, il faut `'https://example.com'`). Et `ALLOWED_HOSTS` vaut `*` en développement : le
filtre ci-dessus produit alors une liste vide, ce qui est correct (pas de HTTPS en dev).

> **À vérifier avant d'appliquer** : que `SECURE_PROXY_SSL_HEADER` et `UWSGI_SCHEME` ne se
> contredisent pas. `UWSGI_SCHEME` suffit peut-être seul — le tester en production sur un
> déploiement de validation, l'admin étant le seul consommateur.

**Vérification** : après déploiement, se connecter à `https://<api_host>/admin/`. Un 403 « CSRF
verification failed » signe que le correctif n'a pas pris.

---

### 2.2 `wait_for_db` importe `psycopg2` en dur

```python
# tout_doux/management/commands/wait_for_db.py — L.6
from psycopg2 import OperationalError as Psycopg2OpError
```

Sans conséquence tant qu'on reste sur psycopg2 (§1.4). **Mais c'est ce qui casse §4.1** : avec
psycopg 3, cet import lève `ModuleNotFoundError` et **le conteneur ne démarre plus du tout**,
en dev comme en prod (`run.sh` L.6).

À traiter uniquement si §4.1 est retenu. Le correctif est alors de ne plus dépendre du driver :

```python
# APRÈS — la OperationalError de Django enveloppe déjà celle du driver
from django.db.utils import OperationalError
from django.core.management.base import BaseCommand
# … et dans handle() : except OperationalError:
```

---

### 2.3 uWSGI 2.0.31 : compilation sur Python 3.14 + musl

uWSGI n'est distribué qu'en **sdist** : il est compilé à chaque `pip install`, contre les en-têtes
Python de l'image. La version 2.0.31 date d'octobre 2025 ; Python 3.14 est sorti le même mois.
**La compilation sur `python:3.14-alpine` n'est pas garantie et n'a pas été testée ici.**

C'est le risque de build n°1 du chantier, et il ne concerne **que la production**
(`.conf/production/backend/Dockerfile` ; en dev, c'est `runserver`).

**Ordre de traitement recommandé** :

1. Construire l'image de production **avant** de déployer :
   ```bash
   docker compose --file docker-compose.prod.yml --env-file .conf/production/conf.env build backend
   ```
2. Si la compilation échoue, essayer d'abord `python:3.13-alpine` (Django 6.1 le supporte).
3. Si elle échoue encore, basculer sur **gunicorn** (§4.2) — roue pure Python, aucune compilation.

⚠️ Si gunicorn est retenu, `--enable-threads` disparaît : vérifier que les e-mails asynchrones
fonctionnent toujours ([../adr/0005-fire-and-forget-emails.md](../adr/0005-fire-and-forget-emails.md)).
gunicorn autorise les threads par défaut, mais la chaîne nginx change aussi (`uwsgi_pass` →
`proxy_pass`) : c'est un chantier à part entière, à ne pas mêler à celui-ci.

---

### 2.4 `django-extensions` 4.1 n'est testé que jusqu'à Django 5.2

C'est la dépendance la plus en retard : version 4.1 publiée en **avril 2025**, soit avant la
sortie de Django 6.0. Ses classifiers déclarent Django 4.2 / 5.1 / 5.2, et sa matrice `tox` ne va
pas au-delà de `dj52` (plus un job `djmaster`, donc le suivi amont existe).

Ce que le projet en utilise :

- `'django_extensions'` dans `INSTALLED_APPS` (`settings.py` L.43) ;
- `show_urls`, cité comme outil de vérification par [verification.md](verification.md) et par
  `../CLAUDE.md` ;
- `shell_plus`, `graph_models` — jamais dans un script, usage manuel.

**Aucun code du projet n'importe django_extensions.** Le risque est donc borné : au pire,
`show_urls` casse et il faut vérifier les routes autrement.

**Décision si django-extensions bloque le démarrage sous Django 6.1** — dans l'ordre :

1. Retirer temporairement `'django_extensions'` d'`INSTALLED_APPS`, valider le reste de la
   migration, remettre quand une version compatible sort ;
2. ou se replier sur Django 5.2 LTS (§0.2).

**Substitut de `show_urls`** si l'option 1 est retenue :

```bash
docker exec tout_doux_backend python -c "
import django, os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings'); django.setup()
from django.urls import get_resolver
for k in sorted(get_resolver().reverse_dict.keys(), key=str):
    if isinstance(k, str): print(k)
"
```

Si le retrait est retenu, mettre à jour [verification.md](verification.md) (étape 3 de la
procédure manuelle), [development.md](development.md) (section « Commandes `manage.py` maison »)
et `../CLAUDE.md` (bloc « Commandes »).

---

### 2.5 DRF 3.18 : format des erreurs des sérialiseurs `many=True`

DRF 3.18 « change les erreurs des sérialiseurs de liste (`many=True`) au format dict ». Le projet
utilise `many=True` à 12 endroits, mais **tous en lecture ou sur des
`PrimaryKeyRelatedField(many=True)`** — jamais un `Serializer(many=True)` en écriture au niveau
racine. L'impact attendu est donc **nul**.

À confirmer tout de même, parce que le frontend affiche les messages d'erreur de validation tels
quels : envoyer un `tagIds` invalide et comparer la forme de la réponse avant/après.

```bash
# Avec un id de tag inexistant — la réponse doit garder la même forme
curl -s -X POST http://localhost:8000/task/ -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"name":"t","projectId":<id>,"tagIds":[999999]}'
```

Autres changements DRF entre 3.12 et 3.18, **aucun n'affecte ce code** (vérifié par lecture des
sérialiseurs) : abandon de coreapi (le projet n'a pas de schéma généré —
[../adr/0004-no-openapi-schema.md](../adr/0004-no-openapi-schema.md)), dépréciation de
`serializers.NullBooleanField` (non utilisé), `set_context` sur les validateurs (non utilisé),
`basename` sur les routeurs (déjà utilisé partout dans `tout_doux/urls.py`).

---

### 2.6 Django 6.0 a réécrit `EmailMessage` : vérifier les 4 e-mails

Les notes de version 6.0 avertissent : « les implémentations internes de `EmailMessage` et
`EmailMultiAlternatives` ont changé significativement ». `tout_doux/services/email.py` n'utilise
que l'API publique (`EmailMultiAlternatives(**kwargs)`, `attach_alternative()`, `send()`) : rien
à modifier.

Django 5.2 impose par ailleurs que `EmailMultiAlternatives.alternatives` soit alimenté **via
`attach_alternative()`** — c'est déjà le cas (`email.py` L.17).

**Vérification** — exercer les 4 e-mails, en dev avec `BACKEND_USE_EMAIL_FILE_SYSTEM=1`, et
ouvrir chaque fichier produit dans `backend/tmp/email/` pour confirmer que le corps HTML est bien
présent (et pas seulement le texte) :

| E-mail                           | Comment le déclencher                     |
| -------------------------------- | ----------------------------------------- |
| Création de compte               | `POST /auth/register/`                    |
| Réinitialisation de mot de passe | `POST /auth/reset-password-request/`      |
| Demande de changement d'e-mail   | `PATCH /user/<id>/` avec un nouvel e-mail |
| Confirmation de changement       | `POST /auth/confirm-email-change/`        |

```bash
ls -t backend/tmp/email | head -4
```

---

### 2.7 Django 6.1 exige PostgreSQL ≥ 15

Django 6.1 abandonne PostgreSQL 14. Le projet déclare `DB_POSTGRES_VERSION=16-alpine` dans les
deux `conf.tpl.env` → **compatible**.

⚠️ Les `conf.env` réels sont **gitignored** et peuvent avoir dérivé — notamment sur le serveur de
production, installé avant que le modèle passe à 16. **À vérifier explicitement avant de
déployer** :

```bash
docker exec tout_doux_db psql -U <user> -d tout_doux -c 'SELECT version();'
```

Si la production tourne sur une version < 15, la montée de PostgreSQL est un chantier séparé
(dump/restore, volume `td_db`) et **doit précéder** ce déploiement.

---

### 2.8 `DEFAULT_AUTO_FIELD` et `ToutDouxConfig`

Django 6.0 change la valeur par défaut de `DEFAULT_AUTO_FIELD` de `AutoField` à `BigAutoField`.
`settings.py` L.101 la déclare déjà explicitement à `BigAutoField` : **aucun effet**, et la ligne
peut rester (elle documente l'intention).

`tout_doux/apps.py` ne définit pas `default_auto_field` — il hérite donc du réglage global, qui ne
change pas. Aucune migration ne doit apparaître.

**Vérification** — c'est exactement ce que détecte l'étape 2 de [verification.md](verification.md) :

```bash
docker exec tout_doux_backend python manage.py makemigrations --check --dry-run   # doit être vide
```

⚠️ Si une migration **apparaît**, ne pas la générer à l'aveugle : identifier d'abord quel champ
Django veut modifier. Les 4 migrations existantes sont des squashs par release
([development.md](development.md)) — une 5ᵉ migration « technique » romprait cette convention.

---

## 3. 🟡 Dette à traiter au passage

### 3.1 R5 — ancrage des routes

Clos mécaniquement par §1.1 dès lors que la traduction retenue est `path()` et non `re_path()`.
**À valider explicitement** avant de supprimer R5 du backlog :

```bash
# Doit répondre 404 (aujourd'hui : 405 ou 200 — la route non ancrée matche)
curl -s -o /dev/null -w '%{http_code}\n' -X POST http://localhost:8000/nimporte/auth/login/
```

### 3.2 `__pycache__` versionnés

**7 fichiers `.pyc` compilés pour CPython 3.8 sont suivis par git** (vérifié) :

```
backend/backend/__pycache__/{__init__,settings,urls,wsgi}.cpython-38.pyc
backend/tout_doux/__pycache__/{__init__,admin}.cpython-38.pyc
backend/tout_doux/migrations/__pycache__/__init__.cpython-38.pyc
```

L'arbre de travail en contient d'autres, non suivis, en `.cpython-39`. Tous deviennent inertes
avec Python 3.14 — le nom de fichier encode la version — mais ils restent du bruit trompeur : un
lecteur peut croire que le projet cible encore 3.8.

```bash
git rm -r --cached 'backend/**/__pycache__'
find backend -name __pycache__ -type d -exec rm -rf {} +
```

`.gitignore` L.112 (`*.pyc`) les couvre déjà — ils sont suivis parce qu'ils ont été commités
**avant** l'ajout de la règle, et `.gitignore` ne désindexe jamais. Un `git rm --cached` suffit
donc, sans toucher au `.gitignore`.

> **Trouvaille annexe, hors périmètre de ce chantier** : les règles `.gitignore` L.36-39
> (` __pycache__/`, ` *.pyc`, ` *.py[cod]`, ` *$py.class`) commencent toutes par une **espace**,
> ce qui est significatif en syntaxe gitignore — elles ne matchent donc rien. Seule L.112, saine,
> fait le travail. À corriger dans un commit séparé.

### 3.3 Mettre à jour la documentation — dans le même commit

Les déclencheurs de `../CLAUDE.md` sont atteints par ce chantier. À reprendre :

| Fichier                                                                | Ce qui change                                                                                                                                |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| [development.md](development.md)                                       | « Python 3.9 vit dans l'image » ; le tableau des variables d'environnement (numéros de ligne de `settings.py` décalés) ; Mailjet             |
| [verification.md](verification.md)                                     | `show_urls` si django-extensions est retiré (§2.4) ; le nouveau niveau de référence de `check --deploy` (§3.4) ; l'existence de tests (§0.3) |
| [../quality/refactoring-backlog.md](../quality/refactoring-backlog.md) | **Supprimer** R5 et R6 (lignes du tableau **et** sections)                                                                                   |
| [../quality/watched-risks.md](../quality/watched-risks.md)             | W1 si §0.3 est fait ; nouvelle fiche si `django-mailjet` est conservé (§1.5)                                                                 |
| [../architecture/auth.md](../architecture/auth.md)                     | Si elle décrit le modèle `AuthToken` de knox (§1.6)                                                                                          |
| [../architecture/api-surface.md](../architecture/api-surface.md)       | Si sa table mentionne `url()` ou le non-ancrage des routes (§1.1)                                                                            |
| `../CLAUDE.md`                                                         | Bloc « Contexte » (« Django 3.2 + DRF 3.12 ») ; ligne « Routes » du tableau des pièges                                                       |
| `../../frontend/CLAUDE.md`                                             | Mention « `../backend` (Django) » si elle cite une version                                                                                   |

### 3.4 Nouveau niveau de référence de `check --deploy`

[verification.md](verification.md) fixe le niveau de référence à **6 avertissements**
(`W004`, `W008`, `W009`, `W012`, `W016`, `W018`). Quatre versions majeures de Django plus tard,
ce compte aura changé — de nouveaux checks existent (dont les checks CSP introduits en 6.0).

```bash
docker exec tout_doux_backend python manage.py check --deploy
```

Recompter, **arbitrer chaque nouvel avertissement** (traiter ou inscrire dans `../quality/`), et
inscrire le nouveau niveau de référence dans [verification.md](verification.md). Ne pas se
contenter de « il y en a plus qu'avant ».

---

## 4. ⚪ Optionnel — après la migration, dans des commits séparés

- **4.1 `psycopg` 3** — `psycopg[binary]==3.3.4` au lieu de `psycopg2`. Supprime la compilation
  au build et c'est la recommandation amont. **Impose §2.2** (`wait_for_db`), sans quoi le
  conteneur ne démarre plus.
- **4.2 gunicorn au lieu d'uWSGI** — supprime la compilation en production. Impose de réécrire
  `run.sh` et de passer `uwsgi_pass` → `proxy_pass` dans
  `.conf/production/frontend/default.conf.tpl`. À ne faire que si §2.3 échoue, ou comme chantier
  à part.
- **4.3 Outillage** — `ruff` + un hook `pre-commit` sur `backend/`. La migration touche 6 fichiers
  Python et 4 fichiers de configuration ; c'est peu, mais c'est le bon moment pour poser le
  garde-fou que W1/W2 de [../quality/watched-risks.md](../quality/watched-risks.md) surveillent.
- **4.4 `CORS_ALLOWED_ORIGINS`** au lieu de `CORS_ALLOW_ALL_ORIGINS` (cf. §1.3).
- **4.5 `AUTO_REFRESH_MAX_TTL`** de knox (cf. §1.6).

---

## 5. Checklist QA finale

À dérouler **entièrement** avant de merger, puis **à nouveau** après le déploiement en
production. Rien ici n'est automatisé.

### Démarrage et configuration

- [ ] `./td.sh update dev` construit les 4 conteneurs sans erreur
- [ ] `docker logs tout_doux_backend` : `wait_for_db` → `migrate` → `runserver`, aucune exception
- [ ] `manage.py check` : 0 erreur
- [ ] `manage.py makemigrations --check --dry-run` : sortie vide
- [ ] `manage.py check --deploy` : compte relevé et arbitré (§3.4)
- [ ] `manage.py showmigrations` : migrations knox appliquées
- [ ] `manage.py test tout_doux` : vert (si §0.3 est fait)

### Routes

- [ ] `show_urls` (ou le substitut §2.4) donne la **même liste** qu'avant migration (`diff`)
- [ ] `POST /nimporte/auth/login/` répond **404** (§3.1)
- [ ] L'API browsable répond sur `http://localhost:8000/`

### Authentification — le chemin le plus exposé (§1.6)

- [ ] Connexion depuis le frontend : la réponse contient `token` et `expiry`
- [ ] Un appel avec `Authorization: Bearer <token>` sur `/project/` répond 200
- [ ] Un appel sans jeton répond 401, et le frontend redirige vers `/login`
- [ ] Un ancien jeton (celui d'avant migration, s'il en reste un) répond 401 — attendu
- [ ] Déconnexion : `POST /auth/logout/` répond 204, le jeton suivant est refusé

### Parcours de compte — dépend des e-mails (§1.5, §2.6)

- [ ] Inscription → e-mail d'activation reçu → lien fonctionnel → compte activé
- [ ] Renvoi d'e-mail d'activation
- [ ] Demande de réinitialisation → e-mail reçu → lien → mot de passe changé
- [ ] Changement d'e-mail en deux temps → les **deux** e-mails partent (nouvelle et ancienne adresse)
- [ ] ⚠️ **Le même parcours refait en production**, avec le vrai transport Mailjet

### CORS et proxy (§1.3, §2.1)

- [ ] Le frontend appelle l'API sans erreur de preflight (onglet Réseau du navigateur)
- [ ] `https://<api_host>/admin/` : la connexion aboutit, pas de 403 CSRF (production)

### Métier — cloisonnement et archivage, ce que les tests ne couvrent pas

Rien dans cette migration ne touche à ces règles, mais elles n'ont **aucun test** et traversent
DRF, dont la version change. Exercer au minimum, avec deux comptes :

- [ ] Créer une tâche en passant l'`id` d'un projet appartenant à **un autre utilisateur** →
      erreur de validation, jamais un succès
      ([../patterns/ownership-and-scoping.md](../patterns/ownership-and-scoping.md))
- [ ] Créer / modifier / supprimer un élément dans un projet **archivé** → refusé aux trois moments
      ([../patterns/archive-guards.md](../patterns/archive-guards.md))
- [ ] Un POST et un PATCH répondent bien avec la **forme de lecture**, pas leurs champs d'entrée
      ([../architecture/serializers.md](../architecture/serializers.md))
- [ ] `GET /project/?size=0` renvoie tout, `?size=20` pagine
      ([../architecture/api-surface.md](../architecture/api-surface.md))
- [ ] Filtres : `?archived=true`, `?date=…`, `?type=…`, `?is_read=…` (django-filter 2.4 → 26.1)
- [ ] Daily : cocher un daily, vérifier l'effet sur la tâche source
      ([../domain/daily-rules.md](../domain/daily-rules.md))
- [ ] Événements : `takesWholeDay: true` efface toujours heures et date de fin
      ([../domain/events.md](../domain/events.md))

### Après déploiement

- [ ] Sauvegarde de §0.5 conservée hors du serveur
- [ ] `docker logs tout_doux_backend` en production : aucune exception dans les 24 h
- [ ] Les utilisateurs actifs ont été prévenus de la déconnexion (§1.6)

---

## Voir aussi

- [development.md](development.md) — lancer, configurer, rebuilder
- [verification.md](verification.md) — la procédure manuelle, et pourquoi elle est le seul filet
- [../quality/refactoring-backlog.md](../quality/refactoring-backlog.md) — R5 et R6, que ce
  chantier clôt
- [../quality/watched-risks.md](../quality/watched-risks.md) — W1 et W2, l'absence d'outillage
