from openai import OpenAI
from app.core.config import settings

print("Testing OpenAI key:", settings.OPENAI_API_KEY[:10] + "...")

try:
    client = OpenAI(api_key=settings.OPENAI_API_KEY)
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": "Hello"}]
    )
    print("Success:", response.choices[0].message.content)
except Exception as e:
    print("Error:", str(e))
    import traceback
    traceback.print_exc()
