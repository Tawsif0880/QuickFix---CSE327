from flask import Blueprint

system_bp = Blueprint('system', __name__)

from app.system import routes
