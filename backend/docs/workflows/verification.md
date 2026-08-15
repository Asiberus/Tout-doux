# Vérifier un changement

**Quand** — avant chaque commit sur `backend/`.

## Il n'y a aucun garde-fou automatique

C'est un fait, pas une omission de cette doc :

| Outil                 | État                                                                                                     |
| --------------------- | -------------------------------------------------------------------------------------------------------- |
| Tests                 | **aucun**. `tout_doux/tests.py` est le squelette de `startapp`, jamais rempli                            |
| Linter / formateur    | **aucun**. Pas de `flake8`, `ruff`, `black`, `isort`, ni de configuration                                |
| Vérification de types | **aucune**. Pas d'annotation, pas de `mypy`                                                              |
| Hook git              | **aucun** pour le backend. `frontend/.husky/` ne couvre que le front                                     |
| CI                    | **aucune**. `.github/workflows/deployment.yml` déploie, ne vérifie rien, et n'est déclenché qu'à la main |

Conséquence pratique : **rien n'empêche un commit qui ne démarre même pas.** La seule
protection est la procédure manuelle ci-dessous.

Suivi de cette absence : [../quality/watched-risks.md](../quality/watched-risks.md) W1 et W2 —
avec les conditions qui rouvriraient le sujet.

## Procédure manuelle

```bash
# 1. Le projet se charge et la configuration est cohérente
docker exec tout_doux_backend python manage.py check

# 2. Aucune dérive entre les modèles et les migrations
docker exec tout_doux_backend python manage.py makemigrations --check --dry-run

# 3. Les routes attendues existent (django_extensions)
docker exec tout_doux_backend python manage.py show_urls | grep <ta-ressource>

# 4. Le serveur redémarre sans erreur
docker logs --tail 30 tout_doux_backend
```

Les étapes 1 et 2 attrapent la majorité des régressions bêtes : import cassé, sérialiseur
référençant un champ inexistant, `Meta.fields` désynchronisé, migration oubliée.

### Exercer l'endpoint

L'API browsable de DRF est le moyen le plus rapide, et elle est active en développement :
se connecter via `http://localhost:8000/api-auth/login/`, puis naviguer depuis
`http://localhost:8000/`.

Pour un endpoint exigeant un jeton :

```bash
TOKEN=$(curl -s -X POST http://localhost:8000/auth/login/ \
  -H 'Content-Type: application/json' \
  -d '{"email":"…","password":"…"}' | python3 -c 'import sys,json;print(json.load(sys.stdin)["token"])')

curl -s http://localhost:8000/project/ -H "Authorization: Bearer $TOKEN"
```

### Ce qu'il faut exercer à la main, faute de test

Pour tout changement touchant un sérialiseur d'écriture, vérifier explicitement :

1. **Le cloisonnement** — appeler avec l'`id` d'un objet appartenant à un autre utilisateur doit
   renvoyer une erreur de validation, pas un succès. Voir
   [../patterns/ownership-and-scoping.md](../patterns/ownership-and-scoping.md).
2. **Les gardes d'archivage** — les trois moments (création, modification, suppression). Voir
   [../patterns/archive-guards.md](../patterns/archive-guards.md).
3. **La forme de la réponse** — un POST/PATCH ne répond pas avec ses champs d'entrée, il répond
   avec la forme de lecture. Voir [../architecture/serializers.md](../architecture/serializers.md).

## `check --deploy`

```bash
docker exec tout_doux_backend python manage.py check --deploy
```

Remonte aujourd'hui **6 avertissements** (`W004`, `W008`, `W009`, `W012`, `W016`, `W018`). Ils
ne sont pas tous pertinents : en développement `DEBUG=1` et la `SECRET_KEY` est volontairement
factice, et le HTTPS est terminé par nginx en production, pas par Django. Ce compte de 6 est le
**niveau de référence** : s'il augmente après un changement, l'avertissement supplémentaire est
à traiter ou à inscrire dans [../quality/](../quality/).

## Pièges

- **`check` ne charge pas les vues.** Une erreur dans un `views/*.py` non importé par
  `views/__init__.py` passera inaperçue. Vérifier que l'export existe.
- **`runserver` recharge en silence après un import cassé** : il affiche l'erreur une fois puis
  attend. Toujours lire `docker logs`, un 500 n'est pas forcément la dernière erreur.
- **Les migrations sont jouées au démarrage du conteneur.** Une migration fautive commitée sera
  appliquée à la base locale de tout le monde dès le prochain `td.sh start dev`.

## Voir aussi

- [development.md](development.md) — lancer et configurer l'application
- [../quality/watched-risks.md](../quality/watched-risks.md) — pourquoi ne rien outiller reste
  défendable aujourd'hui, et à partir de quand ça ne l'est plus
