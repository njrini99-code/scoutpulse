import { X, Clock, MapPin, Calendar, TrendingUp, CheckCircle, ArrowRight } from 'lucide-react';
import { RouteSummary } from '../../services/routeOptimization';

interface RouteSummaryModalProps {
  summary: RouteSummary;
  beforeSummary?: RouteSummary | null;
  onAccept: () => void;
  onCancel: () => void;
}

export function RouteSummaryModal({ summary, beforeSummary, onAccept, onCancel }: RouteSummaryModalProps) {
  const totalTimeMinutes = summary.totalDriveTime + summary.totalWorkTime;
  const totalHours = Math.floor(totalTimeMinutes / 60);
  const totalMinutes = totalTimeMinutes % 60;

  const driveHours = Math.floor(summary.totalDriveTime / 60);
  const driveMinutes = summary.totalDriveTime % 60;

  const workHours = Math.floor(summary.totalWorkTime / 60);
  const workMinutes = summary.totalWorkTime % 60;

  const timeSaved = beforeSummary ? beforeSummary.totalDriveTime - summary.totalDriveTime : 0;
  const percentSaved = beforeSummary && beforeSummary.totalDriveTime > 0
    ? Math.round((timeSaved / beforeSummary.totalDriveTime) * 100)
    : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MapPin className="w-7 h-7" />
              <div>
                <h2 className="text-2xl font-bold">Route Optimized</h2>
                <p className="text-blue-100 text-sm">Review your optimized schedule</p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 text-blue-700 mb-2">
                <Calendar className="w-5 h-5" />
                <span className="text-sm font-semibold">Total Stops</span>
              </div>
              <p className="text-3xl font-bold text-blue-900">{summary.totalAppointments}</p>
              <p className="text-xs text-blue-600 mt-1">
                {summary.totalNPs} NP + {summary.totalOSVs} OSV
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 text-green-700 mb-2">
                <Clock className="w-5 h-5" />
                <span className="text-sm font-semibold">Total Time</span>
              </div>
              <p className="text-3xl font-bold text-green-900">
                {totalHours}h {totalMinutes}m
              </p>
              <p className="text-xs text-green-600 mt-1">
                {summary.estimatedStartTime} - {summary.estimatedEndTime}
              </p>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
              <div className="flex items-center gap-2 text-orange-700 mb-2">
                <TrendingUp className="w-5 h-5" />
                <span className="text-sm font-semibold">Drive Time</span>
              </div>
              <p className="text-3xl font-bold text-orange-900">
                {driveHours}h {driveMinutes}m
              </p>
              <p className="text-xs text-orange-600 mt-1">
                {Math.round((summary.totalDriveTime / totalTimeMinutes) * 100)}% of day
              </p>
            </div>
          </div>

          <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-gray-600" />
              Route Details
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Work Time (in appointments)</span>
                <span className="font-semibold text-gray-900">
                  {workHours}h {workMinutes}m
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Travel Time</span>
                <span className="font-semibold text-gray-900">
                  {driveHours}h {driveMinutes}m
                </span>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Longest Drive</span>
                  <span className="font-semibold text-gray-900">
                    {summary.longestDrive} min
                  </span>
                </div>
                {summary.longestDriveBetween && (
                  <p className="text-xs text-gray-500 mt-1 text-right">
                    {summary.longestDriveBetween}
                  </p>
                )}
              </div>
            </div>
          </div>

          {beforeSummary && timeSaved > 0 && (
            <div className="bg-green-50 border-2 border-green-300 p-5 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <TrendingUp className="w-6 h-6 text-green-600" />
                <h3 className="font-bold text-green-900 text-lg">Optimization Results</h3>
              </div>
              <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-green-200">
                <div className="text-center flex-1">
                  <p className="text-xs text-gray-600 mb-1">Before</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.floor(beforeSummary.totalDriveTime / 60)}h {beforeSummary.totalDriveTime % 60}m
                  </p>
                </div>
                <ArrowRight className="w-6 h-6 text-green-600 mx-4" />
                <div className="text-center flex-1">
                  <p className="text-xs text-gray-600 mb-1">After</p>
                  <p className="text-2xl font-bold text-green-600">
                    {driveHours}h {driveMinutes}m
                  </p>
                </div>
                <div className="ml-4 bg-green-100 px-4 py-2 rounded-lg">
                  <p className="text-xs text-green-700 font-semibold">Saved</p>
                  <p className="text-xl font-bold text-green-600">
                    {timeSaved} min
                  </p>
                  <p className="text-xs text-green-600">({percentSaved}%)</p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <div className="flex gap-3">
              <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-900 mb-1">
                  Route Optimization Complete
                </p>
                <p className="text-xs text-blue-700 leading-relaxed">
                  This route has been optimized using geographic clustering and drive time
                  minimization. Review the schedule on your calendar before accepting.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-50 p-6 rounded-b-xl border-t flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onAccept}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl"
          >
            Accept & Save Schedule
          </button>
        </div>
      </div>
    </div>
  );
}
