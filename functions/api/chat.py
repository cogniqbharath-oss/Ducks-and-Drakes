import os
import google.generativeai as genai
import openpyxl
from openpyxl import Workbook
from datetime import datetime
import re

def save_lead_to_excel(name, contact, notes=""):
    """Saves customer lead information to an Excel file."""
    filename = "leads.xlsx"
    
    # Create file if it doesn't exist
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
    # Look for phone patterns like 555-1234 or (555) 123-4567
    phone_pattern = r'\b\d{3}[-.]?\d{3,4}[-.]?\d{4}\b|\(\d{3}\)\s*\d{3}[-.]?\d{4}'
    email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    
    phone = re.search(phone_pattern, message)
    email = re.search(email_pattern, message)
    
    contact = phone.group(0) if phone else (email.group(0) if email else None)
    
    # Simple name extraction (words that are capitalized)
    words = message.split()
    potential_names = [w for w in words if w[0].isupper() and len(w) > 1 and not w.startswith('I')]
    name = ' '.join(potential_names[:2]) if potential_names else None
    
    return name, contact

def handler(user_message):
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return {"error": "Missing GEMINI_API_KEY environment variable"}

    try:
        genai.configure(api_key=api_key)
        
        # Try gemini-pro first, fallback to other models if needed
        try:
            model = genai.GenerativeModel("gemini-pro")
        except:
            # Fallback to flash model
            model = genai.GenerativeModel("gemini-1.5-flash-latest")
        
        # System prompt
        system_prompt = """You are the friendly AI assistant for Ducks and Drakes, a sports bar in Leavenworth, WA.

Business Info:
- Location: 221 8th St, Leavenworth, WA 98826
- Hours: Open daily until 1:00 AM
- Vibe: Casual sports bar with pool tables, karaoke nights, great food and drinks
- Food: Burgers, fries, American classics
- Drinks: Draft beer, full bar

Your role:
- Answer questions about hours, menu, events
- If someone wants to book a table or asks about reservations, politely ask for their name and phone number
- Be friendly, concise, and helpful
- Use a casual, welcoming tone

User message: {message}"""

        # Check if message contains contact info
        name, contact = extract_contact_info(user_message)
        if name and contact:
            # Save the lead
            if save_lead_to_excel(name, contact, user_message):
                print(f"Lead saved: {name}, {contact}")
        
        # Generate response
        response = model.generate_content(system_prompt.format(message=user_message))
        
        return {"reply": response.text}
        
    except Exception as e:
        print(f"Error in chat handler: {e}")
        import traceback
        traceback.print_exc()
        return {"reply": "I'm having trouble connecting right now. Please try again in a moment!"}

