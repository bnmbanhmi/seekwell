import React, { useState } from 'react';
import axios from 'axios';
import './CreateEMR.css'; // Assuming you have a CSS file for styling

const BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || '').replace(/\/+$/, '');

const CreateEMR: React.FC = () => {
  const [formData, setFormData] = useState({
    consultationNotes: '',
    diagnosis: '',
    prescription: [],
  });
  const [medications, setMedications] = useState([]);
  const [newMedication, setNewMedication] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [step, setStep] = useState(1);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddMedication = () => {
    if (newMedication.trim()) {
      setFormData((prev) => ({
        ...prev,
        prescription: [...prev.prescription, { name: newMedication, dosage: '', quantity: '', instructions: '' }],
      }));
      setNewMedication('');
    }
  };

  const handleSaveEMR = async () => {
    setError('');
    setSuccess('');
    try {
      const response = await axios.post(`${BACKEND_URL}/emr/create`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      setSuccess('EMR saved successfully!');
      setFormData({ consultationNotes: '', diagnosis: '', prescription: [] });
    } catch (err) {
      console.error('Error saving EMR:', err);
      setError('Failed to save EMR. Please try again.');
    }
  };

  const handleCancel = () => {
    setFormData({ consultationNotes: '', diagnosis: '', prescription: [] });
    setError('');
    setSuccess('');
    setStep(1);
  };

  return (
    <div className="create-emr-container">
      <h1>Create EMR</h1>
      {error && <p className="error-message">{error}</p>}
      {success && <p className="success-message">{success}</p>}

      {/* Step 2: EMR Creation Form */}
      {step === 1 && (
        <div className="emr-form">
          <div className="form-group">
            <label htmlFor="consultationNotes">Consultation Notes:</label>
            <textarea
              id="consultationNotes"
              name="consultationNotes"
              value={formData.consultationNotes}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="diagnosis">Diagnosis:</label>
            <input
              type="text"
              id="diagnosis"
              name="diagnosis"
              value={formData.diagnosis}
              onChange={handleChange}
              required
            />
          </div>
          <button onClick={() => setStep(2)}>Add Prescription</button>
        </div>
      )}

      {/* Step 6: Prescription Entry */}
      {step === 2 && (
        <div className="prescription-form">
          <h2>Prescription</h2>
          <div className="form-group">
            <label htmlFor="newMedication">Medication:</label>
            <input
              type="text"
              id="newMedication"
              value={newMedication}
              onChange={(e) => setNewMedication(e.target.value)}
            />
            <button onClick={handleAddMedication}>Add Medication</button>
          </div>
          <ul className="medication-list">
            {formData.prescription.map((med, index) => (
              <li key={index}>
                <strong>{med.name}</strong>
                <div>
                  <label>Dosage:</label>
                  <input
                    type="text"
                    value={med.dosage}
                    onChange={(e) =>
                      setFormData((prev) => {
                        const updatedPrescription = [...prev.prescription];
                        updatedPrescription[index].dosage = e.target.value;
                        return { ...prev, prescription: updatedPrescription };
                      })
                    }
                  />
                </div>
                <div>
                  <label>Quantity:</label>
                  <input
                    type="number"
                    value={med.quantity}
                    onChange={(e) =>
                      setFormData((prev) => {
                        const updatedPrescription = [...prev.prescription];
                        updatedPrescription[index].quantity = e.target.value;
                        return { ...prev, prescription: updatedPrescription };
                      })
                    }
                  />
                </div>
                <div>
                  <label>Instructions:</label>
                  <textarea
                    value={med.instructions}
                    onChange={(e) =>
                      setFormData((prev) => {
                        const updatedPrescription = [...prev.prescription];
                        updatedPrescription[index].instructions = e.target.value;
                        return { ...prev, prescription: updatedPrescription };
                      })
                    }
                  />
                </div>
              </li>
            ))}
          </ul>
          <button onClick={() => setStep(3)}>Review EMR</button>
        </div>
      )}

      {/* Step 9: Review EMR */}
      {step === 3 && (
        <div className="review-emr">
          <h2>Review EMR</h2>
          <p>
            <strong>Consultation Notes:</strong> {formData.consultationNotes}
          </p>
          <p>
            <strong>Diagnosis:</strong> {formData.diagnosis}
          </p>
          <h3>Prescription:</h3>
          <ul>
            {formData.prescription.map((med, index) => (
              <li key={index}>
                <strong>{med.name}</strong> - Dosage: {med.dosage}, Quantity: {med.quantity}, Instructions: {med.instructions}
              </li>
            ))}
          </ul>
          <button onClick={handleSaveEMR}>Save EMR</button>
          <button onClick={handleCancel}>Cancel</button>
        </div>
      )}
    </div>
  );
};

export default CreateEMR;