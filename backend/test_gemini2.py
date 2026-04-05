import traceback
from app.services.pulsetalk_service import PulseTalkService

try:
    m = PulseTalkService._initialize_gemini('AIzaSyCaG3hZGaINeS8iYXdp6FLqkpm5NSvhkEo')
    if m:
        res = m.generate_content('hello')
        print('success:', res.text)
    else:
        print('Failed to initialize model')
except Exception as e:
    with open('error_log.txt', 'w', encoding='utf-8') as f:
        f.write(traceback.format_exc())
    print('Wrote error to error_log.txt')
