/**
 * Onboarding Survey — 7 questions across 4 steps
 * Obligatoire, ne peut pas etre ferme
 * En anglais (navigateur propose traduction)
 * Aucune info personnelle/confidentielle
 */
import { useState } from 'react';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';

/**
 * Sondage unique condensé — 7 questions, 4 étapes.
 * Questions les plus directes possibles (ex. "Niche:", "Product name:").
 * Fusion des meilleures questions des 3 modèles (S1 Q4–7, S2 Q2–7 sans Q1).
 */
const STEPS = [
  {
    title: 'Context',
    subtitle: 'Two quick fields.',
    greeting: "Let's be partners in crime.",
    questions: [
      {
        id: 'niche',
        label: 'Niche',
        type: 'single',
        options: [
          'Dev Tools', 'No-code / Low-code', 'API-first SaaS', 'CRM & Sales',
          'Analytics & Data', 'E-commerce', 'EdTech', 'FinTech', 'AI / ML',
          'Productivity', 'Other',
        ],
      },
      {
        id: 'product_name',
        label: 'Product or project name',
        type: 'open',
        placeholder: 'e.g. ShipFast, Plausible, Resend',
      },
    ],
  },
  {
    title: 'Your situation',
    subtitle: 'So we can match the right solution.',
    greeting: 'We are on the same team.',
    questions: [
      {
        id: 'biggest_difficulty',
        label: 'Your biggest difficulty right now?',
        type: 'single',
        options: [
          'Lack of visibility',
          'Not sure what content to post',
          'Not sure which KOLs to contact',
          'Measuring campaign ROI',
          'Other',
        ],
      },
      {
        id: 'roi_blockage',
        label: 'Biggest blockage to measure campaign ROI?',
        type: 'single',
        options: [
          'Vanity metrics only',
          'No conversion tracking',
          'Lack of KOL transparency',
          'Other',
        ],
      },
    ],
  },
  {
    title: 'Next campaign',
    subtitle: 'We will tailor matching and content.',
    greeting: 'Knowledge is power.',
    questions: [
      {
        id: 'priority_channel',
        label: 'Priority channel for your next campaign?',
        type: 'single',
        options: [
          'X (Twitter)', 'LinkedIn', 'YouTube', 'Newsletter', 'No preference',
        ],
      },
      {
        id: 'campaign_goal',
        label: 'Main goal of your next campaign (one sentence)',
        type: 'open',
        placeholder: 'e.g. visibility, leads, conversions, awareness',
      },
    ],
  },
  {
    title: 'Next step',
    subtitle: 'Optional: we can send a personalized proposal.',
    greeting: 'Almost there. You are doing great.',
    questions: [
      {
        id: 'personalized_proposal',
        label: 'Would you like a personalized proposal (audit + first campaign)?',
        type: 'single',
        options: ['Yes', 'No', 'Later'],
      },
    ],
  },
];

function OptionButton({ label, selected, onClick, multi }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 rounded-xl border transition-all text-sm ${
        selected
          ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-200'
          : 'bg-slate-800/30 border-slate-700/30 text-slate-300 hover:border-slate-500/50 hover:bg-slate-800/50'
      }`}
    >
      <span className="flex items-center gap-3">
        <span className={`w-5 h-5 ${multi ? 'rounded-md' : 'rounded-full'} border-2 flex items-center justify-center shrink-0 ${
          selected ? 'border-indigo-400 bg-indigo-500/30' : 'border-slate-600'
        }`}>
          {selected && <Check className="w-3 h-3 text-indigo-300" />}
        </span>
        {label}
      </span>
    </button>
  );
}

function QuestionBlock({ q, value, onChange }) {
  if (q.type === 'open') {
    return (
      <div>
        <label className="text-slate-300 text-sm font-medium block mb-2">{q.label}</label>
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={q.placeholder}
          className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/30 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 text-sm"
        />
      </div>
    );
  }
  if (q.type === 'single') {
    return (
      <div>
        <label className="text-slate-300 text-sm font-medium block mb-2">{q.label}</label>
        <div className="space-y-1.5">
          {q.options.map((opt) => (
            <OptionButton key={opt} label={opt} selected={value === opt} onClick={() => onChange(opt)} multi={false} />
          ))}
        </div>
      </div>
    );
  }
  if (q.type === 'multi') {
    const arr = Array.isArray(value) ? value : [];
    function toggle(opt) {
      const idx = arr.indexOf(opt);
      if (idx >= 0) onChange(arr.filter((x) => x !== opt));
      else onChange([...arr, opt]);
    }
    return (
      <div>
        <label className="text-slate-300 text-sm font-medium block mb-2">{q.label}</label>
        <div className="space-y-1.5">
          {q.options.map((opt) => (
            <OptionButton key={opt} label={opt} selected={arr.includes(opt)} onClick={() => toggle(opt)} multi={true} />
          ))}
        </div>
      </div>
    );
  }
  return null;
}

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});

  const current = STEPS[step];
  const total = STEPS.length;
  const isLast = step === total - 1;

  // All questions in current step must have an answer
  const allAnswered = current.questions.every((q) => {
    const val = answers[q.id];
    if (q.type === 'open') return (val || '').trim().length > 0;
    if (q.type === 'multi') return Array.isArray(val) && val.length > 0;
    return !!val;
  });

  function setAnswer(qId, value) {
    setAnswers((prev) => ({ ...prev, [qId]: value }));
  }

  function handleNext() {
    if (!allAnswered) return;
    if (isLast) {
      onComplete(answers);
    } else {
      setStep((s) => s + 1);
    }
  }

  function handlePrev() {
    if (step > 0) setStep((s) => s - 1);
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Header with nav */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={handlePrev}
            disabled={step === 0}
            className={`flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg transition-colors ${
              step === 0
                ? 'text-slate-600 cursor-not-allowed'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          <span className="text-slate-500 text-sm font-medium">
            {step + 1} / {total}
          </span>

          <button
            onClick={handleNext}
            disabled={!allAnswered}
            className={`flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg transition-colors ${
              allAnswered
                ? 'text-indigo-300 hover:text-white hover:bg-indigo-500/20'
                : 'text-slate-600 cursor-not-allowed'
            }`}
          >
            {isLast ? 'Finish' : 'Next'}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1 bg-slate-800 rounded-full mb-6">
          <div
            className="h-1 bg-indigo-500 rounded-full transition-all duration-300"
            style={{ width: `${((step + 1) / total) * 100}%` }}
          />
        </div>

        {/* Greeting + Step title */}
        {current.greeting && (
          <p className="text-indigo-400 text-sm font-medium mb-3">{current.greeting}</p>
        )}
        <h2 className="text-2xl font-bold text-white mb-1">{current.title}</h2>
        <p className="text-slate-400 text-sm mb-6">{current.subtitle}</p>

        {/* Questions for this step */}
        <div className="space-y-6">
          {current.questions.map((q) => (
            <QuestionBlock
              key={q.id}
              q={q}
              value={answers[q.id]}
              onChange={(val) => setAnswer(q.id, val)}
            />
          ))}
        </div>

        {/* Bottom CTA */}
        <button
          onClick={handleNext}
          disabled={!allAnswered}
          className={`mt-8 w-full py-3 rounded-xl text-sm font-medium transition-all ${
            allAnswered
              ? 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          {isLast ? 'Start using MaaS' : 'Continue'}
        </button>
      </div>
    </div>
  );
}
