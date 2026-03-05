export const AI_MANIFEST_TEXT = `NOM: Balise-IA Prospect Studio
VERSION: 2.0
DESCRIPTION: CRM de prospection B2B pour PME bretonnes.
AUTEUR: Simon Hingant, Lorient Bretagne
BASE_URL: http://127.0.0.1:3000

ACTIONS DISPONIBLES (API REST JSON):

1. Lister tous les leads
   GET /api/leads
   Réponse: { leads: [{ id, entreprise, contact, poste, ville, secteur, scoreGlobal, priorite, statut, email, notes }] }

2. Ajouter un lead
   POST /api/leads
   Body: { entreprise, contact, poste, ville, secteur, email, notes? }
   Réponse: { lead: { id, scoreGlobal, priorite, ... } }

3. Modifier un lead (statut, notes, etc.)
   PATCH /api/leads/:id
   Body: { statut?, notes?, scoreGlobal? }

4. Supprimer un lead
   DELETE /api/leads/:id
   Réponse: { success: true }

5. Envoyer un email de prospection
   POST /api/emails/send
   Body: { leadId, ton?: "professionnel"|"amical"|"technique"|"consulting", longueur?: "court"|"moyen"|"long" }
   Réponse: { success: true, messageId }

6. Enroller un lead dans une séquence
   POST /api/sequences/enroll
   Body: { leadId, sequenceId }
   Réponse: { enrollment: { id, nextSendDate, currentStep } }

7. Stopper/Pauser une séquence
   PATCH /api/sequences/enrollment/:id
   Body: { status: "paused"|"active"|"stopped" }

8. Lister les activités
   GET /api/activities
   Query params optionnels: ?statut=a_faire&leadId=xxx

9. Marquer une activité terminée
   PATCH /api/activities/:id
   Body: { statut: "termine" }

10. Créer une activité manuelle
    POST /api/activities
    Body: { leadId, type, description, echeance }

PAGES NAVIGABLES:
/ → Dashboard cockpit principal
/leads → Table de tous les leads
/pipeline → Kanban par statut
/activities → Liste des tâches et appels
/emails → Générateur et envoi d'emails
/sequences → Gestion des séquences automatiques
/import → Import CSV en masse

STATUTS LEAD POSSIBLES: nouveau, a_contacter, contacte, en_discussion, chaud, perdu
SÉQUENCES DISPONIBLES: "sequence-classique-14j", "sequence-audit-flash"
`;
