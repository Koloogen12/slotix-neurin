"use client";

import type { FormatQuestion } from "@/lib/api";

interface FormatQuestionsProps {
  questions: FormatQuestion[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
}

const LABEL_CLASSES = "mb-2 block text-[13px] font-semibold text-[var(--color-ink)]";

/** Свои вопросы владельца в форме записи. Обязательность здесь помечена и для браузера
 * (`required`), и глазами (звёздочка), но настоящая проверка — на сервере: форму можно
 * обойти прямым запросом к API. */
export function FormatQuestions({ questions, values, onChange }: FormatQuestionsProps) {
  return (
    <>
      {questions.map((question) => {
        const value = values[question.key] ?? "";
        const fieldId = `q-${question.key}`;

        return (
          <div key={question.id}>
            <label className={LABEL_CLASSES} htmlFor={question.type === "single_choice" ? undefined : fieldId}>
              {question.label}
              {question.required && <span className="ml-1 text-[var(--color-danger,#d4453d)]">*</span>}
            </label>

            {question.type === "single_choice" ? (
              // Радиокнопки, а не select: вариантов немного, и видеть их все сразу важнее —
              // человек выбирает, кто он, а не листает список.
              <div className="flex flex-col gap-2" role="radiogroup" aria-label={question.label}>
                {question.options.map((option) => (
                  <label
                    key={option}
                    className="flex cursor-pointer items-center gap-2.5 text-[14px] leading-snug text-[var(--color-ink)]"
                  >
                    <input
                      type="radio"
                      name={fieldId}
                      value={option}
                      checked={value === option}
                      required={question.required}
                      onChange={() => onChange(question.key, option)}
                      className="size-4 shrink-0 accent-[var(--color-accent,#5094f0)]"
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            ) : question.type === "long_text" ? (
              <>
                <textarea
                  id={fieldId}
                  className="input-field min-h-[104px] resize-y leading-relaxed"
                  required={question.required}
                  minLength={question.minLength ?? undefined}
                  value={value}
                  onChange={(e) => onChange(question.key, e.target.value)}
                />
                {question.minLength ? (
                  <div className="mt-1.5 text-[12px] text-[var(--color-muted)]">
                    {value.length < question.minLength
                      ? `Ещё ${question.minLength - value.length} символов`
                      : "Достаточно"}
                  </div>
                ) : null}
              </>
            ) : (
              <input
                id={fieldId}
                type="text"
                className="input-field"
                required={question.required}
                value={value}
                onChange={(e) => onChange(question.key, e.target.value)}
              />
            )}
          </div>
        );
      })}
    </>
  );
}
