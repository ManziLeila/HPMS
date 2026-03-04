/**
 * Convert a number to words (for Rwandan Francs)
 * Example: 9500 -> "Nine Thousand Five Hundred"
 */
export const numberToWords = (num) => {
    if (num === 0) return 'Zero';

    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

    const convertLessThanThousand = (n) => {
        if (n === 0) return '';

        if (n < 10) return ones[n];
        if (n < 20) return teens[n - 10];
        if (n < 100) {
            const ten = Math.floor(n / 10);
            const one = n % 10;
            return tens[ten] + (one > 0 ? ' ' + ones[one] : '');
        }

        const hundred = Math.floor(n / 100);
        const remainder = n % 100;
        return ones[hundred] + ' Hundred' + (remainder > 0 ? ' ' + convertLessThanThousand(remainder) : '');
    };

    const convertMillions = (n) => {
        if (n >= 1000000) {
            const millions = Math.floor(n / 1000000);
            const remainder = n % 1000000;
            return convertLessThanThousand(millions) + ' Million' + (remainder > 0 ? ' ' + convertMillions(remainder) : '');
        }
        if (n >= 1000) {
            const thousands = Math.floor(n / 1000);
            const remainder = n % 1000;
            return convertLessThanThousand(thousands) + ' Thousand' + (remainder > 0 ? ' ' + convertLessThanThousand(remainder) : '');
        }
        return convertLessThanThousand(n);
    };

    // Round to nearest whole number for currency
    const rounded = Math.round(num);
    return convertMillions(rounded).trim();
};
