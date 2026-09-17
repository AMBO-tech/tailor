import React from 'react';
import { Client } from '@types';
import { ClientCard } from './ClientCard';
import { LoadingSpinner } from '@components/common/LoadingSpinner';
import { EmptyState } from '@components/common/EmptyState';
import { Users } from 'lucide-react';

export interface ClientListProps {
  clients: Client[];
  isLoading: boolean;
  onEdit?: (client: Client) => void;
  onEditClient?: (client: Client) => void;
  onNewOrder?: (client: Client) => void;
  onNewOrderForClient?: (client: Client) => void;
  onAddClient?: () => void;
  onNewClient?: () => void;
  onOpenWhatsApp?: (phone: string, name: string) => void;
  onViewMeasurements?: (client: Client) => void;
}

export const ClientList: React.FC<ClientListProps> = ({
  clients,
  isLoading,
  onEdit,
  onEditClient,
  onNewOrder,
  onNewOrderForClient,
  onAddClient,
  onNewClient,
  onOpenWhatsApp,
  onViewMeasurements,
}) => {
  if (isLoading) {
    return <LoadingSpinner label="Chargement du carnet de clientes..." />;
  }

  const handleAdd = onNewClient || onAddClient;

  if (clients.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Aucune cliente trouvée"
        description="Ajoutez des clientes pour sauvegarder leurs numéros et leurs fiches de mesures."
        actionLabel="Ajouter une cliente"
        onAction={handleAdd}
      />
    );
  }

  return (
    <div className="space-y-3">
      {clients.map((client) => (
        <ClientCard
          key={client.id}
          client={client}
          onEdit={onEdit}
          onEditClient={onEditClient}
          onNewOrder={onNewOrder}
          onNewOrderForClient={onNewOrderForClient}
          onOpenWhatsApp={onOpenWhatsApp}
          onViewMeasurements={onViewMeasurements}
        />
      ))}
    </div>
  );
};
