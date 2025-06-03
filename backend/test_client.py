import requests

def test_get_hospitals():
    url = "http://localhost:8000/hospitals"  # Adjust if the router is mounted under a prefix

    params = {
        "skip": 0,
        "limit": 10
    }

    try:
        response = requests.get(url, params=params)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            doctors = response.json()
            print("Hospitals List:", doctors)
        else:
            print("Failed to fetch hospitals:", response.json())
    except Exception as e:
        print(f"Error during request: {e}")

def test_create_hospital():
    url = "http://localhost:8000/hospitals/"  # Adjust the base path if necessary

    payload = {
        "hospital_name": "Sybau Hospital",
        "address": "1 Dai Co Viet",
        "governed_by": "gurt"
    }

    try:
        response = requests.post(url, json=payload)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            hospital = response.json()
            print("Created Hospital:", hospital)
        else:
            print("Failed to create hospital:", response.json())
    except Exception as e:
        print(f"Error during request: {e}")

def test_get_doctors():
    url = "http://localhost:8000/doctors"  # Adjust if the router is mounted under a prefix

    params = {
        "skip": 0,
        "limit": 10
    }

    try:
        response = requests.get(url, params=params)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            doctors = response.json()
            print("Doctors List:", doctors)
        else:
            print("Failed to fetch doctors:", response.json())
    except Exception as e:
        print(f"Error during request: {e}")

def test_register_user():
    url = "http://localhost:8000/auth/register/"
    payload_patient = {
        "username": "patientuser10",
        "email": "patient10@example.com",
        "full_name": "Patient User10",
        "password": "12345",
        "role": "PATIENT",
    }

    payload_doctor = {
        "username": "doctoruser4",
        "email": "doctor4@example.com",
        "full_name": "Doctor User4",
        "password": "12345",
        "role": "DOCTOR"
    }
    try:
        response = requests.post(url, json=payload_patient)
        print(f"Status Code: {response.status_code}")
        print("Response JSON:", response.json())
    except Exception as e:
        print(f"Error during request: {e}")

if __name__ == "__main__":
    test_register_user()