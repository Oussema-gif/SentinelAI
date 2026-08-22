import { useId, useState, type FormEvent, type KeyboardEvent } from "react";

import "./MessageIntake.css";

interface MessageIntakeProps {
  isAnalyzing?: boolean;
  error?: string | null;
  onAnalyze: (text: string) => Promise<void> | void;
  maxLength?: number;
}

const DEFAULT_MAX_LENGTH = 10_000;

export function MessageIntake({
  isAnalyzing = false,
  error = null,
  onAnalyze,
  maxLength = DEFAULT_MAX_LENGTH,
}: MessageIntakeProps) {
  const messageId = useId();
  const errorId = `${messageId}-error`;
  const [text, setText] = useState("");

  const trimmedText = text.trim();
  const hasText = trimmedText.length > 0;
  const isOverLimit = text.length > maxLength;
  const canSubmit = hasText && !isOverLimit && !isAnalyzing;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    await onAnalyze(trimmedText);
  }

  function handleClear() {
    setText("");
  }

  function handleTextareaKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey) {
      return;
    }

    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    void onAnalyze(trimmedText);
  }

  return (
    <section className="message-intake" aria-labelledby={`${messageId}-title`}>
      <div className="message-intake__header">
        <div>
          <p className="message-intake__eyebrow">Atmospheric scan</p>

          <h1 id={`${messageId}-title`}>What message should we scan?</h1>

          <p className="message-intake__description">
            Paste a suspicious message below. SentinelAI will inspect its
            language, links, and threat signals.
          </p>
        </div>

        <div
          className="message-intake__status"
          aria-live="polite"
          aria-atomic="true"
        >
          <span
            className={`message-intake__status-dot ${
              isAnalyzing
                ? "message-intake__status-dot--active"
                : "message-intake__status-dot--idle"
            }`}
            aria-hidden="true"
          />

          <span>{isAnalyzing ? "Scanning message" : "Radar ready"}</span>
        </div>
      </div>

      <form className="message-intake__form" onSubmit={handleSubmit}>
        <div className="message-intake__textarea-shell">
          <label className="message-intake__label" htmlFor={messageId}>
            Message content
          </label>

          <textarea
            id={messageId}
            className="message-intake__textarea"
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={handleTextareaKeyDown}
            placeholder="Paste the SMS or message you want to investigate..."
            maxLength={maxLength}
            aria-describedby={error ? errorId : undefined}
            aria-invalid={Boolean(error) || isOverLimit}
            disabled={isAnalyzing}
            rows={8}
          />

          <div className="message-intake__textarea-footer">
            <span className="message-intake__hint">
              Keep the original formatting where possible.
            </span>

            <span className="message-intake__shortcut-hint">
              Enter to analyze · Shift+Enter for a new line
            </span>

            <span
              className={`message-intake__counter ${
                isOverLimit ? "message-intake__counter--invalid" : ""
              }`}
              aria-live="polite"
            >
              {text.length.toLocaleString()} / {maxLength.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="message-intake__actions">
          <button
            className="message-intake__clear-button"
            type="button"
            onClick={handleClear}
            disabled={!text || isAnalyzing}
          >
            Clear
          </button>

          <button
            className="message-intake__analyze-button"
            type="submit"
            disabled={!canSubmit}
            aria-disabled={!canSubmit}
          >
            <span
              className={`message-intake__radar-icon ${
                isAnalyzing ? "message-intake__radar-icon--scanning" : ""
              }`}
              aria-hidden="true"
            >
              <span className="message-intake__radar-icon-sweep" />
              <span className="message-intake__radar-icon-center" />
            </span>

            <span>{isAnalyzing ? "Scanning..." : "Analyze message"}</span>
          </button>
        </div>

        {isOverLimit && (
          <p id={errorId} className="message-intake__error" role="alert">
            This message exceeds the {maxLength.toLocaleString()} character
            limit.
          </p>
        )}

        {!isOverLimit && error && (
          <p id={errorId} className="message-intake__error" role="alert">
            {error}
          </p>
        )}
      </form>
    </section>
  );
}
