from azure.storage.blob import (
    BlobServiceClient,
    generate_blob_sas,
    BlobSasPermissions
)
from datetime import datetime, timedelta
from .config import settings

blob_service = BlobServiceClient.from_connection_string(
    settings.blob_connection_string
)

# ✅ SAFE
account_key = settings.blob_account_key
account_name = blob_service.account_name


def generate_upload_sas(blob_name: str, content_type: str, expiry_hours: int = 1) -> str:
    sas_token = generate_blob_sas(
        account_name=account_name,
        container_name=settings.blob_container_name,
        blob_name=blob_name,
        account_key=account_key,
        permission=BlobSasPermissions(write=True, create=True),
        expiry=datetime.utcnow() + timedelta(hours=expiry_hours)
    )

    return f"https://{account_name}.blob.core.windows.net/{settings.blob_container_name}/{blob_name}?{sas_token}"