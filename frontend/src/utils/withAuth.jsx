import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

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
                    // FINAL FIX: Using a structure that is more likely to resolve in Render's DNS system.
                    await axios.get('https://videoconfirence-backend-mokshith.onrender.com/api/v1/users/validate-token', {
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