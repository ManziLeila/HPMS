import clientRepo from '../repositories/clientRepo.js';
import clientContractRepo from '../repositories/clientContractRepo.js';
import employeeRepo from '../repositories/employeeRepo.js';
import fileStorageService from '../services/fileStorageService.js';
import { notFound, badRequest } from '../utils/httpError.js';

export const listClients = async (req, res, next) => {
  try {
    const limit = Number(req.query.limit) || 50;
    const offset = Number(req.query.offset) || 0;
    const clients = await clientRepo.list({ limit, offset });
    const total = await clientRepo.count();
    res.json({ data: clients, pagination: { limit, offset, total } });
  } catch (error) {
    next(error);
  }
};

export const getClientById = async (req, res, next) => {
  try {
    const clientId = Number(req.params.clientId);
    const client = await clientRepo.findById(clientId);
    if (!client) {
      throw notFound('Client not found');
    }
    res.json(client);
  } catch (error) {
    next(error);
  }
};

export const createClient = async (req, res, next) => {
  try {
    const name = (req.body?.name || '').trim();
    if (!name) {
      throw badRequest('Client name is required');
    }
    const client = await clientRepo.create({
      name,
      email: (req.body?.email || '').trim() || null,
      contactInfo: (req.body?.contact_info || req.body?.contactInfo || '').trim() || null,
    });

    // Optionally create client contract with start/end dates and document
    const startDate = req.body?.startDate || req.body?.start_date;
    if (startDate) {
      let contractDocPath = null;
      if (req.file?.buffer) {
        const filename = req.file.originalname || `client-${client.client_id}-contract.pdf`;
        contractDocPath = await fileStorageService.saveContractDocument(req.file.buffer, filename, `client-${client.client_id}`);
      }
      await clientContractRepo.create({
        clientId: client.client_id,
        contractType: req.body?.contractType || 'service-agreement',
        startDate,
        endDate: req.body?.endDate || req.body?.end_date || null,
        notes: (req.body?.notes || '').trim() || null,
        contractDocumentPath: contractDocPath,
      });
    }

    const fullClient = await clientRepo.findById(client.client_id);
    res.status(201).json(fullClient);
  } catch (error) {
    next(error);
  }
};

export const updateClient = async (req, res, next) => {
  try {
    const clientId = Number(req.params.clientId);
    const name = (req.body?.name || '').trim();
    if (!name) {
      throw badRequest('Client name is required');
    }
    const client = await clientRepo.update({
      clientId,
      name,
      email: (req.body?.email || '').trim() || null,
      contactInfo: (req.body?.contact_info || req.body?.contactInfo || '').trim() || null,
    });
    if (!client) {
      throw notFound('Client not found');
    }
    res.json(client);
  } catch (error) {
    next(error);
  }
};

export const deleteClient = async (req, res, next) => {
  try {
    const clientId = Number(req.params.clientId);
    const deleteEmployees = req.query.deleteEmployees === 'true' || req.query.deleteEmployees === true;

    const client = await clientRepo.findById(clientId);
    if (!client) {
      throw notFound('Client not found');
    }

    if (deleteEmployees) {
      // Delete all employees under this client (and their salaries, contracts, etc.)
      const employees = await employeeRepo.listByClientId(clientId, { limit: 10000 });
      for (const emp of employees) {
        await employeeRepo.deleteWithDependencies(emp.employee_id);
      }
    }

    await clientRepo.delete(clientId);
    res.json({
      message: deleteEmployees
        ? 'Client and all employees deleted'
        : 'Client deleted. Employees were kept and unassigned.',
      client: { client_id: clientId, name: client.name },
    });
  } catch (error) {
    next(error);
  }
};
