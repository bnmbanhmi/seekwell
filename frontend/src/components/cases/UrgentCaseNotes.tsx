import React, { useState, useEffect } from 'react';
import { UrgentCase } from '../../services/OfficialAnalyticsService';
import PatientMonitoringService from '../../services/PatientMonitoringService';
import styles from './UrgentCaseNotes.module.css';

interface NoteEntry {
  id: string;
  content: string;
  author: string;
  author_role: string;
  timestamp: string;
  author_id?: number;
}

interface UrgentCaseNotesProps {
  urgentCase: UrgentCase;
  isOpen: boolean;
  onClose: () => void;
}

const UrgentCaseNotes: React.FC<UrgentCaseNotesProps> = ({ urgentCase, isOpen, onClose }) => {
  const [notes, setNotes] = useState<NoteEntry[]>([]);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [addingNote, setAddingNote] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Get current user role for note permissions
      const role = localStorage.getItem('role');
      setCurrentUserRole(role);
      
      // Load existing notes for this urgent case
      loadUrgentCaseNotes();
    }
  }, [isOpen, urgentCase]);

  const loadUrgentCaseNotes = async () => {
    setLoading(true);
    try {
      // Get all notes for this patient
      const patientData = await PatientMonitoringService.getPatientMonitoringData(urgentCase.patientId);
      if (patientData) {
        // Collect all notes from all analyses for this patient
        const allNotes: NoteEntry[] = [];
        patientData.analysisHistory.forEach(analysis => {
          if (analysis.noteHistory) {
            allNotes.push(...analysis.noteHistory);
          }
        });
        
        // Sort notes by timestamp (newest first)
        allNotes.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setNotes(allNotes);
      }
    } catch (error) {
      console.error('Error loading urgent case notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    
    setAddingNote(true);
    try {
      // For urgent cases, we'll add the note to the most recent analysis
      // First, get the patient's latest analysis
      const patientData = await PatientMonitoringService.getPatientMonitoringData(urgentCase.patientId);
      if (patientData && patientData.analysisHistory.length > 0) {
        const latestAnalysis = patientData.analysisHistory[0]; // Assuming sorted by date desc
        
        const success = await PatientMonitoringService.addNoteToAnalysis(
          urgentCase.patientId.toString(), 
          latestAnalysis.id, 
          newNote
        );
        
        if (success) {
          // Reload notes to show the new one
          await loadUrgentCaseNotes();
          setNewNote('');
        }
      }
    } catch (error) {
      console.error('Error adding note:', error);
    } finally {
      setAddingNote(false);
    }
  };

  const canAddNote = () => {
    return currentUserRole === 'LOCAL_CADRE' || 
           currentUserRole === 'DOCTOR' || 
           currentUserRole === 'ADMIN';
  };

  const formatNoteDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'LOCAL_CADRE': return 'Local Cadre';
      case 'DOCTOR': return 'Doctor';
      case 'ADMIN': return 'Administrator';
      default: return role;
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>Notes for {urgentCase.patientName || `Patient ${urgentCase.patientId}`}</h3>
          <div className={styles.caseInfo}>
            <span className={styles.riskBadge}>
              {urgentCase.riskLevel} Risk - {urgentCase.disease}
            </span>
            <span className={styles.confidence}>
              {(urgentCase.confidence * 100).toFixed(1)}% confidence
            </span>
          </div>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>

        <div className={styles.content}>
          {/* Add Note Section - only for authorized users */}
          {canAddNote() && (
            <div className={styles.addNoteSection}>
              <h4>Add Professional Note</h4>
              <textarea
                className={styles.noteTextarea}
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add your professional assessment or recommendations for this urgent case..."
                rows={4}
                disabled={addingNote}
              />
              <div className={styles.addNoteActions}>
                <button
                  className={styles.addNoteButton}
                  onClick={handleAddNote}
                  disabled={!newNote.trim() || addingNote}
                >
                  {addingNote ? 'Adding...' : 'Add Note'}
                </button>
              </div>
            </div>
          )}

          {/* Notes History */}
          <div className={styles.notesHistory}>
            <h4>Notes History ({notes.length})</h4>
            {loading ? (
              <div className={styles.loading}>Loading notes...</div>
            ) : notes.length === 0 ? (
              <div className={styles.noNotes}>
                <p>No professional notes have been added for this patient yet.</p>
                {canAddNote() && (
                  <p>Be the first to add a professional assessment above.</p>
                )}
              </div>
            ) : (
              <div className={styles.notesList}>
                {notes.map((note) => (
                  <div key={note.id} className={styles.noteEntry}>
                    <div className={styles.noteHeader}>
                      <div className={styles.noteAuthor}>
                        <strong>{note.author}</strong>
                        <span className={styles.roleTag}>
                          {getRoleDisplayName(note.author_role)}
                        </span>
                      </div>
                      <span className={styles.noteTimestamp}>
                        {formatNoteDate(note.timestamp)}
                      </span>
                    </div>
                    <div className={styles.noteContent}>
                      {note.content}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UrgentCaseNotes;
