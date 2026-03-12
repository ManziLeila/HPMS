import db from './db.js';

export const getAllTemplates = () =>
  db.query('SELECT * FROM email_templates ORDER BY name ASC');

export const getTemplateById = (id) =>
  db.query('SELECT * FROM email_templates WHERE id = $1', [id]);

export const getActiveTemplateByEvent = (triggerEvent) =>
  db.query(
    'SELECT * FROM email_templates WHERE trigger_event = $1 AND is_active = true LIMIT 1',
    [triggerEvent]
  );

export const createTemplate = ({ name, triggerEvent, subject, bodyHtml, description, isActive, variables }) =>
  db.query(
    `INSERT INTO email_templates (name, trigger_event, subject, body_html, description, is_active, variables)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [name, triggerEvent, subject, bodyHtml, description ?? null, isActive ?? true, JSON.stringify(variables ?? [])]
  );

export const updateTemplate = (id, { name, subject, bodyHtml, description, isActive, variables }) =>
  db.query(
    `UPDATE email_templates
     SET name = $1, subject = $2, body_html = $3, description = $4, is_active = $5, variables = $6, updated_at = NOW()
     WHERE id = $7 RETURNING *`,
    [name, subject, bodyHtml, description ?? null, isActive, JSON.stringify(variables ?? []), id]
  );

export const deleteTemplate = (id) =>
  db.query('DELETE FROM email_templates WHERE id = $1', [id]);

export default {
  getAllTemplates,
  getTemplateById,
  getActiveTemplateByEvent,
  createTemplate,
  updateTemplate,
  deleteTemplate,
};
