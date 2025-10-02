import type { Topic } from "@shared/schema";

export interface ModalMetadata {
  topicId: string;
  topicSlug: string;
  orgId: string;
  prefillBehavior?: string;
}

export function buildFeedbackModal(topic: Topic, metadata: ModalMetadata) {
  const daysLeft = topic.expiresAt 
    ? Math.ceil((new Date(topic.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;
  
  const expiryText = daysLeft !== null && daysLeft >= 0
    ? `Closes in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`
    : topic.expiresAt ? 'Closed' : 'Open-ended';

  const blocks: any[] = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*${topic.name}*\n${expiryText}`
      }
    },
    {
      type: "divider"
    },
    {
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
    },
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
      optional: false,
      label: {
        type: "plain_text",
        text: "Behavior (Required) *"
      },
      hint: {
        type: "plain_text",
        text: "What specifically occurred? Observable actions only."
      },
      element: {
        type: "plain_text_input",
        action_id: "behavior_input",
        multiline: true,
        max_length: 800,
        min_length: 20,
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
      optional: false,
      label: {
        type: "plain_text",
        text: "Impact (Required) *"
      },
      hint: {
        type: "plain_text",
        text: "How did this affect work or people?"
      },
      element: {
        type: "plain_text_input",
        action_id: "impact_input",
        multiline: true,
        max_length: 500,
        min_length: 15,
        placeholder: {
          type: "plain_text",
          text: "Describe the impact..."
        }
      }
    }
  ];

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
