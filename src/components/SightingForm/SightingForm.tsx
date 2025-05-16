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
        className="rounded-xl relative"
        style={{ 
          zIndex: 1000000,
          backgroundColor: 'rgba(33, 33, 33, 0.95)',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          width: '340px',
          margin: 'auto',
          marginTop: '180px',
          padding: '24px',
          position: 'relative',
          borderRadius: '12px',
        }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontSize: '16px',
            lineHeight: 1,
            color: '#3B82F6',
            position: 'absolute',
            top: '8px',
            right: '8px',
            transition: 'opacity 0.2s',
          }}
          onMouseOver={(e) => e.currentTarget.style.opacity = '0.7'}
          onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
        >
          ✕
        </button>
        <div style={{ 
          marginBottom: '20px',
          width: '100%',
          textAlign: 'center'
        }}>
          <h2 style={{ 
            color: '#3B82F6',
            fontSize: '1.125rem',
            fontWeight: '600',
            margin: '0 auto'
          }}>Add New Sighting</h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Date */}
          <div>
            <label className="block text-sm mb-2" style={{ color: 'white' }}>Date</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({
                ...formData,
                date: e.target.value
              })}
              className="block w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
              style={{ color: 'black' }}
              required
            />
          </div>

          {/* Start Location */}
          <div>
            <label className="block text-sm mb-2" style={{ color: 'white' }}>Start Location (Optional)</label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                step="0.000001"
                placeholder="Latitude"
                value={formData.startLocation?.lat}
                onChange={(e) => setFormData({
                  ...formData,
                  startLocation: { ...formData.startLocation!, lat: parseFloat(e.target.value) }
                })}
                className="block w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                style={{ color: 'black' }}
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
                className="block w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                style={{ color: 'black' }}
              />
            </div>
          </div>

          {/* End Location */}
          <div>
            <label className="block text-sm mb-2" style={{ color: 'white' }}>End Location (Optional)</label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                step="0.000001"
                placeholder="Latitude"
                value={formData.endLocation?.lat}
                onChange={(e) => setFormData({
                  ...formData,
                  endLocation: { ...formData.endLocation!, lat: parseFloat(e.target.value) }
                })}
                className="block w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                style={{ color: 'black' }}
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
                className="block w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                style={{ color: 'black' }}
              />
            </div>
          </div>

          {/* Matrilines */}
          <div>
            <label className="block text-sm mb-2" style={{ color: 'white' }}>Matriline</label>
            <input
              type="text"
              value={formData.matrilines.join(', ')}
              onChange={(e) => setFormData({
                ...formData,
                matrilines: e.target.value.split(',').map(m => m.trim()).filter(Boolean)
              })}
              placeholder="e.g., T18, T19"
              className="block w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
              style={{ color: 'black' }}
              required
            />
          </div>

          {/* Group Size */}
          <div>
            <label className="block text-sm mb-2" style={{ color: 'white' }}>Group Size</label>
            <input
              type="number"
              min="1"
              value={formData.groupSize}
              onChange={(e) => setFormData({
                ...formData,
                groupSize: parseInt(e.target.value)
              })}
              className="block w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
              style={{ color: 'black' }}
              required
            />
          </div>

          {/* Submit Button */}
          <div style={{ 
            width: '100%',
            textAlign: 'center',
            marginTop: '16px'
          }}>
            <button
              type="submit"
              style={{
                width: '120px',
                padding: '0.375rem 0',
                fontSize: '0.875rem',
                backgroundColor: '#3B82F6',
                color: 'white',
                borderRadius: '0.25rem',
                border: 'none',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                margin: '0 auto'
              }}
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