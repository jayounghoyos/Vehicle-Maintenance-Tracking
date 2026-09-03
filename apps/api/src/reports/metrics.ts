import type { MetricDefinition, MetricId } from './reports.types';

/**
 * What the schema can actually answer. There is no cost column anywhere
 * in the model, so there are no spend reports: offering one would mean
 * inventing the numbers.
 */
export const METRICS: Record<MetricId, MetricDefinition> = {
  servicesPerMonth: {
    id: 'servicesPerMonth',
    label: 'Services per month',
    charts: ['line', 'area', 'bar'],
    tone: 'neutral',
  },
  servicesByType: {
    id: 'servicesByType',
    label: 'Planned vs breakdown',
    charts: ['donut', 'bar'],
    tone: 'neutral',
  },
  servicesByTask: {
    id: 'servicesByTask',
    label: 'Services by task',
    charts: ['bar', 'donut'],
    tone: 'neutral',
  },
  servicesByVehicle: {
    id: 'servicesByVehicle',
    label: 'Services by vehicle',
    charts: ['bar'],
    tone: 'neutral',
  },
  servicesByMechanic: {
    id: 'servicesByMechanic',
    label: 'Services by who recorded them',
    charts: ['bar'],
    tone: 'neutral',
  },
  fleetByState: {
    id: 'fleetByState',
    label: 'Fleet by maintenance state',
    charts: ['donut', 'bar'],
    tone: 'state',
  },
  fleetByStatus: {
    id: 'fleetByStatus',
    label: 'Fleet by status',
    charts: ['donut', 'bar'],
    tone: 'neutral',
  },
  fleetByMake: {
    id: 'fleetByMake',
    label: 'Fleet by make',
    charts: ['bar', 'donut'],
    tone: 'neutral',
  },
  odometerByVehicle: {
    id: 'odometerByVehicle',
    label: 'Odometer by vehicle',
    charts: ['bar'],
    tone: 'neutral',
  },
};
