export const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(amount || 0);
};

export const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

export const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

export const getLoanTypeName = (loanType) => {
    const loanTypes = {
        sao: 'SAO (Short Term Agri)',
        long_term_emi: 'Long Term EMI',
        rythu_bandhu: 'Rythu Bandhu Loan',
        crop_loan: 'Crop Loan',
        gold_loan: 'Gold Loan',
        mortgage_loan: 'Mortgage Loan'
    };
    return loanTypes[loanType] || loanType?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown';
};

export const formatLoanStatus = (status) => {
    const statuses = {
        pending_approval: 'Pending Approval',
        approved: 'Approved',
        active: 'Active',
        closed: 'Closed',
        rejected: 'Rejected',
        overdue: 'Overdue'
    };
    return statuses[status] || status?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown';
};
