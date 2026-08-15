# 0003 — Jetons Knox et connexion par e-mail

- **Statut** : accepté
- **Date** : 2023-04 (`b77d201` ajoute `django-rest-knox`, `796adbd` implémente
  l'authentification, `dd5ec25` remplace le modèle utilisateur)

## Contexte

Le client est une SPA servie par nginx sur un domaine, l'API sur un autre
(`SERVER_HOST` / `API_HOST`, voir `.conf/production/frontend/default.conf.tpl`). Une
authentification par session Django et cookie était donc inconfortable (cookies inter-domaines,
CSRF sur chaque écriture). Par ailleurs, le produit voulait une identité par **adresse e-mail**,
alors que Django impose `username` comme identifiant.

## Décision

Trois choix pris ensemble :

1. **`django-rest-knox`** comme classe d'authentification par défaut, avec le préfixe d'en-tête
   forcé à `Bearer` (`settings.py:128`), un TTL de **7 jours** et `AUTO_REFRESH` actif.
2. **Un modèle `User` maison** (`AUTH_USER_MODEL = "tout_doux.User"`) qui rend `email` unique.
   `username` reste obligatoire et unique, mais ne sert plus à se connecter.
3. **Deux classes maison** pour découpler la connexion du reste : `EmailBackend`
   (`AUTHENTICATION_BACKENDS`) qui authentifie sur l'e-mail, et `EmailPasswordAuthentication`
   qui lit les identifiants dans le **corps JSON** de la requête plutôt que dans un en-tête
   `Authorization: Basic`.

## Alternatives écartées

- **JWT (`simplejwt`)** — rejeté : un JWT n'est pas révocable sans liste noire, or le produit
  révoque explicitement les sessions à trois occasions (réinitialisation de mot de passe,
  changement d'e-mail, désactivation d'un compte). Knox stocke ses jetons en base, donc
  `user.auth_token_set.all().delete()` suffit. Voir
  [../architecture/auth.md](../architecture/auth.md).
- **`rest_framework.authtoken`** — rejeté : un seul jeton par utilisateur, jamais expiré, stocké
  en clair.
- **Session Django + cookie** — rejeté pour les raisons de domaine ci-dessus. Le module est
  pourtant toujours monté (`api-auth/`) pour l'API browsable de DRF.
- **Supprimer `username` du modèle** — non fait : `AbstractUser` l'impose, et le retirer aurait
  demandé un `AbstractBaseUser` complet avec son manager. Le champ subsiste, avec un endpoint
  `user/is-username-unique/` pour le valider à l'inscription.

## Conséquences

- **Le préfixe `Bearer` n'est pas celui de Knox** (`Token` par défaut). Un client qui suit la
  doc de Knox échoue silencieusement en 401.
- **`AUTO_REFRESH` prolonge le jeton à chaque requête** (au plus une fois par minute) : un
  utilisateur actif n'est jamais déconnecté, et le champ `expiry` renvoyé au login devient
  rapidement faux. Le front le reçoit et ne le lit pas.
- **Pas de refresh token, pas de rotation.** L'expiration se découvre au premier 401.
- `TOKEN_LIMIT_PER_USER` n'est pas réglé : un utilisateur peut accumuler autant de jetons actifs
  que de connexions.
- L'authentification par e-mail a imposé `EmailBackend`, qui exécute un hachage à vide pour les
  e-mails inconnus afin de limiter la fuite par temps de réponse — comportement volontaire à ne
  pas « optimiser ».

## Preuve

`settings.py:117-129`, `auth/email_backend.py`, `auth/json_authentication.py`. Les trois commits
d'avril 2023 sont consécutifs. Aucun message ne motive le choix : **rationale inféré** des
contraintes de déploiement (deux vhosts distincts) et des trois points de révocation présents
dans le code.
