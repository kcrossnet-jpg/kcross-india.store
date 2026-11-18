import React, { useEffect, useState } from 'react';
import { Calendar, Check, Clock, MapPin } from 'lucide-react';
import { SERVICES, STORES } from '../data/catalog';
import { ServiceBooking } from '../types/store';
import { validateBookingForm } from '../utils/storeLogic';

interface ServicesViewProps {
  bookings: ServiceBooking[];
  defaultCustomer?: {
    name?: string;
    email?: string;
  };
  onCreateBooking: (booking: ServiceBooking) => void;
}

const TIME_SLOTS = ['11:00 AM', '12:30 PM', '2:30 PM', '4:30 PM', '6:30 PM'];

export const ServicesView: React.FC<ServicesViewProps> = ({
  bookings,
  defaultCustomer,
  onCreateBooking,
}) => {
  const [cityFilter, setCityFilter] = useState<string>('All');
  const [selectedServiceId, setSelectedServiceId] = useState<string>(SERVICES[0].id);
  const [selectedStoreId, setSelectedStoreId] = useState<string>(STORES[0].id);
  const [date, setDate] = useState<string>('2026-11-18');
  const [timeSlot, setTimeSlot] = useState<string>(TIME_SLOTS[0]);
  const [customerName, setCustomerName] = useState<string>(defaultCustomer?.name ?? '');
  const [email, setEmail] = useState<string>(defaultCustomer?.email ?? '');
  const [notes, setNotes] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmedId, setConfirmedId] = useState<string | null>(null);

  useEffect(() => {
    if (!defaultCustomer) return;
    setCustomerName((prev) => prev || defaultCustomer.name || '');
    setEmail((prev) => prev || defaultCustomer.email || '');
  }, [defaultCustomer]);

  const cities = ['All', ...Array.from(new Set(STORES.map((s) => s.city)))];
  const visibleStores =
    cityFilter === 'All' ? STORES : STORES.filter((s) => s.city === cityFilter);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateBookingForm({
      serviceId: selectedServiceId,
      storeId: selectedStoreId,
      date,
      timeSlot,
      customerName,
      email,
      notes,
    });
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    const svc = SERVICES.find((s) => s.id === selectedServiceId);
    const store = STORES.find((s) => s.id === selectedStoreId);
    if (!svc || !store) return;
    const id = `APT-${Math.floor(10000 + Math.random() * 90000)}`;

    const newBooking: ServiceBooking = {
      id,
      serviceId: svc.id,
      serviceName: svc.name,
      storeId: store.id,
      storeName: store.name,
      date,
      timeSlot,
      customerName: customerName.trim(),
      email: email.trim(),
      notes: notes.trim(),
      status: 'Confirmed',
      createdAt: new Date().toISOString(),
    };

    onCreateBooking(newBooking);
    setConfirmedId(id);
    setCustomerName(defaultCustomer?.name ?? '');
    setEmail(defaultCustomer?.email ?? '');
    setNotes('');
  };

  return (
    <section className="py-8 sm:py-10 space-y-10 sm:space-y-12">
      <div className="border-b border-[#EAE1D8] pb-5 sm:pb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#C2410C]">
          Flagship Studios &amp; Consultations
        </p>
        <h1 className="mt-1 font-display text-3xl sm:text-4xl font-medium text-[#1C1613]">
          In-Store Beauty Services &amp; Store Locator
        </h1>
        <p className="mt-1.5 text-sm text-[#6E6058] max-w-[65ch]">
          Book one-on-one consultations with our skin advisors, colour artists, and salon stylists
          across Mumbai, New Delhi, Bengaluru, and Hyderabad.
        </p>
      </div>

      {/* Services Menu + Booking Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* Left: 4 Services */}
        <div className="lg:col-span-7 space-y-4">
          <h2 className="font-display text-2xl font-medium text-[#1C1613]">
            1. Select a Studio Service
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {SERVICES.map((svc) => {
              const active = selectedServiceId === svc.id;
              return (
                <button
                  key={svc.id}
                  type="button"
                  onClick={() => setSelectedServiceId(svc.id)}
                  aria-pressed={active}
                  className={`flex flex-col justify-between rounded-xl border p-4 sm:p-5 text-left transition-all ${
                    active
                      ? 'border-[#C2410C] bg-white ring-1 ring-[#C2410C]'
                      : 'border-[#EAE1D8] bg-white hover:border-[#1C1613]'
                  }`}
                >
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#6E6058]">
                      <span>
                        {svc.category} · {svc.duration}
                      </span>
                      <span className="font-semibold text-[#C2410C]">{svc.priceLabel}</span>
                    </div>
                    <h3 className="mt-2 font-display text-lg font-medium text-[#1C1613]">
                      {svc.name}
                    </h3>
                    <p className="mt-1.5 text-xs text-[#574B44] leading-relaxed">
                      {svc.summary}
                    </p>
                  </div>

                  <ul className="mt-4 pt-3 border-t border-[#F5EFE8] space-y-1.5">
                    {svc.includes.map((inc) => (
                      <li key={inc} className="flex items-start gap-2 text-xs text-[#1C1613]">
                        <Check
                          className="h-3.5 w-3.5 text-[#C2410C] shrink-0 mt-0.5"
                          aria-hidden="true"
                        />
                        <span>{inc}</span>
                      </li>
                    ))}
                  </ul>
                </button>
              );
            })}
          </div>

          {/* Upcoming Confirmed Appointments */}
          {bookings.length > 0 && (
            <div className="pt-6 space-y-3">
              <h3 className="font-display text-xl font-medium text-[#1C1613]">
                Your Studio Appointments ({bookings.length})
              </h3>
              <div className="space-y-3">
                {bookings.map((b) => (
                  <div
                    key={b.id}
                    className="rounded-xl border border-[#EAE1D8] bg-white p-4 flex flex-wrap items-center justify-between gap-3 sm:gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2 text-xs text-[#6E6058]">
                        <span className="font-mono-num font-semibold text-[#1C1613]">{b.id}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-semibold text-[#2E6F40]">{b.status}</span>
                      </div>
                      <p className="mt-1 text-sm font-semibold text-[#1C1613]">{b.serviceName}</p>
                      <p className="text-xs text-[#6E6058]">{b.storeName}</p>
                    </div>
                    <div className="sm:text-right text-xs text-[#1C1613] tabular-nums">
                      <p className="font-semibold">{b.date}</p>
                      <p className="text-[#6E6058]">{b.timeSlot} · {b.customerName}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Booking Form */}
        <div className="lg:col-span-5 rounded-2xl border border-[#EAE1D8] bg-white p-5 sm:p-6">
          <h2 className="font-display text-2xl font-medium text-[#1C1613]">
            2. Reserve Your Slot
          </h2>
          <p className="mt-1 text-xs text-[#6E6058]">
            Instant confirmation · No advance payment required for complimentary sessions.
          </p>

          {confirmedId && (
            <div
              role="status"
              className="mt-4 rounded-xl border border-[#C6DFCB] bg-[#F3FAF5] p-3.5 text-xs text-[#1E462A]"
            >
              Appointment <strong className="font-mono-num">{confirmedId}</strong> confirmed. See
              your reservation details under Your Studio Appointments.
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
            <div>
              <label htmlFor="booking-service" className="block text-xs font-semibold text-[#1C1613] mb-1">
                Service
              </label>
              <select
                id="booking-service"
                value={selectedServiceId}
                onChange={(e) => setSelectedServiceId(e.target.value)}
                className="w-full rounded-lg border border-[#EAE1D8] bg-[#FCF9F5] px-3 py-2.5 text-sm text-[#1C1613] focus:border-[#C2410C] focus:outline-none"
              >
                {SERVICES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.priceLabel})
                  </option>
                ))}
              </select>
              {errors.serviceId && (
                <p className="mt-1 text-xs text-[#B91C1C]">{errors.serviceId}</p>
              )}
            </div>

            <div>
              <label htmlFor="booking-store" className="block text-xs font-semibold text-[#1C1613] mb-1">
                Store Location
              </label>
              <select
                id="booking-store"
                value={selectedStoreId}
                onChange={(e) => setSelectedStoreId(e.target.value)}
                className="w-full rounded-lg border border-[#EAE1D8] bg-[#FCF9F5] px-3 py-2.5 text-sm text-[#1C1613] focus:border-[#C2410C] focus:outline-none"
              >
                {STORES.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.city} — {st.name}
                  </option>
                ))}
              </select>
              {errors.storeId && (
                <p className="mt-1 text-xs text-[#B91C1C]">{errors.storeId}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="booking-date" className="block text-xs font-semibold text-[#1C1613] mb-1">
                  Preferred Date
                </label>
                <input
                  id="booking-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-lg border border-[#EAE1D8] bg-[#FCF9F5] px-3 py-2.5 text-sm text-[#1C1613] focus:border-[#C2410C] focus:outline-none"
                />
                {errors.date && <p className="mt-1 text-xs text-[#B91C1C]">{errors.date}</p>}
              </div>

              <div>
                <label htmlFor="booking-slot" className="block text-xs font-semibold text-[#1C1613] mb-1">
                  Time Slot
                </label>
                <select
                  id="booking-slot"
                  value={timeSlot}
                  onChange={(e) => setTimeSlot(e.target.value)}
                  className="w-full rounded-lg border border-[#EAE1D8] bg-[#FCF9F5] px-3 py-2.5 text-sm text-[#1C1613] focus:border-[#C2410C] focus:outline-none"
                >
                  {TIME_SLOTS.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
                {errors.timeSlot && (
                  <p className="mt-1 text-xs text-[#B91C1C]">{errors.timeSlot}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="booking-name" className="block text-xs font-semibold text-[#1C1613] mb-1">
                Full Name
              </label>
              <input
                id="booking-name"
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Meera Krishnan"
                className="w-full rounded-lg border border-[#EAE1D8] bg-[#FCF9F5] px-3 py-2.5 text-sm text-[#1C1613] focus:border-[#C2410C] focus:outline-none"
              />
              {errors.customerName && (
                <p className="mt-1 text-xs text-[#B91C1C]">{errors.customerName}</p>
              )}
            </div>

            <div>
              <label htmlFor="booking-email" className="block text-xs font-semibold text-[#1C1613] mb-1">
                Email
              </label>
              <input
                id="booking-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-[#EAE1D8] bg-[#FCF9F5] px-3 py-2.5 text-sm text-[#1C1613] focus:border-[#C2410C] focus:outline-none"
              />
              {errors.email && <p className="mt-1 text-xs text-[#B91C1C]">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="booking-notes" className="block text-xs font-semibold text-[#1C1613] mb-1">
                Skin / Hair Notes (Optional)
              </label>
              <textarea
                id="booking-notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Sensitive skin, colour-treated hair, or preferred fragrance notes"
                className="w-full rounded-lg border border-[#EAE1D8] bg-[#FCF9F5] px-3 py-2 text-sm text-[#1C1613] focus:border-[#C2410C] focus:outline-none"
              />
              {errors.notes && <p className="mt-1 text-xs text-[#B91C1C]">{errors.notes}</p>}
            </div>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#C2410C] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#9A3412]"
            >
              <Calendar className="h-4 w-4" aria-hidden="true" />
              <span>Confirm Appointment</span>
            </button>
          </form>
        </div>
      </div>

      {/* Store Locator Directory */}
      <div className="border-t border-[#EAE1D8] pt-10 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-medium text-[#1C1613]">
              Flagship Store Locator
            </h2>
            <p className="mt-1 text-sm text-[#6E6058]">
              Walk in for instant product pickup, shade trials, and gift wrapping.
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5 bg-[#F3ECE4] p-1 rounded-lg">
            {cities.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCityFilter(c)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                  cityFilter === c
                    ? 'bg-white text-[#1C1613] shadow-xs'
                    : 'text-[#6E6058] hover:text-[#1C1613]'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {visibleStores.map((store) => (
            <div
              key={store.id}
              className="flex flex-col justify-between rounded-xl border border-[#EAE1D8] bg-white p-5"
            >
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#C2410C]">
                  {store.city}
                </span>
                <h3 className="mt-1 font-display text-xl font-medium text-[#1C1613]">
                  {store.name}
                </h3>
                <div className="mt-3 space-y-2 text-xs text-[#574B44]">
                  <p className="flex items-start gap-2">
                    <MapPin className="h-3.5 w-3.5 text-[#6E6058] shrink-0 mt-0.5" aria-hidden="true" />
                    <span>{store.address}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-[#6E6058] shrink-0" aria-hidden="true" />
                    <span>{store.hours}</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedStoreId(store.id);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="mt-5 w-full rounded-lg border border-[#1C1613] px-3 py-2 text-xs font-semibold text-[#1C1613] hover:bg-[#1C1613] hover:text-white transition-colors"
              >
                Book at This Store
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
