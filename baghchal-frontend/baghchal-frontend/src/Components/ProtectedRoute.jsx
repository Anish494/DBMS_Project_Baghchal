// src/components/ProtectedRoute.jsx

import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem("access_token");
    const user = localStorage.getItem("user");

    // if either is missing, redirect to login immediately
    // the page never renders at all
    if (!token || !user) {
        return <Navigate to="/login" replace />;
    }

    // everything is fine — render the actual page
    return children;
};

export default ProtectedRoute;