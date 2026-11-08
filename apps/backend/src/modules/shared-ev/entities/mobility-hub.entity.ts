export class MobilityHub {
  id: string;
  name: string;
  area: string;
  parkingCapacity: number; // number of shared-EV parking spots
  operational: boolean;
}

/** Hub information returned to the client, enriched with live occupancy. */
export class HubOverview extends MobilityHub {
  parkedVehicles: number;
  freeSpots: number;
  availableVehicles: number;
}
