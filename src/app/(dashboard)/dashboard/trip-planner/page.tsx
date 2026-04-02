'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { FaRoute, FaMapMarkerAlt, FaExternalLinkAlt, FaGripVertical, FaTrash, FaClock, FaDollarSign, FaPlus } from 'react-icons/fa';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Order {
  id: string;
  contact_id: string;
  status: string;
  total: number | string;
  order_date: string;
  contact_name?: string;
  contact_city?: string;
  contact_state?: string;
  contact_address?: string;
  contact_zip?: string;
  contact_latitude?: number | null;
  contact_longitude?: number | null;
}

interface TripStopWithDistance {
  orderId: string;
  contactName: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  latitude: number | null;
  longitude: number | null;
  total: number;
  status: string;
  distanceFromPrevious?: number;
  googleMapsLink: string;
}

interface TripSummary {
  totalStops: number;
  stopsWithCoordinates: number;
  stopsWithoutCoordinates: number;
  totalRevenue: number;
}

interface SortableStopProps {
  stop: TripStopWithDistance;
  index: number;
  onRemove: (orderId: string) => void;
}

function SortableStop({ stop, index, onRemove }: SortableStopProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: stop.orderId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-start gap-3">
        <button
          {...attributes}
          {...listeners}
          className="mt-1 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
        >
          <FaGripVertical className="h-5 w-5" />
        </button>

        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 bg-green-100 text-green-700 rounded-full font-semibold text-sm">
                {index + 1}
              </span>
              <h3 className="font-semibold text-gray-900">{stop.contactName}</h3>
            </div>
            <button
              onClick={() => onRemove(stop.orderId)}
              className="text-red-500 hover:text-red-700"
              title="Remove from route"
            >
              <FaTrash className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-2 text-sm text-gray-600">
            <div className="flex items-start gap-1">
              <FaMapMarkerAlt className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{stop.address}, {stop.city}, {stop.state} {stop.zip}</span>
            </div>
          </div>

          <div className="mt-2 flex items-center gap-4 text-sm">
            <span className="text-gray-700">
              <span className="font-medium">Total:</span> ${typeof stop.total === 'number' ? stop.total.toFixed(2) : stop.total}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              stop.status === 'complete' ? 'bg-green-100 text-green-800' :
              stop.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
              stop.status === 'proposed' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {stop.status}
            </span>
          </div>

          {stop.distanceFromPrevious !== undefined && (
            <div className="mt-2 text-sm text-blue-600 font-medium">
              ↓ {stop.distanceFromPrevious.toFixed(1)} miles from previous stop
            </div>
          )}

          {!stop.latitude || !stop.longitude && (
            <div className="mt-2 text-sm text-orange-600">
              ⚠ No coordinates available for this address
            </div>
          )}

          <div className="mt-3">
            <a
              href={stop.googleMapsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
            >
              <FaExternalLinkAlt className="h-3 w-3" />
              Open in Google Maps
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

interface Trip {
  id: string;
  name: string;
  description?: string;
  trip_date?: string;
  status: string;
  created_at: string;
  order_count?: number;
}

export default function TripPlannerPage() {
  // Trip management
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTripName, setNewTripName] = useState('');
  const [newTripDescription, setNewTripDescription] = useState('');
  const [newTripDate, setNewTripDate] = useState('');

  // Order management
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [tripStops, setTripStops] = useState<TripStopWithDistance[]>([]);
  const [totalDistance, setTotalDistance] = useState<number>(0);
  const [directionsLink, setDirectionsLink] = useState<string>('');
  const [summary, setSummary] = useState<TripSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchTrips();
    fetchOrders();
  }, []);

  useEffect(() => {
    if (selectedTrip) {
      loadTripDetails(selectedTrip.id);
    }
  }, [selectedTrip]);

  const fetchTrips = async () => {
    try {
      const response = await fetch('/api/trips');
      if (response.ok) {
        const data = await response.json();
        setTrips(data.trips || []);
      } else {
        toast.error('Failed to load trips');
      }
    } catch (error) {
      console.error('Error fetching trips:', error);
      toast.error('Failed to load trips');
    }
  };

  const loadTripDetails = async (tripId: string) => {
    try {
      setSaving(true);
      const response = await fetch(`/api/trips/${tripId}`);
      if (response.ok) {
        const data = await response.json();
        setTripStops(data.stops);
        setTotalDistance(data.totalDistance);
        setDirectionsLink(data.directionsLink);
        setSummary(data.summary);
        setSelectedOrderIds(data.stops.map((s: TripStopWithDistance) => s.orderId));
      } else {
        toast.error('Failed to load trip details');
      }
    } catch (error) {
      console.error('Error loading trip details:', error);
      toast.error('Failed to load trip details');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateTrip = async () => {
    if (!newTripName.trim()) {
      toast.error('Please enter a trip name');
      return;
    }

    try {
      setSaving(true);
      const response = await fetch('/api/trips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newTripName,
          description: newTripDescription,
          trip_date: newTripDate || null,
          status: 'planned'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Trip created successfully!');
        setShowCreateModal(false);
        setNewTripName('');
        setNewTripDescription('');
        setNewTripDate('');
        await fetchTrips();
        setSelectedTrip(data.trip);
      } else {
        toast.error('Failed to create trip');
      }
    } catch (error) {
      console.error('Error creating trip:', error);
      toast.error('Failed to create trip');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTrip = async (tripId: string) => {
    if (!confirm('Are you sure you want to delete this trip?')) {
      return;
    }

    try {
      const response = await fetch(`/api/trips/${tripId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Trip deleted successfully!');
        await fetchTrips();
        if (selectedTrip?.id === tripId) {
          setSelectedTrip(null);
          setTripStops([]);
          setTotalDistance(0);
          setDirectionsLink('');
          setSummary(null);
        }
      } else {
        toast.error('Failed to delete trip');
      }
    } catch (error) {
      console.error('Error deleting trip:', error);
      toast.error('Failed to delete trip');
    }
  };

  const handleAddOrdersToTrip = async () => {
    if (!selectedTrip) {
      toast.error('Please select a trip first');
      return;
    }

    if (selectedOrderIds.length === 0) {
      toast.error('Please select at least one order');
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(`/api/trips/${selectedTrip.id}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderIds: selectedOrderIds }),
      });

      if (response.ok) {
        toast.success('Orders added to trip!');
        await loadTripDetails(selectedTrip.id);
      } else {
        toast.error('Failed to add orders to trip');
      }
    } catch (error) {
      console.error('Error adding orders to trip:', error);
      toast.error('Failed to add orders to trip');
    } finally {
      setSaving(false);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: '1',
        limit: '1000',
        sortField: 'order_date',
        sortDirection: 'desc',
      });

      const response = await fetch(`/api/orders?${params}`);
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      } else {
        toast.error('Failed to load orders');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleOrderSelect = (orderId: string) => {
    setSelectedOrderIds(prev => {
      if (prev.includes(orderId)) {
        return prev.filter(id => id !== orderId);
      } else {
        return [...prev, orderId];
      }
    });
  };

  const handleSelectAll = () => {
    const filteredOrders = getFilteredOrders();
    const allSelected = filteredOrders.every(order => selectedOrderIds.includes(order.id));

    if (allSelected) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(filteredOrders.map(order => order.id));
    }
  };



  const handleDragEnd = async (event: DragEndEvent) => {
    if (!selectedTrip) return;

    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = tripStops.findIndex(stop => stop.orderId === active.id);
      const newIndex = tripStops.findIndex(stop => stop.orderId === over.id);

      const newStops = arrayMove(tripStops, oldIndex, newIndex);

      // Update UI immediately
      setTripStops(newStops);

      // Update sequences in database
      try {
        const orderSequences = newStops.map((stop, index) => ({
          orderId: stop.orderId,
          sequence: index
        }));

        const response = await fetch(`/api/trips/${selectedTrip.id}/orders`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ orderSequences }),
        });

        if (response.ok) {
          // Reload trip details to get updated distances
          await loadTripDetails(selectedTrip.id);
        }
      } catch (error) {
        console.error('Error updating order sequence:', error);
        toast.error('Failed to update order sequence');
      }
    }
  };

  const handleRemoveStop = async (orderId: string) => {
    if (!selectedTrip) return;

    try {
      const response = await fetch(`/api/trips/${selectedTrip.id}/orders?orderId=${orderId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Order removed from trip');
        await loadTripDetails(selectedTrip.id);
        setSelectedOrderIds(prev => prev.filter(id => id !== orderId));
      } else {
        toast.error('Failed to remove order from trip');
      }
    } catch (error) {
      console.error('Error removing order from trip:', error);
      toast.error('Failed to remove order from trip');
    }
  };

  const getFilteredOrders = () => {
    if (!searchQuery) return orders;

    const query = searchQuery.toLowerCase();
    return orders.filter(order =>
      order.contact_name?.toLowerCase().includes(query) ||
      order.contact_city?.toLowerCase().includes(query) ||
      order.contact_state?.toLowerCase().includes(query) ||
      order.contact_address?.toLowerCase().includes(query)
    );
  };

  const filteredOrders = getFilteredOrders();
  const estimatedDriveTime = Math.round((totalDistance / 45) * 60); // Assuming 45 mph average

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading orders...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Trip Planner</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create named trips, add orders, and plan delivery routes with Google Maps
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
        >
          <FaPlus className="h-4 w-4" />
          New Trip
        </button>
      </div>

      {/* Create Trip Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Create New Trip</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Trip Name *
                </label>
                <input
                  type="text"
                  value={newTripName}
                  onChange={(e) => setNewTripName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., Monday Deliveries"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newTripDescription}
                  onChange={(e) => setNewTripDescription(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows={3}
                  placeholder="Optional notes about this trip..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Trip Date
                </label>
                <input
                  type="date"
                  value={newTripDate}
                  onChange={(e) => setNewTripDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={handleCreateTrip}
                disabled={saving || !newTripName.trim()}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {saving ? 'Creating...' : 'Create Trip'}
              </button>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewTripName('');
                  setNewTripDescription('');
                  setNewTripDate('');
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Trips List */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Trips</h2>

        {trips.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No trips yet. Create your first trip to get started!
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trips.map(trip => (
              <div
                key={trip.id}
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  selectedTrip?.id === trip.id
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-green-300'
                }`}
                onClick={() => setSelectedTrip(trip)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{trip.name}</h3>
                    {trip.description && (
                      <p className="text-sm text-gray-600 mt-1">{trip.description}</p>
                    )}
                    <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                      {trip.trip_date && (
                        <span>{format(new Date(trip.trip_date), 'MMM d, yyyy')}</span>
                      )}
                      <span>{trip.order_count || 0} orders</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTrip(trip.id);
                    }}
                    className="text-red-500 hover:text-red-700"
                  >
                    <FaTrash className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedTrip && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Order Selection */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Orders</h2>

            <div className="mb-4">
              <input
                type="text"
                placeholder="Search by customer, city, state, or address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div className="mb-4 flex items-center justify-between">
              <button
                onClick={handleSelectAll}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {filteredOrders.every(order => selectedOrderIds.includes(order.id)) ? 'Deselect All' : 'Select All'}
              </button>
              <span className="text-sm text-gray-600">
                {selectedOrderIds.length} selected
              </span>
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {filteredOrders.length === 0 ? (
                <p className="text-gray-500 text-sm">No orders found</p>
              ) : (
                filteredOrders.map(order => (
                  <label
                    key={order.id}
                    className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedOrderIds.includes(order.id)}
                      onChange={() => handleOrderSelect(order.id)}
                      className="mt-1 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">{order.contact_name || 'Unknown'}</span>
                        <span className="text-sm text-gray-600">${typeof order.total === 'number' ? order.total.toFixed(2) : order.total}</span>
                      </div>
                      <div className="text-sm text-gray-600 truncate">
                        {order.contact_address}, {order.contact_city}, {order.contact_state}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {format(new Date(order.order_date), 'MMM d, yyyy')} • {order.status}
                      </div>
                    </div>
                  </label>
                ))
              )}
            </div>

            <div className="mt-4">
              <button
                onClick={handleAddOrdersToTrip}
                disabled={selectedOrderIds.length === 0 || saving}
                className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'Adding...' : 'Add to Trip'}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column - Trip Route */}
        <div className="space-y-4">
          {tripStops.length > 0 ? (
            <>
              {/* Summary Card */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Route Summary</h2>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 text-blue-700">
                      <FaRoute className="h-5 w-5" />
                      <span className="text-sm font-medium">Total Distance</span>
                    </div>
                    <p className="mt-1 text-2xl font-bold text-blue-900">{totalDistance.toFixed(1)} mi</p>
                  </div>

                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 text-green-700">
                      <FaClock className="h-5 w-5" />
                      <span className="text-sm font-medium">Est. Drive Time</span>
                    </div>
                    <p className="mt-1 text-2xl font-bold text-green-900">
                      {estimatedDriveTime >= 60
                        ? `${Math.floor(estimatedDriveTime / 60)}h ${estimatedDriveTime % 60}m`
                        : `${estimatedDriveTime}m`
                      }
                    </p>
                  </div>

                  <div className="bg-purple-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 text-purple-700">
                      <FaMapMarkerAlt className="h-5 w-5" />
                      <span className="text-sm font-medium">Total Stops</span>
                    </div>
                    <p className="mt-1 text-2xl font-bold text-purple-900">{summary?.totalStops || 0}</p>
                  </div>

                  <div className="bg-yellow-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 text-yellow-700">
                      <FaDollarSign className="h-5 w-5" />
                      <span className="text-sm font-medium">Total Revenue</span>
                    </div>
                    <p className="mt-1 text-2xl font-bold text-yellow-900">
                      ${summary?.totalRevenue.toFixed(2) || '0.00'}
                    </p>
                  </div>
                </div>

                {directionsLink && (
                  <div className="mt-4">
                    <a
                      href={directionsLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <FaExternalLinkAlt className="h-4 w-4" />
                      Open Full Route in Google Maps
                    </a>
                  </div>
                )}

                {summary && summary.stopsWithoutCoordinates > 0 && (
                  <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <p className="text-sm text-orange-800">
                      ⚠ {summary.stopsWithoutCoordinates} stop(s) don&apos;t have coordinates.
                      Distances may be incomplete.
                    </p>
                  </div>
                )}
              </div>

              {/* Route Stops */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Delivery Route (Drag to Reorder)
                </h2>

                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={tripStops.map(stop => stop.orderId)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-3">
                      {tripStops.map((stop, index) => (
                        <SortableStop
                          key={stop.orderId}
                          stop={stop}
                          index={index}
                          onRemove={handleRemoveStop}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-center text-gray-500 py-12">
                <FaRoute className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p className="text-lg">No orders in trip yet</p>
                <p className="text-sm mt-2">Select orders from the left and click &quot;Add to Trip&quot;</p>
              </div>
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
}
