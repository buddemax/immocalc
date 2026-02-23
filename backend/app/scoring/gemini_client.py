import json

import google.generativeai as genai

from app.config import settings


SYSTEM_PROMPT = '''Du bist ein neutraler, objektiver Immobilien-Gutachter. Deine Aufgabe ist es, den Mikrolage-Score für eine Immobilie auf einer Skala von 1 bis 10 zu berechnen.

Bewertungsregeln:
- ÖPNV: In einer Großstadt erfordern 10 Punkte eine Haltestelle unter 300m. In einer Kleinstadt reichen dafür 600m.
- Einkaufen: Ein Supermarkt unter 500m gibt 10 Punkte.
- Bildung: Schulen in guter Distanz verbessern den Score.
- Freizeit: Gute Park-/Grünflächen-Nähe verbessert den Score.

Wichtig:
- Nutze nur die gelieferten Daten.
- Erfinde nichts.
- Gib ausschließlich JSON zurück.
- Werte müssen zwischen 1 und 10 liegen.

Erlaubtes JSON-Schema:
{
  "score_oepnv": number,
  "score_einkauf": number,
  "score_bildung": number,
  "score_freizeit": number,
  "gesamt_score": number,
  "kurzbegruendung": string,
  "confidence": number
}
'''


def call_gemini(context_text: str, rule_baseline: dict) -> dict:
    if not settings.gemini_api_key:
        raise RuntimeError('GEMINI_API_KEY ist nicht gesetzt.')

    genai.configure(api_key=settings.gemini_api_key)
    model = genai.GenerativeModel(settings.gemini_model)

    prompt = (
        f'{SYSTEM_PROMPT}\n\n'
        f'Input-Daten:\n{context_text}\n\n'
        f'Regelbasierte Referenz (nur als Hilfe): {json.dumps(rule_baseline, ensure_ascii=False)}\n\n'
        'Gib jetzt ausschließlich das JSON zurück.'
    )

    response = model.generate_content(prompt)
    text = (response.text or '').strip()
    if not text:
        raise RuntimeError('Gemini lieferte keine Antwort.')

    candidate = text
    if '```' in text:
        # Accept markdown-wrapped JSON but still enforce strict dict output.
        candidate = text.replace('```json', '').replace('```', '').strip()

    try:
        payload = json.loads(candidate)
    except json.JSONDecodeError as exc:
        raise RuntimeError(f'Gemini-Antwort war kein valides JSON: {text}') from exc

    if not isinstance(payload, dict):
        raise RuntimeError('Gemini-Antwort muss ein JSON-Objekt sein.')

    return payload
