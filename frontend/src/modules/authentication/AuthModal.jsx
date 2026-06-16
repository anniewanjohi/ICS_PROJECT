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
  Grid,
  Tab,
  Tabs,
  Divider,
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

// Custom fade component using MUI's Slide
const FadeTransition = React.forwardRef(function FadeTransition(props, ref) {
  const { in: inProp, children, ...other } = props;
  return (
    <Slide direction="up" in={inProp} ref={ref} {...other}>
      {children}
    </Slide>
  );
});

const validate = {
  email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? "" : "Enter a valid email address",
  password: (v) => v.length >= 8 ? "" : "Password must be at least 8 characters",
  confirmPassword: (v, pw) => v === pw ? "" : "Passwords do not match",
  fullname: (v) => v.trim().length >= 2 ? "" : "Full name is required",
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
          if (onLoginSuccess) {
            onLoginSuccess(result.data.user);
          }
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
        setError(result.message || "Registration failed. Please try again.");
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
  const strengthColors = ["", "#f44336", "#ff9800", "#4caf50", "#4caf50"];

  const demoCredentials = {
    student: { email: "student@strathmore.edu", password: "Student@123" },
    staff: { email: "staff@strathmore.edu", password: "Staff@123" },
    admin: { email: "admin@strathmore.edu", password: "Admin@123" },
  };

  const fillDemoCredentials = (type) => {
    setLoginForm({
      email: demoCredentials[type].email,
      password: demoCredentials[type].password,
      remember: false,
    });
  };

  return (
   <Modal
  open={open}
  onClose={onClose}
  closeAfterTransition
  slots={{ backdrop: Backdrop }}
  slotProps={{
    backdrop: {
      timeout: 500,
      sx: {
        backdropFilter: "blur(8px)",
        backgroundColor: "rgba(0, 0, 0, 0.7)",
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
        width: { xs: "95%", sm: 450, md: 500 },
        maxHeight: "90vh",
        overflow: "auto",
        outline: "none",
      }}
    >
          <Paper
            elevation={24}
            sx={{
              background: "var(--bg-paper)",
              borderRadius: "var(--radius-2xl)",
              overflow: "hidden",
              border: "1px solid var(--border-color)",
              position: "relative",
            }}
          >
            <IconButton
              onClick={onClose}
              sx={{
                position: "absolute",
                top: 12,
                right: 12,
                zIndex: 1,
                color: "var(--text-secondary)",
                "&:hover": {
                  background: "var(--hover-bg)",
                  color: "var(--text-primary)",
                },
              }}
            >
              <Close />
            </IconButton>

            <Box sx={{ textAlign: "center", pt: 4, pb: 2, px: 3 }}>
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: "var(--radius-lg)",
                  background: "var(--primary-gradient)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mb: 2,
                }}
              >
                <Typography sx={{ fontSize: 28 }}>📚</Typography>
              </Box>
              <Typography
                sx={{
                  fontFamily: '"Fraunces", serif',
                  fontWeight: 800,
                  fontSize: "1.5rem",
                  color: "var(--text-primary)",
                  letterSpacing: "-0.02em",
                }}
              >
                Strathmore Directory
              </Typography>
              <Typography
                sx={{
                  fontSize: "0.75rem",
                  color: "var(--text-secondary)",
                  mt: 0.5,
                }}
              >
                Sign in to access the directory
              </Typography>
            </Box>

            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              variant="fullWidth"
              sx={{
                borderBottom: "1px solid var(--border-color)",
                "& .MuiTab-root": {
                  py: 1.5,
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  textTransform: "none",
                  color: "var(--text-secondary)",
                  "&.Mui-selected": {
                    color: "var(--primary-main)",
                  },
                },
                "& .MuiTabs-indicator": {
                  backgroundColor: "var(--primary-main)",
                  height: 3,
                },
              }}
            >
              <Tab label="Sign In" />
              <Tab label="Register" />
            </Tabs>

            <Box sx={{ p: { xs: 2.5, sm: 3.5 } }}>
              {error && (
                <Alert
                  severity="error"
                  sx={{
                    mb: 3,
                    borderRadius: "var(--radius-md)",
                  }}
                  onClose={() => setError("")}
                >
                  {error}
                </Alert>
              )}

              {success ? (
                <Box sx={{ textAlign: "center", py: 4 }}>
                  <Box
                    sx={{
                      width: 64,
                      height: 64,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #4CAF50, #45A049)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      mx: "auto",
                      mb: 2,
                    }}
                  >
                    <CheckCircle sx={{ fontSize: 36, color: "white" }} />
                  </Box>
                  <Typography
                    sx={{
                      fontSize: "1.1rem",
                      fontWeight: 700,
                      color: "var(--text-primary)",
                      mb: 1,
                    }}
                  >
                    {tabValue === 0 ? "Welcome Back!" : "Account Created!"}
                  </Typography>
                  <Typography sx={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                    {success}
                  </Typography>
                  {tabValue === 1 && (
                    <Button
                      variant="contained"
                      onClick={() => setTabValue(0)}
                      sx={{
                        mt: 3,
                        background: "var(--primary-gradient)",
                        color: "white",
                        "&:hover": { background: "var(--primary-gradient-hover)" },
                        borderRadius: "var(--radius-md)",
                        px: 3,
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
                        sx={{
                          mb: 3,
                          "& .MuiOutlinedInput-root": {
                            borderRadius: "var(--radius-md)",
                          },
                        }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Email sx={{ color: "var(--text-secondary)", fontSize: 20 }} />
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
                        sx={{
                          mb: 2,
                          "& .MuiOutlinedInput-root": {
                            borderRadius: "var(--radius-md)",
                          },
                        }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Lock sx={{ color: "var(--text-secondary)", fontSize: 20 }} />
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
                          mb: 3,
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
                                color: "var(--primary-main)",
                                "&.Mui-checked": { color: "var(--primary-main)" },
                              }}
                            />
                          }
                          label={
                            <Typography sx={{ fontSize: "0.813rem", color: "var(--text-secondary)" }}>
                              Remember me
                            </Typography>
                          }
                        />
                        <Button
                          onClick={handleForgotPassword}
                          sx={{
                            fontSize: "0.813rem",
                            color: "var(--primary-main)",
                            textTransform: "none",
                            fontWeight: 500,
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
                          background: "var(--primary-gradient)",
                          color: "white",
                          py: 1.5,
                          borderRadius: "var(--radius-md)",
                          fontSize: "0.9375rem",
                          fontWeight: 600,
                          "&:hover": { background: "var(--primary-gradient-hover)" },
                          "&:disabled": { opacity: 0.7 },
                        }}
                      >
                        {loading ? <CircularProgress size={24} color="inherit" /> : "Sign In"}
                      </Button>

                      <Divider sx={{ my: 3 }}>
                        <Typography sx={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                          Demo Credentials
                        </Typography>
                      </Divider>

                      <Box
                        sx={{
                          display: "flex",
                          gap: 2,
                          flexDirection: { xs: "column", sm: "row" },
                          mb: 2,
                        }}
                      >
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => fillDemoCredentials("student")}
                          sx={{
                            flex: 1,
                            borderColor: "var(--border-color)",
                            color: "var(--text-primary)",
                            "&:hover": { borderColor: "var(--gold)" },
                          }}
                        >
                          Student Demo
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => fillDemoCredentials("staff")}
                          sx={{
                            flex: 1,
                            borderColor: "var(--border-color)",
                            color: "var(--text-primary)",
                            "&:hover": { borderColor: "var(--gold)" },
                          }}
                        >
                          Staff Demo
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => fillDemoCredentials("admin")}
                          sx={{
                            flex: 1,
                            borderColor: "var(--border-color)",
                            color: "var(--text-primary)",
                            "&:hover": { borderColor: "var(--gold)" },
                          }}
                        >
                          Admin Demo
                        </Button>
                      </Box>
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
                        sx={{
                          mb: 3,
                          "& .MuiOutlinedInput-root": {
                            borderRadius: "var(--radius-md)",
                          },
                        }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Person sx={{ color: "var(--text-secondary)", fontSize: 20 }} />
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
                        sx={{
                          mb: 3,
                          "& .MuiOutlinedInput-root": {
                            borderRadius: "var(--radius-md)",
                          },
                        }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Email sx={{ color: "var(--text-secondary)", fontSize: 20 }} />
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
                        sx={{
                          mb: 3,
                          "& .MuiOutlinedInput-root": {
                            borderRadius: "var(--radius-md)",
                          },
                        }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Person sx={{ color: "var(--text-secondary)", fontSize: 20 }} />
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
                        helperText={touched.password && errors.password}
                        placeholder="Min. 8 characters"
                        sx={{
                          mb: 2,
                          "& .MuiOutlinedInput-root": {
                            borderRadius: "var(--radius-md)",
                          },
                        }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Lock sx={{ color: "var(--text-secondary)", fontSize: 20 }} />
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
                                  background: i <= passwordStrength ? strengthColors[passwordStrength] : "var(--border-color)",
                                  transition: "background 0.3s",
                                }}
                              />
                            ))}
                          </Box>
                          <Typography sx={{ fontSize: "0.7rem", color: strengthColors[passwordStrength] || "var(--text-secondary)" }}>
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
                        sx={{
                          mb: 3,
                          "& .MuiOutlinedInput-root": {
                            borderRadius: "var(--radius-md)",
                          },
                        }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Lock sx={{ color: "var(--text-secondary)", fontSize: 20 }} />
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
                          background: "var(--primary-gradient)",
                          color: "white",
                          py: 1.5,
                          borderRadius: "var(--radius-md)",
                          fontSize: "0.9375rem",
                          fontWeight: 600,
                          "&:hover": { background: "var(--primary-gradient-hover)" },
                          "&:disabled": { opacity: 0.7 },
                        }}
                      >
                        {loading ? <CircularProgress size={24} color="inherit" /> : "Create Account"}
                      </Button>

                      <Typography
                        sx={{
                          fontSize: "0.7rem",
                          color: "var(--text-secondary)",
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