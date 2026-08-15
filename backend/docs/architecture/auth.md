# Authentification, permissions et e-mails de compte

Identité par **e-mail + mot de passe**, session par **jeton Knox**. Trois familles de jetons
coexistent et ne se ressemblent pas : les confondre est l'erreur la plus facile à commettre
ici.

## Se connecter

```
POST auth/login/ {email, password}
  → EmailPasswordAuthentication          auth/json_authentication.py
      lit request.data (et non l'en-tête Authorization)
      → django.contrib.auth.authenticate(email=…, password=…)
          → EmailBackend                 auth/email_backend.py   (AUTHENTICATION_BACKENDS)
  → knox.views.LoginView                 → {token, expiry, user}
```

`EmailBackend` est un `ModelBackend` dont `authenticate()` prend `email=` au lieu de
`username=`. **Quand l'e-mail est inconnu, il exécute quand même un hachage à vide** pour
égaliser le temps de réponse (`email_backend.py:12`) : c'est délibéré, ne pas « simplifier » ce
`else`.

Ensuite, chaque requête porte `Authorization: Bearer <token>` — préfixe non standard pour Knox
(`Token` par défaut), imposé par `settings.py:128`.

## Les trois familles de jetons

| Famille                 | Généré par                                     | Durée                                                                               | Stocké ?                                            | Sert à                                                 |
| ----------------------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- | --------------------------------------------------- | ------------------------------------------------------ |
| **Session Knox**        | `knox.views.LoginView`                         | **7 jours**, `AUTO_REFRESH` actif                                                   | oui, `knox_authtoken`                               | toutes les requêtes authentifiées                      |
| **Lien à usage unique** | `utils/token.py:6` → `default_token_generator` | **3 jours** (`PASSWORD_RESET_TIMEOUT`, valeur par défaut de Django, non surchargée) | **non** — vérifié par recalcul                      | activation de compte, réinitialisation de mot de passe |
| **Changement d'e-mail** | même générateur, mais **persisté**             | **7 jours** (`utils/date.py:14`)                                                    | oui, `tout_doux_user_email_change`, en clé primaire | confirmation du nouvel e-mail                          |

`AUTO_REFRESH` prolonge le jeton Knox à chaque requête, au plus une fois par minute. En pratique
un utilisateur actif n'est jamais déconnecté ; un utilisateur absent 7 jours l'est.

Les jetons de la 2ᵉ famille sont invalidés **implicitement** par Django dès que le hash du mot de
passe ou `last_login` change. Un lien d'activation cesse donc de fonctionner après une première
connexion — c'est ce qui rend `auth/resend-activation-email/` nécessaire.

## Quelles actions déconnectent les autres sessions

`user.auth_token_set.all().delete()` purge tous les jetons Knox de l'utilisateur.

| Action                                                                       | Purge les sessions ? | Où                                            |
| ---------------------------------------------------------------------------- | -------------------- | --------------------------------------------- |
| Réinitialisation de mot de passe (`auth/reset-password/`)                    | **oui**              | `serializers/auth/reset_password.py:18`       |
| Confirmation de changement d'e-mail                                          | **oui**              | `serializers/auth/confirm_email_change.py:18` |
| Désactivation d'un compte par un admin                                       | **oui**              | `serializers/user/user_account_state.py:16`   |
| **Changement de mot de passe depuis le profil** (`user/me/change-password/`) | **non**              | `serializers/user/user_change_password.py:12` |

La dernière ligne est une **asymétrie non documentée dans le code** : changer son mot de passe
en étant connecté ne révoque aucune autre session, alors que le réinitialiser les révoque
toutes. Comportement non tranché — dette ou choix, l'historique git ne le dit pas.

## Permissions

Défaut global : `IsAuthenticated` (`settings.py:121`). Trois exceptions seulement.

| Classe          | Utilisée par                                                          | Effet                                                  |
| --------------- | --------------------------------------------------------------------- | ------------------------------------------------------ |
| `AllowAny`      | 10 vues d'auth + `user/is-username-unique/` + `user/is-email-unique/` | libre                                                  |
| `IsAdminUser`   | `UserViewSet` (niveau classe)                                         | `is_staff` requis                                      |
| `CreateOrAdmin` | `FeedbackViewSet`                                                     | POST/HEAD/OPTIONS pour tous, le reste réservé au staff |

`permissions/create__or_admin.py` (double underscore dans le nom de fichier — pas une faute de
frappe à corriger sans renommer l'import) contient un `print(request.method)` résiduel :
[../quality/refactoring-backlog.md](../quality/refactoring-backlog.md) R2.

**Il n'y a aucune permission au niveau objet.** Pas de `has_object_permission` nulle part : le
cloisonnement passe entièrement par les querysets —
[adr/0002](../adr/0002-scoping-by-queryset.md) et
[../patterns/ownership-and-scoping.md](../patterns/ownership-and-scoping.md).

## Mots de passe

`AUTH_PASSWORD_VALIDATORS` (`settings.py:108`) : 3 validateurs Django (longueur minimale, mots
de passe courants, non entièrement numérique) **plus 3 maison** dans `validators/` — au moins un
chiffre, une majuscule, un caractère spécial pris dans une liste explicite
(`special_character_validator.py:4`, qui inclut l'espace et `ù £ € ° ¨`).

`auth/validate-password/` expose cette validation **sans authentification**, pour que le front
affiche les règles en direct. Il ne renvoie que des messages, jamais un booléen global.

## E-mails

`services/email.py` — 4 e-mails, tous liés au cycle de vie du compte, tous rendus depuis
`templates/email/`.

| Méthode                           | Template                 | Destinataire         | Lien construit                                |
| --------------------------------- | ------------------------ | -------------------- | --------------------------------------------- |
| `send_user_creation_email`        | `user-creation.html`     | nouvel utilisateur   | `{SERVER_URL}activate?uidb64=…&token=…`       |
| `send_reset_password_email`       | `password-reset.html`    | utilisateur          | `{SERVER_URL}password-reset?uidb64=…&token=…` |
| `send_change_email_request_email` | `change-email.html`      | **nouvelle** adresse | `{SERVER_URL}confirm-email?token=…`           |
| `send_email_changed_email`        | `email-has-changed.html` | **ancienne** adresse | —                                             |

Trois points non évidents :

1. **Les liens pointent vers des routes du front**, pas vers l'API. `SERVER_URL` doit donc être
   l'URL du client et se terminer par `/` : la concaténation est brute
   (`f'{settings.SERVER_URL}activate?…'`). Mal réglé, tous les e-mails partent avec des liens
   morts, sans erreur côté serveur.
2. **L'envoi est asynchrone et sans filet** : `_send_mail_async` lance un `threading.Thread`
   détaché. Aucune reprise, aucun log, l'exception meurt avec le thread —
   [adr/0005](../adr/0005-fire-and-forget-emails.md).
3. **Le backend d'envoi dépend d'une variable d'environnement** :
   `BACKEND_USE_EMAIL_FILE_SYSTEM=1` écrit dans `backend/tmp/email/` au lieu d'envoyer via
   Mailjet. C'est le réglage de développement — voir
   [../workflows/development.md](../workflows/development.md).

## Cycle de vie d'un compte

```
register (is_active=False, Preferences créées)  →  e-mail d'activation
   └─ activate (uidb64 + token)  →  is_active=True  →  login
        ├─ reset-password-request → e-mail → reset-password (purge les sessions)
        ├─ me/change-email → e-mail à la nouvelle adresse → confirm-email-change
        │     (purge les sessions, notifie l'ancienne adresse, supprime la demande)
        └─ me/delete-account (refusé au superuser)
```

`Preferences` n'est créé **que** par `UserRegisterSerializer.create` (`user_register.py:41`) :
un compte créé par `createsuperuser` ou par l'admin Django n'en a pas, et l'endpoint
`preferences/` se comporte mal dans ce cas —
[../quality/refactoring-backlog.md](../quality/refactoring-backlog.md) R3.

## Décisions négatives

- **Pas de JWT, pas de refresh token** — [adr/0003](../adr/0003-knox-and-email-login.md).
- **Pas de vérification en deux facteurs, pas de verrouillage après N échecs, pas de
  throttling** sur `auth/login/`. Assumé pour une application mono-utilisateur —
  [../quality/watched-risks.md](../quality/watched-risks.md) W5.
- **Pas de rôles au-delà de `is_staff` / `is_superuser`.** Aucun groupe, aucune permission
  Django utilisée.
- **`reset-password-request` répond 204 même pour un e-mail inconnu**, délibérément, pour ne pas
  révéler l'existence d'un compte. Ce soin est **annulé** par `user/is-email-unique/`, ouvert et
  explicite — voir W5.

## Voir aussi

- [api-surface.md](api-surface.md) — la liste des endpoints et leurs accès
- [../workflows/development.md](../workflows/development.md) — lire les e-mails en local
- [adr/0003](../adr/0003-knox-and-email-login.md), [adr/0005](../adr/0005-fire-and-forget-emails.md)
