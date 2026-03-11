import bcrypt from 'bcryptjs';
import { authenticator } from 'otplib';
import employeeRepo from '../repositories/employeeRepo.js';
import { encryptField } from './encryptionService.js';

const userService = {
  async createEmployee({ fullName, email, password, bankAccountEnc, role = 'Admin', rssbNumber, clientId, phoneNumber, bankName, accountHolderName }) {
    if (email && clientId) {
      const existing = await employeeRepo.findByEmailAndClient(email, clientId);
      if (existing) {
        const err = new Error('An employee with this email already exists for this client.');
        err.status = 409;
        err.code = 'DUPLICATE_EMAIL';
        throw err;
      }
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const mfaSecret = authenticator.generateSecret();
    return employeeRepo.create({
      fullName,
      email,
      bankAccountEnc: bankAccountEnc || encryptField('bank_account_enc', 'PENDING'),
      role,
      passwordHash,
      mfaSecret,
      rssbNumber,
      clientId: clientId ?? undefined,
      phoneNumber: phoneNumber ?? null,
      bankName: bankName ?? null,
      accountHolderName: accountHolderName ?? null,
    });
  },

  async findByEmail(email) {
    return employeeRepo.findByEmail(email);
  },

  async listEmployees(params) {
    return employeeRepo.list(params);
  },

  async listEmployeesByClient(clientId, params) {
    return employeeRepo.listByClientId(clientId, params);
  },

  async getEmployeeById(employeeId) {
    return employeeRepo.findById(employeeId);
  },

  async updateEmployee(employeeId, updates) {
    return employeeRepo.update({
      employeeId,
      ...updates,
    });
  },

  async deleteEmployee(employeeId) {
    return employeeRepo.delete(employeeId);
  },
};

export default userService;

