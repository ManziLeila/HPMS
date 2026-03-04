import config from '../config/env.js';

/**
 * Basic SMS Service
 * Currently supports a mock implementation and Africa's Talking template
 */
class SmsService {
    /**
     * Send a simple text message
     * @param {string} phoneNumber - Recipient in international format (+250...)
     * @param {string} message - Message body
     */
    async sendSms(phoneNumber, message) {
        if (!config.sms.enabled) {
            console.log(`[SMS MOCKED] To: ${phoneNumber} | Msg: ${message}`);
            return { success: true, status: 'mocked' };
        }

        try {
            if (config.sms.provider === 'africastalking') {
                // This would require the 'africastalking' npm package
                // For now we'll show high-level logic
                console.log(`[AFRICA TALKING] Sending to ${phoneNumber}: ${message}`);

                /* 
                // Implementation example:
                const options = {
                    apiKey: config.sms.apiKey,
                    username: config.sms.username
                };
                const AfricasTalking = require('africastalking')(options);
                const sms = AfricasTalking.SMS;
                await sms.send({
                    to: [phoneNumber],
                    message: message,
                    from: config.sms.senderId
                });
                */
                return { success: true, provider: 'africastalking' };
            }

            console.warn(`Unknown SMS provider: ${config.sms.provider}`);
            return { success: false, error: 'Unsupported provider' };
        } catch (error) {
            console.error('SMS Send Error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Send a payslip summary SMS
     */
    async sendPayslipSms({ phoneNumber, employeeName, netSalary, payPeriod }) {
        const message = `Hello ${employeeName}, your payslip for ${payPeriod} is ready. Net Salary: ${netSalary}. - HC Solutions`;
        return this.sendSms(phoneNumber, message);
    }
}

export default new SmsService();
