/**
 * Non-blocking notice for when a real-backend call failed and the screen fell back to mock
 * data (SPEC.md §9 honesty rule + jury script step 7: never blank or stuck). Omitted entirely
 * when there's no error to show.
 */
export function ApiErrorNotice({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p
      role="status"
      className="mt-4 rounded-lg border border-label-reach/40 bg-label-reach/10 px-3.5 py-2.5 text-[0.8125rem] leading-relaxed text-label-reach text-pretty"
    >
      Не удалось загрузить данные с сервера, показаны демо-данные. ({message})
    </p>
  );
}
