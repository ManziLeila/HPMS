import fs from 'node:fs/promises';
import { z } from 'zod';
import contractService from '../services/contractService.js';
import fileStorageService from '../services/fileStorageService.js';
import { badRequest, forbidden, notFound } from '../utils/httpError.js';

/* ── validation ─────────────────────────────────────────────── */
const createSchema = z.object({
    employeeId: z.number().int().positive(),
    contractType: z.enum(['fixed-term', 'permanent', 'internship', 'probation', 'part-time']),
    jobTitle: z.string().min(2),
    department: z.string().optional(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
    salaryGrade: z.string().optional(),
    grossSalary: z.number().optional(),
    notes: z.string().optional(),
});

const updateSchema = createSchema.partial().extend({
    contractId: z.number().int().positive(),
    status: z.enum(['active', 'expired', 'terminated', 'renewed']).optional(),
});

/* ── helpers ─────────────────────────────────────────────────── */
const CAN_MANAGE = ['FinanceOfficer', 'HR', 'Admin'];

/* ── controllers ─────────────────────────────────────────────── */
export const create = async (req, res, next) => {
    try {
        if (!CAN_MANAGE.includes(req.user.role)) throw forbidden('Insufficient permissions');
        const data = createSchema.parse(req.body);
        const contract = await contractService.create({ ...data, createdBy: null });
        res.status(201).json({ success: true, data: contract });
    } catch (e) { next(e); }
};

export const list = async (req, res, next) => {
    try {
        const { status, limit = '50', offset = '0' } = req.query;
        const contracts = await contractService.list({ status, limit: +limit, offset: +offset });
        res.json({ success: true, data: contracts, count: contracts.length });
    } catch (e) { next(e); }
};

export const getById = async (req, res, next) => {
    try {
        const id = +req.params.id;
        if (isNaN(id)) throw badRequest('Invalid contract ID');
        const contract = await contractService.findById(id);
        if (!contract) return res.status(404).json({ success: false, message: 'Not found' });
        res.json({ success: true, data: contract });
    } catch (e) { next(e); }
};

export const getByEmployee = async (req, res, next) => {
    try {
        const contracts = await contractService.findByEmployee(+req.params.employeeId);
        res.json({ success: true, data: contracts });
    } catch (e) { next(e); }
};

export const update = async (req, res, next) => {
    try {
        if (!CAN_MANAGE.includes(req.user.role)) throw forbidden('Insufficient permissions');
        const id = +req.params.id;
        const data = updateSchema.parse({ ...req.body, contractId: id });
        const contract = await contractService.update(data);
        res.json({ success: true, data: contract });
    } catch (e) { next(e); }
};

export const getExpiring = async (req, res, next) => {
    try {
        const days = +(req.query.days || '30');
        const contracts = await contractService.expiring(days);
        res.json({ success: true, data: contracts, count: contracts.length });
    } catch (e) { next(e); }
};

export const downloadContractDocument = async (req, res, next) => {
    try {
        const id = +req.params.id;
        if (isNaN(id)) throw badRequest('Invalid contract ID');
        const contract = await contractService.findById(id);
        if (!contract || !contract.contract_document_path) throw notFound('Contract document not found');
        const fullPath = fileStorageService.getContractPath(contract.contract_document_path);
        const content = await fs.readFile(fullPath);
        const filename = contract.contract_document_path.split('/').pop() || 'contract.pdf';
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', 'application/octet-stream');
        res.send(content);
    } catch (e) { next(e); }
};

export const getStats = async (req, res, next) => {
    try {
        const stats = await contractService.stats();
        res.json({ success: true, data: stats });
    } catch (e) { next(e); }
};

export const runNotifications = async (req, res, next) => {
    try {
        if (!['HR', 'Admin'].includes(req.user.role)) throw forbidden('HR only');
        const result = await contractService.runNotifications();
        res.json({ success: true, message: `Sent ${result.sent} notifications`, data: result });
    } catch (e) { next(e); }
};
