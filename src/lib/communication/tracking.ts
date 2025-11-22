import { EmailCommunicationModel, SMSCommunicationModel, ContactModel } from '@/lib/models';
import { format } from 'date-fns';

export interface EmailTrackingData {
  contactId?: string;
  contactEmail?: string;
  fromEmail: string;
  toEmail: string;
  ccEmails?: string[];
  bccEmails?: string[];
  subject?: string;
  bodyText?: string;
  bodyHtml?: string;
  messageId?: string;
  threadId?: string;
}

export interface SMSTrackingData {
  contactId?: string;
  contactPhone?: string;
  fromPhone: string;
  toPhone: string;
  messageText: string;
  provider?: string;
  providerMessageId?: string;
}

/**
 * Track an outbound email communication
 */
export async function trackOutboundEmail(data: EmailTrackingData): Promise<string> {
  let contactId = data.contactId;
  
  // If no contact ID provided, try to find contact by email
  if (!contactId && data.toEmail) {
    const contact = await ContactModel.getByEmail(data.toEmail);
    contactId = contact?.id;
  }
  
  // If still no contact found, create a new one
  if (!contactId && data.toEmail) {
    // Extract name from email if possible
    const emailName = data.toEmail.split('@')[0].replace(/[._]/g, ' ');
    const name = emailName.charAt(0).toUpperCase() + emailName.slice(1);
    
    contactId = await ContactModel.create({
      name,
      email: data.toEmail,
      phone: '',
      address: '',
      city: '',
      state: '',
      zip: '',
      notes: 'Auto-created from email communication'
    });
  }
  
  if (!contactId) {
    throw new Error('Could not determine contact for email tracking');
  }
  
  return await EmailCommunicationModel.create({
    contact_id: contactId,
    direction: 'outbound',
    from_email: data.fromEmail,
    to_email: data.toEmail,
    cc_emails: data.ccEmails,
    bcc_emails: data.bccEmails,
    subject: data.subject,
    body_text: data.bodyText,
    body_html: data.bodyHtml,
    message_id: data.messageId,
    thread_id: data.threadId,
    status: 'sent',
    sent_at: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
  });
}

/**
 * Track an inbound email communication
 */
export async function trackInboundEmail(data: EmailTrackingData): Promise<string> {
  let contactId = data.contactId;
  
  // If no contact ID provided, try to find contact by email
  if (!contactId && data.fromEmail) {
    const contact = await ContactModel.getByEmail(data.fromEmail);
    contactId = contact?.id;
  }
  
  // If still no contact found, create a new one
  if (!contactId && data.fromEmail) {
    // Extract name from email if possible
    const emailName = data.fromEmail.split('@')[0].replace(/[._]/g, ' ');
    const name = emailName.charAt(0).toUpperCase() + emailName.slice(1);
    
    contactId = await ContactModel.create({
      name,
      email: data.fromEmail,
      phone: '',
      address: '',
      city: '',
      state: '',
      zip: '',
      notes: 'Auto-created from email communication'
    });
  }
  
  if (!contactId) {
    throw new Error('Could not determine contact for email tracking');
  }
  
  return await EmailCommunicationModel.create({
    contact_id: contactId,
    direction: 'inbound',
    from_email: data.fromEmail,
    to_email: data.toEmail,
    cc_emails: data.ccEmails,
    bcc_emails: data.bccEmails,
    subject: data.subject,
    body_text: data.bodyText,
    body_html: data.bodyHtml,
    message_id: data.messageId,
    thread_id: data.threadId,
    status: 'delivered',
    sent_at: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
  });
}

/**
 * Track an outbound SMS communication
 */
export async function trackOutboundSMS(data: SMSTrackingData): Promise<string> {
  let contactId = data.contactId;
  
  // If no contact ID provided, try to find contact by phone
  if (!contactId && data.toPhone) {
    const contacts = await ContactModel.getAll(1000, 0); // Get all contacts to search by phone
    const contact = contacts.find(c => c.phone === data.toPhone);
    contactId = contact?.id;
  }
  
  // If still no contact found, create a new one
  if (!contactId && data.toPhone) {
    contactId = await ContactModel.create({
      name: `Contact ${data.toPhone}`,
      email: '',
      phone: data.toPhone,
      address: '',
      city: '',
      state: '',
      zip: '',
      notes: 'Auto-created from SMS communication'
    });
  }
  
  if (!contactId) {
    throw new Error('Could not determine contact for SMS tracking');
  }
  
  return await SMSCommunicationModel.create({
    contact_id: contactId,
    direction: 'outbound',
    from_phone: data.fromPhone,
    to_phone: data.toPhone,
    message_text: data.messageText,
    status: 'sent',
    provider: data.provider,
    provider_message_id: data.providerMessageId,
    sent_at: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
  });
}

/**
 * Track an inbound SMS communication
 */
export async function trackInboundSMS(data: SMSTrackingData): Promise<string> {
  let contactId = data.contactId;
  
  // If no contact ID provided, try to find contact by phone
  if (!contactId && data.fromPhone) {
    const contacts = await ContactModel.getAll(1000, 0); // Get all contacts to search by phone
    const contact = contacts.find(c => c.phone === data.fromPhone);
    contactId = contact?.id;
  }
  
  // If still no contact found, create a new one
  if (!contactId && data.fromPhone) {
    contactId = await ContactModel.create({
      name: `Contact ${data.fromPhone}`,
      email: '',
      phone: data.fromPhone,
      address: '',
      city: '',
      state: '',
      zip: '',
      notes: 'Auto-created from SMS communication'
    });
  }
  
  if (!contactId) {
    throw new Error('Could not determine contact for SMS tracking');
  }
  
  return await SMSCommunicationModel.create({
    contact_id: contactId,
    direction: 'inbound',
    from_phone: data.fromPhone,
    to_phone: data.toPhone,
    message_text: data.messageText,
    status: 'delivered',
    provider: data.provider,
    provider_message_id: data.providerMessageId,
    sent_at: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
  });
}

/**
 * Update email status (for tracking opens, clicks, etc.)
 */
export async function updateEmailStatus(
  emailId: string, 
  status: 'sent' | 'delivered' | 'failed' | 'bounced' | 'opened' | 'clicked'
): Promise<void> {
  await EmailCommunicationModel.updateStatus(emailId, status);
}

/**
 * Update SMS status (for tracking delivery, etc.)
 */
export async function updateSMSStatus(
  smsId: string, 
  status: 'sent' | 'delivered' | 'failed' | 'undelivered'
): Promise<void> {
  await SMSCommunicationModel.updateStatus(smsId, status);
}
