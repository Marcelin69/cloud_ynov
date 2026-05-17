# Cloud TP1 — Pipeline de Traitement de Documents Azure

Projet réalisé dans le cadre du cours Cloud à Ynov.

Groupe : Marcelin Tingougoui & Hansly AGBAMATE


## Présentation

Ce projet implémente un **pipeline serverless de traitement de documents** sur Microsoft Azure. L'utilisateur uploade un fichier via une interface web. Le système détecte automatiquement l'upload, analyse le fichier par intelligence artificielle pour générer des tags descriptifs, et notifie le frontend en temps réel à chaque étape.


## Architecture
[Utilisateur]
     │
     ▼
[Next.js Frontend]  ──────────────────────────────────────────────┐
     │                                                             │
     │ 1. POST /jobs/                                              │ SignalR
     ▼                                                             │ (temps réel)
[FastAPI – apiJob]                                                 │
     │                                                             │
     │ 2. Crée le job dans Cosmos DB (CREATED)                     │
     │ 3. Génère une URL SAS (upload sécurisé)                     │
     │                                                             │
     ▼                                                             │
[Azure Blob Storage]                                               │
     │                                                             │
     │ 4. Blob Trigger (upload détecté)                            │
     ▼                                                             │
[Azure Function – WorkerFile]                                      │
     │ 5. Cosmos DB → UPLOADED ──────────────────────SignalR ──────┘
     │ 6. Cosmos DB → QUEUED   ──────────────────────SignalR ──────┐
     │ 7. Publie sur Service Bus                                    │
     ▼                                                             │
[Azure Service Bus – Queue "job-processing"]                       │
     │                                                             │
     │ 8. Service Bus Trigger                                       │
     ▼                                                             │
[Azure Function – ProcessJob]                                      │
     │ 9. Cosmos DB → PROCESSING ─────────────────SignalR ─────────┤
     │ 10. AZURE LANGUAGE génère des tags IA                         │
     │ 11. Cosmos DB → PROCESSED (+ tags) ───────SignalR ──────────┘
     │
     │ Si échec répété (max 3 tentatives) :
     ▼
[Service Bus Dead Letter Queue]
     │
     ▼
[Azure Function – ProcessDLQ]
     │ 12. Cosmos DB → ERROR ──────────────────────SignalR ──────→ [Frontend]



### 1. Upload du fichier

L’utilisateur envoie un fichier via le frontend (Next.js).
L’API (FastAPI) crée un **job** et retourne une **URL SAS** permettant d’uploader directement le fichier dans Azure Blob Storage.


### 2. Détection automatique du fichier

Dès que le fichier est uploadé dans le stockage :

* Une Azure Function (`WorkerFile`) se déclenche automatiquement
* Le statut du job passe à **`UPLOADED`**
* Une notification temps réel est envoyée au frontend
* Le job est ensuite mis en file d’attente (**`QUEUED`**) via Azure Service Bus


### 3. Mise en file d’attente

Le job est envoyé dans une queue Service Bus (`job-processing`), ce qui permet :

* de découpler les traitements
* de gérer la charge
* d’assurer la robustesse du système


### 4. Traitement du document

Une seconde Azure Function (`ProcessJob`) traite le job :

* Le statut passe à **`PROCESSING`**
* Une notification est envoyée au frontend
* Une IA (Azure OpenAI) analyse le nom du fichier
* Entre 3 et 8 **tags en français** sont générés automatiquement


### 5. Résultat final

Une fois le traitement terminé :

* Le statut passe à **`PROCESSED`**
* Les tags sont enregistrés dans la base de données (Cosmos DB)
* Le frontend reçoit une notification avec les résultats en temps réel


###  6. Gestion des erreurs

En cas d’échec répété du traitement :

* Le message est envoyé dans une **Dead Letter Queue (DLQ)**
* Une fonction dédiée (`ProcessDLQ`) :

  * met le statut à **`ERROR`**
  * enregistre l’erreur
  * notifie le frontend


### 7. Notifications temps réel

Toutes les étapes importantes sont envoyées au frontend via **Azure SignalR** :

* `UPLOADED`
* `PROCESSING`
* `PROCESSED`
* `ERROR`

Cela permet une mise à jour instantanée de l’interface utilisateur, sans rechargement de page.


###  Résumé

1. Upload du fichier
2. Détection automatique
3. Mise en queue
4. Traitement par IA
5. Génération de tags
6. Résultat en temps réel
7. Gestion des erreurs


### Objectif

Fournir un système scalable, asynchrone et temps réel pour le traitement intelligent de documents.


### Flux des statuts

```
CREATED → UPLOADED → QUEUED → PROCESSING → PROCESSED
                                        └─ (erreur) → ERROR
```


## Services Azure utilisés

| Service | Rôle | Tier |
|
| Azure Blob Storage | Stockage des fichiers uploadés | Standard |
| Azure Cosmos DB | Base NoSQL — état des jobs | Free / Serverless |
| Azure Service Bus | File de messages entre fonctions | Standard |
| Azure Functions | Traitement serverless (Python v2) | Consumption |
| Azure SignalR Service | Notifications temps réel WebSocket | Free |
| Azure App Service | Hébergement API FastAPI (Docker) | B1 |
| Azure Static Web Apps | Hébergement frontend Next.js | Free |


## Structure du projet

```
tp1/
├── src/
│   ├── api/                        # API REST FastAPI
│   │   └── app/
│   │       ├── main.py             # Initialisation FastAPI + CORS
│   │       ├── routes_jobs.py      # Endpoints /jobs
│   │       ├── models.py           # Modèles Pydantic
│   │       ├── cosmos.py           # Client Cosmos DB
│   │       ├── blob_service.py     # Génération URL SAS
│   │       └── config.py           # Variables d'environnement
│   │
│   ├── function/worker/            # Azure Functions (Python v2)
│   │   ├── function_app.py         # 4 fonctions Azure
│   │   ├── host.json               # Configuration extensions bundle
│   │   └── requirements.txt        # Dépendances Python
│   │
│   └── app/                        # Frontend Next.js
│       └── src/app/
│           ├── page.js             # Page d'accueil
│           ├── layout.js           # Layout global
│           └── job/
│               ├── page.js         # Liste des jobs (temps réel)
│               └── createJob/
│                   └── page.js     # Formulaire création + suivi
│
└── .github/workflows/              # CI/CD GitHub Actions
    ├── main_prof-fonction-app-mt.yml   # Déploiement Function App
    ├── main_frontend-doco.yml          # Déploiement Frontend
    └── api-build-push.yml              # Build et déploiement API
```


## Prérequis

- Compte Azure avec abonnement actif
- Azure CLI installé
- Python 3.13
- Node.js 18+
- Docker (pour l'API)


## Variables d'environnement

### Azure Function App

| Variable | Description |
|
| `AzureWebJobsStorage` | Connexion string Azure Blob Storage |
| `COSMOS_ENDPOINT` | URL du compte Cosmos DB |
| `COSMOS_KEY` | Clé d'accès Cosmos DB |
| `COSMOS_DATABASE` | Nom de la base (ex: `db-dev`) |
| `COSMOS_CONTAINER` | Nom du container (ex: `jobs`) |
| `SERVICE_BUS_CONNECTION` | Connexion string Service Bus (RootManageSharedAccessKey) |
| `SIGNALR_CONNECTION_STRING` | Connexion string Azure SignalR |
| `SIGNALR_HUB_NAME` | Nom du hub SignalR (ex: `jobNotifications`) |
| `AZURE_OPENAI_ENDPOINT` | URL Azure OpenAI (optionnel) |
| `AZURE_OPENAI_KEY` | Clé Azure OpenAI (optionnel) |
| `AZURE_OPENAI_DEPLOYMENT` | Nom du déploiement OpenAI (ex: `gpt-4o-mini`) |

### API FastAPI

| Variable | Description |
|
| `COSMOS_ENDPOINT` | URL du compte Cosmos DB |
| `COSMOS_KEY` | Clé d'accès Cosmos DB |
| `COSMOS_DATABASE` | Nom de la base |
| `COSMOS_CONTAINER` | Nom du container |
| `BLOB_CONNECTION_STRING` | Connexion string Azure Blob Storage |
| `BLOB_CONTAINER` | Nom du container blob (ex: `dev-storage`) |

### Frontend Next.js

| Variable | Description |
|
| `NEXT_PUBLIC_FUNCTION_APP_URL` | URL de la Function App Azure |


## Déploiement

Le déploiement est automatisé via **GitHub Actions** sur chaque push vers `main`.

### Function App (Python)
Le workflow `main_prof-fonction-app-mt.yml` :
1. Installe les dépendances Python
2. Crée un zip du dossier `src/function/worker`
3. Déploie sur Azure Function App via `Azure/functions-action`

### API FastAPI (Docker)
Le workflow `api-build-push.yml` :
1. Build l'image Docker de l'API
2. Push vers Azure Container Registry
3. Déploie sur Azure App Service

### Frontend Next.js
Le workflow `main_frontend-doco.yml` :
1. Installe les dépendances npm
2. Build Next.js (`next build`)
3. Déploie sur Azure Static Web Apps


## Tester le pipeline

1. Ouvre le frontend déployé
2. Va sur **Traitements → Nouveau**
3. Saisis un nom de fichier et sélectionne un fichier
4. Clique **Créer le job**
5. Observe les statuts se mettre à jour en temps réel :
   - `UPLOADED` — fichier reçu dans Azure Blob Storage
   - `QUEUED` — message envoyé dans Service Bus
   - `PROCESSING` — traitement IA en cours
   - `PROCESSED` — tags générés et affichés

### Tester la Dead Letter Queue

Pour déclencher la DLQ :
- Le Service Bus réessaie automatiquement jusqu'à 3 fois en cas d'erreur
- Après 3 échecs, le message passe en DLQ
- La fonction `ProcessDLQ` met le job en statut `ERROR` et notifie le frontend


## Points techniques notables

### Upload direct via URL SAS
Le fichier est uploadé directement depuis le navigateur vers Azure Blob Storage via une URL SAS temporaire (15 min). L'API ne sert pas d'intermédiaire pour le fichier binaire, ce qui réduit les coûts et améliore les performances.

### Notifications SignalR sans binding
Le binding Python SignalR en Azure Functions v2 est instable. La solution implémente la négociation SignalR et les notifications manuellement via l'API REST, avec génération de JWT (HMAC-SHA256).

### Tagging IA avec fallback
Si Azure OpenAI n'est pas configuré, le système utilise automatiquement un fallback par analyse de mots-clés du nom de fichier (termes comme `rapport`, `facture`, `cv`, `contrat`, etc.). Le pipeline fonctionne dans les deux cas.

### CORS et SignalR
Le client SignalR JavaScript nécessite `withCredentials: false` pour fonctionner avec un header `Access-Control-Allow-Origin: *` côté serveur. Sans cette configuration, le navigateur bloque les requêtes preflight CORS.
