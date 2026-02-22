from flask import Flask, render_template, request, jsonify
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///accounts.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
db = SQLAlchemy(app)
user_scores = {"admin": 125000}


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(20), nullable=False)
    score = db.Column(db.Integer)


@app.route("/")
def index():
    return render_template("index.html", username="admin", score=user_scores["admin"])


@app.route("/update_score")
def update_score():
    username = request.args.get("username")
    clicks = int(request.args.get("clicks", 1))

    user_scores[username] += clicks
    return jsonify({"success": True, "new_score": user_scores[username]})


if __name__ == "__main__":
    app.run(debug=True)
