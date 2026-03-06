import React from 'react';
import { NetworkError } from '../services/api';

interface Props {
  error: Error | string | null;
  onRetry?: () => void;
}

const ErrorMessage: React.FC<Props> = ({ error, onRetry }) => {
  if (!error) return null;

  const isNetwork = error instanceof NetworkError;
  const message = typeof error === 'string'
    ? error
    : isNetwork
      ? 'Nao foi possivel conectar ao servidor. Verifique sua conexao de internet.'
      : (error as Error).message || 'Ocorreu um erro ao carregar os dados.';

  return (
    <div className="text-center py-8">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-4">
        <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.072 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <p className="text-red-600 font-medium">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 px-4 py-2 bg-brand-teal text-white rounded-lg hover:bg-teal-600 text-sm font-medium"
        >
          Tentar novamente
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
