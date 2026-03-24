import React, { createContext, useContext, useState, useCallback } from 'react';

const ProcessingContext = createContext({
  isProcessing: false,
  processingMessage: '',
  setProcessing: () => {},
  clearProcessing: () => {},
});

export const ProcessingProvider = ({ children }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');

  const setProcessing = useCallback((active, message = 'Data processing in progress…') => {
    setIsProcessing(active);
    setProcessingMessage(active ? message : '');
  }, []);

  const clearProcessing = useCallback(() => {
    setIsProcessing(false);
    setProcessingMessage('');
  }, []);

  return (
    <ProcessingContext.Provider value={{ isProcessing, processingMessage, setProcessing, clearProcessing }}>
      {children}
    </ProcessingContext.Provider>
  );
};

export const useProcessing = () => useContext(ProcessingContext);

export default ProcessingContext;
