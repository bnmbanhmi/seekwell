originally, this web app is refactor from a clinic management web app, using AI, so there is a lot of AI hallucinations and unnecessary components in both backend and frontend
now i want to reduce the code of this web app to my core intention:

The core problem: To help a general user quickly diagnose and enable early detection of skin diseases through AI using photos taken with a smartphone and to store a personal medical record, which starts with these photos to monitor skin conditions. To help cadre quickly monitor and manage the records of general users in their area, receive alerts when the AI detects a user with a dangerous skin disease, such as melanoma, and arrange appointments between patients in need and doctors if necessary. To help doctors double-check the AI model's results for serious cases, contact and support patients who need immediate medical assistance, and receive appointment or online consultation schedules.
Ideal initial users:
A farmer in a remote area with limited access to healthcare services, who is frequently exposed to sunlight and is at risk of skin diseases.
A cadre who needs to monitor the skin disease situation in a rural area where many residents work outdoors.
A doctor who wants to connect with and help patients in remote areas.
An admin to manage user accounts.

The minimum viable product (MVP) will be:
For the resident: Quick diagnosis to identify one of six types of skin diseases.
For the cadre: Monitor the number of cases for each type of disease and receive alerts for dangerous cases.
For the doctor: Receive notifications about dangerous cases along with patient information and images for the doctor to re-verify.
For the admin: Manage user accounts.

below is my description for the app (i will now focus on the frontend, the backend should be changed accordingly)
with admin user
keep all the UserManagement functionality
the dashboard use reportsanalytics, only keep numbers related to users and urgent cases

with patient user
The dashboard only have 2 options: to do AI analysis and to view the patients' own analysis history
use the chat with AI funtionality (keep the current chat bubble, only available for patient user, unlike being available for every user like the current system)
use the ImageUpload, AISkinAnalytics functionality (only patient can use this, unlike the current system in which the cadre can use it too)
receive urgent notification if the result is urgent and guideance for next steps (which is wait for the cadre to send the patient's case to a doctor)
keep track and view the history of the patient's AnalysisResult and AnalysisHistory

with cadre user
use the chat with AI functionality (have a different prompt from the patient's, focusing on guideance to deal with the situations)
remove every current cadre's functionalities, or disconnect with cadre if that functionality is of another user type, including checkin checkout, appointment-related, prescriptions, AISkinAnalytics, Prescriptions, Medical History
only have these functionalities
on the dashboard
keep track of the patients' profiles
keep track of the number of cases of each disease
get alert about urgent cases

connect to a doctor and let the doctor view the profile with urgent case


with doctor user
get notification from a cadre about an urgent case
check again if it's the AI predicted correctly, immediately with urgent cases and occasionally for other cases
view the urgent patients' profile with patient's AnalysisHistory and AnalysisResult and contact info to contact if after checking again confirm that AI predicted correctly

and during refactoring, always start refactoring each user type's functionalities by defining each user type's navigation sidebar, and dashboard which is always the first page an user get into after logging in

## COMPLETED REFACTORING

### ✅ Skin Analysis Pages Minimized (COMPLETED)

**AISkinAnalysisDashboard.tsx**
- REMOVED: Complex appointment scheduling, confirmation dialogs, service status checks
- REMOVED: Multiple tabs with badges and review queues  
- SIMPLIFIED: Only 3 tabs - Upload & Analyze, Results, My History
- SIMPLIFIED: Basic urgent case notification (just text message that cadre will contact)
- KEPT: Core ImageUpload, AnalysisResults, AnalysisHistory components

**AnalysisHistory.tsx**
- REMOVED: Complex grouping by risk levels, high-risk and professional review alerts
- REMOVED: Professional review tracking and multiple status indicators
- SIMPLIFIED: Only shows urgent case alert if any exist
- SIMPLIFIED: Basic list of patient's own analysis history with risk levels
- KEPT: View detailed results functionality

**AnalysisResults.tsx**  
- REMOVED: Action buttons for scheduling consultations and professional reviews
- REMOVED: Complex workflow information and follow-up scheduling
- SIMPLIFIED: Display-only results with AI predictions and risk assessment
- SIMPLIFIED: Basic next steps messaging (cadre will contact for urgent cases)
- KEPT: Risk level display, predictions confidence, basic recommendations

**Result:** The skin analysis pages are now focused purely on:
- Patients can upload images and get AI analysis
- Simple display of results with risk levels
- Basic history tracking
- Clear messaging that cadre will handle urgent cases
