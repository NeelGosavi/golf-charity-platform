import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import axios from 'axios';

// Load Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// Checkout Form Component
// Checkout Form Component
const CheckoutForm = ({ plan, onSuccess, onError }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [loading, setLoading] = useState(false);
    const [postalCode, setPostalCode] = useState('');
    const { user } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!stripe || !elements) {
            return;
        }

        // Validate 6-digit PIN code
        if (!/^\d{6}$/.test(postalCode)) {
            onError('Please enter a valid 6-digit PIN code');
            return;
        }

        setLoading(true);
        
        try {
            // Create subscription on backend
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/subscriptions/create`, {
                planType: plan.id
            });
            
            const { clientSecret } = response.data;
            
            // Get card element
            const cardElement = elements.getElement(CardElement);
            
            // Confirm payment with card details including custom postal code
            const { error: stripeError } = await stripe.confirmCardPayment(clientSecret, {
                payment_method: {
                    card: cardElement,
                    billing_details: {
                        name: user.full_name,
                        email: user.email,
                        address: {
                            postal_code: postalCode
                        }
                    }
                }
            });
            
            if (stripeError) {
                onError(stripeError.message);
            } else {
                onSuccess();
            }
        } catch (error) {
            onError(error.response?.data?.error || 'Subscription failed');
        } finally {
            setLoading(false);
        }
    };

    const cardElementOptions = {
        style: {
            base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                    color: '#aab7c4',
                },
            },
            invalid: {
                color: '#9e2146',
            },
        },
        hidePostalCode: true, // Hide Stripe's default postal code field
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-gray-700 font-medium mb-2">
                    Card Details
                </label>
                <div className="border border-gray-300 rounded-lg p-4">
                    <CardElement options={cardElementOptions} />
                </div>
            </div>
            
            {/* Custom Postal Code Field for 6-digit Indian PIN */}
            <div>
                <label className="block text-gray-700 font-medium mb-2">
                    PIN Code (6 digits)
                </label>
                <input
                    type="text"
                    value={postalCode}
                    onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setPostalCode(value);
                    }}
                    placeholder="400001"
                    maxLength="6"
                    pattern="[0-9]{6}"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <p className="text-sm text-gray-500 mt-1">Enter 6-digit Indian PIN code (e.g., 400001)</p>
            </div>
            
            <button
                type="submit"
                disabled={!stripe || loading}
                className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
            >
                {loading ? 'Processing...' : `Pay ${plan.price_display}`}
            </button>
        </form>
    );
};

// Main Subscription Component
const Subscription = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [plans, setPlans] = useState([]);
    const [subscription, setSubscription] = useState(null);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchPlans();
        fetchSubscription();
    }, []);

    const fetchPlans = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/subscriptions/plans`);
            setPlans(response.data.plans);
        } catch (error) {
            console.error('Error fetching plans:', error);
        }
    };

    const fetchSubscription = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/subscriptions`);
            setSubscription(response.data);
        } catch (error) {
            console.error('Error fetching subscription:', error);
        }
    };

    const handleSubscribe = (plan) => {
        setSelectedPlan(plan);
        setError('');
        setSuccess('');
    };

    const handleSuccess = () => {
        setSuccess('Subscription successful! Welcome to Golf Charity Hub! 🎉');
        setSelectedPlan(null);
        fetchSubscription();
        setTimeout(() => {
            navigate('/dashboard');
        }, 2000);
    };

    const handleError = (message) => {
        setError(message);
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Navigation */}
            <nav className="bg-white shadow-lg">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <Link to="/" className="text-xl font-bold text-gray-800">⛳ Golf Charity Hub</Link>
                    <div className="flex gap-4 items-center">
                        <span className="text-gray-600">Welcome, {user?.full_name}</span>
                        <Link to="/dashboard" className="text-gray-600 hover:text-green-600">Dashboard</Link>
                        <button onClick={handleLogout} className="text-red-600 hover:text-red-700">Logout</button>
                    </div>
                </div>
            </nav>

            <div className="container mx-auto px-4 py-12">
                <h1 className="text-3xl font-bold mb-8 text-center">Choose Your Plan</h1>
                
                {error && (
                    <div className="max-w-4xl mx-auto mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                        ❌ {error}
                    </div>
                )}
                
                {success && (
                    <div className="max-w-4xl mx-auto mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                        ✅ {success}
                    </div>
                )}
                
                {!selectedPlan ? (
                    <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        {plans.map(plan => (
                            <div key={plan.id} className="bg-white rounded-lg shadow-lg overflow-hidden transform hover:scale-105 transition duration-300">
                                <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 text-center">
                                    <h2 className="text-2xl font-bold">{plan.name}</h2>
                                    <p className="text-4xl font-bold mt-4">{plan.price_display}</p>
                                    <p className="text-sm mt-2">per {plan.interval}</p>
                                    {plan.savings && (
                                        <span className="inline-block bg-yellow-400 text-gray-800 text-sm px-2 py-1 rounded mt-2">
                                            {plan.savings}
                                        </span>
                                    )}
                                </div>
                                
                                <div className="p-6">
                                    <ul className="space-y-3 mb-6">
                                        {plan.features.map((feature, idx) => (
                                            <li key={idx} className="flex items-center">
                                                <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                                </svg>
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>
                                    
                                    <button
                                        onClick={() => handleSubscribe(plan)}
                                        className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition"
                                    >
                                        Subscribe {plan.price_display}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="max-w-md mx-auto">
                        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 text-center">
                                <h2 className="text-2xl font-bold">{selectedPlan.name}</h2>
                                <p className="text-3xl font-bold mt-2">{selectedPlan.price_display}</p>
                                <p className="text-sm">per {selectedPlan.interval}</p>
                            </div>
                            
                            <div className="p-6">
                                <Elements stripe={stripePromise}>
                                    <CheckoutForm 
                                        plan={selectedPlan}
                                        onSuccess={handleSuccess}
                                        onError={handleError}
                                    />
                                </Elements>
                                
                                <button
                                    onClick={() => setSelectedPlan(null)}
                                    className="w-full mt-4 text-gray-600 hover:text-gray-800 text-sm"
                                >
                                    ← Back to plans
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                
                {subscription && subscription.status === 'active' && (
                    <div className="mt-8 bg-white rounded-lg shadow p-6 max-w-2xl mx-auto">
                        <h2 className="text-xl font-bold mb-4">Current Subscription</h2>
                        <div className="space-y-2">
                            <p><strong>Plan:</strong> {subscription.plan_type}</p>
                            <p><strong>Status:</strong> 
                                <span className="ml-2 px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                                    {subscription.status}
                                </span>
                            </p>
                            <p><strong>Renewal Date:</strong> {new Date(subscription.current_period_end).toLocaleDateString()}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Subscription;