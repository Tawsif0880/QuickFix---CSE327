from flask import Blueprint

emergency_bp = Blueprint('emergency', __name__)

from app.emergency import routes
