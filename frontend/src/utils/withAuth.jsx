import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// CRITICAL FIX: Define the URL string outside of the function scope to ensure no extra characters slip in.
const BACKEND_VALIDATE_URL = 'https://videoconfirence.onrender.com/api/v1/users/validate-token';

const withAuth = (Component) => {
    return (props) => {
        const navigate = useNavigate();
        const [loading, setLoading] = useState(true);

        useEffect(() => {
            const checkAuth = async () => {
                const token = localStorage.getItem('token');
                
                if (!token) {
                    navigate('/auth');
                    return;
                }

                try {
                    // Use the clean, externalized URL variable
                    await axios.get(BACKEND_VALIDATE_URL, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    setLoading(false);

                } catch (error) {
                    console.error("Authentication failed:", error);

                    if (error.response && error.response.status === 400) {
                        localStorage.removeItem('token');
                        navigate('/auth');
                    } else {
                        navigate('/auth');
                    }
                }
            };

            checkAuth();
        }, [navigate]);

        if (loading) {
            return <div>Loading...</div>;
        }

        return <Component {...props} />;\
    };
};

export default withAuth;
