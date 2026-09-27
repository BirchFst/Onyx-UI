from flask import Flask, send_from_directory
import os

ROOT = os.path.dirname(os.path.abspath(__file__))
app = Flask(__name__, static_folder=None)


@app.route('/')
def index():
    return send_from_directory(ROOT, 'index.html')


@app.route('/<path:path>')
def static_files(path):
    return send_from_directory(ROOT, path)


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=False)
