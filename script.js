import React, { useState, useEffect } from 'react';
import { Download, Upload, Save, RefreshCw, Trash2, Plus, Minus, AlertTriangle, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

const SavingsManagement = () => {
  const [currentSavings, setCurrentSavings] = useState('');
  const [newSavings, setNewSavings] = useState('');
  const [remainingSavings, setRemainingSavings] = useState(100);
  const [message, setMessage] = useState('Ingresa tu primer ahorro para comenzar');
  const [statistics, setStatistics] = useState([]);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showImportMenu, setShowImportMenu] = useState(false);
  const [importText, setImportText] = useState('');

  useEffect(() => {
    loadProgress();
  }, []);

  const handleSavings = (isAddition) => {
    if (!newSavings || isNaN(newSavings) || parseFloat(newSavings) <= 0) {
      setMessage('Por favor ingresa una cantidad válida');
      return;
    }

    const current = parseFloat(currentSavings) || 0;
    const amount = parseFloat(newSavings);
    let newTotal = isAddition ? current + amount : Math.max(current - amount, 0);
    newTotal = parseFloat(newTotal.toFixed(2));

    setCurrentSavings(newTotal);
    setRemainingSavings(Math.max(100 - newTotal, 0));
    setNewSavings('');
    setMessage(`Has ahorrado ${newTotal.toFixed(2)}$ (${((newTotal / 100) * 100).toFixed(1)}% de tu meta)`);
    
    addToStatistics(newTotal);
  };

  const addToStatistics = (amount) => {
    const newEntry = {
      amount,
      date: new Date().toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    };
    const updatedStats = [...statistics, newEntry];
    setStatistics(updatedStats);
    localStorage.setItem('statistics', JSON.stringify(updatedStats));
  };

  const saveProgress = () => {
    const data = {
      currentSavings,
      statistics,
      lastUpdate: new Date().toISOString()
    };
    localStorage.setItem('savings', JSON.stringify(data));
    setMessage('Progreso guardado correctamente');
  };

  const loadProgress = () => {
    const savedData = localStorage.getItem('savings');
    if (savedData) {
      const data = JSON.parse(savedData);
      setCurrentSavings(data.currentSavings);
      setStatistics(data.statistics || []);
      setRemainingSavings(Math.max(100 - parseFloat(data.currentSavings), 0));
      setMessage(`Datos cargados: ${new Date(data.lastUpdate).toLocaleDateString('es-ES')}`);
    }
  };

  const deleteProgress = () => {
    if (window.confirm('¿Estás seguro de que deseas eliminar todo tu progreso guardado?')) {
      localStorage.removeItem('savings');
      localStorage.removeItem('statistics');
      setCurrentSavings('');
      setNewSavings('');
      setRemainingSavings(100);
      setStatistics([]);
      setMessage('Progreso eliminado correctamente');
    }
  };

  const exportData = () => {
    const data = {
      currentSavings,
      statistics,
      exportDate: new Date().toISOString()
    };
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mis_ahorros.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportData = () => {
    try {
      const data = JSON.parse(importText);
      if (data.currentSavings !== undefined) {
        setCurrentSavings(data.currentSavings);
        setStatistics(data.statistics || []);
        setRemainingSavings(Math.max(100 - parseFloat(data.currentSavings), 0));
        localStorage.setItem('savings', JSON.stringify(data));
        setMessage('Datos importados correctamente');
        setShowImportMenu(false);
        setImportText('');
      } else {
        setMessage('El formato del JSON no es válido');
      }
    } catch (e) {
      setMessage('Error al procesar el archivo JSON');
    }
  };

  return (
    <div className="min-h-screen bg-[#332f35] p-8">
      <div className="max-w-2xl mx-auto">
        <Card className="bg-[#1f1c23] text-[#a198a9] shadow-lg">
          <CardHeader>
            <CardTitle className="text-center text-[#928A99]">Gestión de Ahorro</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-6">
              <button onClick={exportData} className="flex items-center gap-2 bg-[#E3474A] text-white px-4 py-2 rounded hover:bg-opacity-95 transition-all">
                <Download size={16} /> Exportar
              </button>
              <button onClick={() => setShowImportMenu(true)} className="flex items-center gap-2 bg-[#E3474A] text-white px-4 py-2 rounded hover:bg-opacity-95 transition-all">
                <Upload size={16} /> Importar
              </button>
              <button onClick={saveProgress} className="flex items-center gap-2 bg-[#E3474A] text-white px-4 py-2 rounded hover:bg-opacity-95 transition-all">
                <Save size={16} /> Guardar
              </button>
              <button onClick={loadProgress} className="flex items-center gap-2 bg-[#E3474A] text-white px-4 py-2 rounded hover:bg-opacity-95 transition-all">
                <RefreshCw size={16} /> Cargar
              </button>
              <button onClick={deleteProgress} className="flex items-center gap-2 bg-[#E3474A] text-white px-4 py-2 rounded hover:bg-opacity-95 transition-all">
                <Trash2 size={16} /> Eliminar
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Ahorro Actual ($):</label>
                <input
                  type="number"
                  value={currentSavings}
                  onChange={(e) => setCurrentSavings(e.target.value)}
                  className="w-full p-2 bg-[#27232A] text-[#a198a9] rounded outline-none focus:ring-2 focus:ring-[#48A3A6]"
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Nuevo Ahorro ($):</label>
                <div className="flex gap-2 flex-wrap">
                  <input
                    type="number"
                    value={newSavings}
                    onChange={(e) => setNewSavings(e.target.value)}
                    className="flex-1 p-2 bg-[#27232A] text-[#a198a9] rounded outline-none focus:ring-2 focus:ring-[#48A3A6]"
                    min="0"
                    step="0.01"
                  />
                  <button onClick={() => handleSavings(true)} className="flex items-center gap-1 bg-[#E3474A] text-white px-4 py-2 rounded hover:bg-opacity-95">
                    <Plus size={16} /> Agregar
                  </button>
                  <button onClick={() => handleSavings(false)} className="flex items-center gap-1 bg-[#E3474A] text-white px-4 py-2 rounded hover:bg-opacity-95">
                    <Minus size={16} /> Restar
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm mb-1">Falta por Ahorrar ($):</label>
                <input
                  type="number"
                  value={remainingSavings}
                  className="w-full p-2 bg-[#27232A] text-[#a198a9] rounded"
                  disabled
                />
              </div>

              <div className="h-5 bg-[#E0F1F2] rounded overflow-hidden">
                <div 
                  className="h-full bg-[#3D8E91] transition-all duration-300"
                  style={{ width: `${Math.min((parseFloat(currentSavings) / 100) * 100, 100)}%` }}
                />
              </div>

              <Alert className="bg-[#27232A] border-none">
                <AlertDescription>{message}</AlertDescription>
              </Alert>

              <div className="mt-6">
                <h2 className="text-lg mb-3">Historial de Ahorros</h2>
                <div className="bg-[#27232A] rounded p-4">
                  {statistics.slice(-10).reverse().map((stat, index) => (
                    <div key={index} className="py-2 border-b border-[#a198a9] last:border-0">
                      ${stat.amount.toFixed(2)} <small>{stat.date}</small>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {showImportMenu && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <Card className="bg-[#1f1c23] text-[#a198a9] w-full max-w-md">
              <CardHeader>
                <CardTitle>Importar Datos</CardTitle>
              </CardHeader>
              <CardContent>
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  className="w-full h-40 p-2 bg-[#27232A] text-[#a198a9] rounded mb-4 resize-none"
                  placeholder="Pega aquí el contenido JSON..."
                />
                <div className="flex gap-2">
                  <button onClick={handleImportData} className="flex-1 flex items-center justify-center gap-2 bg-[#E3474A] text-white px-4 py-2 rounded hover:bg-opacity-95">
                    <Upload size={16} /> Importar
                  </button>
                  <button onClick={() => setShowImportMenu(false)} className="flex-1 bg-gray-600 text-white px-4 py-2 rounded hover:bg-opacity-95">
                    Cancelar
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default SavingsManagement;
