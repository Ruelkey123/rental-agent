import type { Flag } from "@/lib/flags";
import { RULES } from "@/lib/rules";

export function FlagList({ flags }: { flags: Flag[] }) {
  return (
    <section aria-labelledby="flags-heading">
      <h2 id="flags-heading" className="text-xl font-semibold">
        {flags.length === 0
          ? "Nothing in your lease breaks the rules we check"
          : `${flags.length} ${flags.length === 1 ? "clause" : "clauses"} that may break New York law`}
      </h2>
      {flags.length === 0 && (
        <p className="mt-2 text-muted">
          We check deposits, late fees, broker fees, and a few other common problems. That doesn&rsquo;t cover everything.
        </p>
      )}
      <ol className="mt-4 space-y-6">
        {flags.map((flag) => {
          const rule = RULES[flag.ruleId];
          return (
            <li key={flag.ruleId} className="border-l-2 border-ink pl-4">
              <h3 className="font-semibold">{rule.title}</h3>
              {flag.quote && (
                <blockquote className="mt-2 font-serif text-[1.05rem] leading-relaxed">
                  <span className="marked">&ldquo;{flag.quote}&rdquo;</span>
                </blockquote>
              )}
              <p className="mt-2 leading-relaxed">{flag.explanation}</p>
              <a href={rule.sourceUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block text-sm text-action underline">
                {rule.citation}
              </a>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
