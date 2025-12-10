/**
 * Loan Type Display Names and Utilities
 */

export const LOAN_TYPES = {
    sao: {
        name: 'Short Term (STD)',
        shortName: 'STD',
        interestRate: '7% / 13.75%',
        description: '7% (≤1 year), 13.75% (>1 year)',
        tenure: '12 months',
        color: 'blue'
    },
    long_term_emi: {
        name: 'Long Term - EMI',
        shortName: 'Long Term EMI',
        interestRate: '12% / 0.75%',
        description: '12% (1st year), 0.75% (after)',
        tenure: '9 years (108 months)',
        color: 'green'
    },
    rythu_bandhu: {
        name: 'Rythu Bandhu',
        shortName: 'Rythu Bandhu',
        interestRate: '12.50% / 14.50%',
        description: '12.50% (≤1 year), 14.50% (>1 year)',
        tenure: '10 years (120 months)',
        color: 'purple'
    },
    rythu_nethany: {
        name: 'Rythu Nathany',
        shortName: 'Rythu Nathany',
        interestRate: '12.50% / 14.50%',
        description: '12.50% (≤1 year), 14.50% (>1 year)',
        tenure: '10 years (120 months)',
        color: 'indigo'
    },
    amul_loan: {
        name: 'Amul Loans',
        shortName: 'Amul',
        interestRate: '12% / 14%',
        description: '12% (≤1 year), 14% (>1 year)',
        tenure: '10 months',
        color: 'yellow'
    }
}

/**
 * Get loan type display name
 */
export const getLoanTypeName = (loanType) => {
    if (!loanType) return 'Unknown'
    const type = LOAN_TYPES[loanType.toLowerCase()]
    return type ? type.name : loanType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

/**
 * Get loan type short name
 */
export const getLoanTypeShortName = (loanType) => {
    if (!loanType) return 'Unknown'
    const type = LOAN_TYPES[loanType.toLowerCase()]
    return type ? type.shortName : loanType.replace(/_/g, ' ')
}

/**
 * Get loan type interest rate
 */
export const getLoanTypeInterestRate = (loanType) => {
    if (!loanType) return ''
    const type = LOAN_TYPES[loanType.toLowerCase()]
    return type ? type.interestRate : ''
}

/**
 * Get loan type description
 */
export const getLoanTypeDescription = (loanType) => {
    if (!loanType) return ''
    const type = LOAN_TYPES[loanType.toLowerCase()]
    return type ? type.description : ''
}

/**
 * Get loan type color for badges
 */
export const getLoanTypeColor = (loanType) => {
    if (!loanType) return 'gray'
    const type = LOAN_TYPES[loanType.toLowerCase()]
    return type ? type.color : 'gray'
}

/**
 * Get loan status badge color
 */
export const getLoanStatusColor = (status) => {
    const statusColors = {
        active: 'green',
        closed: 'gray',
        pending_approval: 'yellow',
        approved: 'blue',
        rejected: 'red',
        defaulted: 'red',
        draft: 'gray'
    }
    return statusColors[status?.toLowerCase()] || 'gray'
}

/**
 * Get loan status display name
 */
export const getLoanStatusName = (status) => {
    if (!status) return 'Unknown'
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

/**
 * Format currency in Indian format
 */
export const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '₹0'
    return `₹${Number(amount).toLocaleString('en-IN')}`
}

/**
 * Format date
 */
export const formatDate = (date) => {
    if (!date) return ''
    return new Date(date).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    })
}
