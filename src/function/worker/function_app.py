import azure.functions as func
import logging

app = func.FunctionApp()

@app.blob_trigger(arg_name="myblob", path="dev-storage/input/{name}",
                               connection="AzureWebJobsStorage")
def WorkerFile(myblob: func.InputStream):
    logging.info(f"Version CI/CD => Python blob trigger function processed blob"
                f"Name: {myblob.name}"
                f"Blob Size: {myblob.length} bytes")