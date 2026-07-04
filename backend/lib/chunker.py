# FUNCTION  — chunk_text(text, chunk_size, overlap)

def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> list[str]:
    """
    Splits a string into overlapping chunks of words in O(N) time complexity.
    
    Args:
        text (str): The raw text to chunk.
        chunk_size (int): Max number of words per chunk.
        overlap (int): Number of overlapping words between successive chunks.
        
    Returns:
        list[str]: List of text chunks.
    """
    words: list[str] = text.split()
    if not words:
        return []
        
    # Standardize parameters to prevent infinite loops
    if chunk_size <= 0:
        chunk_size = 500
    if overlap >= chunk_size or overlap < 0:
        overlap = 50

    chunks: list[str] = []
    num_words = len(words)
    step = chunk_size - overlap
    
    i = 0
    while i < num_words:
        chunk_words: list[str] = words[i : i + chunk_size]
        chunks.append(" ".join(chunk_words))
        i += step
        
        # If the remaining words are fewer than the overlap, stop to avoid redundant tiny chunks
        if num_words - i <= overlap:
            break
            
    return chunks