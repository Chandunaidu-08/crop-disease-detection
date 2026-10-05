document.addEventListener("DOMContentLoaded", () => {
    /* ===============================
       LOGIN & REGISTER LOGIC
    ================================== */
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");
    const showRegisterLink = document.getElementById("showRegister");
    const showLoginLink = document.getElementById("showLogin");

    // Switch to Register Form
    if (showRegisterLink) {
        showRegisterLink.addEventListener("click", (e) => {
            e.preventDefault();
            if (loginForm && registerForm) {
                loginForm.style.display = "none";
                registerForm.style.display = "block";
            }
        });
    }

    // Switch to Login Form
    if (showLoginLink) {
        showLoginLink.addEventListener("click", (e) => {
            e.preventDefault();
            if (loginForm && registerForm) {
                registerForm.style.display = "none";
                loginForm.style.display = "block";
            }
        });
    }

    // -------------------
    // Login Form submission
    // -------------------
    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const email = document.getElementById("loginEmail").value.trim();
            const password = document.getElementById("loginPassword").value.trim();
            if (email === "" || password === "") {
                alert("Please fill in all fields.");
                return;
            }

            try {
                const res = await fetch("http://127.0.0.1:8000/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, password })
                });

                const data = await res.json();

                if (res.ok) {
                    alert(data.message);
                    // Store email in localStorage for predictions
                    localStorage.setItem("userEmail", email);
                    window.location.href = "predict.html";
                } else {
                    alert(data.detail || "Login failed!");
                }
            } catch (err) {
                console.error(err);
                alert("An error occurred during login!");
            }
        });
    }

    // -------------------
    // Register Form submission
    // -------------------
    if (registerForm) {
        registerForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const name = document.getElementById("regName").value.trim();
            const email = document.getElementById("regEmail").value.trim();
            const password = document.getElementById("regPassword").value.trim();
            const confirmPassword = document.getElementById("confirmPassword").value.trim();

            if (password !== confirmPassword) {
                alert("Passwords do not match!");
                return;
            }

            try {
                const res = await fetch("http://127.0.0.1:8000/register", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name, email, password })
                });

                const data = await res.json();

                if (res.ok) {
                    alert(data.message);
                    registerForm.style.display = "none";
                    if (loginForm) loginForm.style.display = "block";
                } else {
                    alert(data.detail || "Registration failed!");
                }
            } catch (err) {
                console.error(err);
                alert("An error occurred during registration!");
            }
        });
    }

    // -------------------
    // Logout functionality
    // -------------------
    const logoutLink = document.getElementById('logout');
    if (logoutLink) {
        logoutLink.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem("userEmail");
            alert("You have been logged out.");
            window.location.href = "login.html";
        });
    }

    /* ===============================
       FRONTEND CROP DISEASE DETECTION
    ================================== */
    const detectBtn = document.getElementById("detectBtn");
    const imageUpload = document.getElementById("imageUpload");

    // Create result container dynamically
    let resultDiv = document.getElementById("result");
    if (!resultDiv) {
        resultDiv = document.createElement("div");
        resultDiv.id = "result";
        resultDiv.style.marginTop = "20px";
        resultDiv.style.fontSize = "18px";
        resultDiv.style.fontWeight = "600";
        resultDiv.style.color = "#2e8b57";
        if (detectBtn) detectBtn.parentNode.appendChild(resultDiv);
    }

    // Create image preview dynamically
    if (!document.getElementById("imagePreview")) {
        const img = document.createElement("img");
        img.id = "imagePreview";
        img.style.maxWidth = "100%";
        img.style.marginTop = "10px";
        detectBtn.parentNode.insertBefore(img, resultDiv);
    }
    const imagePreview = document.getElementById("imagePreview");

    // Preview selected image
    if (imageUpload) {
        imageUpload.addEventListener("change", () => {
            if (imageUpload.files && imageUpload.files[0]) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    imagePreview.src = e.target.result;
                    imagePreview.style.display = "block";
                    resultDiv.textContent = 'Upload an image and click "Detect Disease" to see results.';
                };
                reader.readAsDataURL(imageUpload.files[0]);
            } else {
                imagePreview.style.display = "none";
                imagePreview.src = '';
                resultDiv.textContent = 'Upload an image and click "Detect Disease" to see results.';
            }
        });
    }

    // Simple hash function for consistent prediction
    function hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = (hash << 5) - hash + str.charCodeAt(i);
            hash |= 0;
        }
        return Math.abs(hash);
    }

    // Detect disease and show recommendation
    if (detectBtn && imageUpload) {
        detectBtn.addEventListener("click", async () => {
            const file = imageUpload.files[0];
            if (!file) {
                alert("Please upload an image first.");
                return;
            }

            const diseases = [
                {
                    name: 'Healthy 🌱',
                    recommendation: 'Your crops are healthy! Maintain proper watering, sunlight, and nutrient supply.'
                },
                {
                    name: 'Powdery Mildew ⚠',
                    recommendation: 'Apply fungicide and ensure good air circulation. Avoid excessive humidity.'
                },
                {
                    name: 'Leaf Rust 🦠',
                    recommendation: 'Remove infected leaves and use fungicides. Rotate crops to prevent recurrence.'
                },
                {
                    name: 'Bacterial Blight 🦠',
                    recommendation: 'Remove affected areas and treat with copper-based bactericide. Maintain proper spacing.'
                },
                {
                    name: 'Fungal Infection 🌾',
                    recommendation: 'Apply recommended fungicide. Avoid overwatering and improve drainage.'
                }
            ];

            const hash = hashString(file.name);
            const diseaseIndex = hash % diseases.length;
            const detected = diseases[diseaseIndex];

            resultDiv.innerHTML = `<strong>Prediction:</strong> ${detected.name}<br><strong>Recommendation:</strong> ${detected.recommendation}`;

            // Save prediction to backend
            const email = localStorage.getItem("userEmail");
            if (!email) {
                alert("Please login first to save prediction!");
                return;
            }

            try {
                const res = await fetch("http://127.0.0.1:8000/predict", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        email: email,
                        crop: "Wheat", // You can replace with actual crop if available
                        disease: detected.name,
                        recommendation: detected.recommendation
                    })
                });

                const data = await res.json();
                alert(data.message);
            } catch (err) {
                console.error(err);
                alert("Failed to save prediction to database.");
            }
        });
    }
});
