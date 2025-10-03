import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const RazorpayPayment = ({ noteId, noteTitle, price, onSuccess, onClose }) => {
  const { API_BASE } = useAuth();
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('pending');

  useEffect(() => {
    initiatePayment();
  }, []);

  const initiatePayment = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      console.log('🔄 Initiating payment for note:', noteId);
      
      const response = await axios.post(`${API_BASE}/payment/initiate`, {
        note_id: parseInt(noteId)
      }, {
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        }
      });
      
      console.log('✅ Payment initiated:', response.data);
      
      if (response.data.free_note) {
        // Free note - immediate access
        setStatus('success');
        setTimeout(() => {
          onSuccess();
        }, 2000);
        return;
      }
      
      setOrderData(response.data);
      setLoading(false);
      
    } catch (error) {
      console.error('❌ Payment initiation failed:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Unknown error';
      alert('Failed to initiate payment: ' + errorMessage);
      setLoading(false);
      onClose();
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve, reject) => {
      if (window.Razorpay) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        console.log('✅ Razorpay script loaded');
        resolve();
      };
      script.onerror = () => {
        console.error('❌ Failed to load Razorpay script');
        reject(new Error('Failed to load Razorpay'));
      };
      document.body.appendChild(script);
    });
  };

    const openRazorpay = async () => {
      try {
        await loadRazorpayScript();
    
        if (!orderData) {
          throw new Error('Payment data not available');
        }
    
        const options = {
          key: orderData.key_id,
          amount: orderData.amount * 100, // Amount in paise
          currency: orderData.currency,
          name: 'AKTU Notes',
          description: `Purchase: ${noteTitle}`,
          order_id: orderData.order_id,
          handler: async function (response) {
            console.log('✅ Payment successful response:', response);
            
            try {
              // Verify payment with backend
              const verifyResponse = await axios.post(`${API_BASE}/payment/verify`, {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              }, {
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
              });
              
              console.log('✅ Verification response:', verifyResponse.data);
              
              if (verifyResponse.data.success) {
                setStatus('success');
                // Close payment modal and trigger success callback
                setTimeout(() => {
                  onSuccess(); // This should refresh access and close modal
                }, 1500);
              } else {
                alert('Payment verification failed. Please contact support.');
              }
            } catch (error) {
              console.error('❌ Verification error:', error);
              const errorMessage = error.response?.data?.error || 'Payment verification failed';
              alert('Payment verification failed: ' + errorMessage);
            }
          },
          prefill: {
            name: 'AKTU Student',
            email: 'student@aktu.com',
            contact: '9999999999'
          },
          notes: {
            note_id: noteId,
            note_title: noteTitle
          },
          theme: {
            color: '#4F46E5'
          },
          modal: {
            ondismiss: function() {
              console.log('Payment modal closed');
              onClose();
            }
          }
        };
    
        console.log('🔄 Opening Razorpay checkout with options:', options);
        const rzp = new window.Razorpay(options);
        
        rzp.on('payment.failed', function (response) {
          console.error('❌ Payment failed:', response.error);
          alert(`Payment failed: ${response.error.description}`);
        });
    
        rzp.open();
        
      } catch (error) {
        console.error('❌ Error opening Razorpay:', error);
        alert('Failed to open payment gateway: ' + error.message);
      }
    };
  const checkPaymentStatus = async () => {
    if (!orderData) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_BASE}/payment/status/${orderData.order_id}`,
        { 
          headers: { 
            'Authorization': `Bearer ${token}` 
          } 
        }
      );
      
      console.log('📊 Payment status check:', response.data);
      
      if (response.data.status === 'success') {
        setStatus('success');
        setTimeout(() => {
          onSuccess();
        }, 2000);
      }
    } catch (error) {
      console.error('❌ Status check failed:', error);
    }
  };

  // Auto-check status every 5 seconds for pending payments
  useEffect(() => {
    if (orderData && status === 'pending') {
      const interval = setInterval(checkPaymentStatus, 5000);
      return () => clearInterval(interval);
    }
  }, [orderData, status]);

  // Auto-close success after 3 seconds
  useEffect(() => {
    if (status === 'success') {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [status, onClose]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-lg text-center max-w-sm">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold mb-2">Initializing Payment</h3>
          <p className="text-gray-600">Setting up secure payment gateway...</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-lg text-center max-w-sm">
          <div className="text-6xl mb-4">✅</div>
          <h3 className="text-2xl font-bold text-green-600 mb-2">Payment Successful!</h3>
          <p className="text-gray-600 mb-4">You now have access to "{noteTitle}"</p>
          <p className="text-sm text-gray-500">Redirecting...</p>
        </div>
      </div>
    );
  }

  if (!orderData) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Purchase Note</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Order Summary */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <div className="flex justify-between items-center mb-3">
            <span className="text-gray-600">Note:</span>
            <span className="font-semibold text-gray-900">{noteTitle}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Amount:</span>
            <span className="font-bold text-2xl text-indigo-600">₹{price}</span>
          </div>
        </div>

        {/* Payment Methods Info */}
        <div className="mb-6">
          <h4 className="font-semibold text-gray-900 mb-3">Available Payment Methods:</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center p-2 bg-green-50 rounded">
              <span className="mr-2 text-lg">📱</span> UPI
            </div>
            <div className="flex items-center p-2 bg-blue-50 rounded">
              <span className="mr-2 text-lg">💳</span> Cards
            </div>
            <div className="flex items-center p-2 bg-purple-50 rounded">
              <span className="mr-2 text-lg">🏦</span> Net Banking
            </div>
            <div className="flex items-center p-2 bg-yellow-50 rounded">
              <span className="mr-2 text-lg">👛</span> Wallets
            </div>
          </div>
        </div>

        {/* Test Payment Info */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-yellow-800">
            <strong>Test Mode:</strong> Use UPI ID <code>success@razorpay</code> for successful payment
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={openRazorpay}
            className="flex-1 bg-indigo-600 text-white py-4 rounded-lg font-semibold text-lg hover:bg-indigo-700 transition-colors"
          >
            Pay ₹{price}
          </button>
          
          <button
            onClick={onClose}
            className="px-6 py-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>

        {/* Security Badge */}
        <div className="mt-4 text-center">
          <div className="flex items-center justify-center text-sm text-gray-500">
            <span className="mr-2">🔒</span>
            <span>Secure payment powered by Razorpay</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RazorpayPayment;