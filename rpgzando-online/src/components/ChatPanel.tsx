"use client";

import { useState, useTransition, type FormEvent, type KeyboardEvent } from "react";
import { sendMessageAction, type ChatMessageView } from "@/lib/actions/campaigns";

const SENDER_LABELS: Record<string, string> = {
  PLAYER: "Você",
  GM: "Mestre",
  SYSTEM: "Sistema",
};

interface ChatPanelProps {
  campaignId: string;
  initialMessages: ChatMessageView[];
  onCharacterUpdate?: (character: { hpCurrent: number; gold: number }) => void;
}

export default function ChatPanel({ campaignId, initialMessages, onCharacterUpdate }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessageView[]>(initialMessages);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit() {
    const content = input.trim();
    if (!content) return;

    setInput("");
    setError(null);

    startTransition(async () => {
      const result = await sendMessageAction(campaignId, content);

      if (result.error) {
        setError(result.error);
        setInput(content);
        return;
      }

      if (result.playerMessage && result.gmMessage) {
        setMessages((prev) => [...prev, result.playerMessage!, result.gmMessage!]);
      }

      if (result.character) {
        onCharacterUpdate?.(result.character);
      }
    });
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    submit();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  }

  return (
    <div className="flex min-h-[60vh] flex-1 flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto rounded-lg border border-stone-800 bg-stone-900/40 p-4">
        {messages.map((message) => (
          <div key={message.id} className={message.sender === "PLAYER" ? "text-right" : ""}>
            <p className="mb-1 text-xs uppercase tracking-wide text-stone-500">
              {SENDER_LABELS[message.sender] ?? message.sender}
            </p>
            <p
              className={`inline-block max-w-full whitespace-pre-wrap rounded-lg px-3 py-2 text-left text-sm ${
                message.sender === "PLAYER"
                  ? "bg-amber-600 text-stone-950"
                  : message.sender === "GM"
                    ? "bg-stone-800 text-stone-100"
                    : "bg-stone-800/50 text-stone-400 italic"
              }`}
            >
              {message.content}
            </p>
          </div>
        ))}
      </div>

      {error && (
        <p className="mt-2 rounded border border-red-800 bg-red-950/50 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
          placeholder="O que você faz?"
          className="flex-1 resize-none rounded border border-stone-700 bg-stone-900 px-3 py-2 text-sm text-stone-100 focus:border-amber-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={isPending || !input.trim()}
          className="rounded bg-amber-600 px-4 py-2 text-sm font-medium text-stone-950 hover:bg-amber-500 disabled:opacity-60"
        >
          {isPending ? "Enviando..." : "Enviar"}
        </button>
      </form>
    </div>
  );
}
