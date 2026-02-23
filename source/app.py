from flask import Flask, render_template
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///accounts.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
db = SQLAlchemy(app)


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(20), nullable=False)
    score = db.Column(db.Integer)


@app.route("/")
@app.route("/home")
def index():
    return render_template("index.html", score="135B")


@app.route("/account")
def account():
    return render_template("account.html", user="admin")


if __name__ == "__main__":
    app.run(debug=True)
