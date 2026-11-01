export function signupErrorDestination(code?: string) {
  if (code === "user_already_exists" || code === "email_exists") {
    return "/login?message=" + encodeURIComponent(
      "An account with this email already exists. Sign in to continue.",
    );
  }

  const error = code === "over_email_send_rate_limit"
    ? "Too many attempts. Please wait before requesting another email."
    : "Unable to create your account. Please try again.";
  return "/signup?error=" + encodeURIComponent(error);
}
