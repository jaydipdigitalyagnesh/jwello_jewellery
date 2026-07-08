import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'


function Header() {
    const [showProfileMenu, setShowProfileMenu] = useState(false);

    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [cartCount, setCartCount] = useState(0);
    const location = useLocation();
    const navigate = useNavigate();

    const user = JSON.parse(localStorage.getItem("jwello_user"));

    const handleLogout = () => {
        localStorage.removeItem("jwello_user");
        setShowProfileMenu(false);
        setShowMobileMenu(false);
        navigate("/login");
    };
    const handleCartClick = (e) => {
        const currentUser = JSON.parse(localStorage.getItem("jwello_user"));

        if (!currentUser) {
            e.preventDefault();
            alert("Login required");
            navigate("/login", { replace: true });
            return;
        }
    };

    /* Cart Count */
    useEffect(() => {

        const updateCart = () => {

            const currentUser =
                JSON.parse(
                    localStorage.getItem("jwello_user")
                );

            if (currentUser) {

                const cartKey =
                    `jwello_cart_${currentUser.email}`;

                const cart =
                    JSON.parse(
                        localStorage.getItem(cartKey)
                    ) || [];

                setCartCount(cart.length);

            } else {

                setCartCount(0);

            }

        };

        updateCart();

        window.addEventListener(
            "cartUpdated",
            updateCart
        );

        return () => {

            window.removeEventListener(
                "cartUpdated",
                updateCart
            );

        };

    }, []);




    /* Header Scroll Effect */
    useEffect(() => {

        const navbar = document.getElementById("navbar");

        const handleScroll = () => {

            if (window.scrollY > 50) {

                navbar.classList.add("scrolled");

            } else {

                navbar.classList.remove("scrolled");

            }

        };

        window.addEventListener(
            "scroll",
            handleScroll
        );

        return () => {

            window.removeEventListener(
                "scroll",
                handleScroll
            );

        };

    }, []);

    return (
        <header className="navbar" id="navbar">

            <div className="nav-logo">
                <Link to="/">✦ JWELLO</Link>
            </div>

            <button className={`hamburger ${showMobileMenu ? "open" : ""}`}
                aria-label="Menu" onClick={() => setShowMobileMenu(!showMobileMenu)}>
                <span></span>
                <span></span>
                <span></span>
            </button>
            <nav className={`nav-menu ${showMobileMenu ? "active" : ""}`}>
                <Link to="/shop" className="nav-link" onClick={() => setShowMobileMenu(false)}>Collections</Link>
                <Link to="/shop?cat=rings" className="nav-link" onClick={() => setShowMobileMenu(false)}>Rings</Link>
                <Link to="/shop?cat=necklaces" className="nav-link" onClick={() => setShowMobileMenu(false)}>Necklaces</Link>
                <Link to="/shop?cat=earrings" className="nav-link" onClick={() => setShowMobileMenu(false)}>Earrings</Link>
                <Link to="/about" className="nav-link" onClick={() => setShowMobileMenu(false)}>About</Link>
            </nav>

            <div className="nav-icons">

                {user ? (
                    <div className="user-menu">

                        <button className="icon-btn" onClick={() => setShowProfileMenu(!showProfileMenu)}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <circle cx="12" cy="7" r="4" />
                                <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
                            </svg>
                        </button>

                        {showProfileMenu && (
                            <div className="dropdown-menu">
                                <Link to="/profile" onClick={() => setShowProfileMenu(false)}> Profile</Link>
                                <button onClick={handleLogout}>Logout</button>
                            </div>)}
                    </div>) : (
                    <Link to="/login" className="icon-btn" title="Account">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <circle cx="12" cy="7" r="4" />
                            <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
                        </svg>
                    </Link>)}
                <Link to="/wishlist" className="icon-btn" title="Wishlist" onClick={handleCartClick}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                </Link>

                <Link to="/cart" className="icon-btn cart-icon" title="Cart" onClick={handleCartClick}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                        <line x1="3" y1="6" x2="21" y2="6" />
                        <path d="M16 10a4 4 0 0 1-8 0" />
                    </svg>

                    <span className="cart-badge">{cartCount}</span>
                </Link>

            </div>

        </header>
    )

}

export default Header
