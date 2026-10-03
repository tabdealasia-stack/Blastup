'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { tabdealApi, ApiError } from '@/lib/api';
import { Smartphone, RefreshCw, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

export function ClientWhatsAppSection({ clientId, initialWhatsapp }: { clientId: string, initialWhatsapp: any }) {
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [showProvisionConfirm, setShowProvisionConfirm] = useState(false);
  
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
  const isPending = status === 'pending';

  // Only poll QR if we are disconnected
  const { data: qrData, mutate: refreshQR } = useSWR(
    !isConnected ? `/api/tabdeal/clients/${clientId}/whatsapp/qr` : null,
    () => tabdealApi.getClientWhatsAppQR(clientId, Date.now()),
    {
      refreshInterval: !isConnected ? 10000 : 0, // poll every 10s if not connected
      shouldRetryOnError: false
    }
  );

  const handleProvision = async () => {
    setIsProvisioning(true);
    try {
      await tabdealApi.provisionClientWhatsApp(clientId);
      toast.success('WhatsApp instance provisioned successfully.');
      setShowProvisionConfirm(false);
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

  const hasAccount = !!initialWhatsapp || !!statusData?.data;

  return (
    <Card className="p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-3">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-emerald-500" /> WhatsApp Integration
        </h3>
        {hasAccount && (
          <Badge variant={isConnected ? 'success' : isPending ? 'warning' : 'danger'}>
            {status}
          </Badge>
        )}
      </div>

      {!hasAccount ? (
        <div className="flex-1 flex flex-col items-center justify-center py-6 text-center">
          <Smartphone className="w-8 h-8 text-gray-300 mb-3" />
          <p className="text-sm text-gray-500 mb-4 px-4">No dedicated WhatsApp Baileys container has been provisioned for this client.</p>
          
          {showProvisionConfirm ? (
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 text-left w-full">
              <h4 className="text-sm font-bold text-amber-800 flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4" /> Provision WhatsApp for this client?
              </h4>
              <p className="text-xs text-amber-700 mb-4 leading-relaxed">
                Provisioning initializes the client's WhatsApp account infrastructure.
              </p>
              <div className="flex gap-2">
                <Button 
                  variant="secondary" 
                  className="flex-1 bg-white"
                  onClick={() => setShowProvisionConfirm(false)}
                  disabled={isProvisioning}
                >
                  Cancel
                </Button>
                <Button 
                  variant="primary" 
                  className="flex-1"
                  onClick={handleProvision}
                  isLoading={isProvisioning}
                >
                  Confirm Provision
                </Button>
              </div>
            </div>
          ) : (
            <Button 
              onClick={() => setShowProvisionConfirm(true)} 
              variant="primary"
            >
              Provision Container
            </Button>
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col space-y-5">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2 bg-gray-50/50 p-4 rounded-lg border border-gray-100">
            <div>
              <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone Number</dt>
              <dd className="mt-1 text-sm font-mono text-gray-900">{initialWhatsapp?.phoneNumber || statusData?.data?.phoneNumber || <span className="text-gray-400 italic">Unknown</span>}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Display Name</dt>
              <dd className="mt-1 text-sm font-medium text-gray-900">{initialWhatsapp?.pushName || statusData?.data?.pushName || <span className="text-gray-400 italic">Unknown</span>}</dd>
            </div>
          </dl>

          {!isConnected && qrData?.data?.qr && (
            <div className="mt-2 border border-gray-200 p-5 rounded-lg bg-white shadow-sm flex flex-col items-center">
              <p className="text-sm text-gray-700 font-bold mb-4 uppercase tracking-wider">
                Scan to Pair
              </p>

              <div
                className="bg-white p-3 border border-gray-100 rounded-xl shadow-sm flex items-center justify-center"
                style={{ width: 180, height: 180 }}
              >
                <img
                  src={qrData.data.qr}
                  width={180}
                  height={180}
                  alt="WhatsApp QR Code"
                  className="max-w-full max-h-full"
                />
              </div>

              <p className="text-xs text-gray-400 mt-4 flex items-center gap-1">
                <RefreshCw className="w-3 h-3 animate-spin" /> Auto-refreshing
              </p>
            </div>
          )}

          <div className="mt-auto pt-4 flex flex-col items-end gap-3 border-t border-gray-100">
            {showReconnectConfirm ? (
              <div className="bg-rose-50 p-4 rounded-lg border border-rose-200 w-full text-left">
                <h4 className="text-sm font-bold text-rose-800 flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4" /> Reconnect WhatsApp
                </h4>
                <p className="text-xs text-rose-700 mb-4 leading-relaxed">
                  Reconnect will restart the existing WhatsApp connection lifecycle. It will not create a new client or API key.
                </p>
                <div className="flex gap-2">
                  <Button 
                    variant="secondary" 
                    className="flex-1 bg-white border-rose-200 hover:bg-rose-100 text-rose-700"
                    onClick={() => setShowReconnectConfirm(false)}
                    disabled={isReconnecting}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="primary" 
                    className="flex-1 bg-rose-600 hover:bg-rose-700 border-none shadow-sm text-white"
                    onClick={handleReconnect}
                    isLoading={isReconnecting}
                  >
                    Confirm Reconnect
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-row justify-end gap-3 w-full">
                <Button 
                  variant="outline" 
                  onClick={() => { refreshStatus(); refreshQR(); }}
                  className="text-sm bg-white"
                >
                  <RefreshCw className="w-4 h-4 mr-1.5 text-gray-500" />
                  Refresh
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={() => setShowReconnectConfirm(true)}
                  className="text-sm text-rose-600 hover:text-rose-700 border-rose-200 hover:bg-rose-50 bg-white"
                >
                  Restart Container
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
