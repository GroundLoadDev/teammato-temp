import { WebClient } from '@slack/web-api';
import { generateReceiptHash } from './contentFilter';

export async function sendContributionReceipt(
  accessToken: string,
  userId: string,
  topicId: string,
  topicName: string
): Promise<void> {
  const client = new WebClient(accessToken);
  const receiptHash = generateReceiptHash(userId, topicId, Date.now());

  const message = {
    channel: userId,
    text: `✅ *Your feedback has been submitted anonymously*\n\nReceipt: \`${receiptHash}\`\n\nTopic: *${topicName}*\n\n📋 Your feedback is safe and anonymous. It will be released when enough participants contribute to protect everyone's identity.\n\n🛡️ *Anti-Retaliation Protection*\nYour organization prohibits retaliation against employees who provide feedback. If you experience any retaliation, please contact HR or your anonymous reporting channel.\n\n_This receipt is for your records only. Keep it confidential._`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '✅ *Your feedback has been submitted anonymously*'
        }
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Receipt:*\n\`${receiptHash}\``
          },
          {
            type: 'mrkdwn',
            text: `*Topic:*\n${topicName}`
          }
        ]
      },
      {
        type: 'divider'
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '📋 Your feedback is safe and anonymous. It will be released when enough participants contribute to protect everyone\'s identity.'
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '🛡️ *Anti-Retaliation Protection*\nYour organization prohibits retaliation against employees who provide feedback. If you experience any retaliation, please contact HR or your anonymous reporting channel.'
        }
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: '_This receipt is for your records only. Keep it confidential._'
          }
        ]
      }
    ]
  };

  try {
    await client.chat.postMessage(message);
  } catch (error) {
    console.error('Failed to send contribution receipt:', error);
    // Don't throw - we don't want to fail the submission if DM fails
  }
}

export async function sendTopicOwnerReminder(
  accessToken: string,
  ownerId: string,
  topicName: string,
  topicId: string
): Promise<void> {
  const client = new WebClient(accessToken);

  const message = {
    channel: ownerId,
    text: `⏰ Time to review feedback for "${topicName}"`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `⏰ *Time to review feedback for "${topicName}"*\n\nThis topic has reached its collection window. Please:\n\n1. Review the submitted feedback\n2. Identify key themes and actions\n3. Publish a "You said / We did" response\n\nResponding to feedback builds trust and psychological safety.`
        }
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'Review Feedback'
            },
            url: `${process.env.REPLIT_DEV_DOMAIN || 'http://localhost:5000'}/admin/feedback?topic=${topicId}`,
            style: 'primary'
          }
        ]
      }
    ]
  };

  try {
    await client.chat.postMessage(message);
  } catch (error) {
    console.error('Failed to send topic owner reminder:', error);
  }
}
