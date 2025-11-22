import React, { createContext, useContext, useState, type ReactNode, useCallback } from 'react';

interface AlertOptions {
  title?: string;
  message: string;
  onClose?: () => void;
}

interface AlertContextType {
  showAlert: (message: string, title?: string) => void;
  closeAlert: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const AlertProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [alert, setAlert] = useState<AlertOptions | null>(null);

  const showAlert = useCallback((message: string, title?: string) => {
    setAlert({ message, title });
  }, []);

  const closeAlert = useCallback(() => {
    setAlert(null);
  }, []);

  return (
    <AlertContext.Provider value={{ showAlert, closeAlert }}>
      {children}
      {alert && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 border-4 border-indigo-100 transform transition-all scale-100 animate-bounce-up">
            {alert.title && (
              <h3 className="text-xl font-black text-indigo-800 mb-2">{alert.title}</h3>
            )}
            <p className="text-gray-600 font-medium mb-6">{alert.message}</p>
            <div className="flex justify-end">
              <button
                onClick={closeAlert}
                className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold transition-colors shadow-md active:translate-y-0.5"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </AlertContext.Provider>
  );
};

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};
