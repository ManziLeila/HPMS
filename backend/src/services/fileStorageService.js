import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STORAGE_ROOT = path.resolve(__dirname, '../../storage');

/**
 * Service for managing persistent file storage (e.g., payslips)
 */
class FileStorageService {
    constructor() {
        this.payslipsDir = path.join(STORAGE_ROOT, 'payslips');
    }

    /**
     * Ensure a directory exists (recursive)
     */
    async ensureDir(dirPath) {
        try {
            await fs.mkdir(dirPath, { recursive: true });
        } catch (err) {
            if (err.code !== 'EEXIST') throw err;
        }
    }

    /**
     * Save a payslip PDF to the structured filesystem
     * Path: storage/payslips/YYYY/MM/payslip-name.pdf
     */
    async savePayslip(buffer, filename, payPeriod) {
        try {
            const date = new Date(payPeriod);
            const year = date.getFullYear().toString();
            const month = (date.getMonth() + 1).toString().padStart(2, '0');

            const targetDir = path.join(this.payslipsDir, year, month);
            await this.ensureDir(targetDir);

            const filePath = path.join(targetDir, filename);
            await fs.writeFile(filePath, buffer);

            console.log(`[FileStorage] Saved payslip to: ${filePath}`);
            return filePath;
        } catch (err) {
            console.error('[FileStorage] Failed to save payslip:', err);
            // Don't crash the whole process if storage fails, but log it
            return null;
        }
    }

    /**
     * Generate a ZIP buffer of all payslips for a given year and month
     */
    async generateMonthZip(year, month) {
        try {
            const jszipModule = await import('jszip');
            const JSZip = jszipModule.default || jszipModule;
            const zip = new JSZip();

            const monthPath = path.join(this.payslipsDir, year, month);

            // Check if directory exists
            try {
                await fs.access(monthPath);
            } catch {
                console.warn(`[FileStorage] ZIP targeted non-existent directory: ${monthPath}`);
                return null;
            }

            const files = await fs.readdir(monthPath);
            if (files.length === 0) return null;

            for (const file of files) {
                const filePath = path.join(monthPath, file);
                const content = await fs.readFile(filePath);
                zip.file(file, content);
            }

            return await zip.generateAsync({ type: 'nodebuffer' });
        } catch (err) {
            console.error(`[FileStorage] Failed to generate ZIP for ${year}/${month}:`, err);
            return null;
        }
    }

    /**
     * List years available in storage
     */
    async listAvailableYears() {
        try {
            await this.ensureDir(this.payslipsDir);
            return await fs.readdir(this.payslipsDir);
        } catch {
            return [];
        }
    }

    /**
     * List months available for a year
     */
    async listAvailableMonths(year) {
        try {
            const yearPath = path.join(this.payslipsDir, year);
            return await fs.readdir(yearPath);
        } catch {
            return [];
        }
    }
}

export default new FileStorageService();
