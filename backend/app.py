import requests
from flask import Flask, jsonify, request
from flask_cors import CORS 

app = Flask(__name__)

CORS(app)

@app.route('/api/books', methods=['GET'])
def get_books():
    genre = request.args.get('genre')  
    if not genre:
        return jsonify({"error": "Genre parameter is required"}), 400
 
    open_library_url = f"https://openlibrary.org/subjects/{genre.lower()}.json"

    try: 
        response = requests.get(open_library_url)
        response.raise_for_status() 
 
        books_data = response.json()
 
        if 'works' in books_data and len(books_data['works']) > 0:
            matched_books = []
            for book in books_data['works']:
                matched_books.append({
                    "title": book.get("title", "No title available"),
                    "authors": book.get("authors", [{"name": "Unknown author"}]),
                    "subject": book.get("subjects", [])
                })

            return jsonify(matched_books)

        else:
            return jsonify({"error": f"No books found for genre: {genre}"}), 404

    except requests.exceptions.RequestException as e: 
        return jsonify({"error": f"Failed to fetch books: {str(e)}"}), 500

@app.route('/')
def home():
    return "Flask server is running!"

if __name__ == '__main__':
    app.run(debug=True)
