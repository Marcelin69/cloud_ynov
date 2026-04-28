'use client';

import { creatJob, editJob } from "@/actions/jobs";
import { useActionState, useEffect, useRef, useState } from "react";
import * as signalR from "@microsoft/signalr";

const FUNCTION_APP_URL = process.env.NEXT_PUBLIC_FUNCTION_APP_URL ||
    "https://prof-fonction-app-mt-b0axg8fkaxapdcaf.francecentral-01.azurewebsites.net";

const STATUS_LABELS = {
    UPLOADED: { label: "Fichier reçu", color: "indigo" },
    QUEUED: { label: "En file d'attente", color: "amber" },
    PROCESSING: { label: "Traitement IA en cours…", color: "amber" },
    PROCESSED: { label: "Tagging terminé", color: "emerald" },
    ERROR: { label: "Erreur de traitement", color: "rose" },
};

const initialState = { message: null, error: null, uploadUrl: null, jobId: null };

const CreatJob = ({ id }) => {
    const action = id ? editJob : creatJob;
    const [state, formAction, pending] = useActionState(action, initialState);
    const fileRef = useRef(null);
    const connectionRef = useRef(null);
    const [uploadStatus, setUploadStatus] = useState(null);
    const [jobStatus, setJobStatus] = useState(null);

    // Upload file to Azure Blob Storage via SAS URL
    useEffect(() => {
        if (!state?.uploadUrl || !fileRef.current) return;
        const file = fileRef.current;
        setUploadStatus("uploading");
        fetch(state.uploadUrl, {
            method: "PUT",
            headers: {
                "x-ms-blob-type": "BlockBlob",
                "Content-Type": file.type || "application/octet-stream",
            },
            body: file,
        })
            .then((res) => {
                if (!res.ok) throw new Error(`Upload échoué (${res.status})`);
                setUploadStatus("done");
            })
            .catch((err) => setUploadStatus(`error: ${err.message}`));
    }, [state?.uploadUrl]);

    // Connect to SignalR after upload is done
    useEffect(() => {
        if (uploadStatus !== "done" || !state?.jobId) return;

        const jobId = state.jobId;
        const connection = new signalR.HubConnectionBuilder()
            .withUrl(`${FUNCTION_APP_URL}/api`, {
                skipNegotiation: false,
            })
            .withAutomaticReconnect()
            .configureLogging(signalR.LogLevel.Warning)
            .build();

        connection.on("jobStatusUpdate", (data) => {
            if (data.documentId === jobId) {
                setJobStatus(data);
            }
        });

        connection.start()
            .then(() => console.log("SignalR connected"))
            .catch((err) => console.warn("SignalR error:", err));

        connectionRef.current = connection;

        return () => {
            connection.stop();
        };
    }, [uploadStatus, state?.jobId]);

    const statusInfo = jobStatus ? STATUS_LABELS[jobStatus.status] : null;

    return (
        <div className="max-w-3xl mx-auto px-6 py-14">
            <div className="mb-8">
                <p className="text-xs uppercase tracking-[0.2em] text-indigo-400 font-semibold mb-2">
                    Nouveau traitement
                </p>
                <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-2">
                    Créer un job cloud
                </h1>
                <p className="text-slate-400 text-sm sm:text-base">
                    Renseigne le nom du fichier pour générer un job et obtenir un lien d&apos;upload sécurisé.
                </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-sm p-6 sm:p-8 shadow-2xl shadow-black/30">
                <form className="space-y-6" action={formAction}>
                    <div className="space-y-2">
                        <label htmlFor="jobTitle" className="block text-sm font-medium text-slate-200">
                            Nom du fichier
                        </label>
                        <p className="text-xs text-slate-500">Exemple: client-report-mars-2026.csv</p>
                        <div className="relative">
                            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">#</span>
                            <input
                                id="jobTitle"
                                type="text"
                                name="jobTitle"
                                required
                                minLength={1}
                                maxLength={255}
                                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 pl-8 text-slate-100 placeholder:text-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 focus:outline-none transition-all"
                                placeholder="entrez le nom du fichier"
                                autoComplete="off"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="file" className="block text-sm font-medium text-slate-200">
                            Fichier à uploader
                        </label>
                        <input
                            id="file"
                            type="file"
                            required
                            onChange={(e) => { fileRef.current = e.target.files?.[0] ?? null; }}
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 file:mr-4 file:rounded-lg file:border-0 file:bg-indigo-600 file:px-3 file:py-1 file:text-sm file:font-semibold file:text-white hover:file:bg-indigo-500 transition-all"
                        />
                    </div>

                    {state?.error && (
                        <div className="rounded-xl border border-rose-800/60 bg-rose-950/30 px-4 py-3 text-sm text-rose-300">
                            {state.error}
                        </div>
                    )}

                    {state?.message && (
                        <div className="rounded-xl border border-emerald-800/60 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-300">
                            {state.message}
                        </div>
                    )}

                    {uploadStatus === "uploading" && (
                        <div className="rounded-xl border border-indigo-800/60 bg-indigo-950/30 px-4 py-3 text-sm text-indigo-300">
                            Upload en cours vers Azure Blob Storage…
                        </div>
                    )}

                    {uploadStatus?.startsWith("error") && (
                        <div className="rounded-xl border border-rose-800/60 bg-rose-950/30 px-4 py-3 text-sm text-rose-300">
                            {uploadStatus}
                        </div>
                    )}

                    <div className="flex items-center justify-between gap-3 pt-1">
                        <p className="text-xs text-slate-500">
                            Le job sera enregistré dans Cosmos DB avec un ID unique.
                        </p>
                        <button
                            type="submit"
                            disabled={pending}
                            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-950/50 transition-all hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {pending ? "Création en cours..." : "Créer le job"}
                        </button>
                    </div>
                </form>
            </div>

            {/* Notifications temps réel SignalR */}
            {uploadStatus === "done" && (
                <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-4">
                    <h2 className="text-sm font-semibold text-white uppercase tracking-widest">
                        Suivi temps réel
                    </h2>

                    {!jobStatus ? (
                        <div className="flex items-center gap-3 text-sm text-slate-400">
                            <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                            En attente des notifications Azure…
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className={`flex items-center gap-3 text-sm text-${statusInfo?.color}-300`}>
                                <span className={`inline-block w-2 h-2 rounded-full bg-${statusInfo?.color}-400 ${jobStatus.status === "PROCESSING" ? "animate-pulse" : ""}`} />
                                <span className="font-medium">{jobStatus.status}</span>
                                <span className="text-slate-400">— {statusInfo?.label}</span>
                            </div>

                            {jobStatus.tags && jobStatus.tags.length > 0 && (
                                <div className="pt-2">
                                    <p className="text-xs text-slate-500 mb-2">Tags générés par l&apos;IA :</p>
                                    <div className="flex flex-wrap gap-2">
                                        {jobStatus.tags.map((tag) => (
                                            <span
                                                key={tag}
                                                className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-600/20 border border-indigo-800/50 text-indigo-300"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {jobStatus.status === "ERROR" && (
                                <p className="text-xs text-rose-400">
                                    Le traitement a échoué. Vérifiez les logs Azure Functions.
                                </p>
                            )}
                        </div>
                    )}
                </div>
            )}

            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3 text-sm text-slate-400">
                Le fichier est uploadé directement vers Azure Blob Storage via une URL SAS sécurisée, puis traité automatiquement.
            </div>
        </div>
    );
};

export default CreatJob;
