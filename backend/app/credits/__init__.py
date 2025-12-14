from flask import Blueprint

credits_bp = Blueprint('credits', __name__)

from app.credits import routes

