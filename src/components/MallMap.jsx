import React, { useState, useMemo, useEffect } from 'react';
import './MallMap.css';

const MallMap = () => {
  // Estado para gestionar la edición
  const [isEditing, setIsEditing] = useState(false);
  const [editLocal, setEditLocal] = useState(null);
  const [newClientName, setNewClientName] = useState('');
  
  // Datos iniciales de los clientes
  const initialClients = [
    "david", "lux.hale_lucero", "Joon1", "jhoo freely", "antora",
    "Rodrigo", "edison", "cito", "camilo", "raul", "flor-cati",
    "raul-samilo", "esteban artos", "ANORE", "cristian sobr",
    "jhoana", "momica maison", "rosendo", "jorge", "edison laura",
    "alex", "lavorado", "nathalia", "hairy", "fred sobr",
    "cristian sobr", "raul caligi", "CARRERA 18", "monica maison",
    "pullian", "flor", "adente", "alberto", "marcela", "fior",
    "adente", "laydi aleja", "marilha", "ironvoy", "norvey",
    "temple", "elemento"
  ];

  // Cargar datos desde localStorage o usar los iniciales
  const [clients, setClients] = useState(() => {
    const savedClients = localStorage.getItem('mallClients');
    return savedClients ? JSON.parse(savedClients) : initialClients;
  });

  // Guardar en localStorage cuando cambien los clientes
  useEffect(() => {
    localStorage.setItem('mallClients', JSON.stringify(clients));
  }, [clients]);

  // Estado para la aplicación
  const [selectedLocal, setSelectedLocal] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewFilter, setViewFilter] = useState('all');

  // Generar datos de locales
  const locals = useMemo(() => {
    return Array.from({ length: 42 }, (_, i) => {
      const localNumber = i + 1;
      const isOccupied = localNumber <= clients.length;
      
      return {
        id: localNumber,
        number: localNumber,
        isOccupied,
        clientName: isOccupied ? clients[localNumber - 1] : null,
        area: (Math.floor(Math.random() * 5) + 5) * 10,
        sector: localNumber % 3 === 0 ? 'Moda' : localNumber % 3 === 1 ? 'Gastronomía' : 'Servicios',
        phone: isOccupied ? `+57 ${3000000000 + localNumber}` : 'N/A'
      };
    });
  }, [clients]);

  // Filtrar locales
  const filteredLocals = useMemo(() => {
    return locals.filter(local => {
      if (viewFilter === 'available' && local.isOccupied) return false;
      if (viewFilter === 'occupied' && !local.isOccupied) return false;
      
      if (searchTerm && local.isOccupied) {
        return local.clientName.toLowerCase().includes(searchTerm.toLowerCase());
      }
      
      return true;
    });
  }, [locals, searchTerm, viewFilter]);

  // Manejar la selección de un local
  const handleSelectLocal = (local) => {
    setSelectedLocal(local);
    setIsEditing(false);
    setEditLocal(null);
    setNewClientName('');
  };

  // Iniciar edición de un local
  const handleEditLocal = (local, e) => {
    e.stopPropagation();
    setEditLocal(local);
    setNewClientName(local.isOccupied ? local.clientName : '');
    setIsEditing(true);
  };

  // Guardar cambios en un local
  const handleSaveEdit = () => {
    if (!editLocal) return;

    const updatedClients = [...clients];
    
    if (newClientName.trim() === '') {
      // Si el nombre está vacío, liberar el local
      if (editLocal.number <= updatedClients.length) {
        updatedClients[editLocal.number - 1] = '';
      }
    } else {
      // Asignar nuevo cliente
      if (editLocal.number > updatedClients.length) {
        // Extender el array si es necesario
        while (updatedClients.length < editLocal.number) {
          updatedClients.push('');
        }
      }
      updatedClients[editLocal.number - 1] = newClientName;
    }

    setClients(updatedClients);
    setIsEditing(false);
    setEditLocal(null);
    setNewClientName('');
  };

  // Cancelar edición
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditLocal(null);
    setNewClientName('');
  };

  // Liberar un local (quitar cliente)
  const handleReleaseLocal = (localNumber, e) => {
    e.stopPropagation();
    const updatedClients = [...clients];
    if (localNumber <= updatedClients.length) {
      updatedClients[localNumber - 1] = '';
      setClients(updatedClients);
    }
  };

  // Restablecer a datos iniciales
  const handleResetData = () => {
    if (window.confirm('¿Estás seguro de que quieres restablecer todos los datos? Se perderán los cambios.')) {
      setClients(initialClients);
    }
  };

  return (
    <div className="mall-map-container">
      <header className="mall-header">
        <h1>Mapa de Locales - Centro Comercial</h1>
        <p className="mall-description">
          Visualiza y gestiona los locales comerciales. 
          {isEditing && <span className="editing-notice"> Modo edición activado</span>}
        </p>
      </header>
      
      <div className="mall-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Buscar local por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={isEditing}
          />
        </div>
        <div className="view-options">
          <button 
            className={viewFilter === 'all' ? 'active' : ''}
            onClick={() => setViewFilter('all')}
            disabled={isEditing}
          >
            Ver Todos
          </button>
          <button 
            className={viewFilter === 'available' ? 'active' : ''}
            onClick={() => setViewFilter('available')}
            disabled={isEditing}
          >
            Disponibles
          </button>
          <button 
            className={viewFilter === 'occupied' ? 'active' : ''}
            onClick={() => setViewFilter('occupied')}
            disabled={isEditing}
          >
            Ocupados
          </button>
          <button 
            className={isEditing ? 'active' : ''}
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? 'Cancelar Edición' : 'Modo Edición'}
          </button>
          <button 
            onClick={handleResetData}
            className="reset-btn"
            title="Restablecer datos iniciales"
          >
            ↺
          </button>
        </div>
      </div>
      
      <div className="mall-main-content">
        <div className="locals-list">
          <h2>Lista de Locales {isEditing && <span>(Edición)</span>}</h2>
          <div className="locals-container">
            {filteredLocals.map(local => (
              <div
                key={local.id}
                className={`local-item ${selectedLocal?.id === local.id ? 'selected' : ''}`}
                onClick={() => handleSelectLocal(local)}
              >
                <div className="local-info">
                  <span className="local-number">Local {local.number}:</span>
                  <span className="client-name">
                    {local.isOccupied ? local.clientName : 'Disponible'}
                  </span>
                </div>
                {isEditing && (
                  <div className="local-actions">
                    <button 
                      className="edit-btn"
                      onClick={(e) => handleEditLocal(local, e)}
                      title="Editar local"
                    >
                      ✏️
                    </button>
                    {local.isOccupied && (
                      <button 
                        className="release-btn"
                        onClick={(e) => handleReleaseLocal(local.number, e)}
                        title="Liberar local"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        <div className="map-container">
          <div className="map-grid">
            {locals.map(local => (
              <div
                key={local.id}
                className={`map-cell ${local.isOccupied ? 'occupied' : ''} ${selectedLocal?.id === local.id ? 'selected' : ''}`}
                onClick={() => handleSelectLocal(local)}
              >
                {local.isOccupied ? `L-${local.number}` : `L-${local.number} (Disp)`}
                {isEditing && (
                  <div className="map-cell-actions">
                    <button 
                      className="edit-btn"
                      onClick={(e) => handleEditLocal(local, e)}
                      title="Editar local"
                    >
                      ✏️
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="map-legend">
            <div className="legend-item">
              <div className="legend-color available"></div>
              <span>Disponible</span>
            </div>
            <div className="legend-item">
              <div className="legend-color occupied"></div>
              <span>Ocupado</span>
            </div>
            <div className="legend-item">
              <div className="legend-color selected"></div>
              <span>Seleccionado</span>
            </div>
          </div>
          
          <div className="local-details">
            <h3>Información del Local</h3>
            {selectedLocal ? (
              <>
                <div className="detail-item">
                  <span className="detail-label">Número:</span>
                  <span>{selectedLocal.number}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Estado:</span>
                  <span>{selectedLocal.isOccupied ? 'Ocupado' : 'Disponible'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Cliente:</span>
                  <span>{selectedLocal.isOccupied ? selectedLocal.clientName : 'Por asignar'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Área:</span>
                  <span>{selectedLocal.area} m²</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Sector:</span>
                  <span>{selectedLocal.sector}</span>
                </div>
                {selectedLocal.isOccupied && (
                  <div className="detail-item">
                    <span className="detail-label">Teléfono:</span>
                    <span>{selectedLocal.phone}</span>
                  </div>
                )}
                {isEditing && (
                  <div className="edit-actions">
                    <button 
                      className="edit-btn"
                      onClick={(e) => handleEditLocal(selectedLocal, e)}
                    >
                      ✏️ Editar este local
                    </button>
                    {selectedLocal.isOccupied && (
                      <button 
                        className="release-btn"
                        onClick={(e) => handleReleaseLocal(selectedLocal.number, e)}
                      >
                        🗑️ Liberar local
                      </button>
                    )}
                  </div>
                )}
              </>
            ) : (
              <p>Selecciona un local para ver sus detalles</p>
            )}
          </div>

          {/* Modal de edición */}
          {isEditing && editLocal && (
            <div className="modal-overlay">
              <div className="modal-content">
                <h3>Editar Local {editLocal.number}</h3>
                <div className="form-group">
                  <label htmlFor="clientName">Nombre del Cliente:</label>
                  <input
                    type="text"
                    id="clientName"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    placeholder="Dejar vacío para liberar el local"
                    autoFocus
                  />
                </div>
                <div className="modal-actions">
                  <button onClick={handleSaveEdit} className="save-btn">
                    💾 Guardar
                  </button>
                  <button onClick={handleCancelEdit} className="cancel-btn">
                    ❌ Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <footer className="mall-footer">
        <p>Centro Comercial - Mapa de Locales © 2025</p>
      </footer>
    </div>
  );
};

export default MallMap;