/** Where a vehicle is. Not whether its maintenance is behind, which is
 *  a different question with its own three answers. */
export const VEHICLE_STATUSES = ['active', 'in_shop', 'out_of_service'] as const;
export type VehicleStatus = (typeof VEHICLE_STATUSES)[number];

export const VEHICLE_STATUS_LABEL: Record<VehicleStatus, string> = {
  active: 'Active',
  in_shop: 'In shop',
  out_of_service: 'Out of service',
};

/** Rank, not alphabet: on the road first, retired last. */
export const VEHICLE_STATUS_RANK = new Map<string, number>(
  VEHICLE_STATUSES.map((status, index) => [status, index]),
);
