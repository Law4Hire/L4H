import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, useToast, useQuery } from '@l4h/shared-ui';
import { Calendar } from 'lucide-react';

interface TimeSlot {
  attorneyId: number;
  attorneyName: string;
  attorneyTitle: string;
  professionalType: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

interface GroupedSlots {
  [date: string]: TimeSlot[];
}

const SchedulingPage: React.FC = () => {
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [isVideoConference, setIsVideoConference] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [groupedSlots, setGroupedSlots] = useState<GroupedSlots>({});

  // Fetch available time slots
  const { data: slots = [], isLoading } = useQuery<TimeSlot[]>({
    queryKey: ['available-slots'],
    queryFn: async () => {
      const token = localStorage.getItem('jwt_token');
      const response = await fetch('/api/v1/meetings/available-slots', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to load available time slots');
      }

      return response.json();
    }
  });

  // Group slots by date when data changes
  useEffect(() => {
    if (slots.length > 0) {
      const grouped = slots.reduce((acc, slot) => {
        const date = new Date(slot.startTime).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });

        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push(slot);
        return acc;
      }, {} as GroupedSlots);

      setGroupedSlots(grouped);
    }
  }, [slots]);

  const handleBookAppointment = async () => {
    if (!selectedSlot) return;

    try {
      setIsBooking(true);
      const token = localStorage.getItem('jwt_token');

      const response = await fetch('/api/v1/meetings/book', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          attorneyId: selectedSlot.attorneyId,
          startTime: selectedSlot.startTime,
          endTime: selectedSlot.endTime,
          isVideoConference: isVideoConference,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to book appointment');
      }

      success('Appointment booked successfully!');
      navigate('/appointments');
    } catch (err: any) {
      console.error('Error booking appointment:', err);
      showError(err.message || 'Failed to book appointment');
    } finally {
      setIsBooking(false);
    }
  };

  const formatTime = (dateTimeString: string) => {
    return new Date(dateTimeString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading available time slots...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Schedule Your Consultation</h1>
        <p className="text-lg text-gray-600">
          Select a convenient time to meet with one of our legal professionals
        </p>
      </div>

      {Object.keys(groupedSlots).length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <Calendar className="mx-auto h-12 w-12 text-yellow-600 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Available Time Slots</h2>
          <p className="text-gray-600 mb-4">
            We don't have any available appointments at the moment. Please try again later or contact us directly.
          </p>
          <Button onClick={() => navigate('/dashboard')} variant="secondary">
            Return to Dashboard
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedSlots).map(([date, dateSlots]) => (
            <div key={date} className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{date}</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dateSlots.map((slot, index) => {
                  const isSelected = selectedSlot?.startTime === slot.startTime &&
                                    selectedSlot?.attorneyId === slot.attorneyId;

                  return (
                    <button
                      key={`${slot.attorneyId}-${slot.startTime}-${index}`}
                      onClick={() => setSelectedSlot(slot)}
                      className={`p-4 border-2 rounded-lg text-left transition-all ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-400 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="font-semibold text-gray-900">
                          {formatTime(slot.startTime)}
                        </div>
                        <div className={`text-xs px-2 py-1 rounded ${
                          slot.professionalType === 'Lawyer'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {slot.professionalType}
                        </div>
                      </div>
                      <div className="text-sm font-medium text-gray-700">{slot.attorneyName}</div>
                      <div className="text-xs text-gray-500 mt-1">{slot.attorneyTitle}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {selectedSlot && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Selected Appointment</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <div className="text-sm text-gray-600">Professional</div>
                  <div className="font-semibold text-gray-900">{selectedSlot.attorneyName}</div>
                  <div className="text-sm text-gray-600">{selectedSlot.attorneyTitle}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Time</div>
                  <div className="font-semibold text-gray-900">
                    {formatTime(selectedSlot.startTime)} - {formatTime(selectedSlot.endTime)}
                  </div>
                  <div className="text-sm text-gray-600">
                    {new Date(selectedSlot.startTime).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isVideoConference}
                    onChange={(e) => setIsVideoConference(e.target.checked)}
                    className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span className="ml-3 text-gray-700 font-medium">Schedule as Video Conference (Teams/Zoom)</span>
                </label>
                <p className="ml-8 text-sm text-gray-500 mt-1">A meeting link will be generated and sent to your email.</p>
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={handleBookAppointment}
                  loading={isBooking}
                  disabled={isBooking}
                  className="flex-1"
                >
                  Confirm Appointment
                </Button>
                <Button
                  onClick={() => setSelectedSlot(null)}
                  variant="secondary"
                  disabled={isBooking}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SchedulingPage;
