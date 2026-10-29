
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Replace these placeholders with your Supabase project details.
const SUPABASE_URL = "https://kidfjyxnqopezhhulwrl.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_ROeN6_r-OGF7ZxgiRTcPlA_NW-YdxoX";

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

const loginForm = document.getElementById("login-form");
const loginMessage = document.getElementById("login-message");

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const submitButton = loginForm.querySelector('button[type="submit"]');

  loginMessage.textContent = "";
  submitButton.disabled = true;
  submitButton.textContent = "Signing in...";

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    if (data.user?.email?.toLowerCase() !== email.toLowerCase()) {
      await supabase.auth.signOut();
      throw new Error("This account is not authorized.");
    }

    window.location.href = "admin-dashboard.html";
  } catch (error) {
    loginMessage.textContent =
      error.message || "Login failed. Please try again.";
    loginMessage.style.color = "#ff8585";
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Sign In";
  }
});
