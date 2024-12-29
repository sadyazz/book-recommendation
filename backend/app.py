from flask import Flask, request, jsonify
import pandas as pd
import uuid
from flask_cors import CORS 
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

app = Flask(__name__)
CORS(app)
app.secret_key = 'your_secret_key' 

books_df = pd.read_csv("books.csv")

tfidf_vectorizer = TfidfVectorizer(stop_words='english')
books_df['combined_features'] = (
    books_df['Genre1'].fillna('') + ' ' +
    books_df['Genre2'].fillna('') + ' ' +
    books_df['Genre3'].fillna('') + ' ' +
    books_df['Description'].fillna('')
)

tfidf_matrix = tfidf_vectorizer.fit_transform(books_df['combined_features'])
similarity_matrix = cosine_similarity(tfidf_matrix)

session_data = {}

@app.route('/start', methods=['POST'])
def start_session():
    data = request.json
    genre = data.get('genre', '').strip().lower()
    if not genre:
        return jsonify({"error": "Žanr je obavezan."}), 400

    session_id = str(uuid.uuid4())
    session_data[session_id] = {
        "genre": genre,
        "liked_books": [],
        "disliked_books": [],
        "last_book": None
    }

    filtered_books = books_df[
        books_df[['Genre1', 'Genre2', 'Genre3']].apply(
            lambda row: genre in row.str.lower().fillna('').values, axis=1
        )
    ]

    if filtered_books.empty:
        return jsonify({"message": "No more books available for this genre."}), 400

    recommendation = filtered_books.sample(1).iloc[0]
    session_data[session_id]["last_book"] = recommendation['Book']

    return jsonify({
        "message": "Sesija započeta. Ovo je prva preporuka:",
        "session_id": session_id,
        "book": recommendation['Book'],
        "author": recommendation['Author'],
        "description": recommendation['Description'],
        "genres": [
            recommendation['Genre1'],
            recommendation['Genre2'],
            recommendation['Genre3']
        ]
    })

@app.route('/recommend', methods=['POST'])
def recommend_book():
    data = request.json
    session_id = data.get('session_id')
    reaction = data.get('reaction')

    if not session_id or session_id not in session_data:
        return jsonify({"error": "Nevažeći session_id."}), 400

    user_session = session_data[session_id]

    if reaction and user_session["last_book"]:
        if reaction == "👍":
            user_session["liked_books"].append(user_session["last_book"])
        elif reaction == "👎":
            user_session["disliked_books"].append(user_session["last_book"])

    liked_books = user_session["liked_books"]
    disliked_books = user_session["disliked_books"]

    if not liked_books:
        available_books = books_df[
            ~books_df['Book'].isin(disliked_books)
            & books_df[['Genre1', 'Genre2', 'Genre3']].apply(
                lambda row: user_session["genre"] in row.str.lower().fillna('').values, axis=1
            )
        ]
        if not available_books.empty:
            recommendation = available_books.sample(1).iloc[0]
            user_session["last_book"] = recommendation['Book']
            return jsonify({
                "book": recommendation['Book'],
                "author": recommendation['Author'],
                "description": recommendation['Description'],
                "genres": [
                    recommendation['Genre1'],
                    recommendation['Genre2'],
                    recommendation['Genre3']
                ]
            })

    liked_indices = books_df[books_df['Book'].isin(liked_books)].index
    similar_scores = similarity_matrix[liked_indices].mean(axis=0)
    sorted_indices = similar_scores.argsort()[::-1]
    recommended_indices = [
        idx for idx in sorted_indices
        if books_df.iloc[idx]['Book'] not in liked_books
        and books_df.iloc[idx]['Book'] not in disliked_books
    ]

    if recommended_indices:
        next_book_idx = recommended_indices[0]
        recommendation = books_df.iloc[next_book_idx]
        user_session["last_book"] = recommendation['Book']
        return jsonify({
            "book": recommendation['Book'],
            "author": recommendation['Author'],
            "description": recommendation['Description'],
            "genres": [
                recommendation['Genre1'],
                recommendation['Genre2'],
                recommendation['Genre3']
            ]
        })

    return jsonify({"message": "Nema više knjiga za preporuku u ovom žanru."})

if __name__ == '__main__':
    app.run(debug=True)
