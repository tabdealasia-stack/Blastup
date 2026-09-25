'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { tabdealApi, ApiError } from '@/lib/api';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';

export function ClientWhatsAppSection({ clientId, initialWhatsapp }: { clientId: string, initialWhatsapp: any }) {
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [showReconnectConfirm, setShowReconnectConfirm] = useState(false);

  // Poll status occasionally if we are connected, but poll faster if QR is available or connecting
  const { data: statusData, mutate: refreshStatus } = useSWR(
    `/api/tabdeal/clients/${clientId}/whatsapp/status`,
    () => tabdealApi.getClientWhatsAppStatus(clientId),
    {
      refreshInterval: 15000, // Safe default poll
      fallbackData: initialWhatsapp ? { success: true, data: { status: initialWhatsapp.status } } : undefined
    }
  );

  const status = statusData?.data?.status || (initialWhatsapp ? initialWhatsapp.status : 'disconnected');
  const isConnected = status === 'connected';

  // Only poll QR if we are disconnected
  const { data: qrData, mutate: refreshQR } = useSWR(
    !isConnected ? `/api/tabdeal/clients/${clientId}/whatsapp/qr` : null,
    () => tabdealApi.getClientWhatsAppQR(clientId, Date.now()),
    {
      refreshInterval: !isConnected ? 10000 : 0, // poll every 10s if not connected
      shouldRetryOnError: false // Stop aggressive retry if QR is 404
    }
  );

  const handleProvision = async () => {
    if (!window.confirm('Are you sure you want to provision and initialize a WhatsApp instance for this client?')) return;
    
    setIsProvisioning(true);
    try {
      await tabdealApi.provisionClientWhatsApp(clientId);
      toast.success('WhatsApp instance provisioned successfully.');
      refreshStatus();
      refreshQR();
    } catch (err: any) {
      if (err instanceof ApiError) {
        toast.error(err.message || 'Failed to provision WhatsApp');
      } else {
        toast.error('An unexpected error occurred.');
      }
    } finally {
      setIsProvisioning(false);
    }
  };

  const handleReconnect = async () => {
    setIsReconnecting(true);
    try {
      await tabdealApi.reconnectClientWhatsApp(clientId);
      toast.success('WhatsApp reconnection requested.');
      setShowReconnectConfirm(false);
      refreshStatus();
    } catch (err: any) {
      if (err instanceof ApiError) {
        toast.error(err.message || 'Failed to reconnect WhatsApp');
      } else {
        toast.error('An unexpected error occurred.');
      }
    } finally {
      setIsReconnecting(false);
    }
  };

  const hasAccount = !!initialWhatsapp || statusData?.data;

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-4 border-b pb-2">
        <h3 className="text-lg font-medium text-gray-900">WhatsApp Integration</h3>
        {hasAccount && (
          <Badge variant={isConnected ? 'green' : 'red'}>
            {status}
          </Badge>
        )}
      </div>

      {!hasAccount ? (
        <div className="text-center py-6">
          <p className="text-sm text-gray-500 mb-4">No WhatsApp account paired for this client.</p>
          <Button 
            onClick={handleProvision} 
            isLoading={isProvisioning}
            variant="primary"
          >
            Provision WhatsApp
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Phone Number</dt>
              <dd className="mt-1 text-sm text-gray-900">{initialWhatsapp?.phoneNumber || statusData?.data?.phoneNumber || 'Unknown'}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Display Name</dt>
              <dd className="mt-1 text-sm text-gray-900">{initialWhatsapp?.pushName || statusData?.data?.pushName || 'Unknown'}</dd>
            </div>
          </dl>

          {!isConnected && qrData?.data?.qr && (
            <div className="mt-4 border p-4 rounded-md bg-gray-50 flex flex-col items-center">
              <p className="text-sm text-gray-700 font-medium mb-3">Scan QR Code to Pair</p>
              {/* Ensure we render a safe visual representation. If we don't have a library, we could use an img with a data URL if the backend returned base64, but Baileys usually returns the raw text string. 
                  Given constraints: "use a safe QR rendering component/library already available... Do not introduce a large library unnecessarily. Never render QR data as raw text in the normal UI."
                  We will use an API to render it if we don't have QRCode locally, or just suggest using a library. Wait, let's check if qrcode.react is installed. */}
              {/* For now we will render it using an external reliable charting API safely without storing it, or just use a placeholder if we aren't allowed to hit external APIs. */}
              {/* Actually, Baileys often gives the raw string. We can use a free lightweight QR endpoint. */}
              <QRCodeSVG value={qrData.data.qr} size={200} className="bg-white p-2 border rounded-md" />
              <p className="text-xs text-gray-400 mt-2">QR updates automatically</p>
            </div>
          )}

          <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
            <Button 
              variant="secondary" 
              onClick={() => { refreshStatus(); refreshQR(); }}
              className="text-sm"
            >
              Refresh Status
            </Button>
            
            {showReconnectConfirm ? (
              <div className="flex items-center gap-2 bg-red-50 p-2 rounded-md border border-red-100">
                <span className="text-xs text-red-700 font-medium">This will request a WhatsApp reconnection. Are you sure?</span>
                <Button 
                  variant="primary" 
                  className="bg-red-600 hover:bg-red-700 text-xs py-1 h-8"
                  onClick={handleReconnect}
                  isLoading={isReconnecting}
                >
                  Confirm Reconnect
                </Button>
                <Button 
                  variant="secondary" 
                  className="text-xs py-1 h-8"
                  onClick={() => setShowReconnectConfirm(false)}
                  disabled={isReconnecting}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button 
                variant="secondary" 
                onClick={() => setShowReconnectConfirm(true)}
                className="text-sm text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50"
              >
                Reconnect Instance
              </Button>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
