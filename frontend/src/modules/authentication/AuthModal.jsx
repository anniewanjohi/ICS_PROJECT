// frontend/src/modules/authentication/AuthModal.jsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Alert,
  CircularProgress,
  IconButton,
  InputAdornment,
  Tab,
  Tabs,
  Modal,
  Backdrop,
  Slide,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  Person,
  Close,
  CheckCircle,
} from "@mui/icons-material";
import { api } from "../../services/api";

// ---------- Institutional palette (matches the landing page) ----------
const NAVY = "#0b2547";
const NAVY_HOVER = "#123a68";
const GOLD = "#c9a35c";
const BORDER = "#d7dde3";
const TEXT_MUTED = "#5b6774";
const PANEL_WIDTH = 360;

const validate = {
  email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? "" : "Enter a valid email address",
  password: (v) => v.length >= 8 ? "" : "Password must be at least 8 characters",
  confirmPassword: (v, pw) => v === pw ? "" : "Passwords do not match",
  fullname: (v) => v.trim().length >= 2 ? "" : "Full name is required",
};

const fieldSx = {
  mb: 2,
  "& .MuiInputBase-input": { fontSize: "0.85rem", py: 1.1 },
  "& .MuiInputLabel-root": { fontSize: "0.85rem" },
  "& .MuiOutlinedInput-root": {
    borderRadius: "4px",
    "& fieldset": { borderColor: BORDER },
    "&:hover fieldset": { borderColor: "#b7c2cf" },
    "&.Mui-focused fieldset": { borderColor: NAVY, borderWidth: "1px" },
  },
  "& .MuiInputLabel-root.Mui-focused": { color: NAVY },
};

const AuthModal = ({ open, onClose, onLoginSuccess }) => {
  const [tabValue, setTabValue] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
    remember: false,
  });

  const [regForm, setRegForm] = useState({
    fullname: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "student",
  });

  useEffect(() => {
    if (!open) {
      setTabValue(0);
      setLoginForm({ email: "", password: "", remember: false });
      setRegForm({
        fullname: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "student",
      });
      setError("");
      setSuccess("");
      setErrors({});
      setTouched({});
    }
  }, [open]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setError("");
    setSuccess("");
    setErrors({});
    setTouched({});
  };

  const handleTouch = (field) => setTouched((prev) => ({ ...prev, [field]: true }));

  const validateLoginForm = () => {
    const newErrors = {};
    if (!loginForm.email) newErrors.email = "Email is required";
    else {
      const emailError = validate.email(loginForm.email);
      if (emailError) newErrors.email = emailError;
    }
    if (!loginForm.password) newErrors.password = "Password is required";
    return newErrors;
  };

  const validateRegForm = () => {
    const newErrors = {};
    const nameError = validate.fullname(regForm.fullname);
    if (nameError) newErrors.fullname = nameError;

    const emailError = validate.email(regForm.email);
    if (emailError) newErrors.email = emailError;

    const passError = validate.password(regForm.password);
    if (passError) newErrors.password = passError;

    const confirmError = validate.confirmPassword(regForm.confirmPassword, regForm.password);
    if (confirmError) newErrors.confirmPassword = confirmError;

    return newErrors;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const newErrors = validateLoginForm();
    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      setTouched({ email: true, password: true });
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const result = await api.login(loginForm.email, loginForm.password);

      if (result.success) {
        if (loginForm.remember) {
          localStorage.setItem("token", result.data.token);
          localStorage.setItem("user", JSON.stringify(result.data.user));
        } else {
          sessionStorage.setItem("token", result.data.token);
          sessionStorage.setItem("user", JSON.stringify(result.data.user));
        }

        setSuccess("Login successful! Redirecting...");

        setTimeout(() => {
          if (onLoginSuccess) { onLoginSuccess(result.data.user, result.data.token, loginForm.remember); }
          onClose();
        }, 1500);
      } else {
        setError(result.message || "Invalid email or password");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Network error. Please check if the backend server is running on port 5000");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const newErrors = validateRegForm();
    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      setTouched({
        fullname: true,
        email: true,
        password: true,
        confirmPassword: true,
      });
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const registrationData = {
        email: regForm.email,
        password: regForm.password,
        role: regForm.role,
        profileData: {
          first_name: regForm.fullname.split(' ')[0] || regForm.fullname,
          last_name: regForm.fullname.split(' ').slice(1).join(' ') || '',
        }
      };

      const result = await api.register(registrationData);

      if (result.success) {
        setSuccess("Registration successful! You can now sign in.");
        setTimeout(() => {
          setSuccess("");
          setTabValue(0);
          setLoginForm(prev => ({ ...prev, email: regForm.email }));
        }, 3000);
      } else {
        if (result.errors && result.errors.length > 0) {
          setError(result.errors.join(' · '));
        } else {
          setError(result.message || "Registration failed. Please try again.");
        }
      }
    } catch (err) {
      console.error("Registration error:", err);
      setError("Network error. Please check if the backend server is running on port 5000");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!loginForm.email) {
      setError("Please enter your email address first");
      return;
    }

    setLoading(true);
    try {
      const result = await api.forgotPassword(loginForm.email);
      setSuccess(result.message || "If an account exists, you will receive password reset instructions.");
      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      setError("Failed to send reset email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (password) => {
    if (!password) return 0;
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(regForm.password);
  const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"];
  const strengthColors = ["", "#c0392b", "#b8762a", "#1e8e4f", "#1e8e4f"];

  return (
    <Modal
      open={open}
      onClose={onClose}
      closeAfterTransition
      slots={{ backdrop: Backdrop }}
      slotProps={{
        backdrop: {
          timeout: 400,
          sx: {
            backgroundColor: "rgba(8, 27, 51, 0.55)",
          },
        },
      }}
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Slide direction="up" in={open} mountOnEnter unmountOnExit>
        <Box
          sx={{
            width: { xs: "92%", sm: PANEL_WIDTH },
            maxHeight: "90vh",
            outline: "none",
          }}
        >
          <Paper
            elevation={8}
            square={false}
            sx={{
              background: "#fff",
              maxHeight: "90vh",
              overflowY: "auto",
              border: `1px solid ${BORDER}`,
              borderRadius: "6px",
              position: "relative",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Header bar - flat navy strip like the site nav/panel headers */}
            <Box
              sx={{
                background: NAVY,
                color: "#fff",
                px: 2,
                py: 1.25,
                display: "flex",
                alignItems: "center",
                gap: 1,
                flexShrink: 0,
                borderTopLeftRadius: "6px",
                borderTopRightRadius: "6px",
              }}
            >
              <Box
                sx={{
                  width: 26,
                  height: 26,
                  borderRadius: "4px",
                  background: "rgba(255,255,255,0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                SD
              </Box>
              <Typography
                sx={{
                  fontFamily: "Arial, sans-serif",
                  fontWeight: 700,
                  fontSize: "0.8rem",
                  color: "#fff",
                  flex: 1,
                }}
              >
                Strathmore Directory
              </Typography>
              <IconButton
                onClick={onClose}
                size="small"
                sx={{
                  color: "rgba(255,255,255,0.75)",
                  p: 0.5,
                  "&:hover": { background: "rgba(255,255,255,0.12)", color: "#fff" },
                }}
              >
                <Close fontSize="small" />
              </IconButton>
            </Box>

            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              variant="fullWidth"
              sx={{
                borderBottom: `1px solid ${BORDER}`,
                minHeight: 36,
                flexShrink: 0,
                "& .MuiTab-root": {
                  py: 0.75,
                  minHeight: 36,
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  textTransform: "none",
                  color: TEXT_MUTED,
                  "&.Mui-selected": {
                    color: NAVY,
                  },
                },
                "& .MuiTabs-indicator": {
                  backgroundColor: GOLD,
                  height: 3,
                },
              }}
            >
              <Tab label="Sign In" />
              <Tab label="Register" />
            </Tabs>

            <Box sx={{ p: 2 }}>
              {error && (
                <Alert
                  severity="error"
                  sx={{ mb: 2, fontSize: "0.8rem", borderRadius: "4px" }}
                  onClose={() => setError("")}
                >
                  {error}
                </Alert>
              )}

              {success ? (
                <Box sx={{ textAlign: "center", py: 4 }}>
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: "4px",
                      background: "#e4f7ea",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      mx: "auto",
                      mb: 2,
                    }}
                  >
                    <CheckCircle sx={{ fontSize: 30, color: "#1e8e4f" }} />
                  </Box>
                  <Typography
                    sx={{ fontSize: "1rem", fontWeight: 700, color: NAVY, mb: 1 }}
                  >
                    {tabValue === 0 ? "Welcome Back!" : "Account Created!"}
                  </Typography>
                  <Typography sx={{ fontSize: "0.85rem", color: TEXT_MUTED }}>
                    {success}
                  </Typography>
                  {tabValue === 1 && (
                    <Button
                      variant="contained"
                      onClick={() => setTabValue(0)}
                      sx={{
                        mt: 3,
                        background: NAVY,
                        color: "white",
                        "&:hover": { background: NAVY_HOVER },
                        borderRadius: "4px",
                        px: 3,
                        boxShadow: "none",
                        textTransform: "none",
                        fontWeight: 700,
                      }}
                    >
                      Go to Sign In
                    </Button>
                  )}
                </Box>
              ) : (
                <Box>
                  {/* Login Form */}
                  {tabValue === 0 && (
                    <form onSubmit={handleLogin}>
                      <TextField
                        fullWidth
                        label="Email Address"
                        type="email"
                        value={loginForm.email}
                        onChange={(e) => setLoginForm((prev) => ({ ...prev, email: e.target.value }))}
                        onBlur={() => {
                          handleTouch("email");
                          setErrors((prev) => ({ ...prev, email: validate.email(loginForm.email) }));
                        }}
                        error={touched.email && !!errors.email}
                        helperText={touched.email && errors.email}
                        placeholder="you@strathmore.edu"
                        sx={fieldSx}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Email sx={{ color: TEXT_MUTED, fontSize: 20 }} />
                            </InputAdornment>
                          ),
                        }}
                      />

                      <TextField
                        fullWidth
                        label="Password"
                        type={showPassword ? "text" : "password"}
                        value={loginForm.password}
                        onChange={(e) => setLoginForm((prev) => ({ ...prev, password: e.target.value }))}
                        onBlur={() => handleTouch("password")}
                        error={touched.password && !!errors.password}
                        helperText={touched.password && errors.password}
                        placeholder="••••••••"
                        sx={{ ...fieldSx, mb: 2 }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Lock sx={{ color: TEXT_MUTED, fontSize: 20 }} />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                                {showPassword ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />

                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          mb: 2,
                          flexWrap: "wrap",
                          gap: 1,
                        }}
                      >
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={loginForm.remember}
                              onChange={(e) => setLoginForm((prev) => ({ ...prev, remember: e.target.checked }))}
                              sx={{
                                color: BORDER,
                                "&.Mui-checked": { color: NAVY },
                              }}
                            />
                          }
                          label={
                            <Typography sx={{ fontSize: "0.8rem", color: TEXT_MUTED }}>
                              Remember me
                            </Typography>
                          }
                        />
                        <Button
                          onClick={handleForgotPassword}
                          sx={{
                            fontSize: "0.8rem",
                            color: NAVY,
                            textTransform: "none",
                            fontWeight: 600,
                            "&:hover": { background: "transparent", textDecoration: "underline" },
                          }}
                        >
                          Forgot password?
                        </Button>
                      </Box>

                      <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        disabled={loading}
                        sx={{
                          background: NAVY,
                          color: "white",
                          py: 1,
                          borderRadius: "4px",
                          fontSize: "0.875rem",
                          fontWeight: 700,
                          textTransform: "none",
                          boxShadow: "none",
                          "&:hover": { background: NAVY_HOVER, boxShadow: "none" },
                          "&:disabled": { opacity: 0.7 },
                        }}
                      >
                        {loading ? <CircularProgress size={22} color="inherit" /> : "Sign In"}
                      </Button>
                    </form>
                  )}

                  {/* Registration Form */}
                  {tabValue === 1 && (
                    <form onSubmit={handleRegister}>
                      <TextField
                        fullWidth
                        label="Full Name"
                        value={regForm.fullname}
                        onChange={(e) => setRegForm((prev) => ({ ...prev, fullname: e.target.value }))}
                        onBlur={() => {
                          handleTouch("fullname");
                          setErrors((prev) => ({ ...prev, fullname: validate.fullname(regForm.fullname) }));
                        }}
                        error={touched.fullname && !!errors.fullname}
                        helperText={touched.fullname && errors.fullname}
                        placeholder="John Doe"
                        sx={fieldSx}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Person sx={{ color: TEXT_MUTED, fontSize: 20 }} />
                            </InputAdornment>
                          ),
                        }}
                      />

                      <TextField
                        fullWidth
                        label="Email Address"
                        type="email"
                        value={regForm.email}
                        onChange={(e) => setRegForm((prev) => ({ ...prev, email: e.target.value }))}
                        onBlur={() => {
                          handleTouch("email");
                          setErrors((prev) => ({ ...prev, email: validate.email(regForm.email) }));
                        }}
                        error={touched.email && !!errors.email}
                        helperText={touched.email && errors.email}
                        placeholder="you@strathmore.edu"
                        sx={fieldSx}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Email sx={{ color: TEXT_MUTED, fontSize: 20 }} />
                            </InputAdornment>
                          ),
                        }}
                      />

                      <TextField
                        select
                        fullWidth
                        label="Role"
                        value={regForm.role}
                        onChange={(e) => setRegForm((prev) => ({ ...prev, role: e.target.value }))}
                        sx={fieldSx}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Person sx={{ color: TEXT_MUTED, fontSize: 20 }} />
                            </InputAdornment>
                          ),
                        }}
                      >
                        <MenuItem value="student">Student</MenuItem>
                        <MenuItem value="staff">Staff</MenuItem>
                      </TextField>

                      <TextField
                        fullWidth
                        label="Password"
                        type={showPassword ? "text" : "password"}
                        value={regForm.password}
                        onChange={(e) => setRegForm((prev) => ({ ...prev, password: e.target.value }))}
                        onBlur={() => {
                          handleTouch("password");
                          setErrors((prev) => ({ ...prev, password: validate.password(regForm.password) }));
                        }}
                        error={touched.password && !!errors.password}
                        helperText={
                          touched.password && errors.password
                            ? errors.password
                            : "Min. 8 chars, uppercase, lowercase, number, special character (!@#$...)"
                        }
                        placeholder="Min. 8 characters"
                        sx={{ ...fieldSx, mb: 2 }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Lock sx={{ color: TEXT_MUTED, fontSize: 20 }} />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                                {showPassword ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />

                      {regForm.password && (
                        <Box sx={{ mb: 2 }}>
                          <Box sx={{ display: "flex", gap: 0.5, mb: 0.5 }}>
                            {[1, 2, 3, 4].map((i) => (
                              <Box
                                key={i}
                                sx={{
                                  flex: 1,
                                  height: 3,
                                  borderRadius: "2px",
                                  background: i <= passwordStrength ? strengthColors[passwordStrength] : BORDER,
                                  transition: "background 0.3s",
                                }}
                              />
                            ))}
                          </Box>
                          <Typography sx={{ fontSize: "0.7rem", color: strengthColors[passwordStrength] || TEXT_MUTED }}>
                            {strengthLabels[passwordStrength]} password
                          </Typography>
                        </Box>
                      )}

                      <TextField
                        fullWidth
                        label="Confirm Password"
                        type={showConfirmPassword ? "text" : "password"}
                        value={regForm.confirmPassword}
                        onChange={(e) => setRegForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                        onBlur={() => {
                          handleTouch("confirmPassword");
                          setErrors((prev) => ({
                            ...prev,
                            confirmPassword: validate.confirmPassword(regForm.confirmPassword, regForm.password),
                          }));
                        }}
                        error={touched.confirmPassword && !!errors.confirmPassword}
                        helperText={touched.confirmPassword && errors.confirmPassword}
                        placeholder="Re-enter password"
                        sx={fieldSx}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Lock sx={{ color: TEXT_MUTED, fontSize: 20 }} />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end">
                                {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />

                      <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        disabled={loading}
                        sx={{
                          background: NAVY,
                          color: "white",
                          py: 1,
                          borderRadius: "4px",
                          fontSize: "0.875rem",
                          fontWeight: 700,
                          textTransform: "none",
                          boxShadow: "none",
                          "&:hover": { background: NAVY_HOVER, boxShadow: "none" },
                          "&:disabled": { opacity: 0.7 },
                        }}
                      >
                        {loading ? <CircularProgress size={22} color="inherit" /> : "Create Account"}
                      </Button>

                      <Typography
                        sx={{
                          fontSize: "0.7rem",
                          color: TEXT_MUTED,
                          textAlign: "center",
                          mt: 2,
                        }}
                      >
                        By signing up, you agree to our Terms of Service and Privacy Policy.
                      </Typography>
                    </form>
                  )}
                </Box>
              )}
            </Box>
          </Paper>
        </Box>
      </Slide>
    </Modal>
  );
};

export default AuthModal;