from flask import Blueprint

messaging_bp = Blueprint('messaging', __name__)

from app.messaging import routes
from app.messaging import socketio_handlers

