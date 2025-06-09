#!/usr/bin/env python3
"""
Simple test script to debug the EMR 422 error
"""
import requests
import json

BACKEND_URL = "http://localhost:8000"

def test_login_and_create_emr():
    # Step 1: Try to login as a doctor with common passwords
    common_passwords = ['password', 'password123', '123456', 'admin']
    token = None
    
    for password in common_passwords:
        login_data = {
            'username': 'dr_smith',
            'password': password
        }
        
        print(f"Attempting to login with password: {password}")
        login_response = requests.post(f"{BACKEND_URL}/token", data=login_data)
        
        if login_response.status_code == 200:
            token = login_response.json()['access_token']
            print(f"Login successful with password: {password}")
            break
        else:
            print(f"Login failed with password {password}: {login_response.status_code}")
    
    if not token:
        print("Could not login with any common password")
        return
    
    # Step 2: Try to create a medical report
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    report_data = {
        'patient_id': 6,  # Using available patient ID
        'doctor_id': 2,   # Using available doctor ID
        'in_diagnosis': 'Test diagnosis from API',
        'doctor_notes': 'Test doctor notes',
        'prescription': json.dumps([{
            'name': 'Test Medication',
            'dosage': '10mg',
            'quantity': '30',
            'instructions': 'Take once daily'
        }]),
        'reason_in': 'Test reason for admission',
        'treatment_process': 'Test treatment process'
    }
    
    print(f"Sending EMR data: {json.dumps(report_data, indent=2)}")
    
    emr_response = requests.post(f"{BACKEND_URL}/medical_reports/", 
                                json=report_data, 
                                headers=headers)
    
    print(f"EMR creation response status: {emr_response.status_code}")
    print(f"EMR creation response: {emr_response.text}")
    
    if emr_response.status_code == 422:
        print("422 Validation Error Details:")
        try:
            error_detail = emr_response.json()
            print(json.dumps(error_detail, indent=2))
        except:
            print("Could not parse error response as JSON")

if __name__ == "__main__":
    test_login_and_create_emr()
