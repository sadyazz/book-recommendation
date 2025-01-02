import numpy as np
from flask import Flask, request, jsonify
import pandas as pd
import uuid
from flask_cors import CORS
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import LabelEncoder

app = Flask(__name__)
CORS(app)
app.secret_key = 'your_secret_key'

books_df = pd.read_csv("books.csv")

tfidf_vectorizer = TfidfVectorizer(stop_words='english')
books_df['combined_features'] = (
    books_df['Genre1'].fillna('') + ' ' +
    books_df['Genre2'].fillna('') + ' ' +
    books_df['Genre3'].fillna('')
)

tfidf_matrix = tfidf_vectorizer.fit_transform(books_df['combined_features'])

similarity_matrix = cosine_similarity(tfidf_matrix)

session_data = {}

reaction_encoder = LabelEncoder()

model = LogisticRegression()
trained_models = {} 

def train_model(session_id):
    user_session = session_data[session_id]
    liked_books = user_session["liked_books"]
    disliked_books = user_session["disliked_books"]

    train_data = []
    train_labels = []

    for book in liked_books:
        idx = books_df[books_df['Book'] == book].index[0]
        train_data.append(tfidf_matrix[idx].toarray()[0]) 
        train_labels.append(1) 

    for book in disliked_books:
        idx = books_df[books_df['Book'] == book].index[0]
        train_data.append(tfidf_matrix[idx].toarray()[0]) 
        train_labels.append(0) 

    if len(train_data) < 5 or len(set(train_labels)) < 2:
        return None

    train_data = np.array(train_data) 
    train_labels = np.array(train_labels)

    model = LogisticRegression()
    model.fit(train_data, train_labels)
    return model

def predict_books(session_id):
    user_session = session_data[session_id]
    model = trained_models.get(session_id)

    if model is None:
        recommended_indices = books_df[
            ~books_df['Book'].isin(user_session["liked_books"] + user_session["disliked_books"])
        ].index.tolist()
        return recommended_indices[:3]

    X_all = tfidf_matrix.toarray()
    predictions = model.predict_proba(X_all)[:, 1] 
    sorted_indices = predictions.argsort()[::-1]

    recommended_indices = [
        idx for idx in sorted_indices
        if books_df.iloc[idx]['Book'] not in user_session["liked_books"]
        and books_df.iloc[idx]['Book'] not in user_session["disliked_books"]
    ][:3] 
    return recommended_indices

@app.route('/start', methods=['POST'])
def start_session():
    data = request.json
    genre = data.get('genre', '').strip().lower()
    if not genre:
        return jsonify({"error": "Genre is required."}), 400

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
        return jsonify({"message": "No books available for this genre."}), 400

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

def update_user_profile(user_session):
    liked_books = user_session["liked_books"]
    disliked_books = user_session["disliked_books"]

    liked_indices = books_df[books_df['Book'].isin(liked_books)].index
    disliked_indices = books_df[books_df['Book'].isin(disliked_books)].index

    user_profile_vector = None

    if liked_indices.size > 0:
        liked_vectors = tfidf_matrix[liked_indices]
        user_profile_vector = liked_vectors.mean(axis=0)

    if disliked_indices.size > 0:
        disliked_vectors = tfidf_matrix[disliked_indices]
        disliked_profile = disliked_vectors.mean(axis=0)

        if user_profile_vector is not None:
            user_profile_vector -= disliked_profile
        else:
            user_profile_vector = -disliked_profile

    return np.asarray(user_profile_vector) if user_profile_vector is not None else None

@app.route('/recommend', methods=['POST'])
def recommend_book():
    data = request.json
    session_id = data.get('session_id')
    reaction = data.get('reaction')

    if not session_id or session_id not in session_data:
        return jsonify({"error": "Invalid session_id."}), 400

    user_session = session_data[session_id]

    if reaction and user_session["last_book"]:
        if reaction == "👍":
            user_session["liked_books"].append(user_session["last_book"])
        elif reaction == "👎":
            user_session["disliked_books"].append(user_session["last_book"])

    user_profile_vector = update_user_profile(user_session)

    if user_profile_vector is not None:
        similarity_scores = cosine_similarity(user_profile_vector, tfidf_matrix).flatten()
        sorted_indices = similarity_scores.argsort()[::-1]
        recommended_indices = [
            idx for idx in sorted_indices
            if books_df.iloc[idx]['Book'] not in user_session["liked_books"]
            and books_df.iloc[idx]['Book'] not in user_session["disliked_books"]
        ]
    else:
        recommended_indices = books_df[ 
            ~books_df['Book'].isin(user_session["disliked_books"])
            & books_df[['Genre1', 'Genre2', 'Genre3']].apply(
                lambda row: user_session["genre"] in row.str.lower().fillna('').values, axis=1
            )
        ].index.tolist()

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

    return jsonify({"message": "Nema više preporuka za ovaj žanr."})

@app.route('/top_recommendations', methods=['POST'])
def top_recommendations():
    session_id = request.json.get('session_id')
    if session_id not in session_data:
        return jsonify({"error": "Session not found"}), 404

    model = train_model(session_id)
    if model is None:
        return jsonify({"error": "Not enough data to generate recommendations. Please like or dislike more books."}), 400

    user_session = session_data[session_id]
    user_books = set(user_session["liked_books"] + user_session["disliked_books"])

    recommendations = []
    for idx, book_title in enumerate(books_df['Book']):
        if book_title in user_books:
            continue
        
        author = books_df.loc[idx, 'Author'] if 'Author' in books_df.columns else "Unknown"
        
        genres = [genre for genre in [books_df.loc[idx, 'Genre1'], books_df.loc[idx, 'Genre2'], books_df.loc[idx, 'Genre3']] if genre]

        book_vector = tfidf_matrix[idx].toarray()[0].reshape(1, -1)
        score = model.predict_proba(book_vector)[0][1] 

        recommendations.append({
            'book': book_title,
            'author': author,
            'genres': genres,
            'score': score
        })

    recommendations = sorted(recommendations, key=lambda x: x['score'], reverse=True)[:3]

    return jsonify({
        "recommendations": [
            {
                "book": r['book'],
                "author": r['author'],
                "genres": r['genres']
            }
            for r in recommendations
        ]
    })

if __name__ == '__main__':
    app.run(debug=True)
