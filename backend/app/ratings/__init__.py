from flask import Blueprint

ratings_bp = Blueprint('ratings', __name__)

from app.ratings import routes

