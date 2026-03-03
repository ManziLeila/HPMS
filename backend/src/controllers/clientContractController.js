import clientContractRepo from '../repositories/clientContractRepo.js';
import { notFound, badRequest } from '../utils/httpError.js';

export const listClientContracts = async (req, res, next) => {
  try {
    const clientId = Number(req.params.clientId);
    const limit = Number(req.query.limit) || 50;
    const offset = Number(req.query.offset) || 0;
    const contracts = await clientContractRepo.listByClientId(clientId, { limit, offset });
    res.json({ data: contracts, pagination: { limit, offset } });
  } catch (error) {
    next(error);
  }
};

export const getClientContractById = async (req, res, next) => {
  try {
    const clientId = Number(req.params.clientId);
    const contractId = Number(req.params.contractId);
    const contract = await clientContractRepo.findById(contractId, clientId);
    if (!contract) {
      throw notFound('Client contract not found');
    }
    res.json(contract);
  } catch (error) {
    next(error);
  }
};

export const createClientContract = async (req, res, next) => {
  try {
    const clientId = Number(req.params.clientId);
    const startDate = req.body?.startDate || req.body?.start_date;
    if (!startDate) {
      throw badRequest('Start date is required');
    }
    const contract = await clientContractRepo.create({
      clientId,
      contractType: req.body?.contractType || req.body?.contract_type || 'service-agreement',
      startDate,
      endDate: req.body?.endDate || req.body?.end_date || null,
      notes: req.body?.notes || null,
    });
    res.status(201).json(contract);
  } catch (error) {
    next(error);
  }
};

export const updateClientContract = async (req, res, next) => {
  try {
    const clientId = Number(req.params.clientId);
    const contractId = Number(req.params.contractId);
    const existing = await clientContractRepo.findById(contractId, clientId);
    if (!existing) {
      throw notFound('Client contract not found');
    }
    const startDate = req.body?.startDate ?? req.body?.start_date ?? existing.start_date;
    const endDate = req.body?.endDate !== undefined ? req.body.endDate : (req.body?.end_date !== undefined ? req.body.end_date : existing.end_date);
    const contract = await clientContractRepo.update({
      contractId,
      clientId,
      contractType: req.body?.contractType ?? req.body?.contract_type ?? existing.contract_type,
      startDate,
      endDate,
      notes: req.body?.notes !== undefined ? req.body.notes : existing.notes,
      status: req.body?.status ?? existing.status,
    });
    res.json(contract);
  } catch (error) {
    next(error);
  }
};

export const deleteClientContract = async (req, res, next) => {
  try {
    const clientId = Number(req.params.clientId);
    const contractId = Number(req.params.contractId);
    const contract = await clientContractRepo.delete(contractId, clientId);
    if (!contract) {
      throw notFound('Client contract not found');
    }
    res.json({ message: 'Client contract deleted', contract });
  } catch (error) {
    next(error);
  }
};

export const listAllClientContracts = async (req, res, next) => {
  try {
    const limit = Number(req.query.limit) || 100;
    const offset = Number(req.query.offset) || 0;
    const contracts = await clientContractRepo.listAll({ limit, offset });
    res.json({ data: contracts, pagination: { limit, offset } });
  } catch (error) {
    next(error);
  }
};
