// Updated styles.ts - Now follows the design system
import React from 'react';

const styles: { [key: string]: React.CSSProperties } = {
  // Main layout container with improved styling
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, var(--primary-50) 0%, var(--secondary-100) 100%)',
    padding: 'var(--spacing-5)',
  },
  
  // Improved card design following design system
  card: {
    backgroundColor: 'white',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-lg)',
    padding: 'var(--spacing-8)',
    maxWidth: '400px',
    width: '100%',
    border: '1px solid var(--secondary-200)',
  },
  
  // Left-aligned heading (fixing center alignment issue)
  heading: {
    textAlign: 'left' as const,
    marginBottom: 'var(--spacing-3)',
    fontSize: 'var(--font-size-2xl)',
    fontWeight: 'var(--font-weight-bold)',
    color: 'var(--secondary-900)',
    lineHeight: 'var(--line-height-tight)',
  },
  
  // Left-aligned subheading
  subHeading: {
    textAlign: 'left' as const,
    marginBottom: 'var(--spacing-6)',
    color: 'var(--secondary-600)',
    fontSize: 'var(--font-size-sm)',
    lineHeight: 'var(--line-height-normal)',
  },
  
  // Improved form styling
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--spacing-4)',
  },
  
  formGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
  },
  
  // Left-aligned label following design system
  label: {
    marginBottom: 'var(--spacing-2)',
    fontWeight: 'var(--font-weight-medium)',
    color: 'var(--secondary-700)',
    fontSize: 'var(--font-size-sm)',
    textAlign: 'left' as const,
  },
  
  // Input styling following design system
  input: {
    padding: 'var(--spacing-3)',
    border: '1px solid var(--secondary-300)',
    borderRadius: 'var(--radius-md)',
    fontSize: 'var(--font-size-sm)',
    color: 'var(--secondary-900)',
    backgroundColor: 'white',
    transition: 'border-color var(--transition-fast), box-shadow var(--transition-fast)',
    outline: 'none',
  },
  
  // Button styling following design system
  button: {
    padding: 'var(--spacing-3) var(--spacing-4)',
    color: 'white',
    fontSize: 'var(--font-size-sm)',
    fontWeight: 'var(--font-weight-medium)',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
    backgroundColor: 'var(--primary-600)',
  },
  
  // Left-aligned error text (fixing center alignment)
  errorText: {
    color: 'var(--error-600)',
    fontSize: 'var(--font-size-xs)',
    textAlign: 'left' as const,
    marginTop: 'var(--spacing-1)',
    marginBottom: 'var(--spacing-2)',
  },
};

export default styles;
