import os
import google.generativeai as genai
import openpyxl
from openpyxl import Workbook
from datetime import datetime

# Function to be used as a tool
def save_lead(name: str, contact: str, notes: str = ""):
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
        return "Success: Lead saved."
    except Exception as e:
        return f"Error saving lead: {str(e)}"

def handler(user_message):
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return {"error": "Missing GEMINI_API_KEY environment variable"}

    try:
        genai.configure(api_key=api_key)
        
        # Define the tools
        tools_list = [save_lead]
        
        # Use a model that supports function calling (gemini-1.5-flash is good)
        model = genai.GenerativeModel("gemini-1.5-flash", tools=tools_list)
        
        # System prompt with instructions to collect data
        system_instruction = (
            "You are the AI assistant for Ducks and Drakes. "
            "Your goal is to be helpful and friendly. "
            "If a user sounds interested in booking or asks for updates, politely ask for their Name and Phone Number/Contact. "
            "Once you have their Name and Contact, IMMEDIATELY call the `save_lead` function. "
            "Do not ask for confirmation before calling the function, just do it once you have the info. "
            "After saving, verify the save was successful and thank the user."
        )

        # Start chat with automatic function calling enabled context
        chat = model.start_chat(enable_automatic_function_calling=True)
        
        # Send system instruction first creates a better context context sometimes, 
        # but here we'll just prepend to history or rely on the prompt logic. 
        # Better: send the system instruction as the first message parts.
        
        response = chat.send_message(f"{system_instruction}\n\nUser: {user_message}")
        
        # The SDK's 'enable_automatic_function_calling=True' handles the turn-taking 
        # (Model calls function -> SDK executes -> SDK sends result -> Model generates final response).
        
        return {"reply": response.text}
        
    except Exception as e:
        print(f"Error in chat handler: {e}")
        return {"error": str(e)}
        
    except Exception as e:
        print(f"Error in chat handler: {e}")
        return {"error": str(e)}
