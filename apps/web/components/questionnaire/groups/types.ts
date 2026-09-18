import type { Answers } from "@shared/types";

/** Every group reads the whole answer sheet and writes back only what it owns. */
export type GroupProps = {
  answers: Answers;
  set: (partial: Partial<Answers>) => void;
};
