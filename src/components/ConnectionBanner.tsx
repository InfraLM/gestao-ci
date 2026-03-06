import React from 'react';

interface Props {
  isConnected: boolean;
}

const ConnectionBanner: React.FC<Props> = ({ isConnected }) => {
  if (isConnected) return null;

  return (
    <div className="bg-red-600 text-white text-center py-2 px-4 text-sm font-medium flex-shrink-0">
      Conexao com o servidor indisponivel. Tentando reconectar...
    </div>
  );
};

export default ConnectionBanner;
