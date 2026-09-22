"use client";

import { useCallback, useEffect, useState } from "react";
import { api, type FormatQuestion, type FormatQuestionType } from "@/lib/api";

interface QuestionsEditorProps {
  formatId: string;
}

type Draft = Omit<FormatQuestion, "id"> & { id?: string };

const TYPE_LABELS: Record<FormatQuestionType, string> = {
  short_text: "Короткий ответ",
  long_text: "Развёрнутый ответ",
  single_choice: "Выбор варианта",
};

const TRANSLIT: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i", й: "i",
  к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f",
  х: "h", ц: "c", ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
};

/** Ключ участвует в ссылке (`?q_<key>=`), поэтому кириллицу надо перевести, а не процентно
 * закодировать: `?q_%D1%81%D1%82...` в разметке лендинга нечитаем и легко ломается руками. */
function slugify(label: string): string {
  return label
    .toLowerCase()
    .split("")
    .map((ch) => (ch in TRANSLIT ? TRANSLIT[ch] : ch))
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function emptyQuestion(): Draft {
  return { key: "", label: "", type: "short_text", required: true, options: [], minLength: null };
}

export function QuestionsEditor({ formatId }: QuestionsEditorProps) {
  const [questions, setQuestions] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    try {
      setQuestions(await api.get<FormatQuestion[]>(`/api/formats/${formatId}/questions`));
    } catch {
      setError("Не удалось загрузить вопросы");
    } finally {
      setLoading(false);
    }
  }, [formatId]);

  useEffect(() => {
    void load();
  }, [load]);

  function patch(index: number, changes: Partial<Draft>) {
    setSaved(false);
    setQuestions((current) => current.map((q, i) => (i === index ? { ...q, ...changes } : q)));
  }

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= questions.length) return;
    setSaved(false);
    setQuestions((current) => {
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function handleSave() {
    setError(null);

    const prepared = questions.map((q) => ({
      ...q,
      // Пустой ключ заполняем из формулировки в момент сохранения, а не при вводе: иначе он
      // переписывался бы на каждой букве и ломал бы уже расставленные на лендинге ссылки.
      key: q.key.trim() || slugify(q.label),
      label: q.label.trim(),
      options: q.type === "single_choice" ? q.options.map((o) => o.trim()).filter(Boolean) : [],
    }));

    const blank = prepared.find((q) => !q.label);
    if (blank) return setError("У каждого вопроса должна быть формулировка");
    const keyless = prepared.find((q) => !q.key);
    if (keyless) return setError(`Не удалось собрать ключ из «${keyless.label}» — задайте его вручную`);
    const thin = prepared.find((q) => q.type === "single_choice" && q.options.length < 2);
    if (thin) return setError(`У вопроса «${thin.label}» нужно минимум два варианта ответа`);

    setSaving(true);
    try {
      const result = await api.put<FormatQuestion[]>(`/api/formats/${formatId}/questions`, {
        questions: prepared.map((q) => ({
          key: q.key,
          label: q.label,
          type: q.type,
          required: q.required,
          ...(q.type === "single_choice" ? { options: q.options } : {}),
          ...(q.type === "long_text" && q.minLength ? { minLength: q.minLength } : {}),
        })),
      });
      setQuestions(result);
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось сохранить вопросы");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="qe-hint">Загружаем…</div>;

  return (
    <div className="qe">
      <div className="qe-hint">
        Клиент отвечает на них при записи, ответы видны в карточке встречи. Ссылка на запись может
        отвечать за клиента заранее — параметром <code>?q_ключ=значение</code>.
      </div>

      {questions.map((question, index) => (
        <div className="qe-card" key={question.id ?? `new-${index}`}>
          <div className="qe-row">
            <input
              className="input-field"
              placeholder="Формулировка вопроса"
              value={question.label}
              onChange={(e) => patch(index, { label: e.target.value })}
            />
            <select
              className="input-field qe-type"
              value={question.type}
              onChange={(e) => patch(index, { type: e.target.value as FormatQuestionType, options: [], minLength: null })}
            >
              {(Object.keys(TYPE_LABELS) as FormatQuestionType[]).map((type) => (
                <option key={type} value={type}>
                  {TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </div>

          {question.type === "single_choice" && (
            <textarea
              className="input-field qe-options"
              placeholder="Варианты ответа, по одному на строку"
              value={question.options.join("\n")}
              onChange={(e) => patch(index, { options: e.target.value.split("\n") })}
            />
          )}

          {question.type === "long_text" && (
            <label className="qe-inline">
              Минимум символов
              <input
                type="number"
                min={0}
                max={5000}
                className="input-field qe-num"
                value={question.minLength ?? ""}
                onChange={(e) => patch(index, { minLength: e.target.value ? Number(e.target.value) : null })}
              />
            </label>
          )}

          <div className="qe-foot">
            <label className="qe-inline">
              <input
                type="checkbox"
                checked={question.required}
                onChange={(e) => patch(index, { required: e.target.checked })}
              />
              Обязательный
            </label>
            <label className="qe-inline qe-key">
              Ключ
              <input
                className="input-field qe-num"
                placeholder={slugify(question.label) || "auto"}
                value={question.key}
                onChange={(e) => patch(index, { key: e.target.value })}
              />
            </label>
            <div className="qe-actions">
              <button type="button" className="qe-mini" disabled={index === 0} onClick={() => move(index, -1)}>
                ↑
              </button>
              <button
                type="button"
                className="qe-mini"
                disabled={index === questions.length - 1}
                onClick={() => move(index, 1)}
              >
                ↓
              </button>
              <button
                type="button"
                className="qe-mini qe-del"
                onClick={() => {
                  setSaved(false);
                  setQuestions((current) => current.filter((_, i) => i !== index));
                }}
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      ))}

      {error && <div className="qe-error">{error}</div>}
      {saved && !error && <div className="qe-ok">Сохранено</div>}

      <div className="qe-bar">
        <button
          type="button"
          className="qe-btn"
          onClick={() => {
            setSaved(false);
            setQuestions((current) => [...current, emptyQuestion()]);
          }}
        >
          Добавить вопрос
        </button>
        <button type="button" className="qe-btn qe-btn-primary" disabled={saving} onClick={handleSave}>
          {saving ? "Сохраняем…" : "Сохранить вопросы"}
        </button>
      </div>

      <style jsx>{`
        .qe { display: flex; flex-direction: column; gap: 12px; }
        .qe-hint { font-size: 13px; line-height: 1.5; color: var(--color-muted); }
        .qe-hint code { font-size: 12px; background: rgba(20, 30, 45, 0.06); padding: 1px 5px; border-radius: 5px; }
        .qe-card { display: flex; flex-direction: column; gap: 10px; padding: 14px; border-radius: 14px; background: rgba(255, 255, 255, 0.55); border: 1px solid rgba(20, 30, 45, 0.08); }
        .qe-row { display: flex; gap: 10px; flex-wrap: wrap; }
        .qe-row :global(.input-field) { flex: 1 1 220px; }
        .qe-type { flex: 0 0 180px !important; }
        .qe-options { min-height: 84px; resize: vertical; }
        .qe-foot { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
        .qe-inline { display: inline-flex; align-items: center; gap: 7px; font-size: 13px; color: var(--color-ink); }
        .qe-num { width: 130px !important; flex: none !important; }
        .qe-key { margin-left: auto; }
        .qe-actions { display: flex; gap: 6px; }
        .qe-mini { border: 1px solid rgba(20, 30, 45, 0.12); background: #fff; border-radius: 8px; padding: 5px 10px; font-size: 13px; cursor: pointer; color: var(--color-ink); }
        .qe-mini:disabled { opacity: 0.4; cursor: default; }
        .qe-del { color: #c0392b; }
        .qe-bar { display: flex; gap: 10px; flex-wrap: wrap; }
        /* Свои кнопки, а не fe-btn-* из ScheduleEditor: styled-jsx скоупит стили по
           компоненту, и чужие классы сюда не долетают — выглядели бы голым текстом. */
        .qe-btn { border: 1px solid rgba(20, 30, 45, 0.12); background: #fff; color: var(--color-ink); border-radius: 10px; padding: 9px 16px; font: 500 14px/1 inherit; cursor: pointer; }
        .qe-btn-primary { background: var(--color-accent, #5094f0); border-color: transparent; color: #fff; }
        .qe-btn:disabled { opacity: 0.55; cursor: default; }
        .qe-error { font-size: 13px; color: #c0392b; }
        .qe-ok { font-size: 13px; color: #2c8c5a; }
        @media (max-width: 560px) { .qe-key { margin-left: 0; } }
      `}</style>
    </div>
  );
}
