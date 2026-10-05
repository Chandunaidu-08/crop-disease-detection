import mysql.connector

# Connect to MySQL
conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="yamininaidu",
    database="crop_db"
)
cursor = conn.cursor()

# ---------------- User functions ----------------
def add_user(username, email, password):
    try:
        query = "INSERT INTO users (username, email, password) VALUES (%s, %s, %s)"
        cursor.execute(query, (username, email, password))
        conn.commit()
        return True
    except mysql.connector.errors.IntegrityError:
        return False  # Email already exists

def verify_user(email, password):
    query = "SELECT * FROM users WHERE email=%s AND password=%s"
    cursor.execute(query, (email, password))
    return cursor.fetchone()

# ---------------- Prediction functions ----------------
def save_prediction(email, image_path, prediction):
    query = "INSERT INTO predictions (email, image_path, prediction) VALUES (%s, %s, %s)"
    cursor.execute(query, (email, image_path, prediction))
    conn.commit()

def get_user_predictions(email):
    query = "SELECT * FROM predictions WHERE email=%s"
    cursor.execute(query, (email,))
    return cursor.fetchall()

def update_prediction(pred_id, new_prediction):
    query = "UPDATE predictions SET prediction=%s WHERE id=%s"
    cursor.execute(query, (new_prediction, pred_id))
    conn.commit()

def delete_prediction(pred_id):
    query = "DELETE FROM predictions WHERE id=%s"
    cursor.execute(query, (pred_id,))
    conn.commit()
