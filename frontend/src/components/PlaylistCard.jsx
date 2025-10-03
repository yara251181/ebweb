import React from 'react';

const PlaylistCard = ({ playlist, onNoteClick }) => {
  const extractVideoId = (url) => {
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return match ? match[1] : null;
  };

  const videoId = extractVideoId(playlist.youtube_playlist);

  return (
    <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-6 hover:border-blue-500 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20">
      {/* YouTube Thumbnail */}
      {videoId && (
        <div className="relative rounded-xl overflow-hidden mb-4 group">
          <img 
            src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
            alt={playlist.subject}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="bg-red-600 p-3 rounded-full">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
          </div>
          <div className="absolute top-3 right-3 bg-black bg-opacity-70 px-2 py-1 rounded-full text-xs text-white">
            {playlist.total_videos} videos
          </div>
        </div>
      )}

      {/* Playlist Info */}
      <h3 className="text-xl font-bold text-white mb-2">{playlist.subject}</h3>
      <p className="text-gray-400 text-sm mb-4">Complete course with structured notes</p>

      {/* Notes List */}
      <div className="space-y-3">
        {playlist.notes.map((note, index) => (
          <div 
            key={note.id}
            onClick={() => onNoteClick(note)}
            className="flex items-center justify-between p-3 bg-gray-800 rounded-lg hover:bg-gray-700 cursor-pointer transition-colors group"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                {index + 1}
              </div>
              <div>
                <h4 className="text-white text-sm font-medium group-hover:text-blue-300 transition-colors">
                  {note.title}
                </h4>
                <p className="text-gray-400 text-xs">{note.description}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {note.is_premium ? (
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-2 py-1 rounded-full text-xs font-bold">
                  ₹{note.price}
                </span>
              ) : (
                <span className="bg-green-600 text-white px-2 py-1 rounded-full text-xs font-bold">
                  FREE
                </span>
              )}
              <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlaylistCard;