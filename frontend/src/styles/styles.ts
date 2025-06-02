// styles.ts
import React from 'react';

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    background: 'linear-gradient(to right, #eef2f3, #8e9eab)',
    padding: '20px',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
    padding: '32px',
    maxWidth: '400px',
    width: '100%',
    boxSizing: 'border-box',
  },
  heading: {
    textAlign: 'center',
    marginBottom: '12px',
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#333',
  },
  subHeading: {
    textAlign: 'center',
    marginBottom: '24px',
    color: '#666',
    fontSize: '14px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    marginBottom: '6px',
    fontWeight: 500,
    color: '#333',
  },
  input: {
    padding: '10px 12px',
    border: '1px solid #ccc',
    borderRadius: '6px',
    fontSize: '14px',
    outlineColor: '#007bff',
  },
  button: {
    padding: '12px',
    color: '#fff',
    fontSize: '15px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  errorText: {
    color: 'red',
    fontSize: '14px',
    textAlign: 'center',
    marginTop: '-8px',
    marginBottom: '8px',
  },
};

export default styles;
