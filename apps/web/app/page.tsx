import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const deliverables = [
  {
    term: "Diagnosis",
    detail:
      "An honest read on your profile as it stands today — what already works in your favor, and what will hold you back.",
  },
  {
    term: "Programs that fit",
    detail:
      "A ranked shortlist of real bachelor's programs abroad, each with a plain reason it is on your list and the one thing that makes it a stretch.",
  },
  {
    term: "A comparison",
    detail:
      "Your finalists side by side on the things you said matter: tuition, exams, language, deadlines.",
  },
  {
    term: "A dated plan",
    detail:
      "Exams, documents and deadlines in the order they have to happen, with one task marked as your next move.",
  },
];

export default function Home() {
  return (
    <div className="pt-14 pb-16 sm:pt-24">
      <h1 className="max-w-[16ch] text-[2.125rem] leading-[1.08] font-extrabold tracking-[-0.03em] text-balance sm:text-5xl">
        Where you stand, where you could get in, and what to do first.
      </h1>

      <p className="mt-6 max-w-[54ch] text-[1.0625rem] leading-relaxed text-muted-foreground text-pretty">
        Steer asks about your grades, exams, budget and the countries you are
        curious about. It comes back with a shortlist of real programs abroad and
        a plan with dates on it — not another page of university names to sort
        through on your own.
      </p>

      <div className="mt-9">
        <Link
          href="/profile"
          className={cn(
            buttonVariants(),
            "h-11 px-6 text-[0.9375rem] tracking-tight",
          )}
        >
          Start the questionnaire
        </Link>
        <p className="mt-3 text-sm text-muted-foreground">
          About 3 minutes. No account, nothing to pay.
        </p>
      </div>

      <section className="mt-16 sm:mt-24">
        <h2 className="text-base font-semibold tracking-tight">
          What you get back
        </h2>
        <dl className="mt-2 divide-y divide-border border-t border-border">
          {deliverables.map(({ term, detail }) => (
            <div
              key={term}
              className="grid gap-1 py-5 sm:grid-cols-[10rem_1fr] sm:gap-8"
            >
              <dt className="font-medium tracking-tight">{term}</dt>
              <dd className="text-[0.9375rem] leading-relaxed text-muted-foreground text-pretty">
                {detail}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="mt-12 max-w-[56ch] space-y-3 text-sm leading-relaxed text-muted-foreground text-pretty">
        <p>
          Nothing is locked in. Raise your budget, drop a country, add an exam
          score you are still working toward, and the shortlist and the plan
          change with you.
        </p>
        <p>
          Steer shows how well a program fits you — never your odds of being
          admitted. Every number is either linked to its source or marked as
          demo data.
        </p>
      </div>

      <p className="mt-10 text-[0.9375rem]">
        <Link
          href="/profile"
          className="font-medium text-primary underline underline-offset-4"
        >
          Start the questionnaire
        </Link>
      </p>
    </div>
  );
}
