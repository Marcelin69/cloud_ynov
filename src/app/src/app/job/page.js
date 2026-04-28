"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import * as signalR from "@microsoft/signalr";

const API_URL = "https://apijob-fpe6hbe2h9c4agh2.francecentral-01.azurewebsites.net";
const FUNCTION_APP_URL = process.env.NEXT_PUBLIC_FUNCTION_APP_URL ||
    "https://prof-fonction-app-mt-b0axg8fkaxapdcaf.francecentral-01.azurewebsites.net";

const STATUS_COLORS = {
    CREATED:    "text-slate-400 bg-slate-800 border-slate-700",
    UPLOADED:   "text-indigo-300 bg-indigo-950/40 border-indigo-800/50",
    QUEUED:     "text-amber-300 bg-amber-950/40 border-amber-800/50",
    PROCESSING: "text-amber-300 bg-amber-950/40 border-amber-800/50",
    PROCESSED:  "text-emerald-300 bg-emerald-950/40 border-emerald-800/50",
    ERROR:      "text-rose-300 bg-rose-950/40 border-rose-800/50",
};

export default function JobsPage() {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch jobs list
    useEffect(() => {
        fetch(`${API_URL}/jobs/`)
            .then((r) => r.json())
            .then((data) => setJobs(Array.isArray(data) ? data : []))
            .catch(() => setJobs([]))
            .finally(() => setLoading(false));
    }, []);

    // SignalR real-time updates
    useEffect(() => {
        const connection = new signalR.HubConnectionBuilder()
            .withUrl(`${FUNCTION_APP_URL}/api`, { skipNegotiation: false, withCredentials: false })
            .withAutomaticReconnect()
            .configureLogging(signalR.LogLevel.Warning)
            .build();

        connection.on("jobStatusUpdate", (data) => {
            setJobs((prev) =>
                prev.map((job) =>
                    job.jobId === data.documentId
                        ? { ...job, status: data.status, tags: data.tags ?? job.tags }
                        : job
                )
            );
        });

        connection.start().catch((err) => console.warn("SignalR:", err));
        return () => connection.stop();
    }, []);

    return (
        <div className="max-w-5xl mx-auto px-6 py-16">
            <div className="mb-10 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Traitements</h1>
                    <p className="text-slate-400">Gérez et soumettez vos traitements de données.</p>
                </div>
                <Link
                    href="/job/createJob"
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-all"
                >
                    + Nouveau
                </Link>
            </div>

            {loading ? (
                <div className="text-slate-400 text-sm">Chargement…</div>
            ) : jobs.length === 0 ? (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-10 text-center text-slate-400 text-sm">
                    Aucun traitement pour l&apos;instant.{" "}
                    <Link href="/job/createJob" className="text-indigo-400 underline">Créer le premier</Link>
                </div>
            ) : (
                <div className="space-y-3">
                    {jobs.map((job) => (
                        <div
                            key={job.jobId}
                            className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 flex flex-col sm:flex-row sm:items-center gap-4"
                        >
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">{job.fileName || job.jobId}</p>
                                <p className="text-xs text-slate-500 mt-0.5">{job.jobId}</p>
                                {job.tags && job.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                        {job.tags.map((tag) => (
                                            <span key={tag} className="px-2 py-0.5 rounded-full text-xs bg-indigo-600/20 border border-indigo-800/50 text-indigo-300">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="shrink-0">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[job.status] ?? STATUS_COLORS.CREATED}`}>
                                    {job.status === "PROCESSING" && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                                    )}
                                    {job.status}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
