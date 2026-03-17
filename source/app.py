from flask import Flask, jsonify, render_template, request, session, redirect, url_for
from flask_sqlalchemy import SQLAlchemy
from functools import wraps
from util import Utils
import secrets

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///accounts.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SECRET_KEY"] = secrets.token_hex(16)
db = SQLAlchemy(app)


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(20), unique=True, nullable=False)
    score = db.Column(db.Integer, default=0)
    clicks = db.Column(db.Integer, default=1)
    boost = db.Column(db.Boolean, default=False)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "score": self.score,
            "clicks": self.clicks,
            "boost": self.boost,
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
    user = User.query.filter_by(name=session["username"]).first()
    if user:
        score_str = Utils.format_score(user.score)
        return render_template("index.html", score=score_str)
    return redirect(url_for("login_page"))


@app.route("/account")
@check_login
def account():
    return render_template("account.html", user=session["username"])


@app.route("/top")
@check_login
def top():
    return render_template("top.html", user=session["username"])


@app.route("/upgrade")
@check_login
def upgrade():
    return render_template("upgrade.html", user=session["username"])


@app.route("/login", methods=["GET", "POST"])
def login_page():
    if request.method == "POST":
        username = request.form.get("username")
        if username:
            user = User.query.filter_by(name=username).first()
            if not user:
                user = User(name=username, score=0)
                db.session.add(user)
                db.session.commit()

            session["username"] = username
            return redirect(url_for("index"))

    return render_template("login.html")


@app.route("/logout")
def logout():
    session.pop("username", None)
    return redirect(url_for("login_page"))


@app.route("/api/user/score", methods=["GET"])
@check_login
def get_user_score():
    """Получить текущий счет пользователя"""
    user = User.query.filter_by(name=session["username"]).first()
    if user:
        return jsonify(
            {
                "success": True,
                "score": user.score,
                "formatted_score": Utils.format_score(user.score),
            }
        )
    return jsonify({"success": False, "error": "User not found"}), 404


@app.route("/api/user/click", methods=["POST"])
@check_login
def handle_click():
    """Обработка клика"""
    user = User.query.filter_by(name=session["username"]).first()
    if user:
        # Рассчитываем очки за клик
        points = user.clicks
        if user.boost:
            points *= 2

        user.score += points
        db.session.commit()

        return jsonify(
            {
                "success": True,
                "score": user.score,
                "points_earned": points,
                "formatted_score": Utils.format_score(user.score),
            }
        )
    return jsonify({"success": False, "error": "User not found"}), 404


@app.route("/api/user/upgrade/<upgrade_type>", methods=["POST"])
@check_login
def buy_upgrade(upgrade_type):
    """Покупка улучшений"""
    user = User.query.filter_by(name=session["username"]).first()
    if not user:
        return jsonify({"success": False, "error": "User not found"}), 404

    # Цены улучшений
    upgrade_prices = {
        "click": 12000000000,  # 12B
        "second": 1000000,  # 1M
        "boost": 1000000000000,  # 1T
    }

    if upgrade_type not in upgrade_prices:
        return jsonify({"success": False, "error": "Invalid upgrade type"}), 400

    price = upgrade_prices[upgrade_type]

    if user.score < price:
        return jsonify(
            {
                "success": False,
                "error": "Not enough points",
                "needed": price - user.score,
            }
        ), 400

    # Применяем улучшение
    user.score -= price

    if upgrade_type == "click":
        user.clicks += 1
    elif upgrade_type == "second":
        # Здесь можно добавить логику для второго улучшения
        user.clicks += 5  # Например, +5 к клику
    elif upgrade_type == "boost":
        user.boost = True

    db.session.commit()

    return jsonify(
        {
            "success": True,
            "score": user.score,
            "clicks": user.clicks,
            "boost": user.boost,
            "formatted_score": Utils.format_score(user.score),
        }
    )


@app.route("/api/top/users", methods=["GET"])
def get_top_users():
    """Получить топ пользователей"""
    top_users = User.query.order_by(User.score.desc()).limit(10).all()
    return jsonify({"success": True, "users": [user.to_dict() for user in top_users]})


@app.route("/api/user/info", methods=["GET"])
@check_login
def get_user_info():
    """Получить информацию о пользователе"""
    user = User.query.filter_by(name=session["username"]).first()
    if user:
        return jsonify({"success": True, "user": user.to_dict()})
    return jsonify({"success": False, "error": "User not found"}), 404


with app.app_context():
    db.create_all()


if __name__ == "__main__":
    app.run(debug=True)
