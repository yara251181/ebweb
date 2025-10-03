import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import EngineeringHero from '../components/EngineeringHero';

const Notes = () => {
  const { API_BASE } = useAuth();
  const navigate = useNavigate();
  const [notes, setNotes] = useState([]);
  const [filteredNotes, setFilteredNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState('All Subjects');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/notes`);
      console.log('Fetched notes:', response.data);
      setNotes(response.data);
      setFilteredNotes(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching notes:', error);
      setLoading(false);
    }
  };

  const handleSubjectFilter = (subject) => {
    setSelectedSubject(subject);
    if (subject === 'All Subjects') {
      setFilteredNotes(notes);
    } else {
      setFilteredNotes(notes.filter(note => note.subject === subject));
    }
  };

  const handleNoteClick = (note) => {
    navigate(`/notes/${note.id}`);
  };

  const subjects = ['All Subjects', ...new Set(notes.map(note => note.subject))];

  // Group notes by subject for better organization
  const notesBySubject = filteredNotes.reduce((acc, note) => {
    if (!acc[note.subject]) {
      acc[note.subject] = [];
    }
    acc[note.subject].push(note);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900">
        <EngineeringHero />
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <EngineeringHero />
      
      {/* Filters and Controls */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 space-y-4 lg:space-y-0">
          {/* Subject Filter */}
          <div className="flex flex-wrap gap-2">
            {subjects.map((subject) => (
              <button
                key={subject}
                onClick={() => handleSubjectFilter(subject)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  selectedSubject === subject
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                {subject}
              </button>
            ))}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center space-x-2 bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-all duration-300 ${
                viewMode === 'grid' 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-all duration-300 ${
                viewMode === 'list' 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Notes Display */}
        {viewMode === 'grid' ? (
          // Grid View
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNotes.map((note) => (
              <NoteCard 
                key={note.id}
                note={note}
                onNoteClick={handleNoteClick}
              />
            ))}
          </div>
        ) : (
          // List View - Grouped by Subject
          <div className="space-y-8">
            {Object.entries(notesBySubject).map(([subject, subjectNotes]) => (
              <div key={subject} className="bg-gray-800/50 rounded-2xl p-6">
                <h3 className="text-2xl font-bold text-white mb-6 pb-4 border-b border-gray-700">
                  {subject} 
                  <span className="text-gray-400 text-lg ml-2">({subjectNotes.length} notes)</span>
                </h3>
                <div className="space-y-4">
                  {subjectNotes.map((note) => (
                    <NoteListItem 
                      key={note.id}
                      note={note}
                      onNoteClick={handleNoteClick}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {filteredNotes.length === 0 && (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No notes found</h3>
            <p className="text-gray-400">Try selecting a different subject filter</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Note Card Component for Grid View
const NoteCard = ({ note, onNoteClick }) => {
  return (
    <div 
      className="group bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 hover:border-blue-500 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20 cursor-pointer"
      onClick={() => onNoteClick(note)}
    >
      {/* Premium Badge */}
      {note.is_premium && (
        <div className="flex justify-between items-start mb-4">
          <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-1 rounded-full text-xs font-bold">
            PREMIUM
          </span>
          <span className="bg-yellow-600 text-white px-2 py-1 rounded text-xs font-bold">
            ₹{note.price}
          </span>
        </div>
      )}

      {/* Note Content */}
      <h3 className="text-lg font-bold text-white mb-3 group-hover:text-blue-300 transition-colors line-clamp-2">
        {note.title}
      </h3>
      
      <p className="text-gray-400 text-sm mb-4 line-clamp-3">
        {note.description || 'Comprehensive study notes for engineering students.'}
      </p>

      {/* Subject Tag */}
      <div className="flex items-center justify-between mb-4">
        <span className="bg-blue-600/20 text-blue-400 px-3 py-1 rounded-full text-xs font-medium border border-blue-500/30">
          {note.subject}
        </span>
      </div>

      {/* YouTube Link */}
      {note.youtube_url && (
        <a 
          href={note.youtube_url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex items-center space-x-2 text-red-400 hover:text-red-300 transition-colors group/yt mb-4"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
          </svg>
          <span className="text-sm group-hover/yt:underline">Watch Video</span>
        </a>
      )}

      {/* Action Button */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-700">
        <span className={`text-sm font-medium ${
          note.is_premium 
            ? 'text-purple-400' 
            : note.has_access 
            ? 'text-green-400' 
            : 'text-gray-400'
        }`}>
          {note.is_premium 
            ? 'Purchase Required' 
            : note.has_access 
            ? 'Access Granted' 
            : 'Free Access'
          }
        </span>
        
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-300">
          {note.is_premium ? 'Purchase' : 'View'}
        </button>
      </div>
    </div>
  );
};

// Note List Item Component for List View
const NoteListItem = ({ note, onNoteClick }) => {
  return (
    <div 
      className="flex items-center justify-between p-4 bg-gray-700/30 rounded-xl hover:bg-gray-700/50 cursor-pointer group transition-all duration-300"
      onClick={() => onNoteClick(note)}
    >
      <div className="flex items-center space-x-4">
        {/* Icon */}
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
          note.is_premium 
            ? 'bg-gradient-to-r from-purple-600 to-pink-600' 
            : 'bg-blue-600'
        }`}>
          {note.is_premium ? (
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2z"/>
            </svg>
          ) : (
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
          )}
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-1">
            <h4 className="text-lg font-semibold text-white group-hover:text-blue-300 transition-colors">
              {note.title}
            </h4>
            {note.is_premium && (
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-2 py-1 rounded text-xs font-bold">
                ₹{note.price}
              </span>
            )}
          </div>
          
          <p className="text-gray-400 text-sm mb-2">
            {note.description || 'Comprehensive study notes for engineering students.'}
          </p>

          <div className="flex items-center space-x-4 text-xs">
            <span className="bg-blue-600/20 text-blue-400 px-2 py-1 rounded border border-blue-500/30">
              {note.subject}
            </span>
            
            {note.youtube_url && (
              <a 
                href={note.youtube_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center space-x-1 text-red-400 hover:text-red-300 transition-colors"
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                </svg>
                <span>Video</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Action */}
      <div className="flex items-center space-x-4">
        <span className={`text-sm font-medium ${
          note.is_premium 
            ? 'text-purple-400' 
            : note.has_access 
            ? 'text-green-400' 
            : 'text-gray-400'
        }`}>
          {note.is_premium ? 'Premium' : 'Free'}
        </span>
        
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-300 min-w-20">
          {note.is_premium ? 'Purchase' : 'View'}
        </button>
      </div>
    </div>
  );
};

export default Notes;