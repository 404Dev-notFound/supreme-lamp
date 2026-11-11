import time
from RAG.python_rag.pipeline import RAGPipeline

def main():
    t0 = time.time()
    print("Initializing RAGPipeline with Qdrant and MiniLM...")
    pipeline = RAGPipeline()
    print(f"Pipeline initialized in {time.time() - t0:.2f}s.")
    count = pipeline.vector_store.count()
    print(f"Total documents indexed in Qdrant: {count}")

    queries = [
        "Backend Engineer API design and databases",
        "Binary Search algorithms and time complexity",
        "React frontend development and state management",
        "Machine Learning engineer deep learning",
    ]

    for q in queries:
        res = pipeline.query(q, top_k=3)
        print(f"\nQuery: '{q}' (found {res.count} items in {res.timing_ms}ms)")
        for item in res.results:
            title = item.metadata.get("title")
            doc_type = item.metadata.get("type")
            print(f"  - Score: {item.score:.4f} | Type: {doc_type} | Title: {title}")

if __name__ == "__main__":
    main()
