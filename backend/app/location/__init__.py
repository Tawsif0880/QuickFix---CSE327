from flask import Blueprint

location_bp = Blueprint('location', __name__)

from app.location import routes
from app.location import socketio_handlers

