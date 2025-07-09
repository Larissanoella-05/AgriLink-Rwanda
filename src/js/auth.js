// Supabase configuration
const SUPABASE_URL = 'https://mllcxecflmjwzbamhjzq.supabase.co'; // replace this
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1sbGN4ZWNmbG1qd3piYW1oanpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5ODY4NzMsImV4cCI6MjA2NzU2Mjg3M30.16d6W6nYx9G-fP9dY0iPQcQs6TBPqzswSZJSEix4ZW4'; // replace this

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Declare variables
const currentLanguage = "en" // Default language, should be imported or set dynamically
function showError(message) {
  const errorDiv = document.getElementById("error-message")
  if (errorDiv) {
    errorDiv.textContent = message
    errorDiv.style.display = "block"
  }
}
function hideError() {
  const errorDiv = document.getElementById("error-message")
  if (errorDiv) {
    errorDiv.style.display = "none"
  }
}

// Authentication functions
document.addEventListener("DOMContentLoaded", () => {
  initializeAuth()
})

function initializeAuth() {
  // Check if user is already logged in
  checkAuthState()

  // Initialize login form
 // Login handler
const loginForm = document.getElementById('login-form');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert('Login failed: ' + error.message);
    } else {
      alert('Login successful!');
      window.location.href = 'dashboard.html';
    }
  });
}

  // Initialize signup form
  const signupForm = document.getElementById('signup-form');
if (signupForm) {
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      alert('Signup error: ' + error.message);
    } else {
      alert('Check your email for verification!');
      console.log(data);
    }
  });
}

  // Initialize logout
  const logoutBtn = document.getElementById("logout-btn")
  if (logoutBtn) {
    logoutBtn.addEventListener("click", handleLogout)
  }
}

async function checkAuthState() {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    // User is logged in
    if (window.location.pathname.includes("login.html") || window.location.pathname.includes("signup.html")) {
      window.location.href = "dashboard.html"
    }
  } else {
    // User is not logged in
    if (
      window.location.pathname.includes("dashboard.html") ||
      window.location.pathname.includes("marketplace.html") ||
      window.location.pathname.includes("education.html")
    ) {
      window.location.href = "login.html"
    }
  }
}

async function handleLogin(e) {
  e.preventDefault()

  const email = document.getElementById("email").value
  const password = document.getElementById("password").value
  const loginBtn = document.getElementById("login-btn")

  // Show loading state
  loginBtn.disabled = true
  loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Signing in...'
  hideError()

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    })

    if (error) {
      showError(error.message)
    } else {
      // Success - redirect to dashboard
      window.location.href = "dashboard.html"
    }
  } catch (err) {
    showError("An unexpected error occurred")
  } finally {
    // Reset button state
    loginBtn.disabled = false
    loginBtn.innerHTML = currentLanguage === "en" ? "Sign In" : "Injira"
  }
}

async function handleSignup(e) {
  e.preventDefault()

  const formData = new FormData(e.target)
  const data = Object.fromEntries(formData)

  // Validation
  if (data.password !== data.confirmPassword) {
    showError(currentLanguage === "en" ? "Passwords do not match" : "Amagambo y'ibanga ntabwo ahura")
    return
  }

  if (!data.acceptTerms) {
    showError(
      currentLanguage === "en" ? "Please accept the terms and conditions" : "Nyamuneka wemere amabwiriza n'amategeko",
    )
    return
  }

  const signupBtn = document.getElementById("signup-btn")

  // Show loading state
  signupBtn.disabled = true
  signupBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Creating account...'
  hideError()

  try {
    // Sign up user
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.fullName,
          phone: data.phone,
          role: data.role,
          district: data.district,
          farm_location: data.farmLocation || null,
        },
      },
    })

    if (signUpError) {
      showError(signUpError.message)
    } else {
      // Create profile
      const { error: profileError } = await supabase.from("profiles").insert([
        {
          id: authData.user.id,
          full_name: data.fullName,
          email: data.email,
          phone: data.phone,
          role: data.role,
          district: data.district,
          farm_location: data.role === "farmer" ? data.farmLocation : null,
          created_at: new Date().toISOString(),
        },
      ])

      if (profileError) {
        showError(profileError.message)
      } else {
        // Success - redirect to dashboard
        window.location.href = "dashboard.html"
      }
    }
  } catch (err) {
    showError("An unexpected error occurred")
  } finally {
    // Reset button state
    signupBtn.disabled = false
    signupBtn.innerHTML = currentLanguage === "en" ? "Create Account" : "Kora Konti"
  }
}

async function handleLogout() {
  const { error } = await supabase.auth.signOut()
  if (!error) {
    window.location.href = "index.html"
  }
}

function initializePasswordToggle(toggleId, passwordId) {
  const toggleBtn = document.getElementById(toggleId)
  const passwordInput = document.getElementById(passwordId)

  if (toggleBtn && passwordInput) {
    toggleBtn.addEventListener("click", () => {
      const type = passwordInput.getAttribute("type") === "password" ? "text" : "password"
      passwordInput.setAttribute("type", type)

      const icon = toggleBtn.querySelector("i")
      if (type === "password") {
        icon.className = "fas fa-eye"
      } else {
        icon.className = "fas fa-eye-slash"
      }
    })
  }
}

function initializeRoleField() {
  const roleSelect = document.getElementById("role")
  const farmLocationField = document.getElementById("farm-location-field")

  if (roleSelect && farmLocationField) {
    roleSelect.addEventListener("change", function () {
      if (this.value === "farmer") {
        farmLocationField.classList.remove("hidden")
      } else {
        farmLocationField.classList.add("hidden")
      }
    })
  }
}
