from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os

load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": os.getenv('CORS_ORIGINS', 'http://localhost:3000').split(',')}})
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key')

from app.route import register_routes

register_routes(app)

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'message': 'Backend is running'}), 200

@app.errorhandler(400)
def bad_request(error):
    # Without this handler, a malformed/empty JSON body makes Flask's
    # request.get_json() raise before a view function's own try/except ever
    # runs, and the default response is an HTML error page - inconsistent
    # with every other error response this API returns.
    return jsonify({'error': 'The request body could not be parsed as JSON.'}), 400

@app.errorhandler(415)
def unsupported_media_type(error):
    # Same story as above, but for a request missing Content-Type: application/json.
    return jsonify({'error': 'Content-Type must be application/json.'}), 415

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='127.0.0.1', port=port, debug=True)