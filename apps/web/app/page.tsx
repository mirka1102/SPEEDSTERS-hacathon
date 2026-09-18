import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const deliverables = [
  {
    term: "Диагностика",
    detail:
      "Честная картина твоего профиля на сегодня: что уже играет в плюс, а что будет мешать при поступлении.",
  },
  {
    term: "Подходящие программы",
    detail:
      "Короткий список реальных программ бакалавриата за рубежом. У каждой — понятное объяснение, почему она тебе подходит и что в ней будет самым сложным.",
  },
  {
    term: "Сравнение",
    detail:
      "Финалисты рядом, в одной таблице: стоимость, экзамены, язык обучения, дедлайны.",
  },
  {
    term: "План с датами",
    detail:
      "Экзамены, документы и дедлайны в том порядке, в котором их нужно закрывать. Один шаг отмечен как следующий.",
  },
];

export default function Home() {
  return (
    <div className="pt-10 pb-16 sm:pt-24">
      <h1 className="max-w-[16ch] text-[2.125rem] leading-[1.08] font-extrabold tracking-[-0.03em] text-balance sm:text-5xl">
        Где ты сейчас, куда реально можешь поступить и с чего начать.
      </h1>

      <p className="mt-6 max-w-[54ch] text-[1.0625rem] leading-relaxed text-muted-foreground text-pretty">
        Steer спросит про оценки, экзамены, бюджет и страны, которые тебе
        интересны. В ответ — подборка реальных программ за рубежом и план с
        датами, а не очередной список университетов.
      </p>

      <div className="mt-9">
        <Link
          href="/profile"
          className={cn(
            buttonVariants(),
            "h-11 px-6 text-[0.9375rem] tracking-tight",
          )}
        >
          Пройти анкету
        </Link>
        <p className="mt-3 text-sm text-muted-foreground">
          Около 3 минут. Без регистрации и бесплатно.
        </p>
      </div>

      <section className="mt-16 sm:mt-24">
        <h2 className="text-base font-semibold tracking-tight">
          Что ты получишь
        </h2>
        <dl className="mt-2 divide-y divide-border border-t border-border">
          {deliverables.map(({ term, detail }) => (
            <div
              key={term}
              className="grid gap-1 py-5 sm:grid-cols-[11rem_1fr] sm:gap-8"
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
          Ответы можно менять в любой момент: подними бюджет, убери страну,
          добавь балл за экзамен, к которому ещё готовишься, — подборка и план
          пересчитаются вместе с ними.
        </p>
        <p>
          Steer показывает, насколько программа тебе подходит, и никогда —
          вероятность поступления. У каждой цифры есть ссылка на источник или
          пометка, что это демо-данные.
        </p>
      </div>

      <p className="mt-10 text-[0.9375rem]">
        <Link
          href="/profile"
          className="font-medium text-primary underline underline-offset-4"
        >
          Пройти анкету
        </Link>
      </p>
    </div>
  );
}
