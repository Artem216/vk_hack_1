import time

import os
import time
from celery import Celery

import spacy
import pytextrank

import numpy as np
import fasttext

celery = Celery(__name__)
celery.conf.broker_url = os.environ.get("CELERY_BROKER_URL", "redis://localhost:6379")
celery.conf.result_backend = os.environ.get("CELERY_RESULT_BACKEND", "redis://localhost:6379")

from pymorphy3 import MorphAnalyzer
import nltk
nltk.download('stopwords')




def lemmatize(doc, max_words=300):
    patterns = "[A-Za-z0-9!#$%&'()*+,./:;<=>?@[\]^_`{|}~—\"\-+–•0123456789✅✌❤€№⅓─−⁄▶►♏⛔⚕©♦]"
    stopwords_ru = nltk.corpus.stopwords.words("russian")
    morph = MorphAnalyzer()

    # doc = re.sub(patterns, ' ', doc)
    doc = ' '.join([''.join([sym for sym in w if sym.isalpha()]) for w in doc.split()])
    tokens = []
    for token in doc.split()[:max_words]:
        if token and token not in stopwords_ru:
            token = token.strip()
            token = morph.normal_forms(token)[0]
            
            tokens.append(token)
    if len(tokens) > 2:
        return tokens
    return None


@celery.task(name="create_task")
def create_task(text : str):
    text = text.replace("\\n", "").replace("\\\\n", '').replace('"', "").replace("\n", '')
    lem_text_arr = lemmatize(text)
    lem_text = ' '.join(lem_text_arr)


    import spacy
    import pytextrank

    nlp = spacy.load('ru_core_news_sm')
    nlp.add_pipe("textrank")

    model = fasttext.load_model("model_fasttext.bin")
    pred = model.predict(lem_text)

    doc = nlp(lem_text)
    keywords = []

    for phrase in doc._.phrases:
        keywords.append(phrase.text)

    words = ''
    for el in keywords:
        words += str(el) + ", "

    result = {
        'wods': words,
        'class':str(pred[0])[11:-3],
    }
    return result
