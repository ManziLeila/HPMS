import { z } from 'zod';
import {
  getAllTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from '../repositories/emailTemplateRepository.js';

const VALID_EVENTS = [
  'welcome_email',
  'salary_processed',
  'payslip_sent',
  'payroll_submitted',
  'hr_approved',
  'hr_rejected',
  'md_approved',
  'md_rejected',
  'fo_notification',
];

const templateSchema = z.object({
  name: z.string().min(1).max(100),
  triggerEvent: z.enum(VALID_EVENTS),
  subject: z.string().min(1).max(255),
  bodyHtml: z.string().min(1),
  description: z.string().optional().nullable(),
  isActive: z.boolean().optional().default(true),
  variables: z.array(z.string()).optional().default([]),
});

const updateSchema = z.object({
  name: z.string().min(1).max(100),
  subject: z.string().min(1).max(255),
  bodyHtml: z.string().min(1),
  description: z.string().optional().nullable(),
  isActive: z.boolean(),
  variables: z.array(z.string()).optional().default([]),
});

/** GET /api/email/templates */
export const listEmailTemplates = async (req, res, next) => {
  try {
    const { rows } = await getAllTemplates();
    res.json({ success: true, templates: rows });
  } catch (err) {
    next(err);
  }
};

/** GET /api/email/templates/:id */
export const getEmailTemplate = async (req, res, next) => {
  try {
    const { rows } = await getTemplateById(req.params.id);
    if (!rows.length) return res.status(404).json({ success: false, error: { message: 'Template not found' } });
    res.json({ success: true, template: rows[0] });
  } catch (err) {
    next(err);
  }
};

/** POST /api/email/templates */
export const createEmailTemplate = async (req, res, next) => {
  try {
    const data = templateSchema.parse(req.body);
    const { rows } = await createTemplate({
      name: data.name,
      triggerEvent: data.triggerEvent,
      subject: data.subject,
      bodyHtml: data.bodyHtml,
      description: data.description,
      isActive: data.isActive,
      variables: data.variables,
    });
    res.status(201).json({ success: true, template: rows[0] });
  } catch (err) {
    if (err?.code === '23505') {
      return res.status(409).json({ success: false, error: { message: 'A template for this trigger event already exists.' } });
    }
    next(err);
  }
};

/** PUT /api/email/templates/:id */
export const updateEmailTemplate = async (req, res, next) => {
  try {
    const data = updateSchema.parse(req.body);
    const { rows } = await updateTemplate(req.params.id, {
      name: data.name,
      subject: data.subject,
      bodyHtml: data.bodyHtml,
      description: data.description,
      isActive: data.isActive,
      variables: data.variables,
    });
    if (!rows.length) return res.status(404).json({ success: false, error: { message: 'Template not found' } });
    res.json({ success: true, template: rows[0] });
  } catch (err) {
    next(err);
  }
};

/** DELETE /api/email/templates/:id */
export const deleteEmailTemplate = async (req, res, next) => {
  try {
    await deleteTemplate(req.params.id);
    res.json({ success: true, message: 'Template deleted' });
  } catch (err) {
    next(err);
  }
};

export default {
  listEmailTemplates,
  getEmailTemplate,
  createEmailTemplate,
  updateEmailTemplate,
  deleteEmailTemplate,
};
