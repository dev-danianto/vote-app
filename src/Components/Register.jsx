import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "YOUR URL KEY";
const supabaseKey = "YOUR API KEY";
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize Supabase client with debug mode
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    debug: true, // Enable debug mode for authentication
    autoRefreshToken: true,
    persistSession: true,
  },
});

// Optional: Create a helper function to log errors in a structured way
const logError = (context, error) => {
  console.error(`[${context}] Error:`, error);
  if (error.message) console.error(`Message: ${error.message}`);
  if (error.details) console.error(`Details: ${error.details}`);
  if (error.hint) console.error(`Hint: ${error.hint}`);
  if (error.code) console.error(`Code: ${error.code}`);
};

const Register = ({ isModal = false, onClose, language = "id" }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    agreeToTerms: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [formErrors, setFormErrors] = useState({});
  const [formTouched, setFormTouched] = useState({});
  const [debugInfo, setDebugInfo] = useState(null);

  // Translations based on language
  const translations = {
    id: {
      title: "Daftar Akun",
      subtitle: "Buat akun untuk mengakses layanan KPU",
      fullName: "Nama Lengkap",
      fullNamePlaceholder: "Masukkan nama lengkap",
      email: "Email",
      emailPlaceholder: "Masukkan email",
      password: "Password",
      passwordPlaceholder: "Masukkan password",
      confirmPassword: "Konfirmasi Password",
      confirmPasswordPlaceholder: "Konfirmasi password",
      passwordRequirements:
        "Password harus min. 8 karakter, huruf besar, angka, dan simbol",
      terms: "Saya menyetujui syarat dan ketentuan yang berlaku",
      alreadyHaveAccount: "Sudah punya akun?",
      signIn: "Masuk",
      registerButton: "Daftar",
      processing: "Memproses...",
      orRegisterWith: "Atau daftar dengan",
      passwordMismatch: "Password tidak cocok",
      passwordTooShort: "Password harus minimal 8 karakter",
      mustAgreeToTerms: "Anda harus menyetujui syarat dan ketentuan",
      emailAlreadyRegistered: "Email sudah terdaftar. Silakan login.",
      registrationSuccess:
        "Pendaftaran berhasil! Silakan periksa email Anda untuk verifikasi.",
      validationRequired: "Wajib diisi",
      validationEmail: "Format email tidak valid",
      debugInfo: "Informasi Debug",
    },
    en: {
      title: "Create Account",
      subtitle: "Create an account to access KPU services",
      fullName: "Full Name",
      fullNamePlaceholder: "Enter your full name",
      email: "Email",
      emailPlaceholder: "Enter your email",
      password: "Password",
      passwordPlaceholder: "Enter your password",
      confirmPassword: "Confirm Password",
      confirmPasswordPlaceholder: "Confirm your password",
      passwordRequirements:
        "Password must have min. 8 characters, uppercase, numbers, and symbols",
      terms: "I agree to the terms and conditions",
      alreadyHaveAccount: "Already have an account?",
      signIn: "Sign in",
      registerButton: "Register",
      processing: "Processing...",
      orRegisterWith: "Or register with",
      passwordMismatch: "Passwords do not match",
      passwordTooShort: "Password must be at least 8 characters",
      mustAgreeToTerms: "You must agree to the terms and conditions",
      emailAlreadyRegistered: "Email already registered. Please login.",
      registrationSuccess:
        "Registration successful! Please check your email for verification.",
      validationRequired: "This field is required",
      validationEmail: "Please enter a valid email address",
      debugInfo: "Debug Information",
    },
  };

  // Get translations based on language prop
  const t = translations[language] || translations.en;

  // Password strength checker
  useEffect(() => {
    if (!formData.password) {
      setPasswordStrength(0);
      return;
    }

    let strength = 0;
    if (formData.password.length >= 8) strength += 1;
    if (/[A-Z]/.test(formData.password)) strength += 1;
    if (/[0-9]/.test(formData.password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(formData.password)) strength += 1;

    setPasswordStrength(strength);
  }, [formData.password]);

  // Form validation
  const validateForm = useCallback(() => {
    const newErrors = {};

    if (formTouched.fullName && !formData.fullName) {
      newErrors.fullName = t.validationRequired;
    }

    if (formTouched.email) {
      if (!formData.email) {
        newErrors.email = t.validationRequired;
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = t.validationEmail;
      }
    }

    if (formTouched.password) {
      if (!formData.password) {
        newErrors.password = t.validationRequired;
      } else if (formData.password.length < 8) {
        newErrors.password = t.passwordTooShort;
      }
    }

    if (formTouched.confirmPassword) {
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = t.validationRequired;
      } else if (formData.confirmPassword !== formData.password) {
        newErrors.confirmPassword = t.passwordMismatch;
      }
    }

    return newErrors;
  }, [formData, formTouched, t]);

  useEffect(() => {
    setFormErrors(validateForm());
  }, [formData, formTouched, validateForm]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
    setFormTouched({
      ...formTouched,
      [name]: true,
    });
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setFormTouched({
      ...formTouched,
      [name]: true,
    });
  };

  const isFormValid = useCallback(() => {
    const requiredFields = ["email", "password", "confirmPassword", "fullName"];
    const allFieldsFilled = requiredFields.every((field) => formData[field]);
    const noErrors = Object.keys(formErrors).length === 0;
    const termsAccepted = formData.agreeToTerms;

    return allFieldsFilled && noErrors && termsAccepted;
  }, [formData, formErrors]);

  // Troubleshoot user session
  const checkCurrentSession = async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error("Error checking session:", error);
    } else {
      console.log("Current session:", data);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Reset previous states
    setError(null);
    setSuccessMessage(null);
    setDebugInfo(null);

    // Mark all fields as touched to trigger validation errors if any
    const allTouched = {};
    Object.keys(formData).forEach((key) => {
      allTouched[key] = true;
    });
    setFormTouched(allTouched);

    // Re-validate form
    const errors = validateForm();
    setFormErrors(errors);

    if (Object.keys(errors).length > 0 || !formData.agreeToTerms) {
      return;
    }

    setLoading(true);

    // Optional: Check current session before registering
    await checkCurrentSession();

    try {
      console.log("Starting registration process...");
      console.log("Form data:", {
        email: formData.email,
        fullName: formData.fullName,
        // Don't log passwords
      });

      // Create the sign-up payload with additional metadata
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            registered_at: new Date().toISOString(),
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        // Log detailed error information
        logError("SignUp", error);

        // Set appropriate error message
        if (error.message.includes("already registered")) {
          throw new Error(t.emailAlreadyRegistered);
        }
        throw error;
      }

      console.log("Registration response:", data);

      // Capture debug info for troubleshooting
      setDebugInfo({
        userId: data?.user?.id || "Unknown",
        email: data?.user?.email || "Unknown",
        emailConfirmed: data?.user?.email_confirmed_at ? "Yes" : "No",
        identities: data?.user?.identities || [],
        timestamp: new Date().toISOString(),
      });

      if (data?.user?.id) {
        setSuccessMessage(t.registrationSuccess);
        console.log("Registration successful", { userId: data.user.id });

        // Optionally try to immediately insert profile data as backup
        try {
          const { error: profileError } = await supabase
            .from("profiles")
            .upsert({
              id: data.user.id,
              full_name: formData.fullName,
              created_at: new Date(),
              updated_at: new Date(),
            });

          if (profileError) {
            console.log(
              "Profile upsert fallback error (non-critical):",
              profileError
            );
          } else {
            console.log("Profile upsert fallback successful");
          }
        } catch (profileError) {
          console.log(
            "Profile upsert attempt failed (non-critical):",
            profileError
          );
        }

        setTimeout(() => {
          navigate("/login");
          if (isModal && onClose) onClose();
        }, 3000);
      } else {
        throw new Error("Registration failed with no error message");
      }
    } catch (error) {
      logError("RegistrationProcess", error);
      setError(error.message);

      // Set detailed debug info
      setDebugInfo({
        error: error.message,
        timestamp: new Date().toISOString(),
        errorCode: error.code || "unknown",
        errorDetails: error.details || "none",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider) => {
    try {
      setLoading(true);
      setError(null);
      console.log(`Starting ${provider} login...`);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            // Add Google-specific parameters for additional permissions
            ...(provider === "google"
              ? {
                  access_type: "offline",
                  prompt: "consent",
                }
              : {}),
          },
        },
      });

      if (error) {
        logError(`${provider}Login`, error);
        throw error;
      }

      console.log(`${provider} login response:`, data);
    } catch (error) {
      console.error(`${provider} login error:`, error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderField = (name, label, type, placeholder, autoComplete = "") => (
    <div className="mb-4">
      <label
        htmlFor={name}
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        autoComplete={autoComplete}
        required
        value={formData[name]}
        onChange={handleChange}
        onBlur={handleBlur}
        className={`w-full px-4 py-3 rounded-lg border ${
          formErrors[name]
            ? "border-red-300 ring-1 ring-red-500"
            : "border-gray-300"
        } shadow-sm transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
        placeholder={placeholder}
        aria-invalid={formErrors[name] ? "true" : "false"}
        aria-describedby={formErrors[name] ? `${name}-error` : ""}
      />
      {formErrors[name] && (
        <p className="mt-1 text-sm text-red-600" id={`${name}-error`}>
          {formErrors[name]}
        </p>
      )}
    </div>
  );

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 ${
        isModal ? "p-6" : ""
      }`}
    >
      {isModal && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 w-8 h-8 flex items-center justify-center rounded-full bg-white shadow-md transition-all duration-200 hover:bg-gray-100"
          aria-label="Close"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl rounded-xl sm:rounded-xl">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
              {t.title}
            </h2>
            <p className="text-gray-600">{t.subtitle}</p>
          </div>

          {error && (
            <div
              className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-md"
              role="alert"
            >
              <div className="flex items-center">
                <svg
                  className="h-5 w-5 text-red-500 mr-2"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
          )}

          {successMessage && (
            <div
              className="bg-green-50 border-l-4 border-green-500 p-4 mb-6 rounded-md"
              role="alert"
            >
              <div className="flex items-center">
                <svg
                  className="h-5 w-5 text-green-500 mr-2"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-sm text-green-600">{successMessage}</p>
              </div>
            </div>
          )}

          {/* Debug Information Panel - only shown when debug info is available */}
          {debugInfo && (
            <div className="border border-gray-300 p-4 mb-6 rounded-md bg-gray-50">
              <details>
                <summary className="text-sm font-medium text-gray-700 cursor-pointer">
                  {t.debugInfo}
                </summary>
                <pre className="mt-2 text-xs overflow-auto max-h-40 p-2 bg-gray-100 rounded">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </details>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {renderField("fullName", t.fullName, "text", t.fullNamePlaceholder)}
            {renderField(
              "email",
              t.email,
              "email",
              t.emailPlaceholder,
              "email"
            )}
            {renderField(
              "password",
              t.password,
              "password",
              t.passwordPlaceholder,
              "new-password"
            )}

            {formData.password && (
              <div className="mb-4">
                <div className="flex items-center mb-1">
                  {[...Array(4)].map((_, index) => (
                    <div
                      key={index}
                      className={`h-2 w-full mr-1 rounded-full transition-all duration-300 ${
                        index < passwordStrength
                          ? passwordStrength === 1
                            ? "bg-red-500"
                            : passwordStrength === 2
                            ? "bg-yellow-500"
                            : passwordStrength === 3
                            ? "bg-blue-500"
                            : "bg-green-500"
                          : "bg-gray-200"
                      }`}
                    ></div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {t.passwordRequirements}
                </p>
              </div>
            )}

            {renderField(
              "confirmPassword",
              t.confirmPassword,
              "password",
              t.confirmPasswordPlaceholder,
              "new-password"
            )}

            <div className="flex items-center mb-4">
              <input
                id="agreeToTerms"
                name="agreeToTerms"
                type="checkbox"
                checked={formData.agreeToTerms}
                onChange={handleChange}
                onBlur={handleBlur}
                className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition duration-150"
              />
              <label
                htmlFor="agreeToTerms"
                className={`ml-3 block text-sm ${
                  !formData.agreeToTerms && formTouched.agreeToTerms
                    ? "text-red-600"
                    : "text-gray-700"
                }`}
              >
                {language === "id" ? (
                  <>
                    Saya menyetujui{" "}
                    <Link
                      to="/terms"
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      syarat dan ketentuan
                    </Link>{" "}
                    yang berlaku
                  </>
                ) : (
                  <>
                    I agree to the{" "}
                    <Link
                      to="/terms"
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      terms and conditions
                    </Link>
                  </>
                )}
              </label>
            </div>
            {!formData.agreeToTerms && formTouched.agreeToTerms && (
              <p className="mt-1 text-sm text-red-600 mb-4">
                {t.mustAgreeToTerms}
              </p>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition duration-200 transform hover:-translate-y-1"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    {t.processing}
                  </span>
                ) : (
                  <span>{t.registerButton}</span>
                )}
              </button>
            </div>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">
                  {t.orRegisterWith}
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                className="w-full inline-flex justify-center items-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-200"
                onClick={() => handleSocialLogin("google")}
                disabled={loading}
                aria-label="Sign up with Google"
              >
                <svg
                  className="h-5 w-5 mr-2"
                  viewBox="0 0 24 24"
                  width="24"
                  height="24"
                  aria-hidden="true"
                >
                  <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                    <path
                      fill="#4285F4"
                      d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"
                    />
                    <path
                      fill="#34A853"
                      d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"
                    />
                    <path
                      fill="#EA4335"
                      d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"
                    />
                  </g>
                </svg>
                <span>Google</span>
              </button>

              <button
                type="button"
                className="w-full inline-flex justify-center items-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-200"
                onClick={() => handleSocialLogin("facebook")}
                disabled={loading}
                aria-label="Sign up with Facebook"
              >
                <svg
                  className="h-5 w-5 mr-2"
                  fill="#1877F2"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M9.19795 21.5H13.198V13.4901H16.8021L17.198 9.50977H13.198V7.5C13.198 6.94772 13.6457 6.5 14.198 6.5H17.198V2.5H14.198C11.4365 2.5 9.19795 4.73858 9.19795 7.5V9.50977H7.19795L6.80206 13.4901H9.19795V21.5Z" />
                </svg>
                <span>Facebook</span>
              </button>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-base text-gray-600">
              {t.alreadyHaveAccount}{" "}
              <Link
                to="/login"
                className="font-medium text-blue-600 hover:text-blue-800 transition duration-150"
              >
                {t.signIn}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
