import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col">
      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24 relative overflow-hidden">
        {/* Glow background */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(99,102,241,0.15), transparent)",
          }}
        />

        <div className="relative max-w-3xl mx-auto space-y-6">
          <span className="inline-flex items-center gap-2 text-xs font-medium text-indigo-400 bg-indigo-950/60 border border-indigo-900 px-3 py-1 rounded-full uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            Plateforme Cloud
          </span>

          <h1 className="text-5xl sm:text-6xl font-bold text-white leading-tight tracking-tight">
            Soumettez vos{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
              traitements cloud
            </span>{" "}
            en toute simplicité
          </h1>

          <p className="text-lg text-slate-400 max-w-xl mx-auto leading-relaxed">
            JobFlow vous permet de créer, suivre et gérer vos traitements de
            données cloud depuis une interface unifiée, rapide et sécurisée.
          </p>

          <div className="flex items-center justify-center gap-4 pt-2">
            <Link
              href="/job/createJob"
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-indigo-950/60 hover:shadow-indigo-900/60 hover:-translate-y-0.5"
            >
              Créer un traitement
            </Link>
            <Link
              href="/job"
              className="text-slate-300 hover:text-white border border-slate-700 hover:border-slate-500 px-6 py-3 rounded-xl font-medium transition-all"
            >
              Voir les traitements
            </Link>
          </div>
        </div>
      </section>

      {/* Feature grid */}
      <section className="max-w-5xl mx-auto px-6 pb-24 w-full">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              icon: "⚡",
              title: "Ultra-rapide",
              desc: "Soumission instantanée vers Azure Blob Storage avec SAS tokens sécurisés.",
            },
            {
              icon: "🔒",
              title: "Sécurisé",
              desc: "Chaque traitement est isolé et traçable avec un identifiant unique.",
            },
            {
              icon: "📊",
              title: "Suivi en temps réel",
              desc: "Consultez l'état de vos traitements et leurs résultats à tout moment.",
            },
          ].map(({ icon, title, desc }) => (
            <div
              key={title}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all group"
            >
              <div className="text-3xl mb-3">{icon}</div>
              <h3 className="font-semibold text-white mb-1">{title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
