import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

const ProtectedPDFViewer = ({ noteId }) => {
  const { API_BASE } = useAuth()
  const [pages, setPages] = useState([])
  const [currentPage, setCurrentPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [title, setTitle] = useState('')

  useEffect(() => {
    fetchProtectedPDF()
  }, [noteId])

  const fetchProtectedPDF = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await axios.get(`${API_BASE}/notes/${noteId}/protected-view`)
      
      setPages(response.data.pages)
      setTitle(response.data.title)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching protected PDF:', error)
      setError('Failed to load protected content')
      setLoading(false)
    }
  }

  const nextPage = () => {
    if (currentPage < pages.length - 1) {
      setCurrentPage(currentPage + 1)
    }
  }

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-4">
        {error}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="bg-gray-800 text-white p-4 rounded-t-lg">
        <h2 className="text-xl font-bold">{title}</h2>
        <p className="text-sm text-gray-300">
          Page {currentPage + 1} of {pages.length} • Protected Content
        </p>
      </div>

      {/* Protection Warning */}
      <div className="bg-red-50 border border-red-200 p-3">
        <div className="flex items-center justify-center">
          <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          <span className="text-red-800 font-medium">
            PROTECTED CONTENT: Downloading, printing, copying disabled
          </span>
        </div>
      </div>

      {/* PDF Page Display */}
      <div className="p-4 flex justify-center bg-gray-100 min-h-[500px]">
        {pages.length > 0 && (
          <div className="relative">
            <img
              src={pages[currentPage].data}
              alt={`Page ${currentPage + 1}`}
              className="max-w-full max-h-[80vh] shadow-lg rounded"
              style={{
                userSelect: 'none',
                WebkitUserSelect: 'none',
                MozUserSelect: 'none',
                msUserSelect: 'none'
              }}
              onContextMenu={(e) => e.preventDefault()}
              onDragStart={(e) => e.preventDefault()}
            />
            
            {/* Overlay to prevent text selection */}
            <div 
              className="absolute inset-0"
              style={{
                pointerEvents: 'none',
                userSelect: 'none',
                WebkitUserSelect: 'none'
              }}
            />
          </div>
        )}
      </div>

      {/* Navigation Controls */}
      <div className="bg-gray-100 p-4 rounded-b-lg flex justify-between items-center">
        <button
          onClick={prevPage}
          disabled={currentPage === 0}
          className="bg-indigo-600 text-white px-4 py-2 rounded disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-indigo-700"
        >
          Previous
        </button>

        <div className="flex items-center space-x-2">
          <span className="text-gray-700 font-medium">
            Page {currentPage + 1} of {pages.length}
          </span>
        </div>

        <button
          onClick={nextPage}
          disabled={currentPage === pages.length - 1}
          className="bg-indigo-600 text-white px-4 py-2 rounded disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-indigo-700"
        >
          Next
        </button>
      </div>

      {/* Security Features Info */}
      <div className="bg-blue-50 border-t border-blue-200 p-4">
        <h3 className="font-semibold text-blue-800 mb-2">Security Features:</h3>
        <ul className="text-sm text-blue-700 list-disc list-inside">
          <li>PDF converted to protected images</li>
          <li>Watermarks applied to prevent unauthorized use</li>
          <li>Right-click and text selection disabled</li>
          <li>Download and print functionality blocked</li>
          <li>Content served as base64 images (no direct file access)</li>
        </ul>
      </div>
    </div>
  )
}

export default ProtectedPDFViewer