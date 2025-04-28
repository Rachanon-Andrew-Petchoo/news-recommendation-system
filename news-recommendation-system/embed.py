
import sys, json
from sentence_transformers import SentenceTransformer
import openai
from bertopic import BERTopic
from bertopic.representation import OpenAI
import numpy as np
from scipy.sparse import csr_matrix

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
    if gpt:
        client = openai.Client(api_key="sk-")
        prompt = """
        I have a topic that contains the following documents:
        [DOCUMENTS]

        Based on the information above, extract a short but highly descriptive topic label of at most 5 words. Make sure it is in the following format:
        topic: <topic label>
        """
        representation_model = OpenAI(client, model="gpt-4o-mini", chat=True, prompt = prompt)
        topic_model_gpt = BERTopic(representation_model=representation_model, calculate_probabilities= True)
    else:
        topic_model_gpt = BERTopic(calculate_probabilities=True)
    topics, probs = topic_model_gpt.fit_transform(content, embeddings)
    probs_list = probs.tolist()
    print(json.dumps(probs_list))
    return probs_list



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