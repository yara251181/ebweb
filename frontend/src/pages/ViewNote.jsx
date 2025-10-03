import React, { useState, useEffect } from 'react'
import { useParams, Navigate, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import FullScreenPDFViewer from '../components/FullScreenPDFViewer'
import RazorpayPayment from '../components/RazorpayPayment' // ✅ Import Razorpay component

const ViewNote = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { currentUser, API_BASE } = useAuth()
  const [loading, setLoading] = useState(true)
  const [accessInfo, setAccessInfo] = useState(null)
  const [purchasing, setPurchasing] = useState(false)
  const [error, setError] = useState('')
  const [showViewer, setShowViewer] = useState(false)
  const [showPayment, setShowPayment] = useState(false) // ✅ NEW: Payment modal state

  useEffect(() => {
    if (currentUser) {
      checkAccess()
    } else {
      setError('Please login first')
      setLoading(false)
    }
  }, [id, currentUser])
  
  const checkAccess = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`${API_BASE}/notes/${id}/check-access`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Also check if user has purchased this note
      const purchaseCheck = await axios.get(`${API_BASE}/payment/user-purchases`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const hasPurchased = purchaseCheck.data.some(purchase => 
        purchase.note_id === parseInt(id) && purchase.status === 'success'
      );
      
      setAccessInfo({
        ...response.data,
        has_access: response.data.has_access || hasPurchased,
        purchased: hasPurchased
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Error checking access:', error);
      // If purchase check fails, just use the basic access check
      try {
        const response = await axios.get(`${API_BASE}/notes/${id}/check-access`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setAccessInfo(response.data);
      } catch (err) {
        setError('Failed to check access. Please try again.');
      }
      setLoading(false);
    }
  };
  // ✅ NEW: Handle real payment
  const handlePurchase = () => {
    setShowPayment(true);
  };

  // ✅ NEW: Handle payment success
  // const handlePaymentSuccess = () => {
  //   setShowPayment(false);
  //   // Refresh access info after successful payment
  //   setTimeout(() => {
  //     checkAccess();
  //   }, 2000);
  // };


  
// ✅ NEW: Handle payment success
  const handlePaymentSuccess = () => {
    console.log('✅ Payment success callback triggered');
    setShowPayment(false);

    // Refresh access info after successful payment
    setTimeout(() => {
      checkAccess();

      // Show success message
      alert('Payment successful! You now have access to this note.');

      // Optional: Auto-redirect to notes list after 2 seconds
      setTimeout(() => {
        navigate('/notes');
      }, 2000);

    }, 1000);
  };

  // ✅ Keep test purchase for development (optional)
  const handleTestPurchase = async () => {
    try {
      setPurchasing(true)
      setError('')
      const token = localStorage.getItem('token');
      
      const response = await axios.post(`${API_BASE}/test/purchase/${id}`, 
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )
      
      if (response.data.success) {
        alert(response.data.message)
        checkAccess()
      }
    } catch (error) {
      console.error('Purchase error:', error)
      if (error.response?.status === 401) {
        setError('Please login again to make a purchase.');
      } else {
        setError('Test purchase failed. Please try again.');
      }
    } finally {
      setPurchasing(false)
    }
  }

  const openViewer = () => {
    setShowViewer(true)
  }

  const closeViewer = () => {
    setShowViewer(false)
  }

  if (!currentUser) {
    return <Navigate to="/login" />
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <span className="ml-3 text-gray-600">Checking access...</span>
        </div>
      </div>
    )
  }

  if (error && !accessInfo) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-red-900 mb-2">Error</h2>
          <p className="text-red-700 mb-4">{error}</p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={checkAccess}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate('/notes')}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
            >
              Back to Notes
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!accessInfo?.has_access) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Premium Content</h2>
          <p className="text-gray-600 mb-1">{accessInfo?.title}</p>
          <p className="text-3xl font-bold text-indigo-600 mb-6">₹{accessInfo?.price}</p>
          
          {/* ✅ NEW: Real Payment Button */}
          <div className="mb-6">
            <button
              onClick={handlePurchase}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-lg font-semibold text-lg w-full max-w-xs transition-colors duration-200"
            >
              Purchase with UPI/Card
            </button>
          </div>

          {/* Payment Features */}
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-6">
            <div className="flex items-center text-sm text-gray-600">
              <span className="mr-2">✅</span> Secure Payment
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <span className="mr-2">✅</span> Instant Access
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <span className="mr-2">✅</span> 2 Device Limit
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <span className="mr-2">✅</span> 24/7 Support
            </div>
          </div>

          {/* ✅ OPTIONAL: Keep test purchase for development */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg max-w-md mx-auto">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">Development Testing</h3>
            <p className="text-blue-700 text-sm mb-3">
              Click below to simulate a purchase for testing
            </p>
            <button
              onClick={handleTestPurchase}
              disabled={purchasing}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {purchasing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                  Processing...
                </>
              ) : (
                'Test Purchase (Free)'
              )}
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <button
            onClick={() => navigate('/notes')}
            className="bg-gray-200 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-300"
          >
            Browse Other Notes
          </button>
        </div>

        {/* ✅ Razorpay Payment Modal */}
        {showPayment && (
          <RazorpayPayment
            noteId={id}
            noteTitle={accessInfo?.title}
            price={accessInfo?.price}
            onSuccess={handlePaymentSuccess}
            onClose={() => setShowPayment(false)}
          />
        )}
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header with note info */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{accessInfo?.title}</h1>
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
            ✓ Access Granted
          </span>
          {accessInfo?.is_premium_note && (
            <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
              Premium Content
            </span>
          )}
        </div>
      </div>

      {/* Success Message if purchased */}
      {accessInfo?.purchased && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-green-800">
              You have successfully purchased this note!
            </span>
          </div>
        </div>
      )}

      {/* Open Viewer Button */}
      <div className="bg-white shadow rounded-lg p-8 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Ready to View</h2>
        <p className="text-gray-600 mb-6">Open in protected mode with advanced security features</p>
        
        <button
          onClick={openViewer}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg font-semibold text-lg transition-colors duration-200"
        >
          📖 Open Protected Viewer
        </button>
        
        <div className="mt-6 p-4 bg-gray-50 rounded-lg max-w-md mx-auto">
          <h4 className="font-semibold text-gray-800 mb-2">Security Features:</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <p className="flex items-center justify-center">
              <span className="mr-2">🔒</span> Full-screen protected viewing
            </p>
            <p className="flex items-center justify-center">
              <span className="mr-2">🔍</span> Zoom in/out for better readability
            </p>
            <p className="flex items-center justify-center">
              <span className="mr-2">⌨️</span> Keyboard navigation supported
            </p>
            <p className="flex items-center justify-center">
              <span className="mr-2">🚫</span> Downloading and printing disabled
            </p>
          </div>
        </div>
      </div>

      {/* Error message if any */}
      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Full Screen Viewer */}
      {showViewer && (
        <FullScreenPDFViewer 
          noteId={id} 
          onClose={closeViewer} 
        />
      )}
    </div>
  )
}

export default ViewNote