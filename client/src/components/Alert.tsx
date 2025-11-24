import { useAlertStore } from '../stores/alertStore';

export const Alert = () => {
  const { alert, closeAlert } = useAlertStore();

  if (!alert) return null;

  return (
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
  );
};
