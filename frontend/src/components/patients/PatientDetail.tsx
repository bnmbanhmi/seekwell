import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PatientMonitoringService, { AnalysisResult, PatientMonitoringData } from '../../services/PatientMonitoringService';
import styles from './PatientDetail.module.css';

const PatientDetail: React.FC = () => {
  const [patientData, setPatientData] = useState<PatientMonitoringData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisResult | null>(null);
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  
  // Note editing states
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteContent, setEditingNoteContent] = useState('');
  const [editingNote, setEditingNote] = useState(false);
  
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    // Get current user role for note permissions
    const role = localStorage.getItem('role');
    setCurrentUserRole(role);

    const fetchPatientData = async () => {
      if (!patientId) {
        setError('Patient ID is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const data = await PatientMonitoringService.getPatientMonitoringData(parseInt(patientId));
        
        if (!data) {
          setError('Patient not found or no data available');
        } else {
          setPatientData(data);
        }
      } catch (err) {
        console.error('Error fetching patient data:', err);
        setError('Failed to load patient data');
      } finally {
        setLoading(false);
      }
    };

    fetchPatientData();
  }, [patientId]);

  const handleAddNote = async (analysisId: string) => {
    if (!newNote.trim() || !patientId) return;

    setAddingNote(true);
    try {
      const success = await PatientMonitoringService.addNoteToAnalysis(patientId, analysisId, newNote);
      
      if (success) {
        // Refresh patient data to show the new note
        const data = await PatientMonitoringService.getPatientMonitoringData(parseInt(patientId));
        if (data) {
          setPatientData(data);
          // Update selected analysis if it's the one we added a note to
          if (selectedAnalysis && selectedAnalysis.id === analysisId) {
            const updatedAnalysis = data.analysisHistory.find(a => a.id === analysisId);
            if (updatedAnalysis) {
              setSelectedAnalysis(updatedAnalysis);
            }
          }
        }
        setNewNote('');
      } else {
        alert('Failed to add note. Please try again.');
      }
    } catch (error) {
      console.error('Error adding note:', error);
      alert('Error adding note. Please try again.');
    } finally {
      setAddingNote(false);
    }
  };

  const canAddNotes = currentUserRole && ['OFFICIAL', 'DOCTOR', 'ADMIN'].includes(currentUserRole);

  const handleEditNote = async (noteId: string) => {
    if (!editingNoteContent.trim() || !selectedAnalysis) return;
    
    setEditingNote(true);
    try {
      const success = await PatientMonitoringService.editNoteInAnalysis(
        patientId!, 
        selectedAnalysis.id, 
        noteId, 
        editingNoteContent
      );
      
      if (success) {
        // Refresh patient data to show the updated note
        const data = await PatientMonitoringService.getPatientMonitoringData(parseInt(patientId!));
        if (data) {
          setPatientData(data);
          const updatedAnalysis = data.analysisHistory.find(a => a.id === selectedAnalysis.id);
          if (updatedAnalysis) {
            setSelectedAnalysis(updatedAnalysis);
          }
        }
        setEditingNoteId(null);
        setEditingNoteContent('');
      } else {
        alert('Failed to edit note. Please try again.');
      }
    } catch (error) {
      console.error('Error editing note:', error);
      alert('Error editing note. Please try again.');
    } finally {
      setEditingNote(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!selectedAnalysis) return;
    
    if (!window.confirm('Are you sure you want to delete this note?')) return;
    
    try {
      const success = await PatientMonitoringService.deleteNoteFromAnalysis(
        patientId!, 
        selectedAnalysis.id, 
        noteId
      );
      
      if (success) {
        // Refresh patient data to show the updated notes
        const data = await PatientMonitoringService.getPatientMonitoringData(parseInt(patientId!));
        if (data) {
          setPatientData(data);
          const updatedAnalysis = data.analysisHistory.find(a => a.id === selectedAnalysis.id);
          if (updatedAnalysis) {
            setSelectedAnalysis(updatedAnalysis);
          }
        }
      } else {
        alert('Failed to delete note. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting note:', error);
      alert('Error deleting note. Please try again.');
    }
  };

  const startEditingNote = (noteId: string, currentContent: string) => {
    setEditingNoteId(noteId);
    setEditingNoteContent(currentContent);
  };

  const cancelEditingNote = () => {
    setEditingNoteId(null);
    setEditingNoteContent('');
  };

  const canEditNote = (note: any) => {
    const currentUserId = parseInt(localStorage.getItem('user_id') || '0');
    return currentUserRole === 'ADMIN' || note.author_id === currentUserId;
  };

  const formatDateTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getRoleDisplayName = (role: string) => {
    const roleNames: { [key: string]: string } = {
      'PATIENT': 'Patient',
      'OFFICIAL': 'Health Official',
      'DOCTOR': 'Doctor',
      'ADMIN': 'Administrator'
    };
    return roleNames[role] || role;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel?.toLowerCase()) {
      case 'high': return '#dc3545';
      case 'medium': return '#ffc107';
      case 'low': return '#28a745';
      default: return '#6c757d';
    }
  };

  if (loading) return <div className={styles.loading}>Loading patient data...</div>;
  if (error) return <div className={styles.error}>{error}</div>;
  if (!patientData) return <div className={styles.error}>Patient not found</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button 
          className={styles.backButton}
          onClick={() => navigate('/dashboard/patient-monitoring')}
        >
          ← Back to Patient List
        </button>
        <h2 className={styles.title}>Patient Details</h2>
      </div>

      <div className={styles.content}>
        {/* Patient Information */}
        <div className={styles.patientHeader}>
          <div className={styles.patientProfile}>
            <div className={styles.avatar}>
              {patientData.patient.full_name ? patientData.patient.full_name.charAt(0).toUpperCase() : '?'}
            </div>
            <div className={styles.patientBasicInfo}>
              <h3>{patientData.patient.full_name || 'Unknown Patient'}</h3>
              <p><strong>Email:</strong> {patientData.patient.email || 'No email provided'}</p>
              {patientData.patient.phone_number && (
                <p><strong>Phone:</strong> {patientData.patient.phone_number}</p>
              )}
              {patientData.patient.identification_id && (
                <p><strong>ID:</strong> {patientData.patient.identification_id}</p>
              )}
              {patientData.patient.date_of_birth && (
                <p><strong>DOB:</strong> {new Date(patientData.patient.date_of_birth).toLocaleDateString()}</p>
              )}
              {patientData.patient.gender && (
                <p><strong>Gender:</strong> {patientData.patient.gender}</p>
              )}
              {patientData.patient.health_insurance_card_no && (
                <p><strong>Insurance:</strong> {patientData.patient.health_insurance_card_no}</p>
              )}
            </div>
          </div>

          <div className={styles.patientOverview}>
            <div className={styles.overviewCard}>
              <h4>{patientData.totalAnalyses}</h4>
              <p>Total Analyses</p>
            </div>
            <div className={styles.overviewCard}>
              <h4 style={{ color: '#dc3545' }}>{patientData.urgentCases.length}</h4>
              <p>Urgent Cases</p>
            </div>
            <div className={styles.overviewCard}>
              <h4>{patientData.lastAnalysisDate ? formatDate(patientData.lastAnalysisDate).split(',')[0] : 'N/A'}</h4>
              <p>Last Analysis</p>
            </div>
          </div>
        </div>

        {/* Urgent Cases Section */}
        {patientData.urgentCases.length > 0 && (
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>🚨 Urgent Cases ({patientData.urgentCases.length})</h4>
            <div className={styles.casesList}>
              {patientData.urgentCases.map((analysis, index) => (
                <div key={`${analysis.id}-${index}`} className={styles.caseCard}>
                  <div className={styles.caseImage}>
                    <img src={analysis.image} alt="Analysis" />
                  </div>
                  <div className={styles.caseDetails}>
                    <div className={styles.caseHeader}>
                      <h5>{analysis.result?.disease || 'Unknown Condition'}</h5>
                      <span 
                        className={styles.riskBadge}
                        style={{ backgroundColor: getRiskLevelColor(analysis.result?.riskLevel || 'Low') }}
                      >
                        {analysis.result?.riskLevel || 'Low'} Risk
                      </span>
                    </div>
                    <p><strong>Top Prediction Confidence:</strong> {analysis.result?.confidence ? (analysis.result.confidence * 100).toFixed(1) : '0'}%</p>
                    
                    {/* Full Classification Results */}
                    {analysis.fullPredictions && analysis.fullPredictions.length > 0 && (
                      <div className={styles.fullClassifications}>
                        <p><strong>Full Classification Results:</strong></p>
                        <div className={styles.classificationsGrid}>
                          {analysis.fullPredictions.map((prediction, idx) => (
                            <div key={idx} className={styles.classificationItem}>
                              <span className={styles.classLabel}>{prediction.label.replace(/^[A-Z]{3,4}\s*-?\s*/, '').replace(/^\(([^)]+)\)/, '$1')}:</span>
                              <span className={styles.classPercentage}>{prediction.percentage ? prediction.percentage.toFixed(2) : (prediction.confidence * 100).toFixed(2)}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <p><strong>Date:</strong> {formatDate(analysis.date)}</p>
                    {analysis.bodyRegion && (
                      <p><strong>Body Region:</strong> {analysis.bodyRegion}</p>
                    )}
                    
                    {/* Enhanced Notes History */}
                    {analysis.noteHistory && analysis.noteHistory.length > 0 && (
                      <div className={styles.notesHistory}>
                        <h5><strong>📝 Notes History:</strong></h5>
                        {analysis.noteHistory.map((note, noteIndex) => (
                          <div key={note.id} className={styles.noteEntry}>
                            <div className={styles.noteHeader}>
                              <span className={styles.noteAuthor}>
                                {getRoleDisplayName(note.author_role)}: {note.author}
                                {note.edited_at && (
                                  <span className={styles.editedIndicator}> (edited)</span>
                                )}
                              </span>
                              <div className={styles.noteActions}>
                                <span className={styles.noteTimestamp}>
                                  {formatDateTime(note.timestamp)}
                                </span>
                                {canEditNote(note) && note.author_role !== 'PATIENT' && (
                                  <div className={styles.noteButtons}>
                                    <button
                                      className={styles.editNoteBtn}
                                      onClick={() => startEditingNote(note.id, note.content)}
                                      title="Edit note"
                                    >
                                      ✏️
                                    </button>
                                    <button
                                      className={styles.deleteNoteBtn}
                                      onClick={() => handleDeleteNote(note.id)}
                                      title="Delete note"
                                    >
                                      🗑️
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {editingNoteId === note.id ? (
                              <div className={styles.editNoteSection}>
                                <textarea
                                  className={styles.editNoteTextarea}
                                  value={editingNoteContent}
                                  onChange={(e) => setEditingNoteContent(e.target.value)}
                                  rows={3}
                                />
                                <div className={styles.editNoteActions}>
                                  <button
                                    className={styles.saveNoteBtn}
                                    onClick={() => handleEditNote(note.id)}
                                    disabled={editingNote}
                                  >
                                    {editingNote ? 'Saving...' : 'Save'}
                                  </button>
                                  <button
                                    className={styles.cancelNoteBtn}
                                    onClick={cancelEditingNote}
                                    disabled={editingNote}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className={styles.noteContent}>
                                {note.content}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add Note Section for Officials/Doctors */}
                    {canAddNotes && (
                      <div className={styles.addNoteSection}>
                        <h5><strong>✍️ Add Professional Note:</strong></h5>
                        <textarea
                          className={styles.noteTextarea}
                          value={newNote}
                          onChange={(e) => setNewNote(e.target.value)}
                          placeholder={`Add your ${getRoleDisplayName(currentUserRole || '')} notes here...`}
                          rows={3}
                        />
                        <button
                          className={styles.addNoteButton}
                          onClick={() => handleAddNote(analysis.id)}
                          disabled={!newNote.trim() || addingNote}
                        >
                          {addingNote ? 'Adding...' : 'Add Note'}
                        </button>
                      </div>
                    )}
                    
                    <p><strong>Description:</strong> {analysis.result?.description || 'No description available'}</p>
                    
                    {analysis.result?.recommendations && analysis.result.recommendations.length > 0 && (
                      <div className={styles.recommendations}>
                        <strong>Recommendations:</strong>
                        <ul>
                          {analysis.result.recommendations.map((rec, i) => (
                            <li key={i}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analysis History */}
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>📊 Analysis History ({patientData.analysisHistory.length})</h4>
          <div className={styles.historyList}>
            {patientData.analysisHistory.length > 0 ? (
              patientData.analysisHistory.map((analysis, index) => (
                <div key={`${analysis.id}-${index}`} className={styles.historyCard}>
                  <div className={styles.historyImage}>
                    <img src={analysis.image} alt="Analysis" />
                  </div>
                  <div className={styles.historyDetails}>
                    <div className={styles.historyHeader}>
                      <h6>{analysis.result?.disease || 'Unknown Condition'}</h6>
                      <span 
                        className={styles.riskBadge}
                        style={{ backgroundColor: getRiskLevelColor(analysis.result?.riskLevel || 'Low') }}
                      >
                        {analysis.result?.riskLevel || 'Low'}
                      </span>
                    </div>
                    <p>{analysis.result?.confidence ? (analysis.result.confidence * 100).toFixed(1) : '0'}% confidence</p>
                    <p>{formatDate(analysis.date)}</p>
                    
                    {/* Full Classification Results Preview */}
                    {analysis.fullPredictions && analysis.fullPredictions.length > 0 && (
                      <div className={styles.historyClassifications}>
                        <p><strong>All Classifications:</strong></p>
                        <div className={styles.classificationsPreview}>
                          {analysis.fullPredictions.slice(0, 3).map((prediction, idx) => (
                            <span key={idx} className={styles.classificationPreview}>
                              {prediction.label.replace(/^[A-Z]{3,4}\s*-?\s*/, '').replace(/^\(([^)]+)\)/, '$1')}: {prediction.percentage ? prediction.percentage.toFixed(1) : (prediction.confidence * 100).toFixed(1)}%
                            </span>
                          ))}
                          {analysis.fullPredictions.length > 3 && (
                            <span className={styles.moreClassifications}>+{analysis.fullPredictions.length - 3} more</span>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Notes Preview */}
                    {analysis.noteHistory && analysis.noteHistory.length > 0 && (
                      <div className={styles.historyNotes}>
                        <p><strong>Notes ({analysis.noteHistory.length}):</strong></p>
                        {analysis.noteHistory.slice(-2).map((note) => (
                          <div key={note.id} className={styles.notePreview}>
                            <span className={styles.noteAuthorSmall}>
                              {getRoleDisplayName(note.author_role)}:
                            </span>
                            <span className={styles.noteContentSmall}>
                              {note.content.length > 60 ? `${note.content.substring(0, 60)}...` : note.content}
                            </span>
                          </div>
                        ))}
                        {analysis.noteHistory.length > 2 && (
                          <p className={styles.moreNotes}>+ {analysis.noteHistory.length - 2} more notes</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className={styles.noData}>No analysis history available.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDetail;
