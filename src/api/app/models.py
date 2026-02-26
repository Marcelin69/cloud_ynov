from pydantic import BaseModel, Field
from pydantic_settings import BaseSettings
from datetime import datetime,timezone
from typing import Optional,Dict,Any
import uuid

def now_iso():
    return datetime.now(timezone.utc).isoformat()

class JobCreateRequest(BaseModel):
    fileName: str = Field(...,min_length=1, max_length=255)
    contentType: str = Field(default="application/octet-stream", max_length=255)

class JobCreateResponse(BaseModel):
    jobId:str
    status:str
    createAt:str
    updateAt:str
    uploadUrl:str
    
def job_to_entity(req:JobCreateRequest) -> Dict[str,Any]:
    job_id = str(uuid.uuid4())
    ts = now_iso()
    return {
        "id": job_id,
        "pk": "JOB",
        "status":"CREATED",
        "fileName": req.fileName,
        "contentType": req.contentType,
        "updateAt": ts,
        "createAt": ts,
        "resultSummary": None,
        "error": None
    }
   
    
