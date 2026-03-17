import Link from "next/link";

export default function JobsPage() {
	return (
		<div className="max-w-5xl mx-auto px-6 py-16">
			{/* Header */}
			<div className="mb-10">
				<h1 className="text-3xl font-bold text-white mb-2">Traitements</h1>
				<p className="text-slate-400">
					Gérez et soumettez vos traitements de données.
				</p>
			</div>

			{/* Quick actions */}
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
				<Link
					href="/job/createJob"
					className="group bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-800/50 hover:border-indigo-600 rounded-2xl p-6 transition-all"
				>
					<div className="w-10 h-10 rounded-xl bg-indigo-600/20 flex items-center justify-center text-indigo-400 text-xl mb-4 group-hover:scale-110 transition-transform">
						+
					</div>
					<h2 className="font-semibold text-white mb-1">Nouveau traitement</h2>
					<p className="text-sm text-slate-400">
						Soumettez un nouveau fichier à traiter sur le cloud.
					</p>
				</Link>

				<div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
					<div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 text-xl mb-4">
						📋
					</div>
					<h2 className="font-semibold text-white mb-1">Historique</h2>
					<p className="text-sm text-slate-400">
						La liste des traitements sera disponible prochainement.
					</p>
					<span className="inline-block mt-3 text-xs font-medium text-amber-400 bg-amber-950/50 border border-amber-900/50 px-2 py-0.5 rounded-full">
						Bientôt disponible
					</span>
				</div>
			</div>

			{/* Info banner */}
			<div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-start gap-4">
				<div className="text-2xl mt-0.5">💡</div>
				<div>
					<p className="text-sm font-medium text-white mb-0.5">Comment ça marche ?</p>
					<p className="text-sm text-slate-400">
						Créez un traitement en renseignant le nom de votre fichier. Un lien d'upload
						sécurisé Azure Blob Storage sera généré automatiquement, et votre traitement
						sera tracé avec un identifiant unique dans Cosmos DB.
					</p>
				</div>
			</div>
		</div>
	);
}
