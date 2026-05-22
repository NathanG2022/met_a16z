import React from 'react';

export default function Subscriptions() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Subscriptions</h1>
          <p className="text-gray-600">Manage your subscription and billing preferences</p>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl text-gray-400">💳</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Subscription Management</h2>
            <p className="text-gray-600 mb-6">This page is under development. Subscription features will be available soon.</p>
            
            {/* Placeholder Cards */}
            <div className="grid md:grid-cols-3 gap-6 mt-8">
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2">Current Plan</h3>
                <p className="text-gray-600 text-sm">Free Plan</p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2">Billing Cycle</h3>
                <p className="text-gray-600 text-sm">Monthly</p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2">Next Payment</h3>
                <p className="text-gray-600 text-sm">N/A</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 