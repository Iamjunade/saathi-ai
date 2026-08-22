import { Router, Request, Response } from 'express';
import { prisma, formatHospitalFromDb, formatAuditLogFromDb } from '../db';
import { eventBus } from '../events/eventBus';

export const hospitalsRouter = Router();

// Haversine Distance Formula in Kilometers
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// GET /api/hospitals/nearby?lat=...&lng=...&radius=...&specialty=...
hospitalsRouter.get('/nearby', async (req: Request, res: Response) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);
    const radiusKm = req.query.radius ? parseFloat(req.query.radius as string) : 25;
    const specialty = req.query.specialty ? String(req.query.specialty) : null;

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({
        success: false,
        error: 'Query parameters lat and lng must be valid numbers.',
      });
    }

    const allHospitals = await prisma.hospital.findMany({
      orderBy: { availableBeds: 'desc' },
    });

    const formatted = allHospitals.map(formatHospitalFromDb);

    // Compute distance, ETA, and filter
    const scoredHospitals = formatted
      .map((hosp) => {
        const distKm = calculateDistanceKm(lat, lng, hosp.lat, hosp.lng);
        // Estimated travel speed in city traffic: ~30 km/h (2 mins per km) + 2 min dispatch buffer
        const estimatedEtaMins = Math.max(3, Math.round(distKm * 2.2 + 2));
        return {
          ...hosp,
          distanceKm: distKm,
          estimatedArrivalMins: estimatedEtaMins,
        };
      })
      .filter((hosp) => {
        if (hosp.distanceKm > radiusKm) return false;
        if (specialty && !hosp.specialties.includes(specialty)) return false;
        return true;
      })
      .sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));

    res.json({
      success: true,
      query: { lat, lng, radiusKm, specialty },
      count: scoredHospitals.length,
      data: scoredHospitals,
    });
  } catch (error: any) {
    console.error('Error querying nearby hospitals:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/hospitals - List all hospitals
hospitalsRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const all = await prisma.hospital.findMany({
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, count: all.length, data: all.map(formatHospitalFromDb) });
  } catch (error: any) {
    console.error('Error fetching hospitals:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/hospitals/:id
hospitalsRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const hosp = await prisma.hospital.findUnique({ where: { id } });
    if (!hosp) {
      return res.status(404).json({ success: false, error: `Hospital ${id} not found` });
    }
    res.json({ success: true, data: formatHospitalFromDb(hosp) });
  } catch (error: any) {
    console.error('Error fetching hospital by ID:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PATCH /api/hospitals/:id/capacity
hospitalsRouter.patch('/:id/capacity', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { availableBeds, capacity, status } = req.body;

    const data: any = {};
    if (availableBeds !== undefined) data.availableBeds = Number(availableBeds);
    if (capacity !== undefined) data.capacity = Number(capacity);
    if (status) data.status = String(status);

    const updated = await prisma.hospital.update({
      where: { id },
      data,
    });

    const formatted = formatHospitalFromDb(updated);

    // Broadcast capacity update
    eventBus.broadcastHospitalCapacityUpdated(formatted);

    res.json({ success: true, data: formatted });
  } catch (error: any) {
    console.error('Error updating hospital capacity:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
