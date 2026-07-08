import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState(
        location.state?.tab || "login"
    );
    const [btnText, setBtnText] = useState("Sign In");
    const [btnColor, setBtnColor] = useState("");

    const [message, setMessage] = useState("");
    const [messageColor, setMessageColor] = useState("");

    const [registerData, setRegisterData] = useState({
        name: "",
        email: "",
        phone: "",
        password: ""
    });

    const [loginData, setLoginData] = useState({
        email: "",
        password: ""
    });

    const handleRegisterChange = (e) => {
        setRegisterData({
            ...registerData,
            [e.target.name]: e.target.value
        });
    };

    const handleLoginChange = (e) => {
        setLoginData({
            ...loginData,
            [e.target.name]: e.target.value
        });
    };

    const handleRegister = async () => {
        try {
            const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/register`, registerData);

            setMessage(res.data.message);
            setMessageColor(res.data.success ? "green" : "red");

            if (res.data.success) {
                setTimeout(() => {
                    setRegisterData({
                        name: "",
                        email: "",
                        phone: "",
                        password: ""
                    });

                    setMessage("");
                    setActiveTab("login");
                }, 1500);

            } else {
                setTimeout(() => {
                    setMessage("");
                }, 2500);
            }

        } catch (err) {
            console.log(err);

            setMessage(err.response?.data?.message || "Registration failed");
            setMessageColor("red");

            setTimeout(() => {
                setMessage("");
            }, 2500);
        }
    };
    const handleLogin = async () => {

        setBtnText("Sign In");
        setBtnColor("");

        if (!loginData.email || !loginData.password) {

            setBtnText("Fill all fields");
            setBtnColor("#EF4444");

            setTimeout(() => {
                setBtnText("Sign In");
                setBtnColor("");
            }, 1500);

            return;
        }

        setBtnText("Checking...");
        setBtnColor("#d4af37");

        try {

            const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/login`, loginData);
            console.log(res.data);

            if (!res.data.success) {

                setBtnText("Invalid credentials");
                setBtnColor("#EF4444");

                setTimeout(() => {
                    setBtnText("Sign In");
                    setBtnColor("");
                }, 1500);

                return;
            }

            // ONLY NORMAL USER ALLOWED
            if (res.data.user.role !== "user") {

                localStorage.removeItem("jwello_user");

                setBtnText("Only user can login");
                setBtnColor("#EF4444");

                setTimeout(() => {
                    setBtnText("Sign In");
                    setBtnColor("");
                }, 1500);

                return;
            }

            // SUCCESS USER LOGIN

            localStorage.setItem("token", res.data.token);

            localStorage.setItem(
                "jwello_user",
                JSON.stringify({
                    id: res.data.user.id,
                    name: res.data.user.name,
                    email: res.data.user.email,
                    role: res.data.user.role
                })
            );

            setBtnText("Signing in...");
            setBtnColor("#10B981");

            setTimeout(() => {
                window.location.href = "/";
            }, 1000);

        } catch (err) {

            console.log(err);

            setBtnText("Server error");
            setBtnColor("#EF4444");

            setTimeout(() => {
                setBtnText("Sign In");
                setBtnColor("");
            }, 1500);
        }
    };
    return (
        <div>
            <header className="navbar scrolled">
                <div className="nav-logo">
                    <a href="/">✦ JWELLO</a>
                </div>

                <nav className="nav-menu">
                    <Link to="/shop" className="nav-link">Collections</Link>
                    <Link to="/about" className="nav-link">About</Link>
                </nav>
            </header>

            <div className="auth-page">

                <div className="auth-left">
                    <div className="auth-brand">
                        <div className="auth-brand-logo">✦ JWELLO</div>
                        <p>Welcome to the world of timeless jewellery...</p>
                        <div className="auth-gems">💍 ✨ 💎</div>
                    </div>
                </div>

                <div className="auth-right">
                    <div className="auth-box">

                        <div className="auth-tabs">
                            <button className={`auth-tab ${activeTab === "login" ? "active" : ""}`}
                                onClick={() => setActiveTab("login")}
                            >
                                Sign In
                            </button>

                            <button
                                className={`auth-tab ${activeTab === "register" ? "active" : ""}`}
                                onClick={() => setActiveTab("register")}
                            >
                                Create Account
                            </button>
                        </div>

                        <div className={`form-panel ${activeTab === "login" ? "active" : ""}`}>
                            <h2 className="auth-heading">Welcome <em>Back</em></h2>

                            <div className="auth-form-group">
                                <label>Email Address</label>
                                <input
                                    type="email"
                                    name="email"
                                    className="auth-input"
                                    value={loginData.email}
                                    onChange={handleLoginChange}
                                />
                            </div>

                            <div className="auth-form-group">
                                <label>Password</label>
                                <input
                                    type="password"
                                    name="password"
                                    className="auth-input"
                                    value={loginData.password}
                                    onChange={handleLoginChange}
                                />
                            </div>

                            <button
                                className="auth-submit"
                                onClick={handleLogin}
                                style={{ background: btnColor }}
                            >
                                {btnText}
                            </button>
                        </div>

                        <div className={`form-panel ${activeTab === "register" ? "active" : ""} `}>
                            <h2 className="auth-heading">Join <em>JWELLO</em></h2>

                            <div className="auth-form-group">
                                <label>Full Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    className="auth-input"
                                    value={registerData.name}
                                    onChange={handleRegisterChange}
                                />
                            </div>

                            <div className="auth-form-group">
                                <label>Email Address</label>
                                <input
                                    type="email"
                                    name="email"
                                    className="auth-input"
                                    value={registerData.email}
                                    onChange={handleRegisterChange}
                                />
                            </div>

                            <div className="auth-form-group">
                                <label>Phone Number</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    className="auth-input"
                                    value={registerData.phone}
                                    onChange={handleRegisterChange}
                                />
                            </div>

                            <div className="auth-form-group">
                                <label>Password</label>
                                <input
                                    type="password"
                                    name="password"
                                    className="auth-input"
                                    value={registerData.password}
                                    onChange={handleRegisterChange}
                                />

                                <div style={{ fontSize: "12px", marginTop: "8px", lineHeight: "1.4" }}>
                                    <p style={{ color: /[A-Z]/.test(registerData.password) ? "green" : "red" }}>1 uppercase letter</p>
                                    <p style={{ color: /[a-z]/.test(registerData.password) ? "green" : "red" }}>1 lowercase letter</p>
                                    <p style={{ color: /\d/.test(registerData.password) ? "green" : "red" }}>1 number</p>
                                    <p style={{ color: /[@$!%*?&]/.test(registerData.password) ? "green" : "red" }}>1 special character</p>
                                    <p style={{ color: registerData.password.length >= 8 && registerData.password.length <= 16 ? "green" : "red" }}>8-16 characters</p>
                                </div>
                            </div>

                            {message && (
                                <div
                                    style={{
                                        color: messageColor,
                                        background: messageColor === "green" ? "#ecfdf5" : "#fef2f2",
                                        border: `1px solid ${messageColor === "green" ? "#10B981" : "#EF4444"} `,
                                        padding: "10px",
                                        borderRadius: "8px",
                                        fontSize: "13px",
                                        marginBottom: "12px",
                                        fontWeight: "500"
                                    }}
                                >
                                    {message}
                                </div>
                            )}

                            <button
                                className="auth-submit"
                                onClick={handleRegister}
                            >
                                Create Account
                            </button>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
}

export default Login;