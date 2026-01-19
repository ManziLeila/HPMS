import bcrypt from 'bcryptjs';
import { authenticator } from 'otplib';
import employeeRepo from '../repositories/employeeRepo.js';
import { encryptField } from './encryptionService.js';

const userService = {
  async createEmployee({ fullName, email, password, bankAccountEnc, role = 'Admin' }) {
    const passwordHash = await bcrypt.hash(password, 12);
    const mfaSecret = authenticator.generateSecret();
    return employeeRepo.create({
      fullName,
      email,
      bankAccountEnc: bankAccountEnc || encryptField('bank_account_enc', 'PENDING'),
      role,
      passwordHash,
      mfaSecret,
    });
  },

  async findByEmail(email) {
    return employeeRepo.findByEmail(email);
  },

  async listEmployees(params) {
    return employeeRepo.list(params);
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

