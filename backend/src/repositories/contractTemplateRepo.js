import db from './db.js';

const templateRepo = {
    async create({ name, description, contractType, body, headerHtml, footerHtml, isDefault, createdBy }) {
        const { rows } = await db.query(
            `INSERT INTO hpms_core.contract_templates
         (name, description, contract_type, body, header_html, footer_html, is_default, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
            [name, description, contractType, body, headerHtml, footerHtml, isDefault ?? false, createdBy]
        );
        return rows[0];
    },

    async list() {
        const { rows } = await db.query(
            `SELECT t.*, e.full_name AS created_by_name
       FROM hpms_core.contract_templates t
       LEFT JOIN hpms_core.employees e ON e.employee_id = t.created_by
       ORDER BY t.is_default DESC, t.created_at DESC`
        );
        return rows;
    },

    async findById(id) {
        const { rows } = await db.query(
            `SELECT * FROM hpms_core.contract_templates WHERE template_id = $1`,
            [id]
        );
        return rows[0];
    },

    async update({ templateId, name, description, contractType, body, headerHtml, footerHtml, isDefault }) {
        const { rows } = await db.query(
            `UPDATE hpms_core.contract_templates SET
         name          = COALESCE($2, name),
         description   = COALESCE($3, description),
         contract_type = COALESCE($4, contract_type),
         body          = COALESCE($5, body),
         header_html   = $6,
         footer_html   = $7,
         is_default    = COALESCE($8, is_default)
       WHERE template_id = $1
       RETURNING *`,
            [templateId, name, description, contractType, body, headerHtml, footerHtml, isDefault]
        );
        return rows[0];
    },

    async delete(id) {
        await db.query(`DELETE FROM hpms_core.contract_templates WHERE template_id = $1`, [id]);
    },
};

export default templateRepo;
