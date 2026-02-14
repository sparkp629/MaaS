/**
 * Onboarding Survey — 7 questions, style Pinterest
 * Obligatoire après login, avant le dashboard
 * En anglais (le navigateur proposera la traduction)
 * Aucune information personnelle/confidentielle
 */
import { useState } from 'react';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';

const STEPS = [
  {
    id: 'product_name',
    type: 'open',
    title: "What's the name of your product or project?",
    subtitle: "This is your first request — you can change it anytime later.",
    placeholder: 'e.g. ShipFast, Plausible, Resend...',
  },
  {
    id: 'industry',
    type: 'single',
    title: 'Which industry best describes your product?',
    subtitle: 'This helps us find the right KOLs and competitors for you.',
    options: [
      'Dev Tools', 'No-code / Low-code', 'API-first SaaS', 'CRM & Sales',
      'Analytics & Data', 'E-commerce', 'Education & EdTech',
      'Health & Wellness', 'Finance & FinTech', 'AI & Machine Learning',
      'Productivity', 'Other',
    ],
  },
  {
    id: 'goals',
    type: 'multi',
    title: 'What are your main business goals?',
    subtitle: 'Select all that apply. We will tailor your dashboard accordingly.',
    options: [
      'Increase conversions',
      'Grow my audience',
      'Improve brand awareness',
      'Generate qualified leads',
      'Track ROI on marketing spend',
      'Understand my competitors',
      'I am not sure yet',
    ],
  },
  {
    id: 'platforms',
    type: 'multi',
    title: 'Which platforms do you currently publish on?',
    subtitle: 'We will prioritize these in your Mindshare Index.',
    options: [
      'X (Twitter)', 'LinkedIn', 'YouTube', 'TikTok',
      'Instagram', 'Newsletter', 'Blog / Website', 'None yet',
    ],
  },
  {
    id: 'audience_size',
    type: 'single',
    title: 'How would you describe your current audience size?',
    subtitle: 'Across all platforms combined.',
    options: [
      'Just starting (0 – 1K)',
      'Growing (1K – 10K)',
      'Established (10K – 50K)',
      'Large (50K+)',
    ],
  },
  {
    id: 'competitors',
    type: 'open',
    title: 'Name up to 3 competitors or similar products',
    subtitle: 'We will analyze their weaknesses and your opportunities.',
    placeholder: 'e.g. Hootsuite, Buffer, Sprout Social',
  },
  {
    id: 'content_approach',
    type: 'single',
    title: 'What best describes your content creation approach?',
    subtitle: 'This helps us calibrate the AI suggestions for you.',
    options: [
      'I create everything manually',
      'I use some automation tools (Make, Zapier...)',
      'I have a team handling content',
      'I have not started creating content yet',
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
        <span className={`w-5 h-5 rounded-${multi ? 'md' : 'full'} border-2 flex items-center justify-center shrink-0 ${
          selected ? 'border-indigo-400 bg-indigo-500/30' : 'border-slate-600'
        }`}>
          {selected && <Check className="w-3 h-3 text-indigo-300" />}
        </span>
        {label}
      </span>
    </button>
  );
}

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});

  const current = STEPS[step];
  const total = STEPS.length;
  const isLast = step === total - 1;

  const currentAnswer = answers[current.id];
  const hasAnswer = current.type === 'open'
    ? (currentAnswer || '').trim().length > 0
    : current.type === 'multi'
      ? Array.isArray(currentAnswer) && currentAnswer.length > 0
      : !!currentAnswer;

  function setAnswer(value) {
    setAnswers((prev) => ({ ...prev, [current.id]: value }));
  }

  function toggleMulti(option) {
    const arr = Array.isArray(currentAnswer) ? [...currentAnswer] : [];
    const idx = arr.indexOf(option);
    if (idx >= 0) arr.splice(idx, 1);
    else arr.push(option);
    setAnswer(arr);
  }

  function handleNext() {
    if (!hasAnswer) return;
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
        <div className="flex items-center justify-between mb-8">
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
            disabled={!hasAnswer}
            className={`flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg transition-colors ${
              hasAnswer
                ? 'text-indigo-300 hover:text-white hover:bg-indigo-500/20'
                : 'text-slate-600 cursor-not-allowed'
            }`}
          >
            {isLast ? 'Finish' : 'Next'}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1 bg-slate-800 rounded-full mb-8">
          <div
            className="h-1 bg-indigo-500 rounded-full transition-all duration-300"
            style={{ width: `${((step + 1) / total) * 100}%` }}
          />
        </div>

        {/* Question */}
        <h2 className="text-2xl font-bold text-white mb-2">{current.title}</h2>
        <p className="text-slate-400 text-sm mb-8">{current.subtitle}</p>

        {/* Answer area */}
        {current.type === 'open' && (
          <input
            type="text"
            value={currentAnswer || ''}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder={current.placeholder}
            className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/30 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 text-sm"
            onKeyDown={(e) => e.key === 'Enter' && handleNext()}
            autoFocus
          />
        )}

        {current.type === 'single' && (
          <div className="space-y-2">
            {current.options.map((opt) => (
              <OptionButton
                key={opt}
                label={opt}
                selected={currentAnswer === opt}
                onClick={() => setAnswer(opt)}
                multi={false}
              />
            ))}
          </div>
        )}

        {current.type === 'multi' && (
          <div className="space-y-2">
            {current.options.map((opt) => (
              <OptionButton
                key={opt}
                label={opt}
                selected={Array.isArray(currentAnswer) && currentAnswer.includes(opt)}
                onClick={() => toggleMulti(opt)}
                multi={true}
              />
            ))}
          </div>
        )}

        {/* Bottom CTA */}
        <button
          onClick={handleNext}
          disabled={!hasAnswer}
          className={`mt-8 w-full py-3 rounded-xl text-sm font-medium transition-all ${
            hasAnswer
              ? 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          {isLast ? 'Start using MaaS →' : 'Continue'}
        </button>
      </div>
    </div>
  );
}
