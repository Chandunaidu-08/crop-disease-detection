from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from pymongo import MongoClient
from passlib.context import CryptContext
from datetime import datetime, timedelta
import jwt
import os
from dotenv import load_dotenv

# Load .env if exists
load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "yamini123")
MONGO_URI = os.getenv("MONGO_URI", "mongodb://127.0.0.1:27017")
DB_NAME = os.getenv("DB_NAME", "crop_db")
USER_COLLECTION = os.getenv("USER_COLLECTION", "users")
LOGIN_COLLECTION = os.getenv("LOGIN_COLLECTION", "logins")
PREDICTION_COLLECTION = os.getenv("PREDICTION_COLLECTION", "predictions")

# FastAPI app
app = FastAPI()

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development, allow all
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection
client = MongoClient(MONGO_URI)
db = client[DB_NAME]
users_col = db[USER_COLLECTION]
logins_col = db[LOGIN_COLLECTION]
predictions_col = db[PREDICTION_COLLECTION]

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ---------------- MODELS ----------------
class RegisterModel(BaseModel):
    name: str
    email: EmailStr
    password: str

class LoginModel(BaseModel):
    email: EmailStr
    password: str

class PredictionModel(BaseModel):
    email: EmailStr
    crop: str
    disease: str
    recommendation: str

# ---------------- UTILITIES ----------------
def create_jwt_token(user_id: str):
    payload = {
        "user_id": user_id,
        "exp": datetime.utcnow() + timedelta(hours=1)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")

# ---------------- ROUTES ----------------
@app.get("/")
def home():
    return {"message": "FastAPI + MongoDB API running!"}

# Register user
@app.post("/register")
def register_user(user: RegisterModel):
    if users_col.find_one({"email": user.email}):
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = pwd_context.hash(user.password)
    user_data = {"name": user.name, "email": user.email, "password": hashed_password}
    result = users_col.insert_one(user_data)
    return {"message": "User registered successfully", "id": str(result.inserted_id)}

# Login user
@app.post("/login")
def login_user(user: LoginModel, request: Request):
    existing_user = users_col.find_one({"email": user.email})
    if not existing_user:
        raise HTTPException(status_code=404, detail="User not found")
    if not pwd_context.verify(user.password, existing_user["password"]):
        raise HTTPException(status_code=401, detail="Invalid password")

    token = create_jwt_token(str(existing_user["_id"]))

    # Store login event
    logins_col.insert_one({
        "email": user.email,
        "login_time": str(datetime.utcnow()),
        "ip": request.client.host,
        "user_agent": request.headers.get("user-agent")
    })

    return {
        "message": "Login successful",
        "token": token,
        "name": existing_user["name"],
        "email": existing_user["email"]
    }

# Save prediction
@app.post("/predict")
def save_prediction(prediction: PredictionModel):
    prediction_data = {
        "email": prediction.email,
        "crop": prediction.crop,
        "disease": prediction.disease,
        "recommendation": prediction.recommendation,
        "date": str(datetime.utcnow())
    }
    result = predictions_col.insert_one(prediction_data)
    return {"message": "Prediction saved successfully", "id": str(result.inserted_id)}

# Get predictions for a user
@app.get("/predictions/{email}")
def get_user_predictions(email: str):
    user_predictions = list(predictions_col.find({"email": email}, {"_id": 0}))
    return {"predictions": user_predictions}
