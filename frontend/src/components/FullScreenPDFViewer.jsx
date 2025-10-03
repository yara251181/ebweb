import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

const FullScreenPDFViewer = ({ noteId, onClose }) => {
  const { API_BASE } = useAuth()
  const [pages, setPages] = useState([])
  const [currentPage, setCurrentPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [title, setTitle] = useState('')
  const [zoom, setZoom] = useState(1)
  const containerRef = useRef(null)
  const imageContainerRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [startPos, setStartPos] = useState({ x: 0, y: 0 })
  const [securityBreachAttempts, setSecurityBreachAttempts] = useState(0)

  // ✅ FIXED: Improved security detection
  useEffect(() => {
    let securityInterval;

    const handleSecurityBreach = (reason) => {
      console.log(`Security breach detected: ${reason}`);
      setSecurityBreachAttempts(prev => {
        const newCount = prev + 1;
        if (newCount >= 3) {
          alert('Multiple security violations detected. Viewer will close.');
          onClose();
        } else {
          alert(`Security Warning: ${reason}. Attempt ${newCount}/3`);
        }
        return newCount;
      });
    }

    // ✅ FIXED: More tolerant zoom detection
    const checkZoomLevel = () => {
      // Use multiple methods to detect zoom more accurately
      const zoom1 = window.outerWidth / window.innerWidth;
      const zoom2 = window.outerHeight / window.innerHeight;
      
      // Average the zoom detection methods
      const avgZoom = (zoom1 + zoom2) / 2;
      
      // ✅ ALLOW reasonable zoom range for accessibility
      if (avgZoom < 0.7 || avgZoom > 1.8) { // Much wider tolerance
        handleSecurityBreach('Extreme browser zoom detected. Please use viewer controls instead.');
      }
    }

    // ✅ FIXED: Less aggressive DevTools detection
    const detectDevTools = () => {
      const widthThreshold = window.outerWidth - window.innerWidth > 250; // Increased threshold
      const heightThreshold = window.outerHeight - window.innerHeight > 250;
      
      if (widthThreshold || heightThreshold) {
        handleSecurityBreach('Developer Tools detected');
      }
    }

    // ✅ FIXED: Less restrictive keyboard blocking
    const blockKeyboardShortcuts = (e) => {
      // Only block specific dangerous shortcuts
      if ((e.ctrlKey || e.metaKey) && (
          e.key === 'p' || // Print
          e.key === 's' || // Save
          e.key === 'u' || // View source
          e.key === 'i' || // DevTools (Chrome)
          e.key === 'j' || // DevTools (Chrome)
          e.key === 'c' && (e.shiftKey || e.altKey) // Modified copy
      )) {
        e.preventDefault();
        handleSecurityBreach(`Restricted shortcut: ${e.key}`);
        return false;
      }

      // Block Print Screen
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        return false;
      }

      // ✅ ALLOW function keys for accessibility
      // ✅ ALLOW normal navigation keys
    }

    const blockRightClick = (e) => {
      e.preventDefault();
      // Don't count right-click as security breach immediately
      if (securityBreachAttempts >= 2) {
        handleSecurityBreach('Right-click context menu blocked');
      }
      return false;
    }

    const blockTextSelection = () => {
      if (window.getSelection().toString() !== '') {
        window.getSelection().removeAllRanges();
      }
    }

    const blockDragStart = (e) => {
      e.preventDefault();
      return false;
    }

    // Set up event listeners
    window.addEventListener('resize', checkZoomLevel);
    window.addEventListener('keydown', blockKeyboardShortcuts);
    document.addEventListener('contextmenu', blockRightClick);
    document.addEventListener('selectionchange', blockTextSelection);
    document.addEventListener('dragstart', blockDragStart);
    
    // ✅ FIXED: Less frequent security checks
    securityInterval = setInterval(() => {
      detectDevTools();
      checkZoomLevel();
    }, 5000); // Reduced frequency

    return () => {
      clearInterval(securityInterval);
      window.removeEventListener('resize', checkZoomLevel);
      window.removeEventListener('keydown', blockKeyboardShortcuts);
      document.removeEventListener('contextmenu', blockRightClick);
      document.removeEventListener('selectionchange', blockTextSelection);
      document.removeEventListener('dragstart', blockDragStart);
    };
  }, [onClose, securityBreachAttempts]); // ✅ Added dependency

  useEffect(() => {
    fetchProtectedPDF();
  }, [noteId]);

  const fetchProtectedPDF = async () => {
    try {
      setLoading(true)
      setError('')
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE}/notes/${noteId}/protected-view`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      setPages(response.data.pages)
      setTitle(response.data.title)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching protected PDF:', error)
      setError('Failed to load protected content. Please ensure you are logged in.')
      setLoading(false)
    }
  }

  const nextPage = () => {
    if (currentPage < pages.length - 1) {
      setCurrentPage(currentPage + 1)
      setPosition({ x: 0, y: 0 })
    }
  }

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1)
      setPosition({ x: 0, y: 0 })
    }
  }

  // ✅ FIXED: Better zoom ranges
  const zoomIn = () => {
    setZoom(prev => {
      const newZoom = Math.min(prev + 0.25, 3.0) // ✅ Increased max zoom to 300%
      setPosition({ x: 0, y: 0 })
      return newZoom
    })
  }

  const zoomOut = () => {
    setZoom(prev => {
      const newZoom = Math.max(prev - 0.25, 0.5) // ✅ Reduced min zoom to 50%
      if (newZoom <= 1) {
        setPosition({ x: 0, y: 0 })
      }
      return newZoom
    })
  }

  const resetZoom = () => {
    setZoom(1)
    setPosition({ x: 0, y: 0 })
  }

  // Mouse drag handlers for panning
  const handleMouseDown = (e) => {
    if (zoom > 1) {
      setIsDragging(true)
      setStartPos({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      })
    }
  }

  const handleMouseMove = (e) => {
    if (isDragging && zoom > 1) {
      const newX = e.clientX - startPos.x
      const newY = e.clientY - startPos.y
      
      const container = imageContainerRef.current
      if (container) {
        const containerRect = container.getBoundingClientRect()
        const imageWidth = containerRect.width * zoom
        const imageHeight = containerRect.height * zoom
        
        const maxX = Math.max(0, (imageWidth - containerRect.width) / 2)
        const maxY = Math.max(0, (imageHeight - containerRect.height) / 2)
        
        const boundedX = Math.max(-maxX, Math.min(maxX, newX))
        const boundedY = Math.max(-maxY, Math.min(maxY, newY))
        
        setPosition({ x: boundedX, y: boundedY })
      }
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleKeyDown = (e) => {
    // Only allow specific keys
    switch(e.key) {
      case 'ArrowRight':
        e.preventDefault()
        nextPage()
        break
      case 'ArrowLeft':
        e.preventDefault()
        prevPage()
        break
      case 'Escape':
        e.preventDefault()
        onClose()
        break
      case '+':
        e.preventDefault()
        zoomIn()
        break
      case '-':
        e.preventDefault()
        zoomOut()
        break
      case '0':
        e.preventDefault()
        resetZoom()
        break
      case 'ArrowUp':
        if (zoom > 1) {
          e.preventDefault()
          setPosition(prev => ({ ...prev, y: Math.min(prev.y + 50, 1000) }))
        }
        break
      case 'ArrowDown':
        if (zoom > 1) {
          e.preventDefault()
          setPosition(prev => ({ ...prev, y: Math.max(prev.y - 50, -1000) }))
        }
        break
      default:
        // Block all other keys
        if (e.key.length === 1 || e.key.startsWith('F')) {
          e.preventDefault()
        }
        break
    }
  }

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('mouseleave', handleMouseUp)
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('mouseleave', handleMouseUp)
    }
  }, [currentPage, pages.length, zoom, isDragging, position, startPos])

  // Add subtle watermark overlay
  const WatermarkOverlay = () => (
    <div 
      className="absolute inset-0 pointer-events-none z-10"
      style={{
        background: `repeating-linear-gradient(
          45deg,
          transparent,
          transparent 100px,
          rgba(255,0,0,0.03) 100px,
          rgba(255,0,0,0.03) 200px
        )`,
        userSelect: 'none',
        WebkitUserSelect: 'none'
      }}
    >
      <div className="absolute inset-0 flex items-center justify-center opacity-10">
        <div className="text-red-600 text-6xl font-bold transform rotate-45">
          PROTECTED CONTENT
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading secured content...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
        <div className="bg-red-600 text-white p-6 rounded-lg max-w-md text-center">
          <h2 className="text-xl font-bold mb-2">Security Error</h2>
          <p className="mb-4">{error}</p>
          <button
            onClick={onClose}
            className="bg-white text-red-600 px-4 py-2 rounded font-semibold"
          >
            Close Viewer
          </button>
        </div>
      </div>
    )
  }

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 bg-gray-900 z-50 flex flex-col security-container"
      onContextMenu={(e) => e.preventDefault()}
      style={{ 
        cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none'
      }}
    >
      {/* Security Status Bar */}
      {securityBreachAttempts > 0 && (
        <div className="bg-red-600 text-white p-2 text-center text-sm font-bold">
          ⚠️ SECURITY ALERT: Unauthorized activity detected ({securityBreachAttempts}/3)
        </div>
      )}

      {/* Header Bar */}
      <div className="bg-gray-800 text-white p-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold">{title}</h1>
          <p className="text-sm text-gray-300">
            Page {currentPage + 1} of {pages.length} • Secured Content • Zoom: {Math.round(zoom * 100)}%
            {zoom > 1 && " • Drag to pan"}
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Zoom Controls */}
          <div className="flex items-center space-x-2 bg-gray-700 px-3 py-1 rounded">
            <button
              onClick={zoomOut}
              className="text-white hover:bg-gray-600 p-1 rounded disabled:opacity-50"
              disabled={zoom <= 0.5}
              title="Zoom Out"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <span className="text-sm font-mono bg-gray-600 px-2 py-1 rounded">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={zoomIn}
              className="text-white hover:bg-gray-600 p-1 rounded disabled:opacity-50"
              disabled={zoom >= 3.0}
              title="Zoom In"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
            <button
              onClick={resetZoom}
              className="text-white hover:bg-gray-600 px-2 py-1 rounded text-sm"
              title="Reset Zoom"
            >
              Reset
            </button>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-semibold"
          >
            Close (ESC)
          </button>
        </div>
      </div>

      {/* Protection Warning */}
      <div className="bg-red-700 text-white p-2 text-center text-sm font-semibold">
        <div className="flex items-center justify-center space-x-2">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          <span>HIGH SECURITY MODE: All download, print, and copy functions are disabled</span>
        </div>
      </div>

      {/* Main Content Area */}
      <div 
        ref={imageContainerRef}
        className="flex-1 bg-gray-800 overflow-auto relative security-content"
        onMouseDown={handleMouseDown}
        style={{
          userSelect: 'none',
          WebkitUserSelect: 'none'
        }}
      >
        <WatermarkOverlay />
        {pages.length > 0 && (
          <div className="flex items-center justify-center min-h-full p-4">
            <div
              style={{
                transform: `scale(${zoom}) translate(${position.x}px, ${position.y}px)`,
                transformOrigin: 'center',
                transition: isDragging ? 'none' : 'transform 0.2s ease',
                maxWidth: '90vw',
                maxHeight: '90vh',
                position: 'relative',
                userSelect: 'none',
                WebkitUserSelect: 'none'
              }}
            >
              <img
                src={pages[currentPage].data}
                alt={`Page ${currentPage + 1}`}
                className="shadow-2xl rounded"
                style={{
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  MozUserSelect: 'none',
                  msUserSelect: 'none',
                  pointerEvents: 'none'
                }}
                onContextMenu={(e) => e.preventDefault()}
                onDragStart={(e) => e.preventDefault()}
              />
            </div>
          </div>
        )}
      </div>

      {/* Navigation Bar */}
      <div className="bg-gray-800 p-4 border-t border-gray-700">
        <div className="flex justify-between items-center max-w-4xl mx-auto">
          <button
            onClick={prevPage}
            disabled={currentPage === 0}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg disabled:bg-gray-600 disabled:cursor-not-allowed hover:bg-indigo-700 font-semibold flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Previous</span>
          </button>

          <div className="flex items-center space-x-4">
            <span className="text-white font-semibold bg-gray-700 px-4 py-2 rounded">
              Page {currentPage + 1} of {pages.length}
            </span>
            
            <div className="flex space-x-2">
              <input
                type="number"
                min="1"
                max={pages.length}
                value={currentPage + 1}
                onChange={(e) => {
                  const page = parseInt(e.target.value) - 1
                  if (page >= 0 && page < pages.length) {
                    setCurrentPage(page)
                    setPosition({ x: 0, y: 0 })
                  }
                }}
                className="w-16 px-2 py-1 rounded border border-gray-600 bg-gray-700 text-white text-center"
              />
              <span className="text-white self-center">/ {pages.length}</span>
            </div>
          </div>

          <button
            onClick={nextPage}
            disabled={currentPage === pages.length - 1}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg disabled:bg-gray-600 disabled:cursor-not-allowed hover:bg-indigo-700 font-semibold flex items-center space-x-2"
          >
            <span>Next</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Security Features Info */}
      <div className="bg-gray-900 border-t border-gray-700 p-2">
        <div className="text-center text-gray-400 text-sm">
          <span className="mx-2">🔒 All Security Features Active</span>
          <span className="mx-2">📷 Screenshot Protection</span>
          <span className="mx-2">🖨️ Print Blocking</span>
          <span className="mx-2">📋 Copy Prevention</span>
          {securityBreachAttempts > 0 && (
            <span className="mx-2 text-red-400">⚠️ Monitoring Suspicious Activity</span>
          )}
        </div>
      </div>
    </div>
  )
}

export default FullScreenPDFViewer