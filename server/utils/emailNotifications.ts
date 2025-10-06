/**
 * Email notification utilities for seat-cap and billing alerts
 * Uses Resend for transactional emails
 */

// Ensure fetch is available (Node 18+ has native fetch)
const fetchFn = typeof fetch !== 'undefined' ? fetch : null;

export async function sendSeatCapEmailNotification(
  email: string,
  orgName: string,
  percentage: number,
  status: 'warning' | 'grace' | 'blocked',
  graceEndsAt?: string
): Promise<void> {
  // Check if Resend API key is configured
  const resendApiKey = process.env.RESEND_API_KEY;
  
  if (!resendApiKey) {
    console.warn('RESEND_API_KEY not configured - skipping email notification');
    return;
  }

  const dashboardUrl = `${process.env.REPLIT_DEV_DOMAIN || 'http://localhost:5000'}/admin/billing`;

  let subject = '';
  let htmlContent = '';
  
  if (status === 'warning') {
    subject = `⚠️ ${orgName} - Approaching Seat Capacity (${percentage.toFixed(0)}%)`;
    htmlContent = `
      <h2>⚠️ Approaching Seat Capacity</h2>
      <p>Your organization <strong>${orgName}</strong> is at <strong>${percentage.toFixed(0)}%</strong> of your seat capacity.</p>
      
      <h3>What this means:</h3>
      <p>You're approaching your plan limit. Consider upgrading to ensure uninterrupted service.</p>
      
      <h3>Next Steps:</h3>
      <ul>
        <li>Review your current usage</li>
        <li>Upgrade your plan to increase capacity</li>
        <li>Remove inactive users if needed</li>
      </ul>
      
      <p><a href="${dashboardUrl}" style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 16px;">Upgrade Plan</a></p>
      
      <p style="color: #6B7280; font-size: 14px; margin-top: 24px;">💡 Need help choosing a plan? Contact our support team.</p>
    `;
  } else if (status === 'grace') {
    subject = `🚨 ${orgName} - Seat Capacity Exceeded (Grace Period Active)`;
    htmlContent = `
      <h2>🚨 Seat Capacity Exceeded - Grace Period Active</h2>
      <p>Your organization <strong>${orgName}</strong> is at <strong>${percentage.toFixed(0)}%</strong> of your seat capacity.</p>
      
      <h3>Grace Period:</h3>
      <p>You have until <strong>${graceEndsAt ? new Date(graceEndsAt).toLocaleDateString() : 'soon'}</strong> to upgrade your plan or reduce usage.</p>
      
      <h3>What happens next:</h3>
      <p>If you don't take action, feedback submissions will be blocked after the grace period expires.</p>
      
      <h3>Action Required:</h3>
      <ul>
        <li><strong>Upgrade your plan immediately</strong></li>
        <li>Or reduce your audience size</li>
      </ul>
      
      <p><a href="${dashboardUrl}" style="background-color: #DC2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 16px;">Upgrade Plan Now</a></p>
      
      <p style="color: #6B7280; font-size: 14px; margin-top: 24px;">💡 Need help? Contact our support team immediately.</p>
    `;
  } else if (status === 'blocked') {
    subject = `🛑 ${orgName} - Seat Capacity Exceeded (Service Blocked)`;
    htmlContent = `
      <h2>🛑 Seat Capacity Exceeded - Service Blocked</h2>
      <p>Your organization <strong>${orgName}</strong> has exceeded seat capacity limits.</p>
      
      <h3>Service Status:</h3>
      <p><strong style="color: #DC2626;">Feedback submissions are currently blocked</strong> to prevent data quality issues.</p>
      
      <h3>Immediate Action Required:</h3>
      <ul>
        <li><strong>Upgrade your plan now to restore service</strong></li>
        <li>Or significantly reduce your audience size</li>
      </ul>
      
      <p><a href="${dashboardUrl}" style="background-color: #DC2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 16px;">Upgrade Plan Immediately</a></p>
      
      <p style="color: #6B7280; font-size: 14px; margin-top: 24px;">🛡️ <strong>Privacy Protection:</strong> We block over-capacity submissions to maintain k-anonymity guarantees.</p>
    `;
  }

  const emailPayload = {
    from: 'Teammato <notifications@teammato.com>',
    to: email,
    subject,
    html: htmlContent,
  };

  if (!fetchFn) {
    console.warn('fetch is not available - cannot send email notification');
    return;
  }

  try {
    const response = await fetchFn('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Failed to send seat-cap email notification:', error);
    }
  } catch (error) {
    console.error('Failed to send seat-cap email notification:', error);
    // Don't throw - notifications are best-effort
  }
}
