from flask import Blueprint

providers_bp = Blueprint('providers', __name__)

from app.providers import routes

