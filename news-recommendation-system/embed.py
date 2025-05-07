
import sys, json
from sentence_transformers import SentenceTransformer
import openai
from bertopic import BERTopic
from bertopic.representation import OpenAI
import numpy as np
from scipy.sparse import csr_matrix
import os
from dotenv import load_dotenv
from hdbscan import HDBSCAN

load_dotenv()
openai_api_key = os.getenv("OPENAI_KEY")

def content_embedding(content: str) -> list:
    """
    Generate content embedding using SentenceTransformer.
    """
    model = SentenceTransformer("all-MiniLM-L6-v2")
    # text = sys.stdin.read()
    emb = model.encode(content,show_progress_bar=True).tolist()
    print(json.dumps(emb))
    return emb

def prob_embedding(content: list[str],
                   embeddings: list[list[float]],
                   gpt: bool = False) -> list[float]:
    if not isinstance(embeddings, (np.ndarray, csr_matrix)):
        embeddings = np.array(embeddings, dtype=np.float32)
    hdbscan_model = HDBSCAN(min_cluster_size=3, metric='euclidean', cluster_selection_method='eom', prediction_data=True)
    if gpt:
        client = openai.Client(api_key=openai_api_key)

        prompt = """
        I have a topic that contains the following documents:
        [DOCUMENTS]

        Based on the information above, try to extract a short but highly descriptive topic label of at most 2 words that are human understandble. Make sure it is in the following format:
        topic: <topic label>
        """
        representation_model = OpenAI(client, model="gpt-4o-mini", chat=True, prompt = prompt)
        topic_model_gpt = BERTopic(representation_model=representation_model, hdbscan_model = hdbscan_model, calculate_probabilities= True)
    else:
        topic_model_gpt = BERTopic(hdbscan_model = hdbscan_model, calculate_probabilities=True)
    
    topics, probs = topic_model_gpt.fit_transform(content, embeddings)
    # topic_model_gpt.reduce_topics(content, nr_topics=60)
    name_series = topic_model_gpt.get_document_info(content).Name

    topics = [n.split("_", 1)[1] for n in name_series]

    probs_list = probs.tolist()
    combined = []
    for topic, prob in zip(topics, probs_list):
        combined.append([topic, prob])

    print(json.dumps(combined))
    return combined



def main():
    # mode is passed as argv[1], default to content_embedding
    mode = sys.argv[1] if len(sys.argv) > 1 else 'content_embedding'
    # read one JSON payload from stdin
    payload = json.loads(sys.stdin.read())

    text = payload['content']

    if mode == 'content_embedding':
        emb = content_embedding(text)

    elif mode == 'prob_embedding':
        emb = payload['embeddingArray']
        use_gpt = payload.get('useGpt', False)
        emb = prob_embedding(text, emb, gpt=use_gpt)

    else:
        raise ValueError(f"Unknown mode {mode!r}")

    # write JSON array to stdout
    # print(json.dumps(emb))


if __name__ == '__main__':
    main()