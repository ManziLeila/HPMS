import auditRepo from '../repositories/auditRepo.js';

const auditService = {
  async log({ userId, actionType, details, ipAddress, userAgent, correlationId }) {
    await auditRepo.insert({
      userId,
      actionType,
      details,
      ipAddress,
      userAgent,
      correlationId,
    });
  },
};

export default auditService;

