import bcrypt from 'bcryptjs';
import { authenticator } from 'otplib';
import userRepo from '../repositories/userRepo.js';

const systemUserService = {
  async createUser({ fullName, email, password, role, department }) {
    const passwordHash = await bcrypt.hash(password, 12);
    const mfaSecret = authenticator.generateSecret();
    return userRepo.create({ fullName, email, passwordHash, mfaSecret, role, department });
  },

  async findByEmail(email) {
    return userRepo.findByEmail(email);
  },

  async getUserById(userId) {
    return userRepo.findById(userId);
  },

  async listUsers(params) {
    return userRepo.list(params);
  },

  async updateUser(userId, updates) {
    return userRepo.update({ userId, ...updates });
  },

  async deleteUser(userId) {
    return userRepo.delete(userId);
  },

  async getUsersByRole(role) {
    return userRepo.findByRole(role);
  },
};

export default systemUserService;
