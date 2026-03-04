export const resetPeriod = async(req, res, next) =& gt; {
    try {
        const params = monthlyReportQuery.parse({
            year: req.query.year,
            month: req.query.month,
            frequency: req.query.frequency ?? 'all',
        });

        const deletedRecords = await salaryRepo.deletePeriod(params);

        await auditService.log({
            userId: req.user.id,
            actionType: 'RESET_PERIOD',
            details: {
                year: params.year,
                month: params.month,
                frequency: params.frequency,
                deletedCount: deletedRecords.length
            },
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
            correlationId: req.id,
        });

        res.json({
            message: `Successfully deleted ${deletedRecords.length} salary record(s) for ${params.year}-${String(params.month).padStart(2, '0')}`,
            deletedCount: deletedRecords.length,
            deletedRecords
        });
    } catch (error) {
        next(error);
    }
};
