# server.py
from app import app  # Importă aplicația din fișierul app.py
import requests  # Asigură-te că importi requests

if __name__ == '__main__':
    app.run(debug=True)
