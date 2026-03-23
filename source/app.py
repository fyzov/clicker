from flask import Flask, jsonify, render_template, request, session, redirect, url_for
from flask_sqlalchemy import SQLAlchemy
from functools import wraps
import secrets
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///accounts.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SECRET_KEY"] = secrets.token_hex(16)
db = SQLAlchemy(app)

CLICK_UPGRADE_PRICES = {
    1: 50,
    2: 100,
    3: 200,
    4: 400,
    5: 800,
    6: 1_600,
    7: 3_600,
    8: 7_200,
    9: 14_400,
    10: 28_800,
}


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(20), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    score = db.Column(db.Integer, default=0)
    click_level = db.Column(db.Integer, default=1)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def get_click_power(self):
        return 2 ** (self.click_level - 1)

    def get_next_upgrade_price(self):
        next_level = self.click_level + 1
        return CLICK_UPGRADE_PRICES.get(next_level, None)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "score": self.score,
            "click_level": self.click_level,
            "click_multiplier": self.get_click_power(),
            "next_price": self.get_next_upgrade_price(),
        }


def check_login(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if "username" not in session:
            return redirect(url_for("login_page"))
        return f(*args, **kwargs)

    return decorated_function


@app.route("/")
@app.route("/home")
@check_login
def index():
    return render_template("index.html")


@app.route("/account")
@check_login
def account():
    return render_template("account.html")


@app.route("/top")
@check_login
def top():
    return render_template("top.html")


@app.route("/upgrade")
@check_login
def upgrade():
    return render_template("upgrade.html")


@app.route("/login", methods=["GET", "POST"])
def login_page():
    if request.method == "POST":
        action = request.form.get("action")
        username = request.form.get("username")
        password = request.form.get("password")

        if not username or not password:
            return jsonify(
                {"success": False, "error": "Username and password required"}
            ), 400

        if action == "register":
            existing_user = User.query.filter_by(name=username).first()
            if existing_user:
                return jsonify(
                    {"success": False, "error": "Username already exists"}
                ), 400

            user = User(name=username, score=0, click_level=1)
            user.set_password(password)
            db.session.add(user)
            db.session.commit()

            session["username"] = username
            return jsonify({"success": True, "redirect": url_for("index")})

        elif action == "login":
            user = User.query.filter_by(name=username).first()
            if not user or not user.check_password(password):
                return jsonify(
                    {"success": False, "error": "Invalid username or password"}
                ), 401

            session["username"] = username
            return jsonify({"success": True, "redirect": url_for("index")})

    return render_template("login.html")


@app.route("/logout")
def logout():
    session.pop("username", None)
    return redirect(url_for("login_page"))


@app.route("/api/user/score", methods=["GET"])
@check_login
def get_user_score():
    user = User.query.filter_by(name=session["username"]).first()
    if user:
        return jsonify({"success": True, "score": user.score})
    return jsonify({"success": False, "error": "User not found"}), 404


@app.route("/api/user/click", methods=["POST"])
@check_login
def handle_click():
    user = User.query.filter_by(name=session["username"]).first()
    if user:
        points = user.get_click_power()

        user.score += points
        db.session.commit()

        return jsonify({"success": True, "score": user.score, "points_earned": points})
    return jsonify({"success": False, "error": "User not found"}), 404


@app.route("/api/user/upgrade/<upgrade_type>", methods=["POST"])
@check_login
def buy_upgrade(upgrade_type):
    user = User.query.filter_by(name=session["username"]).first()
    if not user:
        return jsonify({"success": False, "error": "User not found"}), 404

    if upgrade_type != "click":
        return jsonify({"success": False, "error": "Invalid upgrade type"}), 400

    price = user.get_next_upgrade_price()

    if price is None:
        return jsonify({"success": False, "error": "Maximum level reached!"}), 400

    if user.score < price:
        return jsonify(
            {
                "success": False,
                "error": "Not enough points",
                "needed": price - user.score,
            }
        ), 400

    user.score -= price
    user.click_level += 1

    db.session.commit()

    return jsonify(
        {
            "success": True,
            "score": user.score,
            "click_level": user.click_level,
            "click_multiplier": user.get_click_power(),
            "next_price": user.get_next_upgrade_price(),
        }
    )


@app.route("/api/top/users", methods=["GET"])
def get_top_users():
    top_users = User.query.order_by(User.score.desc()).limit(10).all()
    return jsonify({"success": True, "users": [user.to_dict() for user in top_users]})


@app.route("/api/user/info", methods=["GET"])
@check_login
def get_user_info():
    user = User.query.filter_by(name=session["username"]).first()
    if user:
        return jsonify({"success": True, "user": user.to_dict()})
    return jsonify({"success": False, "error": "User not found"}), 404


with app.app_context():
    db.create_all()


if __name__ == "__main__":
    app.run(debug=True)
