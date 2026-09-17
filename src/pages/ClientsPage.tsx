import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useClientsQuery,
  useCreateClientMutation,
  useUpdateClientMutation,
} from '@hooks/useClients';
import { useCreateOrderMutation } from '@hooks/useOrders';
import {
  ClientSearchInput,
  ClientList,
  ClientModal,
  OrderModal,
  MeasurementDrawerModal,
} from '@components';
import { Client, CreateClientDto, CreateOrderDto } from '@types';
import { toast } from '@services/toast';

export const ClientsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [selectedClientForEdit, setSelectedClientForEdit] = useState<Client | null>(null);
  const [selectedClientForOrder, setSelectedClientForOrder] = useState<Client | null>(null);
  const [selectedClientForMeasurements, setSelectedClientForMeasurements] = useState<Client | null>(null);

  const { data: rawClients = [], isLoading } = useClientsQuery(searchQuery);
  const createClientMutation = useCreateClientMutation();
  const updateClientMutation = useUpdateClientMutation();
  const createOrderMutation = useCreateOrderMutation();

  const sortedClients = useMemo(() => {
    let list = Array.isArray(rawClients) ? [...rawClients] : [];
    return list.sort((a, b) => (a.fullName || '').localeCompare(b.fullName || ''));
  }, [rawClients]);

  const handleSaveClient = async (dto: CreateClientDto) => {
    if (selectedClientForEdit) {
      await updateClientMutation.mutateAsync({
        id: selectedClientForEdit.id,
        data: dto,
      });
    } else {
      await createClientMutation.mutateAsync(dto);
    }
    setIsClientModalOpen(false);
    setSelectedClientForEdit(null);
  };

  const handleOpenNewClientModal = () => {
    setSelectedClientForEdit(null);
    setIsClientModalOpen(true);
  };

  const handleEditClient = (client: Client) => {
    setSelectedClientForEdit(client);
    setIsClientModalOpen(true);
  };

  const handleNewOrderForClient = (client: Client) => {
    setSelectedClientForOrder(client);
  };

  const handleCreateOrder = async (dto: CreateOrderDto) => {
    await createOrderMutation.mutateAsync(dto);
    setSelectedClientForOrder(null);
    toast.success('Commande créée avec succès !');
    navigate('/orders');
  };

  const handleOpenWhatsApp = (phone: string, name: string) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const internationalPhone = cleanPhone.startsWith('221')
      ? cleanPhone
      : `221${cleanPhone}`;
    const text = encodeURIComponent(
      `Bonjour ${name}, j'espère que vous allez bien ! C'est votre atelier de couture.`,
    );
    window.open(`https://wa.me/${internationalPhone}?text=${text}`, '_blank');
  };

  return (
    <div className="space-y-3.5">
      {/* Top Search & Add */}
      <ClientSearchInput
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onNewClient={handleOpenNewClientModal}
      />

      {/* Clients List */}
      <ClientList
        clients={sortedClients}
        isLoading={isLoading}
        onEditClient={handleEditClient}
        onNewOrderForClient={handleNewOrderForClient}
        onOpenWhatsApp={handleOpenWhatsApp}
        onViewMeasurements={(client) => setSelectedClientForMeasurements(client)}
        onNewClient={handleOpenNewClientModal}
      />

      {/* Client Modal (Create / Edit) */}
      {isClientModalOpen && (
        <ClientModal
          isOpen={isClientModalOpen}
          initialData={selectedClientForEdit || undefined}
          onClose={() => {
            setIsClientModalOpen(false);
            setSelectedClientForEdit(null);
          }}
          onSubmit={handleSaveClient}
          isLoading={createClientMutation.isPending || updateClientMutation.isPending}
        />
      )}

      {/* Measurement Drawer Modal */}
      {selectedClientForMeasurements && (
        <MeasurementDrawerModal
          isOpen={Boolean(selectedClientForMeasurements)}
          onClose={() => setSelectedClientForMeasurements(null)}
          clientName={selectedClientForMeasurements.fullName}
          measurements={selectedClientForMeasurements.measurements || {}}
          isReadOnly={true}
        />
      )}

      {/* Order Modal for Client */}
      {selectedClientForOrder && (
        <OrderModal
          isOpen={Boolean(selectedClientForOrder)}
          onClose={() => setSelectedClientForOrder(null)}
          onSubmit={handleCreateOrder}
          clients={sortedClients}
          preselectedClientId={selectedClientForOrder.id}
          isLoading={createOrderMutation.isPending}
        />
      )}
    </div>
  );
};
