import { Lead } from '../types/database';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

interface Coordinates {
  lat: number;
  lng: number;
}

interface GeocodedLead extends Lead {
  coordinates?: Coordinates;
}

interface OptimizedSchedule {
  lead: Lead;
  startTime: string;
  endTime: string;
  travelTimeFromPrevious: number;
}

export interface RouteSummary {
  totalAppointments: number;
  totalOSVs: number;
  totalNPs: number;
  totalDriveTime: number;
  totalWorkTime: number;
  estimatedStartTime: string;
  estimatedEndTime: string;
  longestDrive: number;
  longestDriveBetween: string;
}

export async function geocodeAddress(address: string): Promise<Coordinates | null> {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`
    );
    const data = await response.json();

    if (data.status === 'OK' && data.results.length > 0) {
      return data.results[0].geometry.location;
    }
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

export async function getDistanceMatrix(
  origins: Coordinates[],
  destinations: Coordinates[],
  sessionToken?: string
): Promise<number[][]> {
  console.log('[getDistanceMatrix] Called with', origins.length, 'origins and', destinations.length, 'destinations');

  if (origins.length === 0 || destinations.length === 0) {
    console.log('[getDistanceMatrix] Empty input arrays');
    return [];
  }

  try {
    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/route-distance-matrix`;
    console.log('[getDistanceMatrix] Calling API:', apiUrl);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (sessionToken) {
      headers['Authorization'] = `Bearer ${sessionToken}`;
    } else {
      headers['Authorization'] = `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`;
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ origins, destinations }),
    });

    console.log('[getDistanceMatrix] Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[getDistanceMatrix] HTTP error:', response.status, errorText);
      return [];
    }

    const data = await response.json();
    console.log('[getDistanceMatrix] Response data keys:', Object.keys(data));

    if (data.matrix) {
      console.log('[getDistanceMatrix] SUCCESS: Distance matrix received, size:', data.matrix.length, 'x', data.matrix[0]?.length);
      return data.matrix;
    }

    console.error('[getDistanceMatrix] No matrix in response. Data:', data);
    return [];
  } catch (error) {
    console.error('[getDistanceMatrix] Exception:', error);
    console.error('[getDistanceMatrix] Error details:', error instanceof Error ? error.message : String(error));
    return [];
  }
}

function timeToMinutes(time: string): number {
  if (!time) return 0;

  const parts = time.trim().split(' ');

  if (parts.length === 1) {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + (minutes || 0);
  }

  const [timeStr, period] = parts;
  let [hours, minutes] = timeStr.split(':').map(Number);

  if (!minutes) minutes = 0;

  if (period === 'PM' && hours !== 12) {
    hours += 12;
  } else if (period === 'AM' && hours === 12) {
    hours = 0;
  }

  return hours * 60 + minutes;
}

function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours > 12 ? hours - 12 : (hours === 0 ? 12 : hours);
  return `${displayHour}:${mins.toString().padStart(2, '0')} ${ampm}`;
}

function solveModifiedTSP(
  distanceMatrix: number[][],
  fixedAppointments: { index: number; startTime: number; endTime: number }[],
  flexibleIndices: number[]
): number[] {
  const n = flexibleIndices.length;
  if (n === 0) return [];

  const route: number[] = [];
  const visited = new Set<number>();
  let currentTime = 8 * 60;

  const sortedFixed = [...fixedAppointments].sort((a, b) => a.startTime - b.startTime);

  for (const fixedAppt of sortedFixed) {
    const timeUntilFixed = fixedAppt.startTime - currentTime;

    let unassigned = flexibleIndices.filter(idx => !visited.has(idx));

    while (unassigned.length > 0 && currentTime < fixedAppt.startTime) {
      let bestIdx = -1;
      let bestScore = -Infinity;

      for (const idx of unassigned) {
        const lastPos = route.length > 0 ? route[route.length - 1] : 0;
        const travelTimeSeconds = distanceMatrix[lastPos][idx];
        const travelTime = travelTimeSeconds / 60;
        const visitDuration = 15;
        const endTime = currentTime + travelTime + visitDuration;

        // Calculate travel time from this OSV to the fixed appointment
        const travelToFixed = distanceMatrix[idx][fixedAppt.index] / 60;

        // Check if we can complete this OSV AND still make it to the fixed appointment on time
        if (endTime + travelToFixed <= fixedAppt.startTime) {
          const score = 1 / (travelTime + 1);
          if (score > bestScore) {
            bestScore = score;
            bestIdx = idx;
          }
        }
      }

      if (bestIdx === -1) break;

      const lastPos = route.length > 0 ? route[route.length - 1] : 0;
      const travelTime = distanceMatrix[lastPos][bestIdx] / 60;
      const travelToFixed = distanceMatrix[bestIdx][fixedAppt.index] / 60;
      console.log(`TSP: Selected stop ${bestIdx}, travel time from ${lastPos}: ${Math.round(travelTime)} min, then ${Math.round(travelToFixed)} min to NP`);

      route.push(bestIdx);
      visited.add(bestIdx);
      currentTime += travelTime + 15;
      unassigned = flexibleIndices.filter(idx => !visited.has(idx));
    }

    // Travel to the fixed appointment
    const lastPos = route.length > 0 ? route[route.length - 1] : 0;
    const travelToFixed = distanceMatrix[lastPos][fixedAppt.index] / 60;
    currentTime = Math.max(currentTime + travelToFixed, fixedAppt.startTime);
    currentTime = fixedAppt.endTime;
  }

  const remaining = flexibleIndices.filter(idx => !visited.has(idx));
  for (const idx of remaining) {
    route.push(idx);
  }

  return route;
}

function apply2OptImprovement(
  route: number[],
  distanceMatrix: number[][],
  fixedAppointments: { index: number; startTime: number; endTime: number }[],
  maxIterations: number = 100
): number[] {
  if (route.length < 4) return route;

  let improved = true;
  let iterations = 0;
  let bestRoute = [...route];
  let bestDistance = calculateRouteDistance(bestRoute, distanceMatrix);

  console.log(`Starting 2-opt improvement. Initial distance: ${Math.round(bestDistance / 60)} minutes`);

  while (improved && iterations < maxIterations) {
    improved = false;
    iterations++;

    for (let i = 0; i < bestRoute.length - 2; i++) {
      for (let j = i + 2; j < bestRoute.length; j++) {
        const newRoute = twoOptSwap(bestRoute, i, j);
        const newDistance = calculateRouteDistance(newRoute, distanceMatrix);

        if (newDistance < bestDistance && validateTimeConstraints(newRoute, distanceMatrix, fixedAppointments)) {
          bestRoute = newRoute;
          bestDistance = newDistance;
          improved = true;
          console.log(`2-opt: Improved route by swapping positions ${i} and ${j}. New distance: ${Math.round(bestDistance / 60)} min`);
        }
      }
    }
  }

  console.log(`2-opt complete after ${iterations} iterations. Final distance: ${Math.round(bestDistance / 60)} minutes`);
  return bestRoute;
}

function validateTimeConstraints(
  route: number[],
  distanceMatrix: number[][],
  fixedAppointments: { index: number; startTime: number; endTime: number }[]
): boolean {
  let currentTime = 8 * 60;
  let lastPos = 0;
  const sortedFixed = [...fixedAppointments].sort((a, b) => a.startTime - b.startTime);

  let routeIdx = 0;

  for (const fixedAppt of sortedFixed) {
    while (routeIdx < route.length) {
      const idx = route[routeIdx];
      const travelTime = distanceMatrix[lastPos][idx] / 60;
      const arrivalTime = currentTime + travelTime;
      const departureTime = arrivalTime + 15;

      // Calculate travel time from this OSV to the fixed appointment
      const travelToFixed = distanceMatrix[idx][fixedAppt.index] / 60;

      // Check if we can complete this OSV AND still make it to the fixed appointment on time
      if (departureTime + travelToFixed <= fixedAppt.startTime) {
        currentTime = departureTime;
        lastPos = idx;
        routeIdx++;
      } else {
        break;
      }
    }

    // Now travel to the fixed appointment
    const travelToFixedTime = distanceMatrix[lastPos][fixedAppt.index] / 60;
    const arrivalAtFixed = currentTime + travelToFixedTime;

    // If we can't make it on time, this route is invalid
    if (arrivalAtFixed > fixedAppt.startTime) {
      return false;
    }

    currentTime = fixedAppt.endTime;
    lastPos = fixedAppt.index;
  }

  return true;
}

function twoOptSwap(route: number[], i: number, j: number): number[] {
  const newRoute = [...route.slice(0, i + 1), ...route.slice(i + 1, j + 1).reverse(), ...route.slice(j + 1)];
  return newRoute;
}

function calculateRouteDistance(route: number[], distanceMatrix: number[][]): number {
  let totalDistance = 0;
  let prevIdx = 0;

  for (const idx of route) {
    totalDistance += distanceMatrix[prevIdx][idx] || 0;
    prevIdx = idx;
  }

  return totalDistance;
}

export async function optimizeRoute(
  appointments: Lead[],
  selectedDate: Date,
  startingPointLat?: number,
  startingPointLng?: number,
  sessionToken?: string
): Promise<OptimizedSchedule[]> {
  console.log('optimizeRoute called with:', appointments.length, 'appointments');
  console.log('Starting point:', { lat: startingPointLat, lng: startingPointLng });
  console.log('Appointments detail:', appointments.map(a => ({
    name: a.business_name,
    type: a.appointment_type,
    time: a.appointment_time,
    latitude: a.latitude,
    longitude: a.longitude,
    address: a.address,
    city: a.city,
    state: a.state,
    zip: a.zip
  })));

  const npAppointments = appointments.filter(
    apt => apt.appointment_type === 'NP' && apt.appointment_time
  );
  const osvAppointments = appointments.filter(
    apt => apt.appointment_type === 'OSV'
  );

  console.log('Filtered:', { NP: npAppointments.length, OSV: osvAppointments.length });

  if (osvAppointments.length === 0) {
    console.log('No OSV appointments found');
    return [];
  }

  const allLeads: GeocodedLead[] = [...npAppointments, ...osvAppointments];

  console.log('Processing coordinates for', allLeads.length, 'leads');

  try {
    for (const lead of allLeads) {
      if (lead.latitude && lead.longitude) {
        lead.coordinates = { lat: lead.latitude, lng: lead.longitude };
        console.log(`Using stored coords for ${lead.business_name}:`, lead.coordinates);
      } else if (lead.address) {
        let addressToGeocode = lead.address;

        if (!addressToGeocode.includes(',')) {
          addressToGeocode = `${lead.address}${lead.city ? ', ' + lead.city : ''}${lead.state ? ', ' + lead.state : ''}${lead.zip ? ' ' + lead.zip : ''}`;
        }

        console.log(`Geocoding address for ${lead.business_name}:`, addressToGeocode);
        const coords = await geocodeAddress(addressToGeocode.trim());
        if (coords) {
          lead.coordinates = coords;
          console.log(`Geocoded ${lead.business_name}:`, coords);
        } else {
          console.warn(`Failed to geocode ${lead.business_name} with address: ${addressToGeocode}`);
        }
      } else {
        console.warn(`No address or coordinates for ${lead.business_name} - this appointment will be skipped`);
      }
    }
  } catch (error) {
    console.error('Error processing coordinates:', error);
    return [];
  }

  const leadsWithCoords = allLeads.filter(lead => lead.coordinates);
  const leadsWithoutCoords = allLeads.filter(l => !l.coordinates);

  console.log('Leads with valid coordinates:', leadsWithCoords.length, 'out of', allLeads.length);
  console.log('Leads WITH coords:', leadsWithCoords.map(l => ({
    name: l.business_name,
    type: l.appointment_type,
    coords: l.coordinates,
    lat: l.latitude,
    lng: l.longitude
  })));
  console.log('Leads WITHOUT coords:', leadsWithoutCoords.map(l => ({
    name: l.business_name,
    type: l.appointment_type,
    lat: l.latitude,
    lng: l.longitude,
    address: l.address,
    city: l.city
  })));

  if (leadsWithCoords.length === 0) {
    console.error('ERROR: No leads have valid coordinates after processing');
    console.error('Appointments without recognizable addresses:', leadsWithoutCoords.map(l => l.business_name).join(', '));
    throw new Error(`Address not recognized for: ${leadsWithoutCoords.map(l => l.business_name || 'Unknown').join(', ')}. Please add valid addresses.`);
  }

  if (leadsWithCoords.length < osvAppointments.length) {
    console.warn(`WARNING: ${osvAppointments.length - leadsWithCoords.filter(l => l.appointment_type === 'OSV').length} OSV appointments missing coordinates will be excluded`);
  }

  const startingPoint = (startingPointLat && startingPointLng)
    ? { lat: startingPointLat, lng: startingPointLng }
    : null;

  const coords = startingPoint
    ? [startingPoint, ...leadsWithCoords.map(lead => lead.coordinates!)]
    : leadsWithCoords.map(lead => lead.coordinates!);

  console.log('Building distance matrix for', coords.length, 'locations');
  console.log('Starting point:', startingPoint ? 'Custom location' : 'First appointment');
  console.log('Sample coordinates:', coords.slice(0, 3));

  let distanceMatrix: number[][];
  try {
    distanceMatrix = await getDistanceMatrix(coords, coords, sessionToken);
    console.log('Distance matrix call completed, length:', distanceMatrix.length);
  } catch (error) {
    console.error('ERROR calling getDistanceMatrix:', error);
    return [];
  }

  if (!distanceMatrix || distanceMatrix.length === 0) {
    console.log('ERROR: Distance matrix failed to generate (empty or null)');
    return [];
  }

  console.log('Distance matrix generated:', distanceMatrix.length, 'rows');
  console.log('Sample distances (row 0):', distanceMatrix[0]?.slice(0, 5));

  const indexOffset = startingPoint ? 1 : 0;

  const fixedAppointments = npAppointments
    .filter(apt => apt.appointment_time && apt.coordinates)
    .map(apt => {
      const index = leadsWithCoords.indexOf(apt);
      const startTime = timeToMinutes(apt.appointment_time!);
      const duration = apt.appointment_duration || 30;
      return {
        index: index === -1 ? -1 : index + indexOffset,
        startTime,
        endTime: startTime + duration,
      };
    })
    .filter(apt => apt.index !== -1);

  console.log('Fixed appointments (NP):', fixedAppointments);

  const flexibleIndices = osvAppointments
    .filter(apt => apt.coordinates)
    .map(apt => leadsWithCoords.indexOf(apt))
    .filter(idx => idx !== -1)
    .map(idx => idx + indexOffset);

  console.log('Flexible indices (OSV):', flexibleIndices);

  let optimizedOSVOrder = solveModifiedTSP(distanceMatrix, fixedAppointments, flexibleIndices);
  console.log('Optimized OSV order from TSP:', optimizedOSVOrder);

  if (optimizedOSVOrder.length >= 4) {
    console.log('Applying 2-opt improvement...');
    optimizedOSVOrder = apply2OptImprovement(optimizedOSVOrder, distanceMatrix, fixedAppointments);
    console.log('Optimized OSV order after 2-opt:', optimizedOSVOrder);
  }

  const schedule: OptimizedSchedule[] = [];
  let currentTime = 8 * 60;
  let lastScheduledIndex = 0;
  const sortedFixed = [...fixedAppointments].sort((a, b) => a.startTime - b.startTime);

  console.log('Scheduling appointments with optimized OSV route...');

  let osvIndex = 0;
  const scheduledOSVs = new Set<number>();

  for (const fixedAppt of sortedFixed) {
    while (osvIndex < optimizedOSVOrder.length) {
      const osvIdx = optimizedOSVOrder[osvIndex];
      const lead = leadsWithCoords[osvIdx - indexOffset];
      const travelTimeSeconds = distanceMatrix[lastScheduledIndex][osvIdx];
      const travelTime = travelTimeSeconds / 60;
      const startTime = currentTime + travelTime;
      const duration = 15;
      const endTime = startTime + duration;

      // Calculate travel time from this OSV to the fixed appointment
      const travelToFixedSeconds = distanceMatrix[osvIdx][fixedAppt.index];
      const travelToFixed = travelToFixedSeconds / 60;

      // Check if we can complete this OSV AND still make it to the fixed appointment on time
      if (endTime + travelToFixed <= fixedAppt.startTime) {
        console.log(`Scheduling OSV ${lead.business_name}: travel=${Math.round(travelTime)}min, start=${minutesToTime(Math.round(startTime))}, end=${minutesToTime(Math.round(endTime))}, travel to NP=${Math.round(travelToFixed)}min`);

        schedule.push({
          lead,
          startTime: minutesToTime(Math.round(startTime)),
          endTime: minutesToTime(Math.round(endTime)),
          travelTimeFromPrevious: Math.round(travelTime),
        });
        currentTime = endTime;
        lastScheduledIndex = osvIdx;
        scheduledOSVs.add(osvIdx);
        osvIndex++;
      } else {
        console.log(`Skipping OSV ${lead.business_name}: would finish at ${minutesToTime(Math.round(endTime))}, need ${Math.round(travelToFixed)}min to reach NP at ${minutesToTime(fixedAppt.startTime)}`);
        break;
      }
    }

    const npLead = leadsWithCoords[fixedAppt.index - indexOffset];
    const travelTimeSeconds = distanceMatrix[lastScheduledIndex][fixedAppt.index];
    const travelTime = travelTimeSeconds / 60;

    if (currentTime < fixedAppt.startTime) {
      currentTime = fixedAppt.startTime;
    }

    console.log(`Scheduling fixed NP ${npLead.business_name}: at ${minutesToTime(fixedAppt.startTime)}`);

    schedule.push({
      lead: npLead,
      startTime: minutesToTime(fixedAppt.startTime),
      endTime: minutesToTime(fixedAppt.endTime),
      travelTimeFromPrevious: Math.round(travelTime),
    });
    currentTime = fixedAppt.endTime;
    lastScheduledIndex = fixedAppt.index;
  }

  while (osvIndex < optimizedOSVOrder.length) {
    const osvIdx = optimizedOSVOrder[osvIndex];
    const lead = leadsWithCoords[osvIdx - indexOffset];
    const travelTimeSeconds = distanceMatrix[lastScheduledIndex][osvIdx];
    const travelTime = travelTimeSeconds / 60;
    const startTime = currentTime + travelTime;
    const duration = 15;

    console.log(`Scheduling remaining OSV ${lead.business_name}: travel=${Math.round(travelTime)}min, start=${minutesToTime(Math.round(startTime))}`);

    schedule.push({
      lead,
      startTime: minutesToTime(Math.round(startTime)),
      endTime: minutesToTime(Math.round(startTime + duration)),
      travelTimeFromPrevious: Math.round(travelTime),
    });
    currentTime = startTime + duration;
    lastScheduledIndex = osvIdx;
    osvIndex++;
  }

  console.log('Final schedule length:', schedule.length);
  console.log('Final schedule:', schedule.map(s => ({ business: s.lead.business_name, time: s.startTime, type: s.lead.appointment_type })));

  const osvInSchedule = schedule.filter(s => s.lead.appointment_type === 'OSV');
  console.log(`OSVs in final schedule: ${osvInSchedule.length} out of ${osvAppointments.length} original OSVs`);

  return schedule;
}

export function calculateRouteSummary(schedule: OptimizedSchedule[]): RouteSummary {
  const totalAppointments = schedule.length;
  const totalOSVs = schedule.filter(s => s.lead.appointment_type === 'OSV').length;
  const totalNPs = schedule.filter(s => s.lead.appointment_type === 'NP').length;

  const totalDriveTime = schedule.reduce((sum, item) => sum + item.travelTimeFromPrevious, 0);

  const totalWorkTime = schedule.reduce((sum, item) => {
    const duration = item.lead.appointment_type === 'NP'
      ? (item.lead.appointment_duration || 30)
      : 15;
    return sum + duration;
  }, 0);

  const estimatedStartTime = schedule.length > 0 ? schedule[0].startTime : '8:00 AM';
  const estimatedEndTime = schedule.length > 0 ? schedule[schedule.length - 1].endTime : '8:00 AM';

  let longestDrive = 0;
  let longestDriveBetween = '';

  schedule.forEach((item, idx) => {
    if (item.travelTimeFromPrevious > longestDrive) {
      longestDrive = item.travelTimeFromPrevious;
      const prevBusiness = idx > 0 ? schedule[idx - 1].lead.business_name : 'Start';
      longestDriveBetween = `${prevBusiness} → ${item.lead.business_name}`;
    }
  });

  return {
    totalAppointments,
    totalOSVs,
    totalNPs,
    totalDriveTime,
    totalWorkTime,
    estimatedStartTime,
    estimatedEndTime,
    longestDrive,
    longestDriveBetween,
  };
}
