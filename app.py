from flask_migrate import Migrate
from os import environ
from pathlib import Path
from sys import exit

from config import config_dict
from eNMS import create_app, db

get_config_mode = environ.get('ENMS_CONFIG_MODE', 'Debug')

try:
    config_mode = config_dict[get_config_mode.capitalize()]
except KeyError:
    exit('Error: Invalid ENMS_CONFIG_MODE environment variable entry.')

app = create_app(Path.cwd(), config_mode)
Migrate(app, db)
