import sgMail from "@sendgrid/mail";

// Initialize SendGrid with API key
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
} else {
  console.warn("SendGrid API key not found. Email functionality will be disabled.");
}

interface BulkEmailData {
  recipients: Array<{
    email: string;
    firstName?: string;
    lastName?: string;
  }>;
  subject: string;
  content: string;
  fromEmail?: string;
  fromName?: string;
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class SendGridService {
  private static instance: SendGridService;

  private constructor() {}

  static getInstance(): SendGridService {
    if (!SendGridService.instance) {
      SendGridService.instance = new SendGridService();
    }
    return SendGridService.instance;
  }

  async sendBulkEmail(data: BulkEmailData): Promise<Array<{ email: string; result: EmailResult }>> {
    if (!process.env.SENDGRID_API_KEY) {
      console.error("SendGrid API key not configured");
      return data.recipients.map(recipient => ({
        email: recipient.email,
        result: { 
          success: false, 
          error: "SendGrid API key not configured" 
        }
      }));
    }

    const results: Array<{ email: string; result: EmailResult }> = [];

    // Process emails in batches to avoid rate limits
    const batchSize = 100;
    const batches = [];
    
    for (let i = 0; i < data.recipients.length; i += batchSize) {
      batches.push(data.recipients.slice(i, i + batchSize));
    }

    for (const batch of batches) {
      try {
        const personalizations = batch.map(recipient => ({
          to: [{ email: recipient.email }],
          substitutions: {
            firstName: recipient.firstName || "",
            lastName: recipient.lastName || "",
            fullName: `${recipient.firstName || ""} ${recipient.lastName || ""}`.trim()
          }
        }));

        const mailOptions = {
          from: {
            email: data.fromEmail || "noreply@spanner.com",
            name: data.fromName || "SPANNER Team"
          },
          subject: data.subject,
          content: [
            {
              type: "text/plain",
              value: data.content
            },
            {
              type: "text/html", 
              value: data.content.replace(/\n/g, '<br>')
            }
          ],
          personalizations,
          tracking_settings: {
            click_tracking: {
              enable: true
            },
            open_tracking: {
              enable: true
            }
          }
        };

        const response = await sgMail.send(mailOptions as any);
        
        // SendGrid bulk send returns a single response for all emails in the batch
        batch.forEach(recipient => {
          results.push({
            email: recipient.email,
            result: {
              success: true,
              messageId: response[0].headers['x-message-id'] || 'bulk-send'
            }
          });
        });

      } catch (error: any) {
        console.error("SendGrid bulk send error:", error);
        
        // Mark all emails in this batch as failed
        batch.forEach(recipient => {
          results.push({
            email: recipient.email,
            result: {
              success: false,
              error: error.message || "Unknown SendGrid error"
            }
          });
        });
      }
    }

    return results;
  }

  async sendSingleEmail(
    to: string,
    subject: string,
    content: string,
    fromEmail?: string,
    fromName?: string
  ): Promise<EmailResult> {
    if (!process.env.SENDGRID_API_KEY) {
      return { 
        success: false, 
        error: "SendGrid API key not configured" 
      };
    }

    try {
      const mailOptions = {
        to,
        from: {
          email: fromEmail || "noreply@spanner.com",
          name: fromName || "SPANNER Team"
        },
        subject,
        text: content,
        html: content.replace(/\n/g, '<br>'),
        tracking_settings: {
          click_tracking: {
            enable: true
          },
          open_tracking: {
            enable: true
          }
        }
      };

      const response = await sgMail.send(mailOptions);
      
      return {
        success: true,
        messageId: response[0].headers['x-message-id']
      };

    } catch (error: any) {
      console.error("SendGrid single send error:", error);
      return {
        success: false,
        error: error.message || "Unknown SendGrid error"
      };
    }
  }

  async validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  async getDeliveryStatus(messageId: string): Promise<{
    status: 'delivered' | 'bounced' | 'dropped' | 'deferred' | 'processed' | 'unknown';
    timestamp?: string;
  }> {
    // This would require SendGrid Event Webhook implementation
    // For now, return unknown status
    return { status: 'unknown' };
  }
}

export const sendGridService = SendGridService.getInstance();