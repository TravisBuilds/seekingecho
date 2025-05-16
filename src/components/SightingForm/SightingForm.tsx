import { useState } from 'react';
import { NewSighting } from '@/types/sighting';

interface SightingFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (sighting: NewSighting) => void;
}

const SightingForm: React.FC<SightingFormProps> = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState<NewSighting>({
    date: new Date().toISOString().split('T')[0],
    groupSize: 1,
    startLocation: { lat: 0, lng: 0 },
    endLocation: { lat: 0, lng: 0 },
    matrilines: []
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  if (!isOpen) return null;

  console.log('Rendering SightingForm modal...');

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center"
      style={{ 
        position: 'fixed',
        zIndex: 999999,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          console.log('Backdrop clicked, closing form...');
          onClose();
        }
      }}
    >
      <div 
        className="rounded-lg w-full max-w-sm relative p-6"
        style={{ 
          zIndex: 1000000,
          backgroundColor: 'rgba(33, 33, 33, 0.95)',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-white">Add New Sighting</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-300 transition-colors text-xl"
            aria-label="Close"
          >
            X
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Date */}
          <div>
            <label className="block text-sm text-white mb-1">Date</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({
                ...formData,
                date: e.target.value
              })}
              className="block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-blue-500"
              style={{ color: 'white' }}
              required
            />
          </div>

          {/* Start Location */}
          <div>
            <label className="block text-sm text-white mb-1">Start Location (Optional)</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                step="0.000001"
                placeholder="Latitude"
                value={formData.startLocation?.lat}
                onChange={(e) => setFormData({
                  ...formData,
                  startLocation: { ...formData.startLocation!, lat: parseFloat(e.target.value) }
                })}
                className="block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-blue-500 placeholder-gray-400"
                style={{ color: 'white' }}
              />
              <input
                type="number"
                step="0.000001"
                placeholder="Longitude"
                value={formData.startLocation?.lng}
                onChange={(e) => setFormData({
                  ...formData,
                  startLocation: { ...formData.startLocation!, lng: parseFloat(e.target.value) }
                })}
                className="block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-blue-500 placeholder-gray-400"
                style={{ color: 'white' }}
              />
            </div>
          </div>

          {/* End Location */}
          <div>
            <label className="block text-sm text-white mb-1">End Location (Optional)</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                step="0.000001"
                placeholder="Latitude"
                value={formData.endLocation?.lat}
                onChange={(e) => setFormData({
                  ...formData,
                  endLocation: { ...formData.endLocation!, lat: parseFloat(e.target.value) }
                })}
                className="block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-blue-500 placeholder-gray-400"
                style={{ color: 'white' }}
              />
              <input
                type="number"
                step="0.000001"
                placeholder="Longitude"
                value={formData.endLocation?.lng}
                onChange={(e) => setFormData({
                  ...formData,
                  endLocation: { ...formData.endLocation!, lng: parseFloat(e.target.value) }
                })}
                className="block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-blue-500 placeholder-gray-400"
                style={{ color: 'white' }}
              />
            </div>
          </div>

          {/* Matrilines */}
          <div>
            <label className="block text-sm text-white mb-1">Matriline</label>
            <input
              type="text"
              value={formData.matrilines.join(', ')}
              onChange={(e) => setFormData({
                ...formData,
                matrilines: e.target.value.split(',').map(m => m.trim()).filter(Boolean)
              })}
              placeholder="e.g., T18, T19"
              className="block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-blue-500 placeholder-gray-400"
              style={{ color: 'white' }}
              required
            />
          </div>

          {/* Group Size */}
          <div>
            <label className="block text-sm text-white mb-1">Group Size</label>
            <input
              type="number"
              min="1"
              value={formData.groupSize}
              onChange={(e) => setFormData({
                ...formData,
                groupSize: parseInt(e.target.value)
              })}
              className="block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-blue-500"
              style={{ color: 'white' }}
              required
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-center pt-4">
            <button
              type="submit"
              className="w-24 py-2 text-sm bg-gray-400 text-white rounded hover:bg-gray-500 transition-colors focus:outline-none"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SightingForm; 