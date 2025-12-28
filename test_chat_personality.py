import functions.api.chat as chat
import time

questions = [
    "What's good to eat here?",
    "Are you a robot?",
    "What's the vibe like tonight?",
    "Can I book a table?"
]

print("--- Testing Chatbot Personality ---")
for q in questions:
    print(f"\nUser: {q}")
    response = chat.handler(q)
    print(f"Bot:  {response.get('reply', 'Error')}")
    time.sleep(1)
