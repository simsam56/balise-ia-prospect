# Integrations (future)

Ce dossier est reserve aux futures integrations:

- outils de cold email
- API externes d'enrichissement (email finder, social, firmographic)
- synchronisation CRM externe

Point d'entree recommande: implementer un connecteur dans `integrations/` puis brancher une route API dediee dans `app/api/integrations/...`.
