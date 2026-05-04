import Link from "next/link";
import type { OnboardingProgress } from "./progress";

export function OnboardingChecklist({
  steps,
  doneCount,
  total,
}: OnboardingProgress) {
  if (doneCount === total) return null;

  return (
    <section
      aria-labelledby="onboarding-heading"
      className="bg-bg-surface border-border rounded-lg border-[0.5px] p-6"
    >
      <div className="mb-5 flex items-baseline justify-between gap-3">
        <div>
          <p className="text-accent mb-1 font-mono text-[11px] tracking-[0.18em] uppercase">
            Get started
          </p>
          <h2
            id="onboarding-heading"
            className="text-text-primary font-serif text-2xl"
          >
            Four small steps,{" "}
            <em className="text-text-accent">about five minutes</em>.
          </h2>
        </div>
        <p
          className="text-text-tertiary font-mono text-xs whitespace-nowrap"
          aria-label={`${doneCount} of ${total} steps complete`}
        >
          {doneCount} / {total} done
        </p>
      </div>

      <ol className="space-y-2">
        {steps.map((step, i) => (
          <li
            key={step.key}
            className="border-border flex items-center gap-3 rounded-md border-[0.5px] p-3"
          >
            <span
              aria-hidden
              className={[
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-[11px]",
                step.done
                  ? "bg-accent text-accent-on"
                  : "bg-bg-surface-2 text-text-tertiary",
              ].join(" ")}
            >
              {step.done ? "✓" : i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p
                className={[
                  "text-sm font-medium",
                  step.done
                    ? "text-text-tertiary line-through"
                    : "text-text-primary",
                ].join(" ")}
              >
                {step.label}
              </p>
              {!step.done && (
                <p className="text-text-tertiary mt-0.5 text-xs">
                  {step.hint}
                </p>
              )}
            </div>
            {!step.done && (
              <Link
                href={step.href}
                className="text-accent inline-flex h-11 shrink-0 items-center text-xs font-medium underline underline-offset-2"
              >
                Start →
              </Link>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
