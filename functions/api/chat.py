import os
import openpyxl
from openpyxl import Workbook
from datetime import datetime
import re
import requests
import json

def save_lead_to_excel(name, contact, notes=""):
    """Saves customer lead information to an Excel file."""
    filename = "leads.xlsx"
    
    if not os.path.exists(filename):
        wb = Workbook()
        ws = wb.active
        ws.append(["Timestamp", "Name", "Contact", "Notes"])
        wb.save(filename)
    
    try:
        wb = openpyxl.load_workbook(filename)
        ws = wb.active
        ws.append([datetime.now().strftime("%Y-%m-%d %H:%M:%S"), name, contact, notes])
        wb.save(filename)
        return True
    except Exception as e:
        print(f"Error saving lead: {e}")
        return False

def extract_contact_info(message):
    """Simple extraction of name and phone/email from message."""
    phone_pattern = r'\b\d{3}[-.]?\d{3,4}[-.]?\d{4}\b|\(\d{3}\)\s*\d{3}[-.]?\d{4}'
    email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    
    phone = re.search(phone_pattern, message)
    email = re.search(email_pattern, message)
    
    contact = phone.group(0) if phone else (email.group(0) if email else None)
    
    words = message.split()
    potential_names = [w for w in words if len(w) > 1 and w[0].isupper() and not w.startswith('I')]
    name = ' '.join(potential_names[:2]) if potential_names else None
    
    return name, contact

def handler(user_message):
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("❌ No API key found!")
        return {"reply": "Configuration error. Please contact support."}

    try:
        # Check if message contains contact info
        name, contact = extract_contact_info(user_message)
        if name and contact:
            if save_lead_to_excel(name, contact, user_message):
                print(f"✓ Lead saved: {name}, {contact}")
        
        # Use REST API with working model
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key={api_key}"
        
        prompt = f"""You are the AI assistant for Ducks and Drakes sports bar in Leavenworth, WA.

Location: 221 8th St, Leavenworth, WA 98826
Hours: Daily until 1:00 AM
Features: Pool tables, karaoke, great food & drinks

Be friendly and concise. If asked about bookings, request name and phone.

User: {user_message}
Assistant:"""

        payload = {
            "contents": [{
                "parts": [{"text": prompt}]
            }],
            "generationConfig": {
                "temperature": 0.7,
                "maxOutputTokens": 200
            }
        }
        
        print(f"🔄 Calling Gemini API...")
        response = requests.post(url, json=payload, timeout=10)
        
        print(f"📊 Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Got response data")
            
            if data.get("candidates") and data["candidates"][0].get("content"):
                reply = data["candidates"][0]["content"]["parts"][0]["text"]
                print(f"✓ Reply: {reply[:50]}...")
                return {"reply": reply}
            else:
                print(f"⚠️ No candidates in response: {data}")
                return {"reply": "I'm here to help! Ask me about our hours, menu, or events!"}
        else:
            error_text = response.text
            print(f"❌ API Error {response.status_code}: {error_text[:200]}")
            return {"reply": "I'm here to help! Ask me about our hours, menu, or events!"}
        
    except requests.Timeout:
        print("❌ Request timeout")
        return {"reply": "Hey there! Taking a bit longer than usual. Try asking about our hours, menu, or events!"}
    except Exception as e:
        print(f"❌ Error: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"reply": "Hey there! I'm having a quick technical hiccup. Try asking about our hours, menu, or events!"}
