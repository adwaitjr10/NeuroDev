Filename: app.py
```python
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import datetime

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your_secret_key'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///sessions.db'

db = SQLAlchemy(app)

class Session(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), nullable=False, unique=True)
    password = db.Column(db.String(80), nullable=False)

@app.route('/sessions', methods=['POST'])
def create_session():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    user = Session.query.filter_by(username=username).first()

    if user and check_password_hash(user.password, password):
        token = jwt.encode({
            'user_id': user.id,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(minutes=30)
        }, app.config['SECRET_KEY'])

        return jsonify({'token': token.decode('utf-8')})

    return jsonify({'error': 'Invalid username or password'}), 401

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)
```

This Flask application provides a single route `/sessions` that accepts a POST request with a JSON payload containing a `username` and `password`. It checks if the provided credentials match a user in the database, and if so, generates a JSON Web Token (JWT) that is valid for 30 minutes. The token is returned in the response.

If the provided credentials are invalid, the application returns a 401 Unauthorized error with an error message.

The application uses Flask-SQLAlchemy for database operations and stores user sessions in a SQLite database. The `Session` model represents a user with a username and password (hashed using `werkzeug.security`).

Note that this is a basic implementation and does not include features like password hashing during user creation, token refreshing, or token revocation. Additionally, it's recommended to use a more secure method of storing secrets (like environment variables) instead of hard-coding them in the application code.