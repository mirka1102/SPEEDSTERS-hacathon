import { render, screen, fireEvent, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Questionnaire } from "./Questionnaire";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

/** Group headings in order, as the questionnaire names them out loud (RU UI copy). */
const GROUP_TITLES = [
  "О тебе",
  "Направление",
  "Учёба",
  "Экзамены и языки",
  "Куда",
  "Деньги и возможности",
];

const next = () => screen.getByRole("button", { name: "Дальше" });
const heading = () => screen.getByRole("heading", { level: 1 });

beforeEach(() => {
  push.mockClear();
  window.localStorage.clear();
});

describe("Questionnaire", () => {
  it("starts on the first group and advances to the next on clicking Next", () => {
    render(<Questionnaire />);
    expect(heading()).toHaveTextContent("О тебе");
    fireEvent.click(next());
    expect(heading()).toHaveTextContent("Направление");
  });

  it("allows going back to the previous group", () => {
    render(<Questionnaire />);
    fireEvent.click(next());
    fireEvent.click(screen.getByRole("button", { name: "Назад" }));
    expect(heading()).toHaveTextContent("О тебе");
  });

  it("has no Back button on the first group", () => {
    render(<Questionnaire />);
    expect(screen.queryByRole("button", { name: "Назад" })).not.toBeInTheDocument();
  });

  it("walks all six groups without ever disabling the forward button", () => {
    render(<Questionnaire />);
    for (let i = 0; i < GROUP_TITLES.length - 1; i += 1) {
      expect(heading()).toHaveTextContent(GROUP_TITLES[i]);
      expect(next()).toBeEnabled();
      fireEvent.click(next());
    }
    expect(heading()).toHaveTextContent(GROUP_TITLES[GROUP_TITLES.length - 1]);
  });

  it("ends the last group with a diagnosis button that navigates to /diagnosis", () => {
    render(<Questionnaire />);
    for (let i = 0; i < GROUP_TITLES.length - 1; i += 1) fireEvent.click(next());

    expect(screen.queryByRole("button", { name: "Дальше" })).not.toBeInTheDocument();
    const finish = screen.getByRole("button", { name: "Смотреть диагностику" });
    expect(finish).toBeEnabled();
    fireEvent.click(finish);
    expect(push).toHaveBeenCalledWith("/diagnosis");
  });

  it("marks the questionnaire as step 2 of the 7-step journey", () => {
    render(<Questionnaire />);
    expect(screen.getByText(/Шаг 2 из 7/)).toBeInTheDocument();
    expect(screen.getByText("Анкета")).toBeInTheDocument();
  });

  it("saves an answer to localStorage so a mid-questionnaire refresh keeps it", () => {
    const { unmount } = render(<Questionnaire />);
    fireEvent.click(screen.getByRole("radio", { name: /9 класс/ }));

    const stored = JSON.parse(window.localStorage.getItem("steer.profile.v1") ?? "{}");
    expect(stored.answers.grade).toBe("9");

    unmount();
    render(<Questionnaire />);
    expect(screen.getByRole("radio", { name: /9 класс/ })).toBeChecked();
  });

  it("keeps at most two study fields selected", () => {
    render(<Questionnaire />);
    fireEvent.click(next());

    const group = screen.getByRole("group", { name: /В какой области/ });
    fireEvent.click(within(group).getByRole("checkbox", { name: /Инженерия/ }));
    fireEvent.click(within(group).getByRole("checkbox", { name: /Бизнес/ }));

    const checked = within(group)
      .getAllByRole("checkbox")
      .filter((box) => box.getAttribute("aria-checked") === "true");
    expect(checked).toHaveLength(2);
  });

  it("asks for a self-assessed English level only while there is no IELTS/TOEFL score", () => {
    render(<Questionnaire />);
    for (let i = 0; i < 3; i += 1) fireEvent.click(next());

    expect(heading()).toHaveTextContent("Экзамены и языки");
    expect(screen.getByText(/Как оцениваешь свой английский/)).toBeInTheDocument();

    const ielts = screen.getByRole("group", { name: "IELTS уже есть?" });
    fireEvent.click(within(ielts).getByRole("radio", { name: "Есть балл" }));
    fireEvent.change(screen.getByLabelText("Балл IELTS"), { target: { value: "7" } });

    expect(screen.queryByText(/Как оцениваешь свой английский/)).not.toBeInTheDocument();
  });
});
