'use client';

import { creatJob, editJob } from "@/actions/jobs";
import { useActionState } from "react";

const initialState = {
    message: null,
    error: null,
};

const CreatJob = ({ id }) => {
    const action = id ? editJob : creatJob;
    const [state, formAction, pending] = useActionState(action, initialState);

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
                        <p className="text-xs text-slate-500">
                            Exemple: client-report-mars-2026.csv
                        </p>
                        <div className="relative">
                            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                                #
                            </span>
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

                    {state?.error ? (
                        <div className="rounded-xl border border-rose-800/60 bg-rose-950/30 px-4 py-3 text-sm text-rose-300">
                            {state.error}
                        </div>
                    ) : null}

                    {state?.message ? (
                        <div className="rounded-xl border border-emerald-800/60 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-300">
                            {state.message}
                        </div>
                    ) : null}

                    <div className="flex items-center justify-between gap-3 pt-1">
                        <p className="text-xs text-slate-500">
                            Le job sera enregistré dans Cosmos DB avec un ID unique.
                        </p>
                        <button
                            type="submit"
                            disabled={pending}
                            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-950/50 transition-all hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-indigo-600"
                        >
                            {pending ? "Création en cours..." : "Créer le job"}
                        </button>
                    </div>
                </form>
            </div>

            <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3 text-sm text-slate-400">
                Après création, tu pourras utiliser l&apos;URL SAS retournée par l&apos;API pour uploader ton fichier dans Azure Blob Storage.
            </div>
        </div>
    );
}

export default CreatJob;