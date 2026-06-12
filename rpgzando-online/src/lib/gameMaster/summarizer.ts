/**
 * Long-term memory configuration.
 *
 * The Game Master only ever receives the campaign's rolling `summary` plus the
 * `RECENT_MESSAGE_LIMIT` most recent messages and `RECENT_DICE_ROLL_LIMIT` most recent
 * dice rolls. On every turn the LLM is asked to return an updated `summary` that
 * folds the new events into the existing one (see `systemPrompt.ts`).
 *
 * This keeps the context payload bounded regardless of how long a campaign runs:
 * once the message history grows past `RECENT_MESSAGE_LIMIT`, older messages stop
 * being sent verbatim and are only represented through the summary, which is
 * persisted to `campaign.summary` after every turn (see `actions/campaigns.ts`).
 */
export const RECENT_MESSAGE_LIMIT = 20;
export const RECENT_DICE_ROLL_LIMIT = 10;
export const RECENT_JOURNAL_ENTRY_LIMIT = 5;

/** Whether the campaign history is large enough that older messages rely on `summary`. */
export function shouldCompactHistory(recentMessageCount: number): boolean {
  return recentMessageCount >= RECENT_MESSAGE_LIMIT;
}
