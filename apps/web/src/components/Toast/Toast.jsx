import { useEffect } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';

export default function Toast({ id, message, type }) {
  const { removeToast } = useUIStore();

  const icons = {
    success: <CheckCircle className="text-green-500" size={20} />,
    error: <XCircle className="text-red-500" size={20} />,
    info: <Info className="text-blue-500" size={20} />
  };

  const bgColors = {
    success: 'bg-green-500/10 border-green-500/20',
    error: 'bg-red-500/10 border-red-500/20',
    info: 'bg-blue-500/10 border-blue-500/20'
  };

  return (
    <div
      className={`toast flex items-center gap-3 border ${bgColors[type]} animate-slide-up`}
    >
      {icons[type]}
      <span className="flex-1 text-sm">{message}</span>
      <button
        onClick={() => removeToast(id)}
        className="text-dark-400 hover:text-white"
      >
        <X size={16} />
      </button>
    </div>
  );
}