import type { Topic } from "@shared/schema";
import type { ScrubResult } from "./scrub";

export interface ModalMetadata {
  topicId: string;
  topicSlug: string;
  orgId: string;
  prefillBehavior?: string;
}

export interface ModalOptions {
  showTopicSuggestions?: boolean;
  ownerName?: string;
}

// Modal A (input) → SBI (Situation/Behavior/Impact)
// topic + org are pre-selected and passed via private_metadata (as you do today)
export function buildInputModalA(opts: {
  topicName: string;
  topicId: string;
  orgId: string;
  prefill?: { situation?: string; behavior?: string; impact?: string };
}) {
  const pm = JSON.stringify({
    orgId: opts.orgId,
    topicId: opts.topicId,
    topicName: opts.topicName,
  });

  return {
    type: "modal",
    callback_id: "teammato_input",
    private_metadata: pm,
    title: { type: "plain_text", text: "Share Feedback" },
    submit: { type: "plain_text", text: "Review" },
    close: { type: "plain_text", text: "Cancel" },
    blocks: [
      { type: "section", text: { type: "mrkdwn", text: `*Topic:* ${opts.topicName}` } },
      { type: "divider" },
      {
        type: "input",
        block_id: "situation_b",
        element: { type: "plain_text_input", action_id: "situation", multiline: true, max_length: 300, initial_value: opts.prefill?.situation ?? "" },
        label: { type: "plain_text", text: "Situation (optional)" },
        optional: true,
      },
      {
        type: "input",
        block_id: "behavior_b",
        element: { type: "plain_text_input", action_id: "behavior", multiline: true, max_length: 800, initial_value: opts.prefill?.behavior ?? "" },
        label: { type: "plain_text", text: "Behavior (required)" },
      },
      {
        type: "input",
        block_id: "impact_b",
        element: { type: "plain_text_input", action_id: "impact", multiline: true, max_length: 500, initial_value: opts.prefill?.impact ?? "" },
        label: { type: "plain_text", text: "Impact (required)" },
      },
      { type: "context", elements: [{ type: "mrkdwn", text: "No names/emails/IDs/links. We'll scrub what we find." }] },
    ],
  };
}

// Modal B (review) – show before/after, rewrite, and k-threshold rule.
export function buildReviewModalB(opts: {
  topicName: string;
  topicId: string;
  orgId: string;
  k: number;
  beforeText: string;                // concatenated SBI (raw)
  scrub: ScrubResult;                // scrubbed + issues
  scrubbedHighlighted: string;       // mrkdwn string (`[email]` etc highlighted with backticks)
  rewrittenPreview: string;          // coarsened digest-ready one-liner
  // we pass all data forward using private_metadata for "Send"
}) {
  const pm = JSON.stringify({
    orgId: opts.orgId,
    topicId: opts.topicId,
    topicName: opts.topicName,
    k: opts.k,
    beforeText: opts.beforeText,
    scrubbed: opts.scrub.scrubbed,
    rewritten: opts.rewrittenPreview,
  });

  const issuesSummary =
    opts.scrub.issues.length === 0
      ? "No personal info detected."
      : opts.scrub.issues
          .slice(0, 6)
          .map((i) => "`" + i.kind + "`")
          .join(" • ") + (opts.scrub.issues.length > 6 ? " …" : "");

  return {
    type: "modal",
    callback_id: "teammato_review_send",
    private_metadata: pm,
    title: { type: "plain_text", text: "Review & Confirm" },
    submit: { type: "plain_text", text: "Send" },
    close: { type: "plain_text", text: "Go back" },
    blocks: [
      { type: "section", text: { type: "mrkdwn", text: `*Topic:* ${opts.topicName}` } },
      { type: "divider" },
      { type: "section", text: { type: "mrkdwn", text: "*You wrote (S/B/I)*" } },
      {
        type: "section",
        text: { type: "mrkdwn", text: "```" + (opts.beforeText || "(empty)") + "```" },
      },
      { type: "section", text: { type: "mrkdwn", text: "*After scrubbing*" } },
      {
        type: "section",
        text: { type: "mrkdwn", text: opts.scrubbedHighlighted || "(nothing to show)" },
      },
      { type: "context", elements: [{ type: "mrkdwn", text: `Detected: ${issuesSummary}` }] },
      { type: "divider" },
      { type: "section", text: { type: "mrkdwn", text: "*What leaders might see in a digest (when safe)*" } },
      {
        type: "section",
        text: { type: "mrkdwn", text: `> ${opts.rewrittenPreview || "(no preview)"}` },
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: `Quotes only appear when at least *k=${opts.k}* teammates have similar feedback for this topic.`,
          },
        ],
      },
      {
        type: "actions",
        block_id: "review_actions",
        elements: [
          { type: "button", text: { type: "plain_text", text: "Cancel" }, style: "danger", action_id: "cancel_review" },
        ],
      },
    ],
  };
}

// Legacy function for backward compatibility (keep for existing code)
export function buildFeedbackModal(
  topic: Topic, 
  metadata: ModalMetadata,
  options: ModalOptions = {}
) {
  const { showTopicSuggestions = false, ownerName } = options;

  const daysLeft = topic.expiresAt 
    ? Math.ceil((new Date(topic.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;
  
  const expiryText = daysLeft !== null && daysLeft >= 0
    ? `Closes in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`
    : topic.expiresAt ? 'Closed' : 'Open-ended';

  const statusEmoji = {
    collecting: '📝',
    in_review: '👀',
    action_decided: '✅',
    actioned: '🎯'
  }[topic.status] || '📝';

  const statusText = {
    collecting: 'Collecting feedback',
    in_review: 'Under review',
    action_decided: 'Action decided',
    actioned: 'Completed'
  }[topic.status] || 'Collecting feedback';

  let headerText = `*${topic.name}*\n`;
  if (ownerName) {
    headerText += `_Created by: ${ownerName}_\n`;
  }
  if (topic.description) {
    headerText += `${topic.description}\n\n`;
  }
  headerText += `${statusEmoji} ${statusText} • Duration: ${topic.windowDays} days • ${expiryText}`;

  const blocks: any[] = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: headerText
      }
    },
    {
      type: "divider"
    },
  ];

  // Only show topic suggestions if enabled
  if (showTopicSuggestions) {
    blocks.push({
      type: "input",
      block_id: "suggest_topic_block",
      optional: true,
      label: {
        type: "plain_text",
        text: "Suggest a new topic instead"
      },
      element: {
        type: "plain_text_input",
        action_id: "suggest_topic_input",
        max_length: 60,
        placeholder: {
          type: "plain_text",
          text: "New topic title (leave blank to submit feedback on current topic)"
        }
      }
    });
  }

  // Add SBI fields
  blocks.push(
    {
      type: "input",
      block_id: "situation_block",
      optional: true,
      label: {
        type: "plain_text",
        text: "Situation (Optional)"
      },
      hint: {
        type: "plain_text",
        text: "If safe, when/where (e.g., 'Sprint demo, week 38'). We coarsen details before release."
      },
      element: {
        type: "plain_text_input",
        action_id: "situation_input",
        max_length: 300,
        placeholder: {
          type: "plain_text",
          text: "When/where did this happen?"
        }
      }
    },
    {
      type: "input",
      block_id: "behavior_block",
      optional: showTopicSuggestions,
      label: {
        type: "plain_text",
        text: "Behavior"
      },
      hint: {
        type: "plain_text",
        text: showTopicSuggestions 
          ? "What specifically occurred? Observable actions only. Skip if suggesting a topic." 
          : "What specifically occurred? Observable actions only."
      },
      element: {
        type: "plain_text_input",
        action_id: "behavior_input",
        multiline: true,
        max_length: 800,
        initial_value: metadata.prefillBehavior || "",
        placeholder: {
          type: "plain_text",
          text: "Describe what happened..."
        }
      }
    },
    {
      type: "input",
      block_id: "impact_block",
      optional: showTopicSuggestions,
      label: {
        type: "plain_text",
        text: "Impact"
      },
      hint: {
        type: "plain_text",
        text: showTopicSuggestions 
          ? "How did this affect work or people? Skip if suggesting a topic." 
          : "How did this affect work or people?"
      },
      element: {
        type: "plain_text_input",
        action_id: "impact_input",
        multiline: true,
        max_length: 500,
        placeholder: {
          type: "plain_text",
          text: "Describe the impact..."
        }
      }
    }
  );

  return {
    type: "modal",
    callback_id: "feedback_modal",
    private_metadata: JSON.stringify(metadata),
    title: {
      type: "plain_text",
      text: "Share Feedback"
    },
    submit: {
      type: "plain_text",
      text: "Submit Feedback"
    },
    close: {
      type: "plain_text",
      text: "Cancel"
    },
    blocks
  };
}
