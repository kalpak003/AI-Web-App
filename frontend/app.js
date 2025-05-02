document.addEventListener("DOMContentLoaded", () => {
  // Initialize elements
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");
  const loginErrorMsg = document.getElementById("login-error-msg");
  const registerErrorMsg = document.getElementById("register-error-msg");

  // Handle login form submission
  if (loginForm) {
      loginForm.addEventListener("submit", handleLogin);
  }

  // Handle register form submission
  if (registerForm) {
      registerForm.addEventListener("submit", handleRegister);
  }

  // Check authentication status for protected routes
  if (window.location.pathname === "/dashboard") {
      checkAuthStatus();
  }
});

async function handleLogin(event) {
  event.preventDefault();
  
  const form = event.target;
  const errorMsg = document.getElementById("login-error-msg");
  const submitButton = form.querySelector("button[type='submit']");
  
  // Get form data
  const username = form.username.value.trim();
  const password = form.password.value.trim();

  // Validate inputs
  if (!username || !password) {
      showError(errorMsg, "Please fill in all fields");
      return;
  }

  try {
      // Disable button during request
      submitButton.disabled = true;
      
      const response = await fetch("/api/auth/login/", {
          method: "POST",
          headers: { 
              "Content-Type": "application/json",
          },
          body: JSON.stringify({ username, password }),
          credentials: "include"
      });

      const data = await response.json();

      if (response.ok) {
          // Store token securely
          setAuthToken(data.access_token);
          
          // Redirect to dashboard
          window.location.href = "/dashboard";
      } else {
          showError(errorMsg, data.detail || "Login failed");
      }
  } catch (error) {
      console.error("Login error:", error);
      showError(errorMsg, "Error connecting to server");
  } finally {
      submitButton.disabled = false;
  }
}

async function handleRegister(event) {
  event.preventDefault();
  
  const form = event.target;
  const errorMsg = document.getElementById("register-error-msg");
  const submitButton = form.querySelector("button[type='submit']");
  
  // Get form data
  const username = form.username.value.trim();
  const email = form.email.value.trim();
  const password = form.password.value.trim();

  // Validate inputs
  if (!username || !email || !password) {
      showError(errorMsg, "Please fill in all fields");
      return;
  }

  try {
      submitButton.disabled = true;
      
      const response = await fetch("/api/auth/signup/", {
          method: "POST",
          headers: { 
              "Content-Type": "application/json",
          },
          body: JSON.stringify({ username, email, password }),
          credentials: "include"
      });

      const data = await response.json();

      if (response.ok) {
          alert("Registration successful! Please login.");
          window.location.href = "/login";
      } else {
          showError(errorMsg, data.detail || "Registration failed");
      }
  } catch (error) {
      console.error("Registration error:", error);
      showError(errorMsg, "Error connecting to server");
  } finally {
      submitButton.disabled = false;
  }
}

async function checkAuthStatus() {
  const token = getAuthToken();
  
  if (!token) {
      redirectToLogin();
      return;
  }

  try {
      const response = await fetch("/api/auth/verify/", {
          headers: {
              "Authorization": `Bearer ${token}`
          }
      });
      
      if (!response.ok) {
          redirectToLogin();
      }
  } catch (error) {
      console.error("Auth check failed:", error);
      redirectToLogin();
  }
}

// Helper functions
function setAuthToken(token) {
  // Store in localStorage
  localStorage.setItem("token", token);
  
  // Also set as cookie for HTTP-only security
  document.cookie = `token=${token}; path=/; max-age=${60 * 60 * 24}; SameSite=Strict` + 
                    (location.protocol === "https:" ? "; Secure" : "");
}

function getAuthToken() {
  // Check localStorage first
  const token = localStorage.getItem("token");
  if (token) return token;
  
  // Fallback to cookie
  const cookieToken = document.cookie
      .split('; ')
      .find(row => row.startsWith('token='))
      ?.split('=')[1];
  
  return cookieToken;
}

function redirectToLogin() {
  // Clear auth data before redirecting
  localStorage.removeItem("token");
  document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  window.location.href = "/login";
}

function showError(element, message) {
  if (!element) return;
  
  element.textContent = message;
  element.style.display = "block";
  
  // Auto-hide error after 5 seconds
  setTimeout(() => {
      element.style.display = "none";
  }, 5000);
}