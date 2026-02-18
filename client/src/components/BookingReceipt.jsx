import React from "react";

function BookingReceipt({ booking, userData }) {
  return (
    <div
      id="booking-receipt"
      className="w-[794px] p-10 font-sans"
    >
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        
        {/* Gradient Header */}
        <div className="bg-gradient-to-r from-purple-600 to-violet-600 text-white p-8">
          <h1 className="text-3xl font-bold tracking-wide">
            Travel Tribe
          </h1>
          <p className="text-sm opacity-90 mt-1">
            Booking Confirmation Receipt
          </p>

          <div className="mt-4 text-sm">
            Receipt ID: <span className="font-semibold">{booking.receiptId}</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-10">

          {/* Top Meta Info */}
          <div className="flex justify-between text-sm text-gray-500 mb-8">
            <div>
              Generated On:{" "}
              <span className="font-medium text-gray-800">
                {new Date().toLocaleDateString("en-IN")}
              </span>
            </div>
            <div>
              Status:{" "}
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  booking.status === "confirmed"
                    ? "bg-green-100 text-green-700"
                    : booking.status === "pending"
                    ? "bg-yellow-100 text-yellow-700"
                    : booking.status === "cancelled"
                    ? "bg-red-100 text-red-700"
                    : "bg-blue-100 text-blue-700"
                }`}
              >
                {booking.status}
              </span>
            </div>
          </div>

          {/* Booking + Guest Grid */}
          <div className="grid grid-cols-2 gap-8">

            {/* Booking Card */}
            <div className="bg-gray-50 border rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-800">
                Booking Details
              </h2>

              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-500 text-xs">Hostel</p>
                  <p className="font-medium">{booking.hostelId}</p>
                </div>

                <div>
                  <p className="text-gray-500 text-xs">Room</p>
                  <p className="font-medium">{booking.roomSelection}</p>
                </div>

                <div>
                  <p className="text-gray-500 text-xs">Check-in</p>
                  <p className="font-medium">
                    {new Date(booking.checkInDate).toLocaleDateString("en-IN")}
                  </p>
                </div>

                <div>
                  <p className="text-gray-500 text-xs">Check-out</p>
                  <p className="font-medium">
                    {new Date(booking.checkOutDate).toLocaleDateString("en-IN")}
                  </p>
                </div>
              </div>
            </div>

            {/* Guest Card */}
            <div className="bg-gray-50 border rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-800">
                Guest Details
              </h2>

              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-500 text-xs">Name</p>
                  <p className="font-medium">{userData.name}</p>
                </div>

                <div>
                  <p className="text-gray-500 text-xs">Email</p>
                  <p className="font-medium">{userData.email}</p>
                </div>

                <div>
                  <p className="text-gray-500 text-xs">Phone</p>
                  <p className="font-medium">
                    {userData.phone || "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Section */}
          <div className="mt-10 bg-purple-50 border border-purple-200 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">
              Payment Summary
            </h2>
            <div className="border-t pt-4 flex justify-between text-lg font-bold text-purple-700">
              <span>Total Paid</span>
              <span>₹{booking.amount}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 text-center text-xs text-gray-500">
            <p>
              This is a system-generated receipt. No signature required.
            </p>
            <p className="mt-1">
              © Travel Tribe 2026 — Your trusted companion for comfortable stays
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}

export default BookingReceipt;
