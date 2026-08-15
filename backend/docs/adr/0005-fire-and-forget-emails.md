# 0005 — E-mails envoyés dans un thread détaché

- **Statut** : accepté
- **Date** : 2023-10 (`8b17536`), transport Mailjet ajouté en 2023-12 (`dc4047f`)

## Contexte

Quatre e-mails jalonnent le cycle de vie d'un compte (activation, réinitialisation, changement
d'e-mail, notification de changement). Trois d'entre eux sont déclenchés depuis un
`serializer.save()`, en plein cycle requête/réponse. Un appel synchrone à l'API Mailjet ajoutait
sa latence — et son indisponibilité — au temps de réponse de l'inscription.

## Décision

`services/email.py:21` — l'envoi part dans un `threading.Thread` détaché :

```python
@staticmethod
def _send_mail_async(**kwargs):
    threading.Thread(target=EmailService._send_mail, kwargs=kwargs).start()
```

La vue répond immédiatement, sans attendre ni vérifier l'envoi. C'est ce qui impose
`--enable-threads` dans la ligne de commande uwsgi
(`.conf/production/backend/run.sh`) : sans cette option, uwsgi désactive le GIL pour les threads
non-uwsgi et le thread ne s'exécute jamais.

## Alternatives écartées

- **Celery + Redis / RabbitMQ** — rejeté : deux conteneurs et un broker de plus dans une stack
  qui en compte quatre, pour quatre e-mails transactionnels sur une application
  quasi mono-utilisateur.
- **`django-q` / `huey` avec le broker en base** — plus léger, mais impose quand même un
  processus worker à superviser dans le `docker-compose`.
- **Envoi synchrone** — rejeté pour la latence, mais c'est l'option qui serait la plus honnête :
  au moins l'échec remonterait à l'utilisateur.

## Conséquences

Toutes négatives, et assumées :

- **Aucune reprise sur échec.** Si Mailjet est indisponible ou refuse le message, l'exception
  meurt dans le thread. Rien n'est journalisé, rien n'est réessayé.
- **Aucune trace.** Il n'existe aucun moyen de savoir a posteriori si un e-mail d'activation est
  parti. Le seul symptôme est un utilisateur qui ne peut pas activer son compte — d'où
  l'existence des deux endpoints de renvoi (`auth/resend-activation-email/` et
  `user/{pk}/resend-activation-email/`), qui sont la **compensation** de ce choix.
- **Dépendance à `--enable-threads`.** Un changement de serveur d'application (gunicorn, ASGI)
  doit reconduire cette garantie, sinon les e-mails cessent silencieusement de partir.
- En développement, `BACKEND_USE_EMAIL_FILE_SYSTEM=1` écrit sur disque, ce qui masque
  entièrement le problème : le thread réussit toujours.

Surveillé, avec sa condition de réouverture, en
[W3](../quality/watched-risks.md).

## Preuve

`services/email.py:20-22`, `.conf/production/backend/run.sh:10`. Aucun message de commit ne
motive le choix : **rationale inféré** de la position des appels (dans `save()`) et de
l'existence des deux endpoints de renvoi.
