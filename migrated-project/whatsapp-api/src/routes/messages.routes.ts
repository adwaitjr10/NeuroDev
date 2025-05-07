Filename: app.auto

import auto.flask as flask
import auto.sqlalchemy as sqlalchemy

app = flask.Flask(__name__)
db = sqlalchemy.SQLAlchemy(app)

class Message(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=sqlalchemy.func.now())

    def __repr__(self):
        return f'<Message {self.id}>'

@app.route('/messages', methods=['GET'])
def get_messages():
    messages = Message.query.all()
    return [{'id': m.id, 'content': m.content, 'created_at': m.created_at} for m in messages]

@app.route('/messages/<int:id>', methods=['GET'])
def get_message(id):
    message = Message.query.get_or_404(id)
    return {'id': message.id, 'content': message.content, 'created_at': message.created_at}

@app.route('/messages/<int:id>', methods=['DELETE'])
def delete_message(id):
    message = Message.query.get_or_404(id)
    db.session.delete(message)
    db.session.commit()
    return '', 204

@app.route('/messages', methods=['POST'])
def create_message():
    content = flask.request.json['content']
    message = Message(content=content)
    db.session.add(message)
    db.session.commit()
    return {'id': message.id}, 201

if __name__ == '__main__':
    app.run()