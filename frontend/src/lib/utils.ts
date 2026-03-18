/**
 * Standardizes phone numbers to E.164-like format for display.
 * Ensures the number starts with '+' and has consistent spacing for readability.
 * Example: "923058480889" -> "+92 305 8480889"
 */
export const formatPhoneNumber = (phoneNumber: string): string => {
    if (!phoneNumber) return '';
    
    // Remove all non-numeric characters first to clean up
    const clean = phoneNumber.replace(/\D/g, '');
    
    // If it's a Pakistan number (starting with 92 or 03)
    if (clean.startsWith('92') && clean.length >= 12) {
        return `+92 ${clean.substring(2, 5)} ${clean.substring(5)}`;
    }
    
    if (clean.startsWith('03') && clean.length === 11) {
        return `+92 ${clean.substring(1, 4)} ${clean.substring(4)}`;
    }

    // Default: just prepend + if it's missing and doesn't have one
    if (!phoneNumber.startsWith('+')) {
        return `+${clean}`;
    }

    return phoneNumber;
};
