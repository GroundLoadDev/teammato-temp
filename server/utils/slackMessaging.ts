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

export async function postActionNotesToChannel(
  accessToken: string,
  channelId: string,
  topicName: string,
  actionNotes: string
): Promise<void> {
  const client = new WebClient(accessToken);

  const message = {
    channel: channelId,
    text: `✅ Action Update: ${topicName}`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `📢 *You Said / We Did: ${topicName}*`
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: actionNotes
        }
      },
      {
        type: 'divider'
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: '💬 Thank you for your feedback. Your voice matters and drives positive change.'
          }
        ]
      }
    ]
  };

  try {
    await client.chat.postMessage(message);
  } catch (error) {
    console.error('Failed to post action notes:', error);
    throw error; // Re-throw so caller knows it failed
  }
}

export async function sendInstallerWelcomeDM(
  accessToken: string,
  installerUserId: string,
  teamName: string,
  dashboardUrl: string
): Promise<void> {
  const client = new WebClient(accessToken);

  const message = {
    channel: installerUserId,
    text: `🎉 Welcome to Teammato! Your workspace "${teamName}" is ready for anonymous feedback.`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `🎉 *Welcome to Teammato!*\n\nYour workspace *"${teamName}"* is now set up for anonymous feedback. Your team can now share honest feedback safely and anonymously.`
        }
      },
      {
        type: 'divider'
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*Next Steps:*\n\n1️⃣ *Configure Your Audience* - Choose who can submit feedback\n2️⃣ *Create Your First Topic* - Start collecting feedback\n3️⃣ *Invite Team Members* - Add admins and moderators\n\n🔒 *Privacy First:* All feedback is encrypted and released only when k-anonymity thresholds are met.'
        }
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'Open Dashboard'
            },
            url: dashboardUrl,
            style: 'primary'
          }
        ]
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: '💡 Need help? Visit your dashboard to get started or reach out to support.'
          }
        ]
      }
    ]
  };

  try {
    await client.chat.postMessage(message);
  } catch (error) {
    console.error('Failed to send installer welcome DM:', error);
    // Don't throw - we don't want to fail the installation if DM fails
  }
}

export async function sendSeatCapNotification(
  accessToken: string,
  userId: string,
  orgName: string,
  percentage: number,
  status: 'warning' | 'grace' | 'blocked',
  graceEndsAt?: string
): Promise<void> {
  const client = new WebClient(accessToken);

  const dashboardUrl = `${process.env.REPLIT_DEV_DOMAIN || 'http://localhost:5000'}/admin/billing`;

  let emoji = '⚠️';
  let title = 'Seat Capacity Warning';
  let messageText = '';
  
  if (status === 'warning') {
    emoji = '⚠️';
    title = 'Approaching Seat Capacity';
    messageText = `Your organization *${orgName}* is at *${percentage.toFixed(0)}%* of your seat capacity.\n\n*What this means:*\nYou're approaching your plan limit. Consider upgrading to ensure uninterrupted service.\n\n*Next Steps:*\n• Review your current usage\n• Upgrade your plan to increase capacity\n• Remove inactive users if needed`;
  } else if (status === 'grace') {
    emoji = '🚨';
    title = 'Seat Capacity Exceeded - Grace Period Active';
    messageText = `Your organization *${orgName}* is at *${percentage.toFixed(0)}%* of your seat capacity.\n\n*Grace Period:*\nYou have until *${graceEndsAt ? new Date(graceEndsAt).toLocaleDateString() : 'soon'}* to upgrade your plan or reduce usage.\n\n*What happens next:*\nIf you don't take action, feedback submissions will be blocked after the grace period expires.\n\n*Action Required:*\n• Upgrade your plan immediately\n• Or reduce your audience size`;
  } else if (status === 'blocked') {
    emoji = '🛑';
    title = 'Seat Capacity Exceeded - Service Blocked';
    messageText = `Your organization *${orgName}* has exceeded seat capacity limits.\n\n*Service Status:*\nFeedback submissions are currently blocked to prevent data quality issues.\n\n*Immediate Action Required:*\n• Upgrade your plan now to restore service\n• Or significantly reduce your audience size`;
  }

  const message = {
    channel: userId,
    text: `${emoji} ${title} - ${orgName}`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `${emoji} *${title}*`
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: messageText
        }
      },
      {
        type: 'divider'
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'Upgrade Plan'
            },
            url: dashboardUrl,
            style: status === 'blocked' ? 'danger' : 'primary'
          }
        ]
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: status === 'blocked' 
              ? '🛡️ *Privacy Protection:* We block over-capacity submissions to maintain k-anonymity guarantees.'
              : '💡 Need help choosing a plan? Contact our support team.'
          }
        ]
      }
    ]
  };

  try {
    await client.chat.postMessage(message);
  } catch (error) {
    console.error('Failed to send seat-cap notification:', error);
    // Don't throw - notifications are best-effort
  }
}
