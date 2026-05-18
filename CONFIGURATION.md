# Configuration du projet

Ce document présente les configurations nécessaires pour le projet.
Il couvre :

- l'API FastAPI (`src/api/app/config.py`)
- les Azure Functions Python (`src/function/worker/function_app.py`)
- le frontend Next.js (`src/app/src/app/job/createJob/page.js`)

---

## 1. API FastAPI

L'API FastAPI charge les variables d'environnement via `src/api/app/config.py`.
Ce module utilise `pydantic-settings` et recherche un fichier `.env`.

Variables attendues :

- `COSMOS_ENDPOINT` : URL du compte Azure Cosmos DB.
- `COSMOS_KEY` : clé d'accès au compte Cosmos DB.
- `COSMOS_DATABASE` : nom de la base de données Cosmos DB.
  - Valeur par défaut : `db-dev`
- `COSMOS_CONTAINER` : nom du container Cosmos DB.
  - Valeur par défaut : `jobs`
- `BLOB_CONNECTION_STRING` : chaîne de connexion au compte Azure Blob Storage.
- `BLOB_CONTAINER` : nom du container Blob Storage utilisé pour l'upload.

Exemple de `.env` pour l'API :

```env
COSMOS_ENDPOINT=https://<votre-compte-cosmos>.documents.azure.com:443/
COSMOS_KEY=<votre-cle-cosmos>
COSMOS_DATABASE=db-dev
COSMOS_CONTAINER=jobs
BLOB_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=...;AccountKey=...;EndpointSuffix=core.windows.net
BLOB_CONTAINER=dev-storage
```

Notes :

- `COSMOS_ENDPOINT` et `COSMOS_KEY` sont obligatoires.
- `BLOB_CONNECTION_STRING` et `BLOB_CONTAINER` doivent pointer vers le même compte/storage que l'API utilise pour générer les SAS d'upload.

---

## 2. Azure Functions

Les fonctions sont définies dans `src/function/worker/function_app.py`.
La configuration est entièrement gérée par des variables d'environnement.

### Variables requises

- `AzureWebJobsStorage` : connexion Azure Blob Storage pour les triggers de fonction.
- `COSMOS_ENDPOINT` : URL du compte Cosmos DB.
- `COSMOS_KEY` : clé d'accès Cosmos DB.
- `COSMOS_DATABASE` : nom de la base Cosmos DB.
  - Valeur par défaut : `db-dev`
- `COSMOS_CONTAINER` : nom du container Cosmos DB.
  - Valeur par défaut : `jobs`
- `SERVICE_BUS_CONNECTION` : chaîne de connexion Azure Service Bus.
- `SIGNALR_CONNECTION_STRING` : chaîne de connexion Azure SignalR.
- `SIGNALR_HUB_NAME` : nom du hub SignalR.
  - Valeur par défaut : `jobNotifications`
- `OPENAI_API_KEY` : clé API OpenAI pour le modèle Gemini.
- `OPENAI_MODEL` : nom du modèle OpenAI/Gemini.
  - Valeur par défaut : `gemini-1.5`

### Configuration Service Bus + DLQ

Le projet utilise une queue Azure Service Bus nommée `job-processing`.

- La fonction `WorkerFile` publie un message dans `job-processing` après la mise à jour du job en `QUEUED`.
- La fonction `ProcessJob` lit la queue `job-processing` et exécute le traitement IA.
- La Dead Letter Queue est automatiquement associée à `job-processing`.
- La fonction `ProcessDLQ` écoute `job-processing/$deadletterqueue`.
- En cas d'échec répété / expiration du message, le message est transféré vers la DLQ.

Le seul paramètre nécessaire est :

- `SERVICE_BUS_CONNECTION` : chaîne de connexion au namespace Service Bus.

### Paramètres Service Bus à connaître

- `job-processing` : nom de la queue principale.
- `job-processing/$deadletterqueue` : endpoint DLQ lié à la queue.
- La clé utilisée doit avoir les droits `Send` et `Listen`.

### Configuration Azure SignalR

La solution utilise Azure SignalR pour notifier le frontend en temps réel.

- `SIGNALR_CONNECTION_STRING` : chaîne de connexion du service SignalR.
- `SIGNALR_HUB_NAME` : nom du hub.
  - Valeur par défaut : `jobNotifications`

Le code effectue deux actions principales :

1. négociation SignalR sur l'endpoint `/negotiate`
2. envoi de notifications avec le hub de SignalR

Si `SIGNALR_CONNECTION_STRING` est absent, les notifications sont désactivées.

### Exemple de configuration d'application Azure Functions

```env
AzureWebJobsStorage=DefaultEndpointsProtocol=https;AccountName=...;AccountKey=...;EndpointSuffix=core.windows.net
COSMOS_ENDPOINT=https://<votre-compte-cosmos>.documents.azure.com:443/
COSMOS_KEY=<votre-cle-cosmos>
COSMOS_DATABASE=db-dev
COSMOS_CONTAINER=jobs
SERVICE_BUS_CONNECTION=Endpoint=sb://...;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=...
SIGNALR_CONNECTION_STRING=Endpoint=https://...;AccessKey=...;Version=1.0;
SIGNALR_HUB_NAME=jobNotifications
OPENAI_API_KEY=<votre-cle-openai>
OPENAI_MODEL=gemini-1.5
```

---

## 3. Frontend Next.js

Le frontend utilise une variable d'environnement publique Next.js.
Elle est lue dans `src/app/src/app/job/createJob/page.js` et `src/app/src/app/job/page.js`.

- `NEXT_PUBLIC_FUNCTION_APP_URL` : URL de l'API / Function App utilisée par le frontend.

Le code contient une URL de secours par défaut :

```js
https://prof-fonction-app-mt-b0axg8fkaxapdcaf.francecentral-01.azurewebsites.net
```

### Exemple `.env.local`

```env
NEXT_PUBLIC_FUNCTION_APP_URL=https://votre-fonction-app.azurewebsites.net
```

Notes :

- `NEXT_PUBLIC_` est nécessaire pour exposer la variable au client dans Next.js.
- Cette URL doit pointer sur la Function App qui gère la négociation SignalR et les triggers.

---

## 4. Fichier `host.json`

Le fichier `src/function/worker/host.json` contient la configuration runtime des Azure Functions.

- `version: "2.0"`
- `extensionBundle` : `Microsoft.Azure.Functions.ExtensionBundle` avec la plage `[4.*, 5.0.0)`
- `applicationInsights.samplingSettings.isEnabled` : `true`
- `applicationInsights.samplingSettings.excludedTypes` : `Request`

Ce fichier ne définit pas de variables d'environnement, mais contrôle l'exécution des extensions et le comportement de télémétrie.

---

## 5. Bonnes pratiques

- Ne pas committer de secrets dans le dépôt.
- Utiliser un fichier `.env` local pour le développement de l'API.
- Définir les variables d'environnement de production dans le portail Azure ou le pipeline CI/CD.
- Vérifier que les URLs et conteneurs Blob sont cohérents entre l'API, les fonctions et le frontend.
