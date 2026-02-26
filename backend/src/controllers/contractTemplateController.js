import templateRepo from '../repositories/contractTemplateRepo.js';
import contractRepo from '../repositories/contractRepo.js';
import { fillTemplate, streamContractPDF, PLACEHOLDERS } from '../services/contractTemplateService.js';

/* ── GET /contract-templates ──────────────── list all */
export const listTemplates = async (req, res, next) => {
    try {
        res.json(await templateRepo.list());
    } catch (e) { next(e); }
};

/* ── GET /contract-templates/placeholders ─── available tokens */
export const getPlaceholders = (_req, res) => res.json(PLACEHOLDERS);

/* ── GET /contract-templates/:id ─────────── single */
export const getTemplate = async (req, res, next) => {
    try {
        const t = await templateRepo.findById(req.params.id);
        if (!t) return res.status(404).json({ error: { message: 'Template not found' } });
        res.json(t);
    } catch (e) { next(e); }
};

/* ── POST /contract-templates ────────────── create */
export const createTemplate = async (req, res, next) => {
    try {
        const { name, description, contractType, body, headerHtml, footerHtml, isDefault } = req.body;
        if (!name?.trim()) return res.status(400).json({ error: { message: 'Template name is required' } });
        if (!body?.trim()) return res.status(400).json({ error: { message: 'Template body is required' } });
        const t = await templateRepo.create({
            name, description, contractType, body, headerHtml, footerHtml, isDefault,
            createdBy: req.user.employeeId,
        });
        res.status(201).json(t);
    } catch (e) { next(e); }
};

/* ── PATCH /contract-templates/:id ──────── update */
export const updateTemplate = async (req, res, next) => {
    try {
        const t = await templateRepo.update({ templateId: req.params.id, ...req.body });
        if (!t) return res.status(404).json({ error: { message: 'Template not found' } });
        res.json(t);
    } catch (e) { next(e); }
};

/* ── DELETE /contract-templates/:id ─────── delete */
export const deleteTemplate = async (req, res, next) => {
    try {
        await templateRepo.delete(req.params.id);
        res.status(204).end();
    } catch (e) { next(e); }
};

/* ── POST /contract-templates/:id/preview ── preview filled HTML */
export const previewTemplate = async (req, res, next) => {
    try {
        const t = await templateRepo.findById(req.params.id);
        if (!t) return res.status(404).json({ error: { message: 'Template not found' } });
        const filled = fillTemplate(t.body, req.body);
        res.json({ body: filled });
    } catch (e) { next(e); }
};

/* ── GET /contracts/:id/pdf ──────────────── download filled PDF */
export const downloadContractPDF = async (req, res, next) => {
    try {
        const contract = await contractRepo.findById(req.params.id);
        if (!contract) return res.status(404).json({ error: { message: 'Contract not found' } });

        let body;
        if (contract.template_id) {
            const tmpl = await templateRepo.findById(contract.template_id);
            body = tmpl ? fillTemplate(tmpl.body, contract) : buildFallbackBody(contract);
        } else {
            body = buildFallbackBody(contract);
        }

        const safeName = (contract.full_name || 'employee').replace(/\s+/g, '-').toLowerCase();
        streamContractPDF(res, {
            fileName: `contract-${safeName}-${contract.contract_id}.pdf`,
            body,
            headerLine: `HC Solutions Ltd · Contract #${contract.contract_id} · Generated ${new Date().toLocaleDateString('en-GB')}`,
        });
    } catch (e) { next(e); }
};

/* Fallback when no template exists */
const buildFallbackBody = (c) => `EMPLOYMENT CONTRACT

HC Solutions Ltd — Contract #${c.contract_id}

EMPLOYEE DETAILS
Full Name:     ${c.full_name || '—'}
Email:         ${c.email || '—'}
Department:    ${c.department || '—'}
Job Title:     ${c.job_title}
Contract Type: ${c.contract_type}
Start Date:    ${c.start_date ? new Date(c.start_date).toLocaleDateString('en-GB') : '—'}
End Date:      ${c.end_date ? new Date(c.end_date).toLocaleDateString('en-GB') : 'Open-ended'}
Gross Salary:  ${c.gross_salary ? Number(c.gross_salary).toLocaleString() : '—'} RWF
Salary Grade:  ${c.salary_grade || '—'}

Notes:
${c.notes || 'None'}

──────────────────────────────────────────
Employee Signature: _______________________    Date: ___________

Employer Signature: _______________________    Date: ___________
                    HC Solutions Ltd
`;
