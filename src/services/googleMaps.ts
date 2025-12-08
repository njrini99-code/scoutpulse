const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  formatted_address: string;
}

export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        address
      )}&key=${GOOGLE_MAPS_API_KEY}`
    );
    const data = await response.json();

    if (data.status === 'OK' && data.results[0]) {
      const location = data.results[0].geometry.location;
      return {
        latitude: location.lat,
        longitude: location.lng,
        formatted_address: data.results[0].formatted_address,
      };
    }
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

export interface RouteOptimizationResult {
  optimizedOrder: string[];
  totalDistance: number;
  totalDuration: number;
}

export async function optimizeRoute(
  waypoints: { id: string; lat: number; lng: number }[]
): Promise<RouteOptimizationResult | null> {
  if (waypoints.length < 2) {
    return null;
  }

  try {
    const origin = `${waypoints[0].lat},${waypoints[0].lng}`;
    const destination = `${waypoints[waypoints.length - 1].lat},${waypoints[waypoints.length - 1].lng}`;
    const waypointStr = waypoints
      .slice(1, -1)
      .map((w) => `${w.lat},${w.lng}`)
      .join('|');

    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&waypoints=optimize:true|${waypointStr}&key=${GOOGLE_MAPS_API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK') {
      const route = data.routes[0];
      const totalDistance = route.legs.reduce((sum: number, leg: any) => sum + leg.distance.value, 0);
      const totalDuration = route.legs.reduce((sum: number, leg: any) => sum + leg.duration.value, 0);

      const optimizedOrder = data.routes[0].waypoint_order.map((index: number) => waypoints[index + 1].id);
      optimizedOrder.unshift(waypoints[0].id);
      optimizedOrder.push(waypoints[waypoints.length - 1].id);

      return {
        optimizedOrder,
        totalDistance: totalDistance / 1609.34,
        totalDuration: totalDuration / 60,
      };
    }
    return null;
  } catch (error) {
    console.error('Route optimization error:', error);
    return null;
  }
}
