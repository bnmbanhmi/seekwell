import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../common/LanguageSwitcher';
import './PatientSearch.css';

const BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || '').replace(/\/+$/, '');

// Types for patient search - matching backend schema exactly
interface PatientSearchQuery {
  query?: string;
  patient_id?: number;
  full_name?: string;
  phone_number?: string;
  email?: string;
  identification_id?: string;
  health_insurance_card_no?: string;
  gender?: string;
  age_min?: number;
  age_max?: number;
  skip?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: string;
}

interface PatientSearchResult {
  patient_id: number;
  full_name: string;
  email?: string;
  phone_number?: string;
  date_of_birth?: string;
  gender?: string;
  identification_id?: string;
  health_insurance_card_no?: string;
  age?: number;
}

interface PatientSearchResponse {
  patients: PatientSearchResult[];
  total_count: number;
  page: number;
  per_page: number;
  total_pages: number;
}

const PatientSearch: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useState<PatientSearchQuery>({
    limit: 10,
    skip: 0,
    sort_by: "full_name",
    sort_order: "asc"
  });
  const [searchResults, setSearchResults] = useState<PatientSearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<PatientSearchResult | null>(null);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);

  // Current user role for access control display
  const [userRole, setUserRole] = useState<string>('');

  useEffect(() => {
    const role = localStorage.getItem('role') || '';
    setUserRole(role);
  }, []);

  const handleSearch = async (page: number = 1) => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Calculate skip based on page
      const skip = (page - 1) * (searchParams.limit || 10);
      
      const searchPayload: PatientSearchQuery = {
        ...searchParams,
        skip
      };

      // Remove empty values
      Object.keys(searchPayload).forEach(key => {
        const value = searchPayload[key as keyof PatientSearchQuery];
        if (value === '' || value === null || value === undefined) {
          delete searchPayload[key as keyof PatientSearchQuery];
        }
      });

      console.log('Search payload:', searchPayload);

      const response = await axios.post(
        `${BACKEND_URL}/patients/search`,
        searchPayload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      setSearchResults(response.data);
      console.log('Search results:', response.data);
    } catch (err) {
      console.error('Search error:', err);
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) {
          setError('Authentication failed. Please log in again.');
        } else if (err.response?.status === 403) {
          setError('Bạn không có quyền tìm kiếm bệnh nhân.');
        } else {
          setError(`Tìm kiếm thất bại: ${err.response?.data?.detail || err.message}`);
        }
      } else {
        setError('Đã xảy ra lỗi không mong muốn trong quá trình tìm kiếm.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    let processedValue: any = value;
    
    // Handle different input types
    if (type === 'number') {
      processedValue = value === '' ? undefined : Number(value);
    } else if (type === 'checkbox') {
      processedValue = (e.target as HTMLInputElement).checked;
    } else if (value === '') {
      processedValue = undefined;
    }

    setSearchParams(prev => ({
      ...prev,
      [name]: processedValue
    }));
  };

  const handlePageChange = (newPage: number) => {
    handleSearch(newPage);
  };

  const clearSearch = () => {
    setSearchParams({
      limit: 10,
      skip: 0,
      sort_by: "full_name",
      sort_order: "asc"
    });
    setSearchResults(null);
    setError(null);
    setSelectedPatient(null);
  };

  const handlePatientSelect = (patient: PatientSearchResult) => {
    setSelectedPatient(patient);
  };

  const closePatientDetails = () => {
    setSelectedPatient(null);
  };

  // Navigation functions
  const navigateToAppointments = (patientId: number) => {
    navigate(`/dashboard/appointments?patient_id=${patientId}`);
  };

  const navigateToEMR = (patientId: number) => {
    navigate(`/dashboard/medical-history?patient_id=${patientId}`);
  };

  const navigateToCreateEMR = (patientId: number) => {
    navigate(`/dashboard/create_records?patient_id=${patientId}`);
  };

  return (
    <div className="patient-search-container">
      <div className="search-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2>{t('patientSearch.title')}</h2>
            <p className="role-info">
              {t('patientSearch.roleInfo')} <strong>{userRole}</strong>
              {userRole === 'PATIENT' && ` ${t('patientSearch.ownRecordsOnly')}`}
            </p>
          </div>
          <LanguageSwitcher />
        </div>
      </div>

      {/* Search Form */}
      <div className="search-form">
        <div className="basic-search">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="query">{t('patientSearch.generalSearch')}</label>
              <input
                type="text"
                id="query"
                name="query"
                value={searchParams.query || ''}
                onChange={handleInputChange}
                placeholder={t('patientSearch.generalPlaceholder')}
                className="search-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="limit">{t('patientSearch.resultsPerPage')}</label>
              <select
                id="limit"
                name="limit"
                value={searchParams.limit || 10}
                onChange={handleInputChange}
                className="select-input"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        </div>

        {/* Advanced Search Toggle */}
        <button
          type="button"
          className="toggle-advanced"
          onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
        >
          {showAdvancedSearch ? t('patientSearch.hide') : t('patientSearch.show')} {t('patientSearch.toggleAdvanced')}
        </button>

        {/* Advanced Search Fields */}
        {showAdvancedSearch && (
          <div className="advanced-search">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="full_name">{t('patientSearch.fullName')}</label>
                <input
                  type="text"
                  id="full_name"
                  name="full_name"
                  value={searchParams.full_name || ''}
                  onChange={handleInputChange}
                  placeholder={t('patientSearch.fullNamePlaceholder')}
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">{t('patientSearch.email')}</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={searchParams.email || ''}
                  onChange={handleInputChange}
                  placeholder={t('patientSearch.emailPlaceholder')}
                />
              </div>
              <div className="form-group">
                <label htmlFor="phone_number">{t('patientSearch.phone')}</label>
                <input
                  type="text"
                  id="phone_number"
                  name="phone_number"
                  value={searchParams.phone_number || ''}
                  onChange={handleInputChange}
                  placeholder={t('patientSearch.phonePlaceholder')}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="patient_id">{t('patientSearch.patientId')}</label>
                <input
                  type="number"
                  id="patient_id"
                  name="patient_id"
                  value={searchParams.patient_id || ''}
                  onChange={handleInputChange}
                  placeholder={t('patientSearch.patientIdPlaceholder')}
                />
              </div>
              <div className="form-group">
                <label htmlFor="age_min">{t('patientSearch.ageMin')}</label>
                <input
                  type="number"
                  id="age_min"
                  name="age_min"
                  value={searchParams.age_min || ''}
                  onChange={handleInputChange}
                  placeholder={t('patientSearch.ageMinPlaceholder')}
                  min="0"
                />
              </div>
              <div className="form-group">
                <label htmlFor="age_max">{t('patientSearch.ageMax')}</label>
                <input
                  type="number"
                  id="age_max"
                  name="age_max"
                  value={searchParams.age_max || ''}
                  onChange={handleInputChange}
                  placeholder={t('patientSearch.ageMaxPlaceholder')}
                  min="0"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="gender">{t('patientSearch.gender')}</label>
                <select
                  id="gender"
                  name="gender"
                  value={searchParams.gender || ''}
                  onChange={handleInputChange}
                >
                  <option value="">{t('patientSearch.allGenders')}</option>
                  <option value="male">{t('patientSearch.male')}</option>
                  <option value="female">{t('patientSearch.female')}</option>
                  <option value="other">{t('patientSearch.other')}</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="identification_id">{t('patientSearch.idCard')}</label>
                <input
                  type="text"
                  id="identification_id"
                  name="identification_id"
                  value={searchParams.identification_id || ''}
                  onChange={handleInputChange}
                  placeholder={t('patientSearch.idCardPlaceholder')}
                />
              </div>
              <div className="form-group">
                <label htmlFor="health_insurance_card_no">{t('patientSearch.insuranceCard')}</label>
                <input
                  type="text"
                  id="health_insurance_card_no"
                  name="health_insurance_card_no"
                  value={searchParams.health_insurance_card_no || ''}
                  onChange={handleInputChange}
                  placeholder={t('patientSearch.insurancePlaceholder')}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="sort_by">{t('common.sortBy')}</label>
                <select
                  id="sort_by"
                  name="sort_by"
                  value={searchParams.sort_by || 'full_name'}
                  onChange={handleInputChange}
                >
                  <option value="full_name">{t('patientSearch.fullName')}</option>
                  <option value="date_of_birth">{t('patientSearch.dateOfBirth')}</option>
                  <option value="patient_id">{t('patientSearch.patientId')}</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="sort_order">{t('common.sortOrder')}</label>
                <select
                  id="sort_order"
                  name="sort_order"
                  value={searchParams.sort_order || 'asc'}
                  onChange={handleInputChange}
                >
                  <option value="asc">{t('common.ascending')}</option>
                  <option value="desc">{t('common.descending')}</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="search-actions">
          <button
            type="button"
            className="search-btn"
            onClick={() => handleSearch(1)}
            disabled={loading}
          >
            {loading ? t('patientSearch.searching') : t('patientSearch.searchButton')}
          </button>
          <button
            type="button"
            className="clear-btn"
            onClick={clearSearch}
            disabled={loading}
          >
            {t('patientSearch.clearButton')}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}

      {/* Search Results */}
      {searchResults && (
        <div className="search-results">
          <div className="results-header">
            <h3>{t('patientSearch.results')}</h3>
            <p>
              {t('patientSearch.totalResults')} {searchResults.total_count} 
              ({t('patientSearch.page')} {searchResults.page} {t('patientSearch.of')} {searchResults.total_pages})
            </p>
          </div>

          {searchResults.patients.length === 0 ? (
            <div className="no-results">
              <p>Không tìm thấy bệnh nhân nào phù hợp với tiêu chí tìm kiếm.</p>
            </div>
          ) : (
            <>
              <div className="results-table">
                <table>
                  <thead>
                    <tr>
                      <th>ID Bệnh Nhân</th>
                      <th>Họ và Tên</th>
                      <th>Email</th>
                      <th>Điện Thoại</th>
                      <th>Tuổi</th>
                      <th>Giới Tính</th>
                      <th>Ngày Sinh</th>
                      <th>Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchResults.patients.map((patient) => (
                      <tr key={patient.patient_id}>
                        <td>{patient.patient_id}</td>
                        <td>{patient.full_name}</td>
                        <td>{patient.email || 'Không có'}</td>
                        <td>{patient.phone_number || 'Không có'}</td>
                        <td>{patient.age || 'Không có'}</td>
                        <td>{patient.gender === 'male' ? 'Nam' : patient.gender === 'female' ? 'Nữ' : patient.gender === 'other' ? 'Khác' : 'Không có'}</td>
                        <td>{patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString('vi-VN') : 'Không có'}</td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="view-btn"
                              onClick={() => handlePatientSelect(patient)}
                              title="Xem chi tiết bệnh nhân"
                            >
                              Xem
                            </button>
                            <button
                              className="appointment-btn"
                              onClick={() => navigateToAppointments(patient.patient_id)}
                              title="Xem lịch hẹn của bệnh nhân"
                            >
                              Lịch Hẹn
                            </button>
                            <button
                              className="emr-btn"
                              onClick={() => navigateToEMR(patient.patient_id)}
                              title="View patient's medical records"
                            >
                              Medical Records
                            </button>
                            {(userRole === 'DOCTOR' || userRole === 'OFFICIAL') && (
                              <button
                                className="create-emr-btn"
                                onClick={() => navigateToCreateEMR(patient.patient_id)}
                                title="Create new medical record"
                              >
                                Tạo EMR
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {searchResults.total_pages > 1 && (
                <div className="pagination">
                  <button
                    className="page-btn"
                    onClick={() => handlePageChange(searchResults.page - 1)}
                    disabled={searchResults.page <= 1 || loading}
                  >
                    Trang Trước
                  </button>
                  
                  <span className="page-info">
                    Trang {searchResults.page} / {searchResults.total_pages}
                  </span>
                  
                  <button
                    className="page-btn"
                    onClick={() => handlePageChange(searchResults.page + 1)}
                    disabled={searchResults.page >= searchResults.total_pages || loading}
                  >
                    Trang Sau
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Patient Details Modal */}
      {selectedPatient && (
        <div className="modal-overlay" onClick={closePatientDetails}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Chi Tiết Bệnh Nhân</h3>
              <button className="close-btn" onClick={closePatientDetails}>×</button>
            </div>
            <div className="modal-body">
              <div className="patient-details">
                <div className="detail-row">
                  <strong>ID Bệnh Nhân:</strong> {selectedPatient.patient_id}
                </div>
                <div className="detail-row">
                  <strong>Họ và Tên:</strong> {selectedPatient.full_name}
                </div>
                <div className="detail-row">
                  <strong>Email:</strong> {selectedPatient.email || 'Không có'}
                </div>
                <div className="detail-row">
                  <strong>Điện Thoại:</strong> {selectedPatient.phone_number || 'Không có'}
                </div>
                <div className="detail-row">
                  <strong>Ngày Sinh:</strong> {selectedPatient.date_of_birth ? new Date(selectedPatient.date_of_birth).toLocaleDateString('vi-VN') : 'Không có'}
                </div>
                <div className="detail-row">
                  <strong>Tuổi:</strong> {selectedPatient.age || 'Không có'}
                </div>
                <div className="detail-row">
                  <strong>Giới Tính:</strong> {selectedPatient.gender === 'male' ? 'Nam' : selectedPatient.gender === 'female' ? 'Nữ' : selectedPatient.gender === 'other' ? 'Khác' : 'Không có'}
                </div>
                <div className="detail-row">
                  <strong>Số CMND/CCCD:</strong> {selectedPatient.identification_id || 'Không có'}
                </div>
                <div className="detail-row">
                  <strong>Thẻ BHYT:</strong> {selectedPatient.health_insurance_card_no || 'Không có'}
                </div>
              </div>
              
              {/* Quick Actions in Modal */}
              <div className="modal-actions">
                <h4>Thao Tác Nhanh</h4>
                <div className="modal-action-buttons">
                  <button
                    className="modal-appointment-btn"
                    onClick={() => {
                      navigateToAppointments(selectedPatient.patient_id);
                      closePatientDetails();
                    }}
                  >
                    📅 Xem Lịch Hẹn
                  </button>
                  <button
                    className="modal-emr-btn"
                    onClick={() => {
                      navigateToEMR(selectedPatient.patient_id);
                      closePatientDetails();
                    }}
                  >
                    📋 View Medical Records
                  </button>
                  {(userRole === 'DOCTOR' || userRole === 'OFFICIAL') && (
                    <button
                      className="modal-create-emr-btn"
                      onClick={() => {
                        navigateToCreateEMR(selectedPatient.patient_id);
                        closePatientDetails();
                      }}
                    >
                      ➕ Create New EMR
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientSearch;
