import { useState } from 'react';
import { Upload, CheckCircle, AlertCircle, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { geocodeAddress } from '../../services/googleMaps';
import { enrichBusinessData } from '../../services/serper';

interface CSVImportProps {
  onClose: () => void;
  onComplete: () => void;
}

export function CSVImport({ onClose, onComplete }: CSVImportProps) {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{ success: number; errors: number } | null>(null);
  const { user } = useAuth();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResults(null);
    }
  };

  const parseCSV = (text: string): any[] => {
    const lines = text.split('\n');
    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());

    const records = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;

      const values = lines[i].split(',');
      const record: any = {};

      headers.forEach((header, index) => {
        const value = values[index]?.trim();
        if (value) {
          record[header] = value;
        }
      });

      if (record.business_name || record.name) {
        records.push(record);
      }
    }

    return records;
  };

  const handleImport = async () => {
    if (!file || !user) return;

    setImporting(true);
    setProgress(0);

    try {
      const text = await file.text();
      const records = parseCSV(text);

      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < records.length; i++) {
        const record = records[i];
        setProgress(Math.round(((i + 1) / records.length) * 100));

        try {
          const address = `${record.address || ''} ${record.city || ''} ${record.state || ''} ${
            record.zip || ''
          }`.trim();

          let latitude = null;
          let longitude = null;

          if (address) {
            const geocode = await geocodeAddress(address);
            if (geocode) {
              latitude = geocode.latitude;
              longitude = geocode.longitude;
            }
          }

          const enrichment = await enrichBusinessData(
            record.business_name || record.name,
            record.city,
            record.state
          );

          const leadData = {
            user_id: user.id,
            business_name: record.business_name || record.name || null,
            industry: record.industry || null,
            address: record.address || null,
            city: record.city || null,
            state: record.state || null,
            zip: record.zip || null,
            latitude,
            longitude,
            phone: record.phone || enrichment?.phone || null,
            email: record.email || enrichment?.email || null,
            website: record.website || enrichment?.website || null,
            owner_name: record.owner_name || record.owner || null,
            decision_maker_title: record.decision_maker_title || record.title || null,
            competitor: record.competitor || null,
            pain_points: record.pain_points || enrichment?.description || null,
            notes: record.notes || null,
            status: record.status || 'prospect',
            deal_stage: record.deal_stage || null,
            deal_value: record.deal_value ? parseFloat(record.deal_value) : null,
            np_set: false,
            osv_completed: false,
          };

          const { error } = await supabase.from('leads').insert(leadData);

          if (error) {
            errorCount++;
            console.error('Import error:', error);
          } else {
            successCount++;
          }
        } catch (err) {
          errorCount++;
          console.error('Record processing error:', err);
        }
      }

      setResults({ success: successCount, errors: errorCount });
      onComplete();
    } catch (error) {
      console.error('CSV import error:', error);
      setResults({ success: 0, errors: 1 });
    }

    setImporting(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Import CSV</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!results ? (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">
                {file ? file.name : 'Choose a CSV file or drag it here'}
              </p>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="csv-upload"
              />
              <label
                htmlFor="csv-upload"
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer font-medium"
              >
                Select File
              </label>
            </div>

            {importing && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Importing...</span>
                  <span className="text-sm font-medium text-gray-900">{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Geocoding addresses and enriching business data...
                </p>
              </div>
            )}

            <button
              onClick={handleImport}
              disabled={!file || importing}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {importing ? 'Importing...' : 'Import CSV'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div>
                <p className="font-semibold text-green-900">{results.success} records imported</p>
              </div>
            </div>

            {results.errors > 0 && (
              <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-600" />
                <div>
                  <p className="font-semibold text-red-900">{results.errors} records failed</p>
                </div>
              </div>
            )}

            <button
              onClick={onClose}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
