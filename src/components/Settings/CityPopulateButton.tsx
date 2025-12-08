import React, { useState } from 'react';
import { MapPin } from 'lucide-react';

export function CityPopulateButton() {
  const [isPopulating, setIsPopulating] = useState(false);
  const [result, setResult] = useState<{
    updated: number;
    failed: number;
    total: number;
  } | null>(null);

  const handlePopulateCities = async () => {
    setIsPopulating(true);
    setResult(null);

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/populate-cities`;
      const headers = {
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      };

      let totalUpdated = 0;
      let totalFailed = 0;
      let batch = 0;

      while (batch < 20) {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers,
        });

        if (!response.ok) {
          throw new Error('Failed to populate cities');
        }

        const data = await response.json();

        totalUpdated += data.updated || 0;
        totalFailed += data.failed || 0;

        if (data.updated === 0) {
          break;
        }

        batch++;
      }

      setResult({
        updated: totalUpdated,
        failed: totalFailed,
        total: totalUpdated + totalFailed,
      });
    } catch (error) {
      console.error('Error populating cities:', error);
      alert('Failed to populate cities. Please try again.');
    } finally {
      setIsPopulating(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-blue-50 rounded-lg">
          <MapPin className="w-6 h-6 text-blue-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Populate Cities from ZIP Codes
          </h3>
          <p className="text-gray-600 mb-4">
            Automatically fill in missing city data for all leads using their ZIP codes.
          </p>

          <button
            onClick={handlePopulateCities}
            disabled={isPopulating}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isPopulating ? 'Populating Cities...' : 'Populate Cities Now'}
          </button>

          {result && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-semibold text-green-900 mb-2">
                City Population Complete
              </h4>
              <div className="text-sm text-green-800 space-y-1">
                <p>✓ Updated: {result.updated} leads</p>
                {result.failed > 0 && <p>✗ Failed: {result.failed} leads</p>}
                <p>Total Processed: {result.total} leads</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
