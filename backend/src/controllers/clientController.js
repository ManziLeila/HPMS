import clientRepo from '../repositories/clientRepo.js';
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
    const name = req.body?.name?.trim();
    if (!name) {
      throw badRequest('Client name is required');
    }
    const client = await clientRepo.create({ name });
    res.status(201).json(client);
  } catch (error) {
    next(error);
  }
};

export const updateClient = async (req, res, next) => {
  try {
    const clientId = Number(req.params.clientId);
    const name = req.body?.name?.trim();
    if (!name) {
      throw badRequest('Client name is required');
    }
    const client = await clientRepo.update({ clientId, name });
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
    const client = await clientRepo.delete(clientId);
    if (!client) {
      throw notFound('Client not found');
    }
    res.json({ message: 'Client deleted', client });
  } catch (error) {
    next(error);
  }
};
