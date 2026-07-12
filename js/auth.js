// =========================================================
// MaintainIQ — Authentication
// =========================================================

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;
  const errorBox = document.getElementById("auth-error");
  const btn = document.getElementById("login-btn");

  errorBox.classList.add("hidden");
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Signing in...';

  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });

  if (error) {
    errorBox.textContent = error.message;
    errorBox.classList.remove("hidden");
    btn.disabled = false;
    btn.textContent = "Sign In";
    return;
  }
  window.location.href = "dashboard.html";
}

async function handleSignup(e) {
  e.preventDefault();
  const fullName = document.getElementById("signup-name").value.trim();
  const email = document.getElementById("signup-email").value.trim();
  const password = document.getElementById("signup-password").value;
  const errorBox = document.getElementById("auth-error");
  const btn = document.getElementById("signup-btn");

  errorBox.classList.add("hidden");

  if (password.length < 6) {
    errorBox.textContent = "Password must be at least 6 characters.";
    errorBox.classList.remove("hidden");
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Creating account...';

  const { error } = await supabaseClient.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } }
  });

  if (error) {
    errorBox.textContent = error.message;
    errorBox.classList.remove("hidden");
    btn.disabled = false;
    btn.textContent = "Create Account";
    return;
  }

  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session) {
    window.location.href = "dashboard.html";
  } else {
    errorBox.classList.remove("hidden");
    errorBox.classList.remove("auth-error");
    errorBox.style.background = "var(--emerald-100)";
    errorBox.style.color = "var(--emerald-600)";
    errorBox.textContent = "Account created! Check your email to confirm, then sign in.";
    btn.disabled = false;
    btn.textContent = "Create Account";
  }
}

async function handleLogout() {
  await supabaseClient.auth.signOut();
  window.location.href = "login.html";
}

function initPasswordStrength(inputId, barId) {
  const input = document.getElementById(inputId);
  const bar = document.getElementById(barId);
  if (!input || !bar) return;
  input.addEventListener("input", () => {
    const val = input.value;
    let score = 0;
    if (val.length >= 6) score += 33;
    if (val.length >= 10) score += 33;
    if (/[0-9]/.test(val) && /[a-zA-Z]/.test(val)) score += 34;
    bar.style.width = score + "%";
    bar.style.background = score < 40 ? "var(--red-500)" : score < 80 ? "var(--amber-500)" : "var(--emerald-500)";
  });
}

/* Load the current user into any [data-user-name] / [data-user-email] / [data-user-initials] elements */
async function loadUserBadge() {
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) return;
  const name = user.user_metadata?.full_name || user.email.split("@")[0];
  document.querySelectorAll("[data-user-name]").forEach(el => el.textContent = name);
  document.querySelectorAll("[data-user-email]").forEach(el => el.textContent = user.email);
  document.querySelectorAll("[data-user-initials]").forEach(el => el.textContent = initials(name));
  return user;
}
