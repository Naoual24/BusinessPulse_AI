import numpy as np
import re
from textblob import TextBlob
from textblob_fr import PatternAnalyzer as FrAnalyzer
from collections import Counter
from typing import Any, Optional, Dict

class SentimentService:
    # ... (lexicons and keywords same as before)
    ARABIC_POSITIVE = ['ممتاز', 'جيد', 'رائع', 'شكر', 'جميل', 'أحببت', 'سريع', 'نوعية']
    ARABIC_NEGATIVE = ['سيئ', 'ضعيف', 'غالي', 'تأخير', 'مشكلة', 'خطأ', 'لا أنصح', 'بطيء']
    
    FR_KEYWORDS = {
        'livraison': ['livraison', 'retard', 'colis'],
        'prix': ['prix', 'cher', 'coûteux'],
        'qualité': ['qualité', 'robuste', 'fragile', 'plastique'],
        'service': ['service', 'accueil', 'vendeur']
    }
    
    EN_KEYWORDS = {
        'delivery': ['delivery', 'late', 'package'],
        'price': ['price', 'expensive', 'cost'],
        'quality': ['quality', 'build', 'cheap', 'fragile'],
        'service': ['service', 'staff', 'support']
    }

    @staticmethod
    def detect_language(text: str) -> str:
        if any('\u0600' <= char <= '\u06FF' for char in text):
            return 'ar'
        fr_words = {'le', 'la', 'les', 'et', 'est', 'un', 'une'}
        words = set(re.findall(r'\w+', text.lower()))
        if words.intersection(fr_words):
            return 'fr'
        return 'en'

    @classmethod
    def analyze_sentiment(cls, text: str) -> float:
        if not text or not isinstance(text, str):
            return 0.0
        lang = cls.detect_language(text)
        if lang == 'fr':
            blob = TextBlob(text, analyzer=FrAnalyzer())
            return float(blob.sentiment[0])
        elif lang == 'ar':
            pos_score = sum(1 for word in cls.ARABIC_POSITIVE if word in text)
            neg_score = sum(1 for word in cls.ARABIC_NEGATIVE if word in text)
            if pos_score + neg_score == 0:
                return 0.0
            return float((pos_score - neg_score) / (pos_score + neg_score))
        else:
            blob = TextBlob(text)
            return float(blob.sentiment.polarity)

    @classmethod
    def analyze_batch(cls, comments: list[str], mapping: dict = None) -> Any:
        if not comments:
            return None
        results = []
        all_words = []
        issues = Counter() # type: ignore
        for comment in comments:
            if not isinstance(comment, str) or not comment.strip():
                continue
            score = cls.analyze_sentiment(comment)
            lang = cls.detect_language(comment)
            label = "neutral"
            if score > 0.1: label = "positive"
            elif score < -0.1: label = "negative"
            results.append(label)
            words = re.findall(r'\w{4,}', comment.lower())
            all_words.extend(words)
            if label == "negative":
                if lang == 'fr':
                    for issue, keywords in cls.FR_KEYWORDS.items():
                        if any(kw in comment.lower() for kw in keywords):
                            issues[issue] += 1
                elif lang == 'en':
                    for issue, keywords in cls.EN_KEYWORDS.items():
                        if any(kw in comment.lower() for kw in keywords):
                            issues[issue] += 1
        total = len(results)
        if total == 0: return None
        dist = Counter(results) # type: ignore
        sat_score = ((dist['positive'] - dist['negative']) / total * 50) + 50
        return {
            "distribution": {
                "positive": float(np.round(dist['positive'] / total * 100, 1)),
                "negative": float(np.round(dist['negative'] / total * 100, 1)),
                "neutral": float(np.round(dist['neutral'] / total * 100, 1))
            },
            "satisfaction_score": float(np.round(sat_score, 1)),
            "top_keywords": [word for word, count in Counter(all_words).most_common(20)], # type: ignore
            "main_issues": [issue for issue, count in issues.most_common(5)] # type: ignore
        }
