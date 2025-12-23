import os
import requests
import json
import openpyxl
from datetime import datetime
import re

def extract_contact_info(message):
    # Basic regex to find phone numbers and names
    phone_pattern = r'(\d{3}[-\.\s]?\d{3}[-\.\s]?\d{4}|\(\d{3}\)\s*?\d{3}[-\.\s]?\d{4}|\d{10})'
    name_pattern = r'(?:my name is|i am|this is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)'
    
    phone_match = re.search(phone_pattern, message)
    name_match = re.search(name_pattern, message, re.IGNORECASE)
    
    phone = phone_match.group(0) if phone_match else None
    name = name_match.group(1) if name_match else None
    
    return name, phone

def save_lead_to_excel(name, contact, message):
    file_path = "leads.xlsx"
    try:
        if os.path.exists(file_path):
            wb = openpyxl.load_workbook(file_path)
            sheet = wb.active
        else:
            wb = openpyxl.Workbook()
            sheet = wb.active
            sheet.append(["Date", "Name", "Contact", "Message"])
        
        sheet.append([datetime.now().strftime("%Y-%m-%d %H:%M"), name, contact, message])
        wb.save(file_path)
        return True
    except Exception as e:
        print(f"Error saving to Excel: {e}")
        return False

def handler(user_message):
    api_key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not api_key:
        # Fallback to hardcoded key if env fails during testing
        api_key = "AIzaSyD27GQeQ7a2oea0AgMMqur_mSBr6r5wIdQ"

    try:
        # Check if message contains contact info
        name, contact = extract_contact_info(user_message)
        if name and contact:
            if save_lead_to_excel(name, contact, user_message):
                print(f"Lead saved: {name}, {contact}")
        
        # Use REST API with the confirmed 2.5 flash model
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
        
        prompt = f"""You are the friendly AI bartender assistant for Ducks and Drakes, a beloved sports bar in Leavenworth, WA.

BUSINESS INFO:
- Location: 221 8th St, Leavenworth, WA 98826
- Phone: (509) 548-0270
- Hours: Daily 11:00 AM - 1:00 AM
- Vibe: Casual sports bar with pool tables, karaoke nights, great food & drinks
- Specialties: Burgers, fries, American classics, draft beer, full bar

YOUR PERSONALITY:
- Friendly, welcoming, and enthusiastic
- Use casual language (like a real bartender)
- Be concise but helpful
- Show excitement about the food and atmosphere

IMPORTANT RULES:
- Keep responses SHORT (2-3 sentences max)
- If asked about bookings/reservations, ask for their name and phone number
- For food images, say "I can show you some pictures!" (frontend handles this)
- Never make up information - stick to what you know
- Be conversational and natural

USER QUESTION: {user_message}

YOUR RESPONSE (keep it brief and friendly):"""

        payload = {
            "contents": [{
                "parts": [{"text": prompt}]
            }],
            "generationConfig": {
                "temperature": 0.7,
                "maxOutputTokens": 200
            }
        }
        
        print(f"Calling Gemini API (Model: gemini-2.5-flash)...")
        
        import time
        max_retries = 3
        for attempt in range(max_retries):
            try:
                response = requests.post(url, json=payload, timeout=10)
                print(f"Status (Attempt {attempt+1}): {response.status_code}")
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("candidates") and data["candidates"][0].get("content"):
                        reply = data["candidates"][0]["content"]["parts"][0]["text"]
                        return {"reply": reply}
                elif response.status_code == 429:
                    wait_time = 2 ** attempt
                    print(f"Rate limit hit. Waiting {wait_time}s...")
                    time.sleep(wait_time)
                    continue
                else:
                    print(f"API Error {response.status_code}: {response.text[:200]}")
                    break
                    
            except Exception as e:
                print(f"Error during request: {e}")
                break
        
        return {"reply": "I'm here to help! Ask me about our hours, menu, or events!"}
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Critical error: {e}")
        return {"reply": "Hey there! I'm having a quick technical hiccup. Try asking about our hours, menu, or events!"}
