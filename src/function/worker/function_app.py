import azure.functions as func
import logging
import json
import os
import hmac
import hashlib
import base64
import time
from datetime import datetime, timezone
from azure.cosmos import CosmosClient
from azure.servicebus import ServiceBusClient, ServiceBusMessage

app = func.FunctionApp()

SERVICE_BUS_QUEUE = "job-processing"


def now_iso():
    return datetime.now(timezone.utc).isoformat()


def get_cosmos_container():
    client = CosmosClient(os.environ["COSMOS_ENDPOINT"], os.environ["COSMOS_KEY"])
    db = client.get_database_client(os.environ.get("COSMOS_DATABASE", "db-dev"))
    return db.get_container_client(os.environ.get("COSMOS_CONTAINER", "jobs"))


# ── SignalR ──────────────────────────────────────────────────────────────────

def send_signalr_notification(target: str, arguments: list):
    connection_string = os.environ.get("SIGNALR_CONNECTION_STRING", "")
    hub_name = os.environ.get("SIGNALR_HUB_NAME", "jobNotifications")
    if not connection_string:
        logging.info("SIGNALR_CONNECTION_STRING not set, skipping notification")
        return
    try:
        params = dict(p.split("=", 1) for p in connection_string.split(";") if "=" in p)
        endpoint = params.get("Endpoint", "").rstrip("/")
        access_key = params.get("AccessKey", "")

        url = f"{endpoint}/api/v1/hubs/{hub_name}"
        header = base64.urlsafe_b64encode(b'{"alg":"HS256","typ":"JWT"}').decode().rstrip("=")
        payload_str = json.dumps({"aud": url, "exp": int(time.time()) + 300})
        payload = base64.urlsafe_b64encode(payload_str.encode()).decode().rstrip("=")
        signing_input = f"{header}.{payload}".encode()
        sig = hmac.new(access_key.encode(), signing_input, hashlib.sha256).digest()
        signature = base64.urlsafe_b64encode(sig).decode().rstrip("=")
        token = f"{header}.{payload}.{signature}"

        import requests
        resp = requests.post(
            url,
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            json={"target": target, "arguments": arguments},
            timeout=10
        )
        logging.info(f"SignalR '{target}': HTTP {resp.status_code}")
    except Exception as e:
        logging.warning(f"SignalR notification error: {e}")


# ── AI Tagging ───────────────────────────────────────────────────────────────

def _tags_fallback(file_name: str) -> list:
    name = file_name.lower()
    tags = ["document"]
    if file_name.endswith(".pdf"):
        tags.append("pdf")
    elif file_name.endswith(".docx") or file_name.endswith(".doc"):
        tags.append("word")
    elif file_name.endswith((".jpg", ".jpeg", ".png")):
        tags.extend(["image", "photo"])
    if any(k in name for k in ["cv", "resume", "candidature"]):
        tags.extend(["cv", "rh"])
    if any(k in name for k in ["facture", "invoice", "bill"]):
        tags.extend(["facture", "comptabilité"])
    if any(k in name for k in ["contrat", "contract"]):
        tags.extend(["contrat", "juridique"])
    if any(k in name for k in ["rapport", "report"]):
        tags.extend(["rapport", "analyse"])
    if any(k in name for k in ["azure", "cloud"]):
        tags.extend(["azure", "cloud"])
    return list(dict.fromkeys(tags))[:8]  # deduplicate, max 8


def generate_tags(file_name: str) -> list:
    try:
        from azure.ai.textanalytics import TextAnalyticsClient
        from azure.core.credentials import AzureKeyCredential

        endpoint = os.environ["AZURE_LANGUAGE_ENDPOINT"]
        key = os.environ["AZURE_LANGUAGE_KEY"]
        client = TextAnalyticsClient(endpoint=endpoint, credential=AzureKeyCredential(key))

        # Nettoie le nom de fichier pour améliorer l'analyse
        import re
        name_clean = re.sub(r'\.[^.]+$', '', file_name)          # retire l'extension
        name_clean = re.sub(r'[-_]', ' ', name_clean)             # remplace - et _ par espaces
        text = f"Document nommé {name_clean}. Fichier de type professionnel."

        # Extraction des mots-clés
        kp_result = client.extract_key_phrases([text], language="fr")
        tags = []
        for doc in kp_result:
            if not doc.is_error:
                for phrase in doc.key_phrases:
                    tags.extend(phrase.lower().split())

        # Reconnaissance d'entités pour enrichir les tags
        er_result = client.recognize_entities([text], language="fr")
        for doc in er_result:
            if not doc.is_error:
                for entity in doc.entities:
                    tags.append(entity.text.lower())

        # Dédoublonnage + ajout du type de fichier
        ext = file_name.rsplit('.', 1)[-1].lower() if '.' in file_name else ''
        if ext:
            tags.append(ext)
        tags = list(dict.fromkeys(tags))[:8]

        if not tags:
            raise ValueError("Aucun tag extrait")

        logging.info(f"Azure AI Language tags: {tags}")
        return tags
    except Exception as e:
        logging.warning(f"AI tagging failed ({e}), using fallback")
        return _tags_fallback(file_name)


# ── 0. Negotiate (SignalR) ───────────────────────────────────────────────────

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-requested-with",
}

@app.route(route="negotiate", auth_level=func.AuthLevel.ANONYMOUS, methods=["GET", "POST", "OPTIONS"])
def negotiate(req: func.HttpRequest) -> func.HttpResponse:
    if req.method == "OPTIONS":
        return func.HttpResponse(status_code=204, headers=CORS_HEADERS)

    connection_string = os.environ.get("SIGNALR_CONNECTION_STRING", "")
    hub_name = os.environ.get("SIGNALR_HUB_NAME", "jobNotifications")
    if not connection_string:
        return func.HttpResponse("SIGNALR_CONNECTION_STRING not set", status_code=500, headers=CORS_HEADERS)

    params = dict(p.split("=", 1) for p in connection_string.split(";") if "=" in p)
    endpoint = params.get("Endpoint", "").rstrip("/")
    access_key = params.get("AccessKey", "")

    client_url = f"{endpoint}/client/?hub={hub_name}"
    header = base64.urlsafe_b64encode(b'{"alg":"HS256","typ":"JWT"}').decode().rstrip("=")
    payload_str = json.dumps({"aud": client_url, "exp": int(time.time()) + 3600, "iat": int(time.time())})
    payload = base64.urlsafe_b64encode(payload_str.encode()).decode().rstrip("=")
    signing_input = f"{header}.{payload}".encode()
    sig = hmac.new(access_key.encode(), signing_input, hashlib.sha256).digest()
    signature = base64.urlsafe_b64encode(sig).decode().rstrip("=")
    token = f"{header}.{payload}.{signature}"

    return func.HttpResponse(
        body=json.dumps({"url": client_url, "accessToken": token}),
        mimetype="application/json",
        headers=CORS_HEADERS
    )


# ── 1. Blob Trigger ──────────────────────────────────────────────────────────

@app.blob_trigger(arg_name="myblob", path="dev-storage/input/{name}",
                  connection="AzureWebJobsStorage")
def WorkerFile(myblob: func.InputStream):
    blob_name = myblob.name
    blob_size = myblob.length
    logging.info(f"Blob trigger: {blob_name} ({blob_size} bytes)")

    # Parse job_id from path: ".../input/<job_id>/<filename>"
    parts = [p for p in blob_name.split("/") if p]
    try:
        idx = parts.index("input")
        job_id = parts[idx + 1]
        file_name = "/".join(parts[idx + 2:])
    except (ValueError, IndexError):
        logging.error(f"Cannot parse job_id from blob path: {blob_name}")
        return

    uploaded_at = now_iso()

    # Update Cosmos DB → UPLOADED
    try:
        container = get_cosmos_container()
        item = container.read_item(item=job_id, partition_key="JOB")
        item["status"] = "UPLOADED"
        item["blobName"] = blob_name
        item["size"] = blob_size
        item["uploadedAt"] = uploaded_at
        item["updateAt"] = uploaded_at
        container.replace_item(item=item, body=item)
        logging.info(f"Job {job_id} → UPLOADED")
    except Exception as e:
        logging.error(f"Cosmos DB update failed for job {job_id}: {e}")
        return

    # Notify React: UPLOADED
    send_signalr_notification("jobStatusUpdate", [{
        "documentId": job_id,
        "status": "UPLOADED",
        "message": "Fichier reçu"
    }])

    # Update Cosmos DB → QUEUED
    try:
        item["status"] = "QUEUED"
        item["updateAt"] = now_iso()
        container.replace_item(item=item, body=item)
        logging.info(f"Job {job_id} → QUEUED")
    except Exception as e:
        logging.error(f"Cosmos DB QUEUED update failed for job {job_id}: {e}")
        return

    # Publish to Service Bus
    message_body = json.dumps({
        "documentId": job_id,
        "fileName": file_name,
        "blobName": blob_name,
        "size": blob_size,
        "uploadedAt": uploaded_at
    })
    try:
        with ServiceBusClient.from_connection_string(os.environ["SERVICE_BUS_CONNECTION"]) as sb:
            with sb.get_queue_sender(SERVICE_BUS_QUEUE) as sender:
                sender.send_messages(ServiceBusMessage(message_body))
        logging.info(f"Job {job_id} published to Service Bus")
    except Exception as e:
        logging.error(f"Service Bus send failed for job {job_id}: {e}")


# ── 2. Service Bus Trigger (traitement IA) ───────────────────────────────────

@app.service_bus_queue_trigger(
    arg_name="msg",
    queue_name="job-processing",
    connection="SERVICE_BUS_CONNECTION"
)
def ProcessJob(msg: func.ServiceBusMessage):
    body = msg.get_body().decode("utf-8")
    data = json.loads(body)
    job_id = data["documentId"]
    file_name = data.get("fileName", "")
    logging.info(f"Processing job {job_id} (file: {file_name})")

    # Update Cosmos DB → PROCESSING
    try:
        container = get_cosmos_container()
        item = container.read_item(item=job_id, partition_key="JOB")
        item["status"] = "PROCESSING"
        item["updateAt"] = now_iso()
        container.replace_item(item=item, body=item)
    except Exception as e:
        logging.error(f"Cosmos DB PROCESSING update failed: {e}")
        raise

    # Notify React: PROCESSING
    send_signalr_notification("jobStatusUpdate", [{
        "documentId": job_id,
        "status": "PROCESSING",
        "message": "Traitement IA en cours"
    }])

    # Generate tags with AI
    tags = generate_tags(file_name)
    processed_at = now_iso()

    # Update Cosmos DB → PROCESSED
    try:
        item["status"] = "PROCESSED"
        item["tags"] = tags
        item["processedAt"] = processed_at
        item["updateAt"] = processed_at
        container.replace_item(item=item, body=item)
        logging.info(f"Job {job_id} → PROCESSED (tags: {tags})")
    except Exception as e:
        logging.error(f"Cosmos DB PROCESSED update failed: {e}")
        raise

    # Notify React: PROCESSED with tags
    send_signalr_notification("jobStatusUpdate", [{
        "documentId": job_id,
        "status": "PROCESSED",
        "message": "Tagging terminé",
        "tags": tags
    }])


# ── 3. DLQ Alert Function ────────────────────────────────────────────────────

@app.service_bus_queue_trigger(
    arg_name="dlqmsg",
    queue_name="job-processing/$deadletterqueue",
    connection="SERVICE_BUS_CONNECTION"
)
def ProcessDLQ(dlqmsg: func.ServiceBusMessage):
    body = dlqmsg.get_body().decode("utf-8")
    logging.info(f"DLQ message: {body}")
    try:
        data = json.loads(body)
        job_id = data.get("documentId")
        if not job_id:
            logging.error("DLQ message missing documentId")
            return

        error_at = now_iso()
        container = get_cosmos_container()
        item = container.read_item(item=job_id, partition_key="JOB")
        item["status"] = "ERROR"
        item["errorMessage"] = "Message envoyé en DLQ après plusieurs échecs"
        item["errorAt"] = error_at
        item["updateAt"] = error_at
        container.replace_item(item=item, body=item)
        logging.info(f"Job {job_id} → ERROR (from DLQ)")

        # Notify React: ERROR
        send_signalr_notification("jobStatusUpdate", [{
            "documentId": job_id,
            "status": "ERROR",
            "message": "Erreur de traitement"
        }])
    except Exception as e:
        logging.error(f"ProcessDLQ failed: {e}")
