# clinic-management

A comprehensive clinic management system designed to streamline operations for medical practices. It includes features for managing patient records, user authentication with role-based access control, and an administrative interface for system oversight.

## Features

*   **User Authentication**: Secure registration and login for different user roles (Admin, Doctor, Patient).
*   **Role-Based Access Control**: Differentiated access to features based on user roles.
*   **Patient Management**: Create, view, update, and delete patient profiles.
*   **Admin Dashboard**: System administration capabilities.
*   **API**: RESTful API for backend services.
*   **Chat Functionality**: Integrated chat for communication (details TBD based on `routers/chat.py`).

## Tech Stack

*   **Backend**:
    *   Python 3.11+
    *   FastAPI
    *   SQLAlchemy
    *   PostgreSQL
    *   Pydantic
    *   Uvicorn (ASGI server)
*   **Frontend**:
    *   React
    *   TypeScript
    *   Node.js / npm

## Project Structure

The project is organized into two main directories:
*   `backend/`: Contains the FastAPI application, including API routers, database models, schemas, CRUD operations, and business logic.
*   `frontend/`: Contains the React-based user interface.

## Setup and Installation

### Prerequisites

*   Python 3.11 or higher
*   Node.js and npm (latest LTS version recommended)
*   PostgreSQL server installed and running

### Backend Setup

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/bnmbanhmi/clinic-management
    cd clinic-management
    ```

2.  **Navigate to the backend directory and create/activate a virtual environment**:
    ```bash
    cd backend
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    ```

3.  **Install dependencies**:
    (Ensure `requirements.txt` is in the project root directory)
    ```bash
    pip install -r ../requirements.txt
    ```

4.  **Configure Environment Variables**:
    Create a `.env` file in the `backend/` directory (alongside `app/`) with the following content. Adjust values as per your local setup.
    ```env
    DATABASE_URL="postgresql://your_db_user:your_db_password@your_db_host:your_db_port/your_db_name"
    SECRET_KEY="your_very_strong_and_secret_key_here"
    ALGORITHM="HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES=30
    # Optional: For OpenAI chat functionality, if used
    # OPENAI_API_KEY="your_openai_api_key"
    ```
    Replace `your_db_user`, `your_db_password`, `your_db_host`, `your_db_port`, and `your_db_name` with your actual PostgreSQL connection details.

5.  **Initialize the Database and Create Initial Admin User**:
    Ensure your PostgreSQL server is running and the database specified in `DATABASE_URL` exists.
    From the `backend/` directory, run the script:
    ```bash
    python app/create_initial_admin.py
    ```
    This script will create the necessary database tables and an initial admin user with credentials:
    *   Email: `admin@example.com`
    *   Password: `adminpassword`

### Frontend Setup

1.  **Navigate to the frontend directory** (from the project root):
    ```bash
    cd frontend
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

## Running the Application

### Backend

1.  Ensure your virtual environment in `backend/venv` is activated.
2.  Navigate to the `backend/` directory.
3.  Start the FastAPI server:
    ```bash
    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
    ```
    The API will be accessible at `http://localhost:8000`. Interactive API documentation (Swagger UI) will be available at `http://localhost:8000/docs` and ReDoc at `http://localhost:8000/redoc`.

### Frontend

1.  Navigate to the `frontend/` directory.
2.  Start the React development server:
    ```bash
    npm start
    ```
    The application will typically open in your browser at `http://localhost:3000`.

## API Endpoints Overview

The backend provides several API endpoints for managing users, patients, and authentication. Key endpoints include:

*   `POST /auth/token`: Obtain JWT token for login.
*   `POST /auth/register/`: Register new users.
    *   Admins can create users with `ADMIN` or `DOCTOR` roles.
    *   Doctors can create users with the `PATIENT` role.
*   `GET /users/me/`: Get current authenticated user's details.
*   `POST /patients/`: Create a patient profile (requires an existing user with `PATIENT` role, typically done by a Doctor or Admin after registering the patient user).
*   `GET /patients/`: List patient profiles (access controlled).
*   `GET /chat/`: (If fully implemented) Endpoints for chat functionality.

For a complete and interactive list of API endpoints, refer to the auto-generated documentation at `http://localhost:8000/docs` when the backend server is running.
