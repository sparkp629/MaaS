/**
 * Onboarding Survey — 7 questions across 4 steps
 * Obligatoire, ne peut pas etre ferme
 * En anglais (navigateur propose traduction)
 * Aucune info personnelle/confidentielle
 */
import { useState } from 'react';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';

/**
 * 4 steps, 7 questions total:
 * Step 1: Product name + Industry (2 questions)
 * Step 2: Goals + Platforms (2 questions)
 * Step 3: Audience size + Competitors (2 questions)
 * Step 4: Content approach (1 question)
 */
const STEPS = [
  {
    title: 'Tell us about your product',
    subtitle: 'This is your first request. You can change everything later.',
    questions: [
      {
        id: 'product_name',
        label: 'Product or project name',
        type: 'open',
        placeholder: 'e.g. ShipFast, Plausible, Resend...',
      },
      {
        id: 'industry',
        label: 'Industry',
        type: 'single',
        options: [
          'Dev Tools', 'No-code / Low-code', 'API-first SaaS', 'CRM & Sales',
          'Analytics & Data', 'E-commerce', 'Education & EdTech',
          'Health & Wellness', 'Finance & FinTech', 'AI & Machine Learning',
          'Productivity', 'Other',
        ],
      },
    ],
  },
  {
    title: 'Your goals & platforms',
    subtitle: 'We will tailor your dashboard and KOL matching accordingly.',
    questions: [
      {
        id: 'goals',
        label: 'Main business goals',
        type: 'multi',
        options: [
          'Increase conversions',
          'Grow my audience',
          'Improve brand awareness',
          'Generate qualified leads',
          'Track ROI on marketing spend',
          'Understand my competitors',
          'Not sure yet',
        ],
      },
      {
        id: 'platforms',
        label: 'Platforms you publish on',
        type: 'multi',
        options: [
          'X (Twitter)', 'LinkedIn', 'YouTube', 'TikTok',
          'Instagram', 'Newsletter', 'Blog / Website', 'None yet',
        ],
      },
    ],
  },
  {
    title: 'Your audience & competitors',
    subtitle: 'We will analyze their weaknesses and your opportunities.',
    questions: [
      {
        id: 'audience_size',
        label: 'Current audience size (all platforms)',
        type: 'single',
        options: [
          'Just starting (0 - 1K)',
          'Growing (1K - 10K)',
          'Established (10K - 50K)',
          'Large (50K+)',
        ],
      },
      {
        id: 'competitors',
        label: 'Name up to 3 competitors or similar products',
        type: 'open',
        placeholder: 'e.g. Hootsuite, Buffer, Sprout Social',
      },
    ],
  },
  {
    title: 'Your content approach',
    subtitle: 'This helps us calibrate the AI suggestions for you.',
    questions: [
      {
        id: 'content_approach',
        label: 'How do you create content today?',
        type: 'single',
        options: [
          'I create everything manually',
          'I use some automation tools (Make, Zapier...)',
          'I have a team handling content',
          'I have not started creating content yet',
        ],
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

        {/* Step title */}
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
