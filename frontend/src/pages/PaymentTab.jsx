import { Sparkles, Users, FileText, BarChart3, Zap } from 'lucide-react';

function ComingSoonBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400 text-xs font-medium border border-amber-500/25">
      Coming soon
    </span>
  );
}

export default function PaymentTab() {
  const magicBenefits = [
    { icon: FileText, label: 'Audit niche & recommandations', desc: 'Analyse automatique de ton positionnement' },
    { icon: Users, label: 'Matching KOL qualifié', desc: 'Top créateurs filtrés par affinité' },
    { icon: Sparkles, label: 'Contenu IA sur mesure', desc: 'Hooks et scripts adaptés à chaque KOL' },
    { icon: BarChart3, label: 'ROI & suivi', desc: 'Métriques et attribution claires' },
  ];

  const dealTypes = [
    { type: 'Fixe', desc: 'Prix fixe négocié avec le KOL', amount: 'XXX €', color: 'indigo' },
    { type: 'Performance', desc: 'Rémunération liée aux résultats (CPS, CPA)', amount: 'Variable', color: 'emerald' },
    { type: 'Mix', desc: 'Fix + bonus performance', amount: 'XXX € + bonus', color: 'amber' },
  ];

  const executionSteps = [
    { num: 1, title: 'Contenu gagnant', desc: 'Hooks validés + brief créatif par plateforme' },
    { num: 2, title: 'Génération IA', desc: 'Scripts, posts X/LinkedIn, vidéos courtes prêts à diffuser' },
    { num: 3, title: 'Planification + deals', desc: 'Calendrier éditorial + activation Stripe des deals bookés' },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white mb-2">
          Paiement & Offres MaaS (Preview)
        </h1>
        <p className="text-slate-400 text-sm max-w-xl mx-auto">
          Cette vue est prête visuellement mais n’est pas encore activée en production. Les offres et paiements seront disponibles après la finalisation de l’intégration Stripe.
        </p>
      </div>

      {/* Section 1: Magic Button */}
      <section className="rounded-2xl bg-slate-800/30 border border-slate-700/30 p-5">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-indigo-400" />
            Magic Button
          </h2>
          <ComingSoonBadge />
        </div>
        <p className="text-slate-400 text-sm mb-5">
          Tout-en-un : audit, matching KOL, contenu IA et suivi ROI. Activation Stripe prévue prochainement.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {magicBenefits.map(({ icon: Icon, label, desc }) => (
            <div
              key={label}
              className="p-3 rounded-xl bg-slate-900/50 border border-slate-700/30"
            >
              <Icon className="w-5 h-5 text-indigo-400 mb-2" />
              <div className="font-medium text-white text-sm">{label}</div>
              <div className="text-xs text-slate-500 mt-0.5">{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Section 2: Deals KOL déjà bookés */}
      <section className="rounded-2xl bg-slate-800/30 border border-slate-700/30 p-5">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <h2 className="text-base font-semibold text-white">
            Deals KOL déjà bookés
          </h2>
          <ComingSoonBadge />
        </div>
        <p className="text-slate-400 text-sm mb-5">
          Gère tes contrats KOL (fixe, performance ou mix). L’affichage et le paiement seront connectés à Stripe.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {dealTypes.map(({ type, desc, amount, color }) => {
            const colorClasses = {
              indigo: 'from-indigo-500/10 to-indigo-500/5 border-indigo-500/20',
              emerald: 'from-emerald-500/10 to-emerald-500/5 border-emerald-500/20',
              amber: 'from-amber-500/10 to-amber-500/5 border-amber-500/20',
            };
            const textColors = {
              indigo: 'text-indigo-400',
              emerald: 'text-emerald-400',
              amber: 'text-amber-400',
            };
            return (
              <div
                key={type}
                className={`p-4 rounded-xl bg-gradient-to-br ${colorClasses[color]} border`}
              >
                <div className={`font-semibold text-white mb-1 ${textColors[color]}`}>
                  {type}
                </div>
                <div className="text-slate-400 text-sm mb-2">{desc}</div>
                <div className="text-xs text-slate-500">{amount}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Section 3: Exécution */}
      <section className="rounded-2xl bg-slate-800/30 border border-slate-700/30 p-5">
        <h2 className="text-base font-semibold text-white mb-4">
          Exécution
        </h2>
        <p className="text-slate-400 text-sm mb-6">
          Workflow en 3 étapes : du contenu validé jusqu’à la planification et aux deals activés.
        </p>
        <div className="space-y-4">
          {executionSteps.map(({ num, title, desc }) => (
            <div
              key={num}
              className="flex gap-4 p-4 rounded-xl bg-slate-900/50 border border-slate-700/30"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-sm">
                {num}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-white">{title}</div>
                <div className="text-sm text-slate-500 mt-0.5">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
