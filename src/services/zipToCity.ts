export interface ZipCityMapping {
  zip: string;
  city: string;
  state: string;
}

export async function getCityFromZip(zipCode: string | number): Promise<string | null> {
  try {
    const zip = zipCode.toString().padStart(5, '0');

    const response = await fetch(`https://api.zippopotam.us/us/${zip}`);

    if (!response.ok) {
      console.error(`ZIP lookup failed for ${zip}`);
      return null;
    }

    const data = await response.json();

    if (data.places && data.places.length > 0) {
      return data.places[0]['place name'];
    }

    return null;
  } catch (error) {
    console.error('ZIP to city lookup error:', error);
    return null;
  }
}

export async function enrichLeadWithCity(
  leadId: string,
  zipCode: string | number
): Promise<string | null> {
  const city = await getCityFromZip(zipCode);

  if (!city) {
    return null;
  }

  return city;
}
