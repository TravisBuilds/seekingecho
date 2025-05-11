import { useState } from 'react';
import { WhaleSighting } from '@/types/sighting';

interface SightingFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (sighting: WhaleSighting) => void;
}

const SightingForm: React.FC<SightingFormProps> = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState<Partial<WhaleSighting>>({
    timestamp: new Date().toISOString().split('T')[0],
    location: { lat: 0, lng: 0 },
    endLocation: { lat: 0, lng: 0 },
    matrilines: [],
    groupSize: 1
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData as WhaleSighting);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Add New Whale Sighting</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Date and Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Date</label>
            <input
              type="date"
              value={formData.timestamp?.split('T')[0]}
              onChange={(e) => setFormData({
                ...formData,
                timestamp: new Date(e.target.value).toISOString()
              })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          {/* Location */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Start Latitude</label>
              <input
                type="number"
                step="0.000001"
                value={formData.location?.lat}
                onChange={(e) => setFormData({
                  ...formData,
                  location: { ...formData.location!, lat: parseFloat(e.target.value) }
                })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Start Longitude</label>
              <input
                type="number"
                step="0.000001"
                value={formData.location?.lng}
                onChange={(e) => setFormData({
                  ...formData,
                  location: { ...formData.location!, lng: parseFloat(e.target.value) }
                })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* End Location (Optional) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">End Latitude (Optional)</label>
              <input
                type="number"
                step="0.000001"
                value={formData.endLocation?.lat}
                onChange={(e) => setFormData({
                  ...formData,
                  endLocation: { ...formData.endLocation!, lat: parseFloat(e.target.value) }
                })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">End Longitude (Optional)</label>
              <input
                type="number"
                step="0.000001"
                value={formData.endLocation?.lng}
                onChange={(e) => setFormData({
                  ...formData,
                  endLocation: { ...formData.endLocation!, lng: parseFloat(e.target.value) }
                })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Matrilines */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Matrilines (comma-separated)</label>
            <input
              type="text"
              value={formData.matrilines?.join(', ')}
              onChange={(e) => setFormData({
                ...formData,
                matrilines: e.target.value.split(',').map(m => m.trim()).filter(Boolean)
              })}
              placeholder="e.g., T18, T19"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          {/* Group Size */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Group Size</label>
            <input
              type="number"
              min="1"
              value={formData.groupSize}
              onChange={(e) => setFormData({
                ...formData,
                groupSize: parseInt(e.target.value)
              })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Add Sighting
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SightingForm; 