function isValidEmail(email) {
  // Check if email is valid
   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidPassword(password) {
  // Validate password format
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9])[A-Za-z\d\S]{8,}$/;
  return passwordRegex.test(password);
}
function isValidConfirmPassword(password, confirmPassword) {
  // Check if confirm password matches password
  return password === confirmPassword;
}

module.exports = { isValidEmail, isValidPassword, isValidConfirmPassword };