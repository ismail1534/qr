from flask import Flask, request, jsonify, send_file, send_from_directory
from flask_cors import CORS
from qr.qr_generator import generate_secure_token, save_token, validate_token, generate_qr_for_file
import os
import hashlib
from Crypto.Cipher import AES
from Crypto.Random import get_random_bytes

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes
app.secret_key = "supersecretkey"

UPLOAD_FOLDER = "uploads"
QR_FOLDER = "qr_codes"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(QR_FOLDER, exist_ok=True)

# Configuration from Environment Variables
# In production (Koyeb), this should be the public URL of the Koyeb service
BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:5000") 
# The URL where the frontend is hosted (for QR codes to point to)
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:5173")


# ===========================
# AES ENCRYPTION FUNCTIONS
# ===========================

def pad(data):
    return data + b"\0" * (16 - len(data) % 16)

def encrypt_file(infile, outfile, key):
    cipher = AES.new(key, AES.MODE_CBC)
    with open(infile, "rb") as f:
        plaintext = pad(f.read())
    ciphertext = cipher.encrypt(plaintext)

    with open(outfile, "wb") as f:
        f.write(cipher.iv + ciphertext)

def decrypt_file(infile, key):
    with open(infile, "rb") as f:
        iv = f.read(16)
        ciphertext = f.read()

    cipher = AES.new(key, AES.MODE_CBC, iv)
    plaintext = cipher.decrypt(ciphertext)
    return plaintext.rstrip(b"\0")

def file_checksum(path):
    sha256 = hashlib.sha256()
    with open(path, "rb") as f:
        for block in iter(lambda: f.read(4096), b""):
            sha256.update(block)
    return sha256.hexdigest()

# ==============================
# ROUTES
# ==============================

@app.route("/upload", methods=["POST"])
def upload_file():
    if "file" not in request.files or "password" not in request.form:
        return jsonify({"error": "Missing file or password"}), 400

    f = request.files["file"]
    password = request.form.get("password")

    file_name = f.filename
    original_path = os.path.join(UPLOAD_FOLDER, file_name)
    encrypted_path = original_path + ".enc"

    f.save(original_path)

    # SHA256 before encryption
    checksum = file_checksum(original_path)

    # AES key = SHA256(password)
    key = hashlib.sha256(password.encode()).digest()

    encrypt_file(original_path, encrypted_path, key)
    os.remove(original_path)

    token = generate_secure_token()
    save_token(token, encrypted_path, password, expiry_seconds=3600)
    
    # Generate QR pointing to the FRONTEND access page
    # Example: https://my-frontend.vercel.app/access?token=abc...
    access_url = f"{FRONTEND_URL}/access?token={token}"
    qr_img_path = generate_qr_for_file(token, access_url)
    
    qr_filename = os.path.basename(qr_img_path)
    
    # Return full URL for QR image so frontend can display it
    qr_image_url = f"{BACKEND_URL}/qr_codes/{qr_filename}"

    return jsonify({
        "message": "File uploaded successfully",
        "file_name": file_name,
        "checksum": checksum,
        "qr_image_url": qr_image_url,
        "access_url": access_url
    })

@app.route("/qr_codes/<filename>")
def serve_qr(filename):
    return send_from_directory(QR_FOLDER, filename)

@app.route("/verify-token", methods=["POST"])
def verify_token():
    data = request.json
    token = data.get("token")
    if not token:
        return jsonify({"error": "Token missing"}), 400

    info = validate_token(token)
    if not info:
        return jsonify({"valid": False, "error": "Invalid or expired token"}), 404

    # Allow frontend to verify password and checksum locally or via another call
    # Here we just confirm the token exists and maybe return info needed for next step
    # We DO NOT return the file or password yet.
    
    encrypted_path = info["file_name"]
    password_required = info["password"]
    
    # Calculate checksum of the decrypted file to send to user for manual verification match
    # Wait, we need the password to decrypt to check checksum.
    # The user supplies the password.
    
    return jsonify({"valid": True})


@app.route("/download", methods=["POST"])
def download_file():
    data = request.json
    token = data.get("token")
    password = data.get("password")
    
    if not token or not password:
        return jsonify({"error": "Missing token or password"}), 400

    info = validate_token(token)
    if not info:
        return jsonify({"error": "Invalid or expired token"}), 401
        
    if info["password"] != password:
        return jsonify({"error": "Incorrect password"}), 403

    encrypted_path = info["file_name"]
    
    # Decrypt and send
    key = hashlib.sha256(password.encode()).digest()
    
    try:
        decrypted_data = decrypt_file(encrypted_path, key)
    except Exception as e:
         return jsonify({"error": "Decryption failed"}), 500

    original_name = os.path.basename(encrypted_path).replace(".enc", "")
    
    # Save temporarily to send (or use send_file with BytesIO)
    from io import BytesIO
    return send_file(
        BytesIO(decrypted_data),
        download_name=original_name,
        as_attachment=True
    )

@app.route("/params", methods=["GET"])
def get_params():
    """Helper to check checkum match before download if client wants."""
    token = request.args.get("token")
    password = request.args.get("password")
    
    info = validate_token(token)
    if not info or info["password"] != password:
         return jsonify({"valid": False}), 401
         
    encrypted_path = info["file_name"]
    key = hashlib.sha256(password.encode()).digest()
    decrypted_data = decrypt_file(encrypted_path, key)
    checksum = hashlib.sha256(decrypted_data).hexdigest()
    
    return jsonify({"valid": True, "checksum": checksum})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)
